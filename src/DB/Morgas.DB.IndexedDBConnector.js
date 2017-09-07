(function(µ,SMOD,GMOD,HMOD,SC){

	let DBC=GMOD("DBConn");
	
	SC=SC({
		prom:"Promise",
		eq:"equals",
		
		DBObj:"DBObj",
		DBFriend:"DBFriend"
	});
	
	let ICON=DBC.IndexedDBConnector=µ.Class(DBC,{
		constructor:function(dbName)
		{
			this.mega();
			this.name=dbName;

			SC.prom.pledgeAll(this,["_open","drop"]);
		},
		
		save:function(signal,objs)
		{
			objs=[].concat(objs);
			let sortedObjs=ICON.sortObjs(objs);
			let classNames=Object.keys(sortedObjs);
			this._open(classNames).then(function(db)
			{
				let transactions=Object.entries(sortedObjs).map(SC.prom.pledge(function(tSignal,[objectType,objects])
				{
					let trans=db.transaction(objectType,"readwrite");
					trans.onerror=function(event)
					{
						µ.logger.error(event);
						db.close();
						tSignal.resolve(event);
					};
					trans.oncomplete=function(event)
					{
						µ.logger.info(event);
						db.close();
						tSignal.resolve();
					};
					
					let store = trans.objectStore(objectType);
					for (let object of objects)
					{
						let obj=object.toJSON(), method="put";
						if(obj.ID===undefined)
						{
							delete obj.ID;
							method="add";
						}
						let req=store[method](obj);
						req.onerror=µ.logger.error;
						req.onsuccess=function(event)
						{
							µ.logger.debug(event);
							if (object instanceof SC.DBObj) object.ID=req.result;
						}
					};
				}));
				signal.resolve(new SC.prom(transactions));
			},signal.reject);
		},
		load:function(signal,objClass,pattern)
		{
			this._open().then(function(db)
			{
				if(!db.objectStoreNames.contains(objClass.prototype.objectType))
				{
					db.close();
					signal.resolve([]);
				}
				else
				{
					let trans=db.transaction(objClass.prototype.objectType,"readonly"),
					rtn=[];
					trans.onerror=function(event)
					{
						µ.logger.error(event);
						db.close();
						signal.reject(event);
					};
					trans.oncomplete=function()
					{
						db.close();
						signal.resolve(rtn);
					};

					let store = trans.objectStore(objClass.prototype.objectType);
					if(typeof pattern.ID==="number"|| (Array.isArray(pattern.ID) && pattern.ID.length>0))
					{
						let reqs=[].concat(pattern.ID).map(function(ID)
						{
							let req=store.get(ID);
							req.onerror=function(event)
							{
								µ.logger.error(event);
							};
							req.onsuccess=function(event)
							{
								µ.logger.debug(event);
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
							µ.logger.error(event);
							db.close();
							signal.reject(event);
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
			},signal.reject);
		},
		"delete":function(signal,objClass,toDelete)
		{
			let _self=this,
			objectType=objClass.prototype.objectType,
			collectingIDs=null;
			if(typeof toDelete==="number"||toDelete instanceof SC.DBObj||toDelete instanceof SC.DBFriend||Array.isArray(toDelete))
			{
				let ids=DBC.getDeletePattern(objClass,toDelete).ID;
				collectingIDs=SC.prom.resolve(ids);
			}
			else
			{
				collectingIDs=this._open().then(function(db){return new Promise(function(rs,rj)
				{
					let _collectingSelf=this,
					ids=[],
					trans=db.transaction(objectType,"readonly");
					trans.onerror=function(event)
					{
						µ.logger.error(event);
						db.close();
						rj(event);
					};
					trans.oncomplete=function()
					{
						db.close();
						rs(ids);
					};

					let store = trans.objectStore(objectType);
					let req=store.openCursor();
					req.onerror=function(event)
					{
						µ.logger.error(event);
						db.close();
						rj(event);
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
					
				})});
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
							µ.logger.error(event);
							db.close();
							signal.reject(event);
						};
						let store = trans.objectStore(objectType);
						
						let reqs=ids.map(SC.prom.pledge(function(rSignal,ID)
						{
							let req=store["delete"](ID);
							req.onerror=function(event)
							{
								µ.logger.error(event);
								rSignal.resolve(ID);
							};
							req.onsuccess=function(event)
							{
								µ.logger.debug(event);
								rSignal.resolve();
							}
						}));
						return new SC.prom(reqs).then(function()
						{
							db.close();
							//TODO replace with Array.slice
							signal.resolve(Array.prototype.slice.call(arguments));
						},µ.logger.error);
					});
				}
				else
				{
					signal.resolve(false);
				}
			},function(event){
				db.close();
				signal.reject(event);
			});
		},
		destroy:function()
		{
			//TODO destructor
			this.mega();
		},
		_open:function(signal,classNames)
		{
			let _self=this;
			let req=indexedDB.open(this.name);
			req.onerror=function(event){
				signal.reject(event);
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
					signal.resolve(db);
				}
				else
				{
					let req2=indexedDB.open(_self.name,version+1);
					req2.onerror=function(event){
						signal.reject(event);
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
						signal.resolve(req2.result);
					};
					db.close();
				}
			}
		},
		/**
		 * requests to drop the whole database
		 */
		drop:function(signal)
		{
			let req=indexedDB.deleteDatabase(this.name)
			req.onsuccess=signal.resolve;
			rec.onerror=signal.reject;
		}
	});
	ICON.isAvailable=function()
	{
		try
		{
			indexedDB.open("availability test");
			return true;
		}
		catch (e)
		{
			return false;
		}
	};
	ICON.sortObjs=function(objs)
	{
		var rtn={};
		for(var i=0;i<objs.length;i++)
		{
			var obj=objs[i],
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
})(Morgas,Morgas.setModule,Morgas.getModule,Morgas.hasModule,Morgas.shortcut);