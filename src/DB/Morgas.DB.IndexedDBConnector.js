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
		it:"iterate"
	});
	
	var ICON=µ.Class(DBC,{

		init:function(dbName)
		{
			this.superInit(DBC);
			this.name=dbName;
			this.version=null;

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
			},signal.error);
		},
		load:function(signal,objClass,pattern)
		{
			this.opened.then(function(event)
			{
				
			},signal.error);
		},
		"delete":function(signal,objClass,toDelete)
		{
			this.opened.then(function(event)
			{
				var toDelete=DBC.getDeletePattern(toDelete);
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
				db=req.result;
				_self.version=req.result.verion;
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
					var req2=indexedDB.open(_self.name,_self.version+1);
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