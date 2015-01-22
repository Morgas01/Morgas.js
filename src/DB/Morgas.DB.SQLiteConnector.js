(function(µ,gµ){
	/**
	 * Depends on	: Morgas DB
	 * Uses			: 
	 *
	 * DB.Connector for SQLite db in AddOn
	 *
	 */
	let DB				=µ.DB;
	let DBC				=DB.Connector;
	let FIELD			=µ.DB.Field;
	
	let LITECON;
	LITECON=DBC.SQLiteConnector=µ.Class(DBC,
	{
		_service:Components.classes["@mozilla.org/storage/service;1"].getService(Components.interfaces.mozIStorageService),
		init:function(filePath)
		{
			this.superInit(DBC);
			µ.detacheAll(this,["getNextIDs"]);
			this.file=gµ.Prefs.getFromLocalDirectory(filePath);
		},
		save:function(detached,objs)
		{
			µ.debug(["SQLiteConnector.save: ",arguments],3);
			objs=[].concat(objs);
			let _self=this;
			let insert={};
			let update={};
			for(let i=0;i<objs.length;i++)
			{
				let obj=objs[i];
				let type=obj.objectType;
				let action;
				if(obj.getID()==null)
					action=insert;
				else
					action=update;
				action[type]=action[type]||[];
				action[type].push(obj);
			}
			this.getNextIDs(insert).then(function(ids)
			{
				µ.debug(["SQLiteConnector.save: new IDs ",arguments],3);
				let con=_self._service.openDatabase(_self.file);
				for(let t in insert)
				{	
					for(let i=0;i<insert[t].length;i++)
					{
						let id=(i<ids[t].length?ids[t][i]:ids[t][ids[t].length-1]+i-ids[t].length+1);
						insert[t][i].setID(id);
					}
				}
				for(let t in insert)
				{
					let stmt=con.createAsyncStatement(_self._getInsertString(insert[t][0]));
					let params=stmt.newBindingParamsArray();
					
					for(let i=0;i<insert[t].length;i++)
					{
						let bp = params.newBindingParams();
						for(let f in insert[t][i].fields)
						{
							bp.bindByName(f,insert[t][i].fields[f].toDBValue());
						}
						params.addParams(bp);
					}
					stmt.bindParameters(params);
					stmt.executeAsync(
					{
						handleError:function(e){µ.debug(e,0);detached.error(e)}
					});
				}
				for(let t in update)
				{
					let stmt=con.createAsyncStatement(_self._getUpdateString(update[t][0]));
					let params=stmt.newBindingParamsArray();
					
					for(let i=0;i<update[t].length;i++)
					{
						let bp = params.newBindingParams();
						for(let f in update[t][i].fields)
						{
							bp.bindByName(f,update[t][i].fields[f].toDBValue());
						}
						params.addParams(bp);
					}
					stmt.bindParameters(params);
					stmt.executeAsync(
					{
						handleError:function(e){µ.debug(e,0);detached.error(e)}
					});
				}
				con.asyncClose({complete:function()
				{
					detached.complete(_self);
				}});
			},
			function(e){detached.error(e);})
		},
		load:function(detached,objClass,pattern,order)
		{
			let stmt="SELECT * FROM "+objClass.prototype.objectType+this._parsePattern(pattern);
			if(order!=null)
				stmt+=" ORDER BY "+order;
			
			µ.debug("SQLiteConnector.load: "+stmt,2);
			
			let rtn=[];
			let con=this._service.openDatabase(this.file);
			try
			{
				stmt=con.createStatement(stmt);
				try
				{
					while (stmt.executeStep())
					{
						let inst=new objClass();
						for(let i in inst.fields)
						{
							inst.fields[i].fromDBValue(stmt.row[i]);
						}
						rtn.push(inst);
					}
					detached.complete(rtn);
				}
				catch(e)
				{
					µ.debug(e,0);
					detached.error(e);
				}
			}
			catch(e)
			{
				µ.debug("no such table",2);
				µ.debug(e,2);
				detached.complete(rtn);
			}
			/*
			stmt.executeAsync(
			{
				handleResult:function(aResultSet)
				{
					try{
					let rtn=[];
					let row;
					while(row=aResultSet.getNextRow())
					{
						let inst=new objClass();
						for(let i in inst.fields)
						{
							inst.fields[i].fromDBValue(row.getResultByName(i))
						}
						rtn.push(inst);
					}
					detached.complete(rtn);
					}catch(e){µ.debug(e,0);detached.error(e);}
				},
				handleError:function(e){µ.debug(e,0);detached.error(e);},
				handleCompletion:function(reason)
				{
					switch(reason)
					{
						case 1:
							µ.debug("statement canceled",1);
						case 0:
							detached.complete([]);
							break;
						default:
							µ.debug("statement has Errors",0);
							detached.error("statement has Errors");
					}
				}
			});
			*/
			con.asyncClose();
		},
		loadChildren:function(detached,childClass,obj)
		{
			throw new Error("abstract Class DB.Connector");
		},
		saveFriends:function(detached,obj,relationName)
		{
			µ.debug(["SQLiteConnector.saveFriends: ",arguments],3);
			let rel=obj.relations[relationName];
			let friends=obj.friends[relationName];
			if(!friends)
				throw "no friends from relation "+relationName+" found";
			let fRel=friends[0].relations[rel.targetRelationName];
			let id=obj.getValueOf(rel.fieldName);
			if(id==null)
				throw rel.fieldName+" is null";
			
			let fids=[];
			for(let i=0;i<friends.length;i++)
			{
				let fid=friends[i].getValueOf(fRel.fieldName);
				if(fid!=null)
					fids.push(fid);
			}
			if(fids.length<1)
				throw "no friend with "+fRel.fieldName+" found";
			
			let tableName=[obj.objectType,relationName,friends[0].objectType,rel.targetRelationName].sort().join("_");
			let idName=obj.objectType+"_ID";
			let fidName=friends[0].objectType+"_ID";
			
			
			µ.debug(["SQLiteConnector.saveFriends: ID: ",id," fids:",fids],3);
			
			let con=this._service.openDatabase(this.file);
			
			let createStmt="CREATE TABLE IF NOT EXISTS "+tableName+" ("+idName+" INTEGER NOT NULL,"+fidName+" INTEGER NOT NULL, PRIMARY KEY ("+idName+","+fidName+"))";
			µ.debug("SQLiteConnector.saveFriends: "+createStmt,3);
			
			con.createAsyncStatement(createStmt)
			.executeAsync();
			
			let stmt="INSERT OR IGNORE INTO "+tableName+" ("+idName+","+fidName+") VALUES (:"+idName+",:"+fidName+")";
			µ.debug("SQLiteConnector.saveFriends: "+stmt,3);
			stmt=con.createAsyncStatement(stmt);
			let params=stmt.newBindingParamsArray();
			
			for(let i=0;i<fids.length;i++)
			{	
				let bp = params.newBindingParams();
				bp.bindByName(idName,id);
				bp.bindByName(fidName,fids[i]);
				params.addParams(bp);
			}
			stmt.bindParameters(params);
			stmt.executeAsync(
			{
				handleError:function(e){µ.debug(e,0);detached.error(e)}
			});
			con.asyncClose({complete:function()
			{
				detached.complete();
			}});
		},
		loadFriends:function(detached,friendClass,obj)
		{
			throw new Error("abstract Class DB.Connector");
		},
		"delete":function(detached,objClass,toDelete)
		{
			//TODO: children & friends
			if(typeof toDelete!=="object"||toDelete instanceof Array)
			{
				//make toDelete a Pattern from Number(s), DB.Object(s)
				if(!(toDelete instanceof Array))
				{
					toDelete=[toDelete];
				}
				
				for(let i=0;i<toDelete.length;i++)
				{
					if(toDelete[i] instanceof DB.Object)
					{
						toDelete[i]=toDelete[i].getID();
					}
				}
				toDelete={ID:toDelete};
			}
			
			let stmt="DELETE FROM "+objClass.prototype.objectType+this._parsePattern(toDelete);
			µ.debug("SQLiteConnector.delete: "+stmt,2);
			let con=this._service.openDatabase(this.file);
			try
			{
				stmt=con.createAsyncStatement(stmt);
				stmt.executeAsync(
				{
					handleResult:function(aResultSet){},
					handleError:function(e){µ.debug(e,0);detached.complete(e)},
					handleCompletion:function(){}
				});
			}
			catch(e)
			{
				µ.debug(e,2)
			}
			let _self=this;
			con.asyncClose({complete:function()
			{
				detached.complete(_self);
			}});
		},
		destroy:function()
		{
			throw new Error("abstract Class DB.Connector");
		},
		_getCreateString:function(obj)
		{
			let rtn="CREATE TABLE IF NOT EXISTS "+obj.objectType+" ( ";
			for (let f in obj.fields)
			{
				rtn+=f+" "+LITECON.TYPES[obj.fields[f].type];
				if(f=="ID")
				{
					rtn+=" NOT NULL PRIMARY KEY";
				}
				rtn+=" ,";
			}
			rtn=rtn.slice(0,-1)+" )";
			µ.debug("SQLiteConnector.getCreateString: "+rtn,2);
			return rtn;
		},
		_getInsertString:function(obj)
		{
			let rtn="INSERT INTO "+obj.objectType+" ( ";
			let values="";
			for (let f in obj.fields)
			{
				rtn+=f+" ,";
				values+=":"+f+" ,";
			}
			rtn=rtn.slice(0,-1)+" ) VALUES ("+values;
			rtn=rtn.slice(0,-1)+" )";
			µ.debug("SQLiteConnector.getInsertString: "+rtn,2);
			return rtn;
		},
		_getUpdateString:function(obj)
		{
			let rtn="UPDATE "+obj.objectType+" SET ";
			let values="";
			for (let f in obj.fields)
			{
				if(f!="ID")
					rtn+=f+"=:"+f+" ,";
			}
			rtn=rtn.slice(0,-1)+" WHERE ID=:ID"+values;
			µ.debug("SQLiteConnector.getUpdateString: "+rtn,2);
			return rtn;
		},
		//TODO?? asynchron returns not all results -> synchron?
		getNextIDs:function(detached,insert)
		{
			µ.debug(["SQLiteConnector.getNextIDs: ",arguments],2);
			let con=this._service.openDatabase(this.file);
			let loadIDs=[];
			let rtn={};
			for(let type in insert)
			{
				con.createAsyncStatement(this._getCreateString(insert[type][0]))
				.executeAsync();
				let stmt=con.createAsyncStatement("SELECT 0 AS newID WHERE NOT EXISTS (SELECT ID FROM "+type+" WHERE ID=0) UNION "+"SELECT ID+1 AS newID FROM "+type+" WHERE ID+1 NOT IN (SELECT ID FROM "+type+")");
				rtn[type]=[];
				let loaded=new µ.Detached();
				loadIDs.push(loaded);
				(function(detached,type){
					stmt.executeAsync(
					{
						handleResult:function(aResultSet)
						{
							for (let row = aResultSet.getNextRow();row;row = aResultSet.getNextRow())
							{
								rtn[type].push(row.getResultByName("newID"));
							}
							detached.complete(type);
						},
						handleError:function(e){µ.debug(e,0);detached.error(e)},
						handleCompletion:function(){}
					});
				})(loaded.signal(),type)
			}
			con.asyncClose();
			if(loadIDs.length==0)
			{
				µ.debug("SQLiteConnector.getNextIDs: no IDs to load",3);
				detached.complete(rtn);
			}
			else
			{
				let when=new µ.Detached(loadIDs).complete(function(){detached.complete(rtn)},true);
				µ.debug(["SQLiteConnector.getNextIDs: loading IDs ",when],3);
			}
		},
		_parsePattern:function(pattern)
		{
			let str="";
			if(pattern!=null)
			{
				if(Object.keys(pattern).length>0)
				{
					str+=" WHERE";
					for(let i in pattern)
					{
						str+=" "+i;
						
						if (pattern[i] instanceof Array)
						{
							str+=" IN ("+JSON.stringify(pattern[i]).slice(1,-1)+")";
						}
						else
						{
							let val=pattern[i];
							if((val+"").match(/^([<=>]|is|not|between|in|like|GLOB)/ig)!=null)
							{
								str+=" "+val;
							}
							else if (typeof val ==="boolean")
							{
								str+=" = "+~~val;
							}
							else
							{
								str+=" = "+JSON.stringify(val);
							}
						}
						str+=" AND"
					}
					str=str.slice(0,-4);
				}
				else if (typeof pattern=="string")
				{
					str+=" WHERE "+pattern;
				}
			}
			return str;
		}
	});
	LITECON.TYPES={
		0:"BOOL",//		"BOOL"
		1:"INTEGER",//	"INT"
		2:"DOUBLE",//	"DOUBLE"
		3:"TEXT",//		"STRING"
		4:"TEXT",//		"DATE"
		5:"BLOB",//		"BLOB"
		6:"TEXT"//		"JSON"
	};
})(Morgas,gµ);