(function(µ,SMOD,GMOD){
	/**
	 * Depends on	: Morgas DB 
	 * Uses			: 
	 *
	 * DB.Connector for simple Javascript object
	 *
	 */
	let DBC		=GMOD("DBConn");
	let ORG		=GMOD("Organizer");
	
	let SC=GMOD("shortcut")({
		eq:"equals",
		find:"find"
	});
	
	let OCON;
	
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
			let sortedObjs=DBC.sortObjs(objs);
			for(let objectType in sortedObjs.fresh)
			{
				let objs=sortedObjs.fresh[objectType],
				ids=this._getNextID(objectType);
				for(let i=0;i<objs.length;i++)
				{
					let id=(i<ids.length?ids[i]:ids[ids.length-1]+i-ids.length+1);
					objs[i].setID(id);
					this.db.add([{objectType:objs[i].objectType,fields:objs[i].toJSON()}]);
				}
			}

			for(let objectType in sortedObjs.preserved)
			{
				let objs=sortedObjs.preserved[objectType],
				group=this.db.getGroupValue("objectType",objectType);
				for(let i=0;i<objs.length;i++)
				{
					let found=SC.find(group,{fields:{ID:objs[i].getID()}});
					if(found.length>0)
					{
						found[0].value.fields=objs[i].toJSON();
					}
				}
			}

			for(let objectType in sortedObjs.friend)
			{
				let objs=sortedObjs.friend[objectType],
				group=this.db.getGroupValue("objectType",objectType),
				newFriends=[];
				for(let i=0;i<objs.length;i++)
				{
					let json={fields:objs[i].toJSON()};
					let found=SC.find(group,json);
					if(found.length===0)
					{
						json.objectType=objs[i].objectType;
						newFriends.push(json);
					}
				}
				this.db.add(newFriends);
			}
			signal.complete();
		},
		load:function(signal,objClass,pattern,sort,DESC)
		{
			let values=this.db.getGroupValue("objectType",objClass.prototype.objectType),
			rtn=[];
			
			if(sort)
			{
				sort=ORG.pathSort("fields."+sort+".value",DESC);
			}
			
			for(let i=0;i<values.length;i++)
			{
				if(SC.eq(values[i].fields,pattern))
				{
					let instance=new objClass();
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
			toDelete={objectType:objClass.prototype.objectType,fields:DBC.getDeletePattern(objClass,toDelete)};
			let filterKey=JSON.stringify(toDelete),
			values=this.db.filter(filterKey,toDelete).getFilter(filterKey);
			for(let i=0;i<values.length;i++)
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
			let rtn=[],
			group=this.db.getGroupValue("objectType",objectType);
			let i=0;
			for(;group.length>0;i++)
			{
				let found=SC.find(group,{fields:{ID:i}});
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