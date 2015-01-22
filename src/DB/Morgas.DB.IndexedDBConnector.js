(function(µ,SMOD,GMOD){
	/**
	 * Depends on	: Morgas DB 
	 * Uses			: 
	 *
	 * DB.Connector for simple Javascript object
	 *
	 */
	let DBC=GMOD("DBConn"),
	SC=GMOD("shortcut")({
		det:"Detached",
		it:"iterate",
		eq:"equals",
		find:"find",
		
		DBObj:"DBObj",
		DBFriend:"DBFriend"
	});
	
	let ICON=µ.Class(DBC,{

		init:function(dbName)
		{
			this.superInit(DBC);
			this.name=dbName;

			SC.det.detacheAll(this,["_open"]);
		},
		
		save:function(signal,objs)
		{
			objs=[].concat(objs);
			let sortedObjs=ICON.sortObjs(objs);
			let classNames=Object.keys(sortedObjs);
			this._open(classNames).then(function(db)
			{
				let transactions=SC.it(sortedObjs,SC.det.detache(function(tSignal,objects,objectType)
				{
					let trans=db.transaction(objectType,"readwrite");
					trans.onerror=function(event)
					{
						µ.debug(event, 0);
						tSignal.complete(event);
					};
					trans.oncomplete=function(event)
					{
						µ.debug(event, 2);
						tSignal.complete();
					};
					
					let store = trans.objectStore(objectType);
					SC.it(objects,function(object,i)
					{
						let obj=object.toJSON(),
						method="put";
						if(obj.ID===undefined)
						{
							delete obj.ID;
							method="add";
						}
						let req=store[method](obj);
						req.onerror=function(event){µ.debug(event,0)};
						req.onsuccess=function(event)
						{
							µ.debug(event, 3);
							object.setID&&object.setID(req.result);//if (!(object instanceof DBFRIEND)) {object.setID(req.result)} 
						}
					});
				}),false,true);
				db.close();
				signal.complete(new SC.det(transactions));
				this.complete();
			},signal.error);
		},
		load:function(signal,objClass,pattern)
		{
			this._open().then(function(db)
			{
				if(!db.objectStoreNames.contains(objClass.prototype.objectType))
				{
					db.close();
					signal.complete([]);
				}
				else
				{
					let trans=db.transaction(objClass.prototype.objectType,"readonly"),
					rtn=[];
					trans.onerror=function(event)
					{
						µ.debug(event,0);
						db.close();
						signal.error(event);
					};
					trans.oncomplete=function()
					{
						db.close();
						signal.complete(rtn);
					};

					let store = trans.objectStore(objClass.prototype.objectType);
					if(typeof pattern.ID==="number"|| Array.isArray(pattern.ID))
					{
						let reqs=SC.it([].concat(pattern.ID),function(ID)
						{
							let req=store.get(ID);
							req.onerror=function(event)
							{
								µ.debug(event,0);
							};
							req.onsuccess=function(event)
							{
								µ.debug(event, 3);
								if(SC.eq(req.result,pattern))
								{
									let inst=new objClass();
									inst.fromJSON(req.result);
									rtn.push(inst);
								}
							}
						});
					}
					else
					{
						let req=store.openCursor();
						req.onerror=function(event)
						{
							µ.debug(event,0);
							db.close();
							signal.error(event);
						};
						req.onsuccess=function(event)
						{
							if(req.result)
							{
								if(SC.eq(req.result.value,pattern))
								{
									let inst=new objClass();
									inst.fromJSON(req.result.value);
									rtn.push(inst);
								}
								req.result["continue"]();
							}
						}
					}
				}
				this.complete();
			},signal.error);
		},
		"delete":function(signal,objClass,toDelete)
		{
			let _self=this,
			objectType=objClass.prototype.objectType,
			collectingIDs=null;
			if(typeof toDelete==="number"||toDelete instanceof SC.DBObj||toDelete instanceof SC.DBFriend||Array.isArray(toDelete))
			{
				let ids=DBC.getDeletePattern(objClass,toDelete).ID;
				collectingIDs=SC.det.complete(ids);
			}
			else
			{
				collectingIDs=this._open().then(function(db)
				{
					let _collectingSelf=this,
					ids=[],
					trans=db.transaction(objectType,"readonly");
					trans.onerror=function(event)
					{
						µ.debug(event,0);
						db.close();
						signal.error(event);
						_collectingSelf.error(event);
					};
					trans.oncomplete=function()
					{
						db.close();
						_collectingSelf.complete(ids);
					};

					let store = trans.objectStore(objectType);
					let req=store.openCursor();
					req.onerror=function(event)
					{
						µ.debug(event,0);
						db.close();
						signal.error(event);
						_collectingSelf.error(event);
					};
					req.onsuccess=function(event)
					{
						if(req.result)
						{
							if(SC.eq(req.result.value,toDelete))
							{
								ids.push(req.result.key);
							}
							req.result["continue"]();
						}
					}
					
				},signal.error)
			}
			collectingIDs.then(function(ids)
			{
				if(ids.length>0)
				{
					return _self._open().then(function(db)
					{
						let trans=db.transaction(objClass.prototype.objectType,"readwrite");
						trans.onerror=function(event)
						{
							µ.debug(event,0);
							db.close();
							signal.error(event);
						};
						let store = trans.objectStore(objectType);
						
						let reqs=SC.it(ids,SC.det.detache(function(rSignal,ID)
						{
							let req=store["delete"](ID);
							req.onerror=function(event)
							{
								µ.debug(event,0);
								rSignal.complete(ID);
							};
							req.onsuccess=function(event)
							{
								µ.debug(event, 3);
								rSignal.complete();
							}
						}));
						return new SC.det(reqs).then(function()
						{
							db.close();
							signal.complete(Array.slice(arguments));
							this.complete();
						},µ.debug);
					});
				}
				else
				{
					signal.complete(false);
					this.complete();
				}
			},function(event){
				db.close();
				signal.error(event,0);
				this.complete();
			});
		},
		destroy:function()
		{
			
		},
		_open:function(signal,classNames)
		{
			let _self=this;
			let req=indexedDB.open(this.name);
			req.onerror=function(event){
				signal.error(event,0);
			};
			req.onsuccess=function()
			{
				let toCreate=[],
				db=req.result,
				version=req.result.version;
				for(let i=0;classNames&&i<classNames.length;i++)
				{
					if(!db.objectStoreNames.contains(classNames[i]))
					{
						toCreate.push(classNames[i]);
					}
				}
				if(toCreate.length===0)
				{
					signal.complete(db);
				}
				else
				{
					let req2=indexedDB.open(_self.name,version+1);
					req2.onerror=function(event){
						signal.error(event,0);
					};
					req2.onupgradeneeded=function()
					{
						for(let i=0;i<toCreate.length;i++)
						{
							req2.result.createObjectStore(toCreate[i],{keyPath:"ID",autoIncrement:true});
						}
					};
					req2.onsuccess=function()
					{
						_self.version=req2.result.version;
						signal.complete(req2.result);
					};
					db.close();
				}
			}
		}
	});
	
	ICON.sortObjs=function(objs)
	{
		let rtn={};
		for(let i=0;i<objs.length;i++)
		{
			let obj=objs[i],
			objType=obj.objectType;
			
			if(rtn[objType]===undefined)
			{
				rtn[objType]=[];
			}
			rtn[objType].push(obj);
		}
		return rtn;
	};
	SMOD("IndexedDBConnector",ICON);	
	SMOD("IDBConn",ICON);
})(Morgas,Morgas.setModule,Morgas.getModule);