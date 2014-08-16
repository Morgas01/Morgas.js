(function(µ,SMOD,GMOD){
	/**
	 * Depends on	: Morgas DB 
	 * Uses			: 
	 *
	 * DB.Connector for simple Javascript object
	 *
	 */
	var DBC		=GMOD("DBConn");
	var ORG		=GMOD("Organizer");
	
	var SC=GMOD("shortcut")({
		eq:"equals",
		find:"find"
	});
	
	var OCON;
	
	OCON=DBC.ObjectConnector=µ.Class(DBC,
	{
		db:new ORG().group("objectType","objectType"),
		init:function(local)
		{
			this.superInit(DBC);
			if(!local)
			{
				this.db=new ORG().group("objectType","objectType");
			}
		},
		save:function(signal,objs)
		{
			objs=[].concat(objs);
			var sortedObjs=DBC.sortObjs(objs);
			for(var objectType in sortedObjs.fresh)
			{
				var objs=sortedObjs.fresh[objectType],
				ids=this._getNextID(objectType);
				for(var i=0;i<objs.length;i++)
				{
					var id=(i<ids.length?ids[i]:ids[ids.length-1]+i-ids.length+1);
					objs[i].setID(id);
					this.db.add([{objectType:objs[i].objectType,fields:objs[i].toJSON()}]);
				}
			}

			for(var objectType in sortedObjs.preserved)
			{
				var objs=sortedObjs.preserved[objectType],
				group=this.db.getGroupValue("objectType",objectType);
				for(var i=0;i<objs.length;i++)
				{
					var found=SC.find(group,{fields:{ID:objs[i].getID()}});
					if(found.length>0)
					{
						found[0].value.fields=objs[i].toJSON();
					}
				}
			}

			for(var objectType in sortedObjs.friend)
			{
				var objs=sortedObjs.friend[objectType],
				group=this.db.getGroupValue("objectType",objectType),
				newFriends=[];
				for(var i=0;i<objs.length;i++)
				{
					var json={fields:objs[i].toJSON()};
					var found=SC.find(group,json);
					if(found.length===0)
					{
						json.objectType=objs[i].objectType
						newFriends.push(json);
					}
				}
				this.db.add(newFriends);
			}
			signal.complete();
		},
		load:function(signal,objClass,pattern,sort,DESC)
		{
			var values=this.db.getGroupValue("objectType",objClass.prototype.objectType),
			rtn=[];
			
			if(sort)
			{
				sort=ORG.pathSort("fields."+sort+".value",DESC);
			}
			
			for(var i=0;i<values.length;i++)
			{
				if(SC.eq(values[i].fields,pattern))
				{
					var instance=new objClass();
					instance.fromJSON(values[i].fields);
					if(sort)
					{
						rtn.splice(ORG.getOrderIndex(instance,rtn,sort),0,instance);
					}
					else
					{
						rtn.push(instance);
					}
				}
			}
			signal.complete(rtn);
		},
		"delete":function(signal,objClass,toDelete)
		{
			toDelete={objectType:objClass.prototype.objectType,fields:DBC.getDeletePattern(toDelete)};
			var filterKey=JSON.stringify(toDelete),
			values=this.db.filter(filterKey,toDelete).getFilter(filterKey);
			for(var i=0;i<values.length;i++)
			{
				this.db.remove(values[i]);
			}
			this.db.removeFilter(filterKey);
			signal.complete();
		},
		destroy:function()
		{
			if(this.db!==OCON.prototype.db)
			{
				this.db.clear();
			}
			this.db=null;
			this.save=this.load=this["delete"]=µ.constantFunctions.ndef;
		},
		_getNextID:function(objectType)
		{
			var rtn=[],
			group=this.db.getGroupValue("objectType",objectType);
			var i=0;
			for(;group.length>0;i++)
			{
				var found=SC.find(group,{fields:{ID:i}});
				if(found.length===0)
				{
					rtn.push(i);
				}
				else
				{
					group.splice(found[0].index,1);
				}
			}
			rtn.push(i);
			return rtn;
		}
	});
	
	SMOD("ObjectConnector",OCON);
})(Morgas,Morgas.setModule,Morgas.getModule);