(function(µ,SMOD,GMOD,HMOD,SC){

	let DBC=GMOD("DBConn");
	let ORG=GMOD("Organizer");
	
	SC=SC({
		eq:"equals",
	});
	
	let getDb=function()
	{
		return new ORG().group("objectType","objectType",function(tDb)
		{
			tDb.map("ID","fields.ID");
		});
	};
	
	let OCON=DBC.ObjectConnector=µ.Class(DBC,
	{
		constructor:function()
		{
			DBC.prototype.constructor.call(this);
			this.db=getDb();
		},
		async save(objs)
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
					objs[i].ID=id;
					this.db.add({objectType:objs[i].objectType,fields:objs[i].toJSON()});
				}
			}
			
			let updates=[];
			for(let objectType in sortedObjs.preserved)
			{
				let objs=sortedObjs.preserved[objectType];
				let ids=this.db.getGroupPart("objectType",objectType).getMap("ID");
				for(let i=0;i<objs.length;i++)
				{
					let found=ids[objs[i].ID];
					if(found)
					{
						found.fields=objs[i].toJSON();
						updates.push(found)
					}
				}
			}
			this.db.update(updates);

			for(let objectType in sortedObjs.friend)
			{
				let objs=sortedObjs.friend[objectType],
					tDb=this.db.getGroupPart("objectType",objectType),
					tDbValues=tDb ? tDb.getValues():null,
					newFriends=[];

				for(let i=0;i<objs.length;i++)
				{
					let json={fields:objs[i].toJSON()};
					if(!tDbValues||tDbValues.findIndex(SC.eq.test(json))==-1)
					{
						json.objectType=objs[i].objectType;
						newFriends.push(json);
					}
				}
				this.db.addAll(newFriends);
			}
		},
		async load(objClass,pattern,sort)
		{
			let tDb=this.db.getGroupPart("objectType",objClass.prototype.objectType);
			if(!tDb) return [];

			let pDb;
			if(pattern!=null)
			{
				pattern={fields:pattern};
				let patternKey=SC.eq.patternToString(pattern);
				if(!tDb.hasFilter(patternKey)) tDb.filter(patternKey,pattern);
				pDb=tDb.getFilter(patternKey);
			}
			else pDb=tDb;
			let rtn;
			if(sort)
			{
				sort=[].concat(sort).map(s=>"fields."+s);
				let sortKey=JSON.stringify(sort);
				if(!pDb.hasSort(sortKey)) pDb.sort(sortKey,ORG.attributeSort(sort));
				rtn=pDb.getSort(sortKey);
			}
			else rtn=pDb.getValues();
			rtn=rtn.map(r=>new objClass().fromJSON(r.fields));
			return rtn;
		},
		async delete(objClass,toDelete)
		{
			toDelete=this.db.values.filter(SC.eq.test({objectType:objClass.prototype.objectType,fields:DBC.getDeletePattern(objClass,toDelete)}));
			this.db.remove(toDelete);
			return toDelete.map(d=>d.fields.ID);
		},
		async destroy()
		{
			if(this.db!==OCON.prototype.db)
			{
				this.db.clear();
			}
			DBC.prototype.destroy.call(this);
		},
		_getNextID:function(objectType)
		{
			let rtn=[],
			tDb=this.db.getGroupPart("objectType",objectType);
			if(!tDb)return [0];
			let ids=Object.keys(tDb.getIndexMap("ID"));
			let i=0;
			for(;ids.length>0;i++)
			{
				let index=ids.indexOf(""+i);
				if(index===-1) rtn.push(i);
				else ids.splice(index,1);
			}
			rtn.push(i);
			return rtn;
		}
	});
	
	SMOD("ObjectConnector",OCON);
})(Morgas,Morgas.setModule,Morgas.getModule,Morgas.hasModule,Morgas.shortcut);