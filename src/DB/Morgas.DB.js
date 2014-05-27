(function(µ,SMOD,GMOD){
	/**
	 * Depends on	: Morgas
	 * Uses			: util.object, Detached
	 *
	 * Database Classes
	 *
	 */

	var SC=GMOD("shortcut")({
		debug:"debug",
		det:"Detache"
	});
	
	var DB=µ.DB=µ.DB||{};
	
	var DBC,TRAN,STMT,DBOBJECT,REL,FIELD;
	
	DBC=DB.Connector=µ.Class(
	{
		init:function()
		{
			SC.det.detacheAll(this,["save","load","delete","saveChildren","loadChildren","saveFriends","loadFriends","destroy"]);
		},
		
		save:function(detached,objs)
		{
			/*
			objs=[].concat(objs)
			for(var i=0;i<objs.length;i++)
			{
			}
			*/
			throw new Error("abstract Class DB.Connector");
		},
		load:function(detached,objClass,pattern)
		{
			throw new Error("abstract Class DB.Connector");
		},
		"delete":function(detached,objClass,toDelete)
		{
			/*
			//make toDelete a Pattern from Number, DB.Object or Array
			if(typeof toDelete=="number" || toDelete instanceof DB.Object)
			{
				toDelete=[toDelete];
			}
			if(toDelete instanceof Array)
			{
				for(var i=0;i<toDelete.length;i++)
				{
					if(toDelete[i] instanceof DB.Object)
					{
						toDelete[i]=toDelete[i].getID();
					}
				}
				toDelete={ID:toDelete};
			}
			*/
			throw new Error("abstract Class DB.Connector");
		},
		saveChildren:function(detached,obj,relationName)
		{
			throw new Error("abstract Class DB.Connector");
		},
		loadChildren:function(detached,childClass,obj)
		{
			throw new Error("abstract Class DB.Connector");
		},
		saveFriends:function(detached,obj,relationName)
		{
			throw new Error("abstract Class DB.Connector");
		},
		loadFriends:function(detached,friendClass,obj)
		{
			throw new Error("abstract Class DB.Connector");
		},
		destroy:function()
		{
			throw new Error("abstract Class DB.Connector");
		}
	});
	SMOD("DBConn",DBC);
	
	DBOBJECT=DB.Object=µ.Class(
	{
		objectType:null,
		init:function(param)
		{
			param=param||{};
			if(this.objectType==null)
				throw "DB.Object: objectType not defined";
						
			this.fields={};
			
			this.relations={};
			this.parents={};	//n:1
			this.children={};	//1:n
			this.friends={};	//n:m
			
			this.addField("ID",FIELD.TYPES.INT,param.ID,{UNIQUE:true,AUTOGENERATE:true});
		},
		addRelation:function(name,relatedClass,type,targetRelationName,fieldName)
		{
			this.relations[name]=new REL(relatedClass,type,targetRelationName||name,fieldName);
		},
		addField:function(name,type,value,options)
		{
			this.fields[name]=new FIELD(type,value,options);
		},
		getValueOf:function(fieldName){return this.fields[fieldName].getValue();},
		setValueOf:function(fieldName,val){if(fieldName!="ID")this.fields[fieldName].setValue(val);},
		setID:function(val)
		{
			this.fields["ID"].setValue(val);
			for(var c in this.children)
			{
				var children=this.children[c];
				for(var i=0;i<children.length;i++)
				{
					children[i]._setParent(this.relations[c],this);
				}
			}
		},
		getID:function(){return this.getValueOf("ID");},
		getParent:function(relationName)
		{
			return this.parents[relationName];
		},
		_setParent:function(pRel,parent)
		{
			var cRel=this.relations[pRel.targetRelationName];
			this.parents[pRel.targetRelationName]=parent;
			this.setValueOf(cRel.fieldName,parent.getValueOf(pRel.fieldName));
		},
		_add:function(container,relationName,value)
		{
			var c=container[relationName]=container[relationName]||[];
			if(c.indexOf(value)==-1)
				c.push(value);
		},
		_get:function(container,relationName)
		{
			return (container[relationName]||[]).slice(0);
		},
		addChild:function(relationName,child)
		{
			if(this.relations[relationName].type==REL.TYPES.CHILD)
			{
				this._add(this.children,relationName,child);
				child._setParent(this.relations[relationName],this);
			}
		},
		addChildren:function(relationName,children)
		{
			for(var i=0;i<children.length;i++)
			{
				this.addChild(relationName,children[i]);
			}
		},
		getChildren:function(relationName)
		{
			return this._get(this.children,relationName);
		},
		addFriend:function(relationName,friend)
		{
			if(this.relations[relationName].type==REL.TYPES.FRIEND)
			{
				this._add(this.friends,relationName,friend);
				friend._add(friend.friends,this.relations[relationName].targetRelationName,this);
			}
		},
		addFriends:function(relationName,friends)
		{
			for(var i=0;i<friends.length;i++)
			{
				this.addFriend(relationName,friends[i]);
			}
		},
		getFriends:function(relationName)
		{
			return this._get(this.friends,relationName);
		},
		//TODO friends
		toJSON:function(children,friends)
		{
			var rtn={fields:{}};
			for(var f in this.fields)
			{
				rtn.fields[f]=this.getValueOf(f);
			}
			if(children>0)
			{
				rtn.children={};
				for(var c in this.children)
				{
					var rtnc=rtn.children[c]=[];
					var children=this.children[c];
					for(var i=0;i<children.length;i++)
					{
						rtnc.push(children[i].toJSON(children-1,friends));
					}
				}
			}
			if(friends>0)
			{
				rtn.friends={};
				for(var f in this.friends)
				{
					var rtnf=rtn.friends[f]=[];
					var friends=this.friends[f];
					for(var i=0;i<friends.length;i++)
					{
						rtnf.push(friends[i].toJSON(children,friends-1));
					}
				}
			}
			return rtn;
		}
	});
	SMOD("DBObj",DBOBJECT);
	
	REL=DB.Relation=µ.Class(
	{
		init:function(relatedClass,type,targetRelationName,fieldName)
		{
			//this.name ?
			type=type.toUpperCase();
			if(fieldName==null)
			{
				if(type==REL.TYPES.PARENT)
					throw "DB.Relation: "+type+" relation needs a fieldName";
				else
					fieldName="ID";
			}
			this.type=type;
			this.relatedClass=relatedClass;
			this.fieldName=fieldName;
			this.targetRelationName=targetRelationName;
		}
	});
	REL.TYPES={
		"PARENT"	:-1,
		"FRIEND"	:0,
		"CHILD"		:1
	};
	SMOD("DBRel",REL);
	
	FIELD=DB.Field=µ.Class(
	{
		init:function(type,value,options)
		{
			//this.name ?
			this.type=type;
		  /*this.value=*/this.fromDBValue(value);
			this.options=options||{};	// depends on connector
		},
		setValue:function(val)
		{
			this.value=val;
		},
		getValue:function(){return this.value;},
		toJSON:function()
		{
			switch(this.type)
			{
				case FIELD.TYPES.DATE:
					var date=this.getValue();
					if(date==null)
						return null;
					return date.getUTCFullYear()+","+date.getUTCMonth()+","+date.getUTCDate()+","+date.getUTCHours()+","+date.getUTCMinutes()+","+date.getUTCSeconds()+","+date.getUTCMilliseconds();
				default:
					return this.getValue();
			}
			return null;
		},
		toDBValue:function()
		{
			switch(this.type)
			{
				case FIELD.TYPES.DATE:
					return this.toJSON();
				case FIELD.TYPES.JSON:
					return JSON.stringify(this.getValue());
				default:
					return this.getValue();
			}
			return null;
		},
		fromDBValue:function(val)
		{
			if(typeof val=="string")
			{
				switch(this.type)
				{
					case FIELD.TYPES.DATE:
						this.value=new Date(Date.UTC.apply(Date,val.split(",")))
						break;
					case FIELD.TYPES.JSON:
						this.value=JSON.parse(val);
						break;
					default:
						this.value=val;
				}
			}
			else if(val!==undefined)
				this.value=val;
			else
				this.value=null;
		}
	});
	FIELD.TYPES={
		"BOOL"		:0,
		"INT"		:1,
		"DOUBLE"	:2,
		"STRING"	:3,
		"DATE"		:4,
		"BLOB"		:5,
		"JSON"		:6
	};
	SMOD("DBField",FIELD);
})(Morgas,Morgas.setModule,Morgas.getModule);