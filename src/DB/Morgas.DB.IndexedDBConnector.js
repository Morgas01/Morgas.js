(function(µ,SMOD,GMOD){
	/**
	 * Depends on	: Morgas DB 
	 * Uses			: 
	 *
	 * DB.Connector for simple Javascript object
	 *
	 */
	var DBC	=GMOD("DBConn"),
	REL		=GMOD("DBRel"),
	SC=GMOD("shortcut")({
		det:"Detached",
		unique:"uniquify",
		it:"iterate",
		eq:"equals",
		find:"find"
	});
	
	var ICON=µ.Class(DBC,{

		init:function(dbName)
		{
			this.superInit(DBC);
			this.name=dbName;

			SC.det.detacheAll(this,["_open"]);
		},
		
		save:function(signal,objs)
		{
			objs=[].concat(objs);
			var sortedObjs=DBC.sortObjs(objs);
			var classNames=Object.keys(sortedObjs);
			this._open(classNames).then(function(db)
			{
				var transactions=SC.it(sortedObjs,SC.det.detache(function(tSignal,objects,objectType)
				{
					var trans=db.transaction(objectType,"readwrite");
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
					
					var store = trans.objectStore(objectType);
					for(var i=0;i<objects.length;i++)
					{
						var req=store.add(objects[i].toJSON());
						req.onerror=function(event){µ.debug(event,0)};
						req.onsuccess=function(event)
						{
							µ.debug(event, 3);
							objects[i].setID(req.result.ID);
						}
					}
				},false,true));
				signal.complete(new SC.det(transactions));
				this.complete();
			},signal.error);
		},
		load:function(signal,objClass,pattern)
		{
			this.open().then(function(db)
			{
				if(!db.objectStoreNames.contains(objClass.prototype.objectType))
				{
					signal.complete([]);
				}
				else
				{
					var trans=db.transaction(objClass.prototype.objectType,"readonly");
					
					trans.onerror=function(event)
					{
						µ.debug(event,0);
						signal.error(event);
					};

					var store = trans.objectStore(objectType);
					if(typeof pattern.ID!=="number"|| Array.isArray(pattern.ID))
					{
						var reqs=SC.it([].concat(pattern.ID),SC.det.detache(function(rSignal,ID)
						{
							var req=store.get(ID);
							req.onerror=function(event)
							{
								µ.debug(event,0);
								rSignal.complete(undefined);
							}
							req.onsuccess=function(event)
							{
								µ.debug(event, 3);
								if(SC.eq(req.result))
								{
									var inst=new objClass();
									inst.fromJSON(req.result);
									rSignal.complete(inst);
								}
							}
						}));
						new SC.det(reqs).then(function()
						{
							signal.complete(SC.find(arguments,pattern,true));
							this.complete();
						},µ.debug);
					}
					else
					{
						var rtn=[],
						req=store.openCursor();
						req.onerror=function(event)
						{
							µ.debug(event,0);
							signal.error(event);
						}
						req.onsuccess=function(event)
						{
							if(req.result)
							{
								if(SC.eq(req.result.value))
								{
									var inst=new objClass();
									inst.fromJSON(req.result.value);
									rtn.push(inst);
								}
								req.result["continue"]();
							}
							else
							{
								signal.complete(rtn);
							}
						}
					}
				}
				this.complete();
			},signal.error);
		},
		"delete":function(signal,objClass,toDelete)
		{
			this.open().then(function(db)
			{
				var trans=db.transaction(objClass.prototype.objectType,"readonly");
				
				trans.onerror=function(event)
				{
					µ.debug(event,0);
					signal.error(event);
				};

				var store = trans.objectStore(objectType);
				if(typeof toDelete==="number"||toDelete instanceof objClass||Array.isArray)
				{
					var ids=DBC.getDeletePattern(toDelete).ID;
					this.complete({store:store,ids:ids});
				}
				else
				{
					var _self=this,
					ids=[];
					req=store.openCursor();
					req.onerror=function(event)
					{
						µ.debug(event,0);
						signal.error(event);
					}
					req.onsuccess=function(event)
					{
						if(req.result)
						{
							if(SC.eq(req.result.value))
							{
								ids.push(req.result.key);
							}
							req.result["continue"]();
						}
						else
						{
							_self.complete({store:store,ids:ids});
						}
					}
				}
				
			},signal.error).then(function(data)
			{
				var store=data.store,
				ids=data.ids;
				
				var reqs=SC.it(ids,SC.det.detache(function(rSignal,ID)
				{
					var req=store["delete"](ID);
					req.onerror=function(event)
					{
						µ.debug(event,0);
						rSignal.complete(ID);
					}
					req.onsuccess=function(event)
					{
						µ.debug(event, 3);
						rSignal.complete();
					}
				}));
				new SC.det(reqs).then(function()
				{
					signal.complete(SC.find(arguments,pattern,true));
					this.complete();
				},µ.debug);
				this.complete();
			},signal.error);
		},
		destroy:function()
		{
			
		},
		_open:function(signal,classNames)
		{
			var _self=this;
			var req=indexedDB.open(this.name);
			req.onerror=signal.error;
			req.onsuccess=function()
			{
				var toCreate=[],
				db=req.result,
				version=req.result.verion;
				for(var i=0;i<classNames.length;i++)
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
					db.close();
					var req2=indexedDB.open(_self.name,version+1);
					req2.onerror=signal.error;
					req2.onupgradeneeded=function()
					{
						for(var i=0;i<toCreate.length;i++)
						{
							req2.result.createObjectStore(toCreate[i],{keyPath:"ID",autoIncrement:true});
						}
					};
					req2.onsuccess=function()
					{
						_self.version=req2.result.version;
						signal.complete(req2.result);
					}
				}
			}
		}
	});
	
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
	}
	SMOD("IndexedDBConnector",ICON);	
	SMOD("IDBConn",ICON);
})(Morgas,Morgas.setModule,Morgas.getModule);