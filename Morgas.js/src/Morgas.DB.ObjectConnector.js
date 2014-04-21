(function(µ,SMOD,GMOD){
	/**
	 * Depends on	: Morgas DB 
	 * Uses			: 
	 *
	 * DB.Connector for simple Javascript object
	 *
	 */
	var DBC		=GMOD("DBConn");
	var REL		=GMOD("DBRel");
	
	var OCON;
	
	OCON=DBC.ObjectConnector=µ.Class(DBC,
	{
		db:{},// {"objectType":{"id":"DB.Object"}}
		init:function(db,detached)
		{
			this.detached=detached!==false;
			if(this.detached)
				this.superInit(DBC);
			this.db=db||this.db;
		},
		save:function(detached,objs)
		{
			objs=[].concat(objs)
			for(var i=0;i<objs.length;i++)
			{
				var obj=objs[i];
				if(this.db[obj.objectType]==null)
				{
					this.db[obj.objectType]={};
				}
				var table=this.db[obj.objectType];
				if(obj.getID()==null)
				{
					obj.setID(this.getNextID(table));
				}
				table[obj.getID()]=obj.toJSON().fields;
			}
			detached.complete(this);
			return this;
		},
		load:function(detached,objClass,pattern)
		{
			var rtn=[];
			var entries=µ.util.object.find(this.db[objClass.prototype.objectType],pattern)
			for(var i=0;i<entries.length;i++)
			{
				rtn.push(new objClass(entries[i].value));
			}
			detached.complete(rtn);
			return rtn;
		},
		loadChildren:function(detached,childClass,obj)
		{
			var rel=obj.getRelation(REL.TYPES.PARENT,childClass);
			var pattern={};
			pattern[rel.fieldName]=obj.getID();
			if(this.detached)
			{
				this.load(childClass,pattern).done(function(children)
				{
					obj.addChildren(children);
					detached.complete(this);
				});
			}
			else
			{
				obj.addChildren(this.load(childClass,pattern));
				return this;
			}
		},
		loadFriends:function(detached,friendClass,obj)
		{
			throw new Error("abstract Class DB.Connector");
		},
		"delete":function(detached,objClass,objs_pattern)
		{
			objs_pattern=[].concat(objs_pattern);
			for(var i=0;i<objs_pattern.length;i++)
			{
				if(objs_pattern[i] instanceof DB.Object&&objs_pattern[i].getID()!=null)
				{
					delete this.db[objs_pattern.objectType][objs_pattern[i].getID()];
				}
				else if (objs_pattern[i]!=null&&objClass!=null)
				{
					var entries=µ.util.object.find(this.db[objClass.prototype.objectType],objs_pattern[i])
					for(var f=0;f<entries.length;f++)
					{
						delete this.db[objClass.prototype.objectType][entries[f].index];
					}
				}
			}
			detached.complete(this);
			return this;
		},
		destroy:function()
		{
			this.db=this.detached=null;
		},
		getNextID:function(table)
		{
			var id=0;
			while(id in table)
			{
				id++;
			}
			return id;
		}
	});
	OCON.PersistDBS=function(ocon,name)
	{
		name=name||"ObjectConnectorDBS";
		var dbs=ocon.dbs||OCON.prototype.dbs;
		localStorage.setItem(name,JSON.stringify(dbs));
	};
	OCON.LoadDBS=function(ocon,name)
	{
		name=name||"ObjectConnectorDBS";
		ocon=ocon||OCON.prototype;
		ocon.dbs=JSON.Parse(localStorage.getItem(name));
	};
	
	SMOD("ObjectConnector",OCON);
})(Morgas,Morgas.setModule,Morgas.getModule);