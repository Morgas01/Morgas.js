(function(µ,SMOD,GMOD,HMOD,SC){

	SC=SC({
		prom:"Promise"
	});
	
	var DB=µ.DB=µ.DB||{};
	
	var DBC,TRAN,STMT,DBOBJECT,REL,FIELD;
	
	DBC=DB.Connector=µ.Class(
	{
		/* override these */
		init:function()
		{
			SC.prom.pledgeAll(this,["save","load","delete","destroy"]);
		},
		
		save:function(signal,objs)
		{
			/*
			objs=[].concat(objs);
			var sortedObjs=DBC.sortObjs(objs);
			*/
			throw new Error("abstract Class DB.Connector");
		},
		load:function(signal,objClass,pattern)
		{
			throw new Error("abstract Class DB.Connector");
		},
		"delete":function(signal,objClass,toDelete)
		{
			/*
			var toDelete=DBC.getDeletePattern(objClass,toDelete);
			*/
			throw new Error("abstract Class DB.Connector");
		},
		destroy:function()
		{
			throw new Error("abstract Class DB.Connector");
		},
		
		/* these should be same for everyone*/
		saveChildren:function(obj,relationName)
		{
			return this.save(obj.getChildren(relationName));
		},
		saveFriendships:function(obj,relationName)
		{
			var rel=obj.relations[relationName],
				friends=obj.friends[relationName];
			if(!friends)
			{
				µ.logger.warn("no friends in relation "+relationName+" found");
				return new SC.prom.resolve(false,this);
			}
			var fRel=friends[0].relations[rel.targetRelationName],
				id=obj.getID();
			if(id==null)
			{
				µ.logger.warn("friend id is null");
				return new SC.prom.resolve(false,this);
			}
			var fids=[];
			for(var i=0;i<friends.length;i++)
			{
				var fid=friends[i].getID();
				if(fid!=null)
					fids.push(fid);
			}
			if(fids.length===0)
			{
				µ.logger.warn("no friend with friend id found");
				return new SC.prom.resolve(false,this);
			}
			var tableName=DBC.getFriendTableName(obj.objectType,relationName,friends[0].objectType,rel.targetRelationName),
				idName=obj.objectType+"_ID",
				fidName=friends[0].objectType+"_ID",
				toSave=[];
			if (rel.relatedClass===fRel.relatedClass)
			{
				fidName+=2;
			}
			var friendship=DBFRIEND.generator(obj,relationName);
			for(var i=0;i<fids.length;i++)
			{
				toSave.push(new friendship(id,fids[i]));
			}
			return this.save(toSave);
		},
		
		loadParent:function(obj,relationName)
		{
			var relation=obj.relations[relationName],
				parentClass=relation.relatedClass,
				fieldName=relation.fieldName;
			return this.load(parentClass,{ID:obj.getValueOf(fieldName)}).then(function(result)
			{
				var parent=result[0];
				parent.addChild(relationName,obj);
				return parent;
			});
		},
		loadChildren:function(obj,relationName,pattern)
		{
			var relation=obj.relations[relationName],
				childClass=relation.relatedClass,
				childRelation=new childClass().relations[relation.targetRelationName],
				fieldName=childRelation.fieldName;

			pattern=pattern||{};
			pattern[fieldName]=obj.getID();

			return this.load(childClass,pattern).then(function(children)
			{
				obj.addChildren(relationName,children);
				return children;
			});
		},
		loadFriends:function(obj,relationName,pattern)
		{
			var friendship=DBFRIEND.generator(obj,relationName);
			var fPattern={};
			fPattern[friendship.objFieldname]=obj.getID();

			var p=this.load(friendship,fPattern);
			
			if (friendship.objClass===friendship.friendClass)
			{
				p=p.then(function(results)
				{
					fPattern[friendship.friendFieldname]=fPattern[friendship.objFieldname];
					delete fPattern[friendship.objFieldname];
					return this.load(friendship,fPattern).then(function(results2)
					{
						for(var i=0;i<results2.length;i++)
						{
							var t=results2[i].fields[friendship.objFieldname].value;
							results2[i].fields[friendship.objFieldname].value=results2[i].fields[friendship.friendFieldname].value;
							results2[i].fields[friendship.friendFieldname].value=t;
						}
						return results.concat(results2);
					});
				});
			}
			p=p.then(function(results)
			{
				if(results.length>0)
				{
					pattern=pattern||{};
					pattern.ID=results.map(function(val)
					{
						return val.fields[friendship.friendFieldname].value;
					});
					return this.load(friendship.friendClass,pattern);
				}
				else return [];
			});
			return p;
		},
		deleteFriendships:function(obj,relationName)
		{
			var rel=obj.relations[relationName],
				friends=obj.friends[relationName];
			if(!friends)
			{
				SC.debug("no friends in relation "+relationName+" found",2);
				return new SC.prom.resolve(false,this);
			}
			var fRel=friends[0].relations[rel.targetRelationName],
				id=obj.getID();
			if(id==null)
			{
				µ.logger.warn("object's id is null",2);
				return new SC.prom.resolve(false,this);
			}
			var fids=[];
			for(var i=0;i<friends.length;i++)
			{
				var fid=friends[i].getID();
				if(fid!=null)
					fids.push(fid);
			}
			if(fids.length===0)
			{
				µ.logger.warn("no friend with friend id found");
				return new SC.prom.resolve(false,this);
			}
			var fClass=DBFRIEND.generator(obj,relationName),
				toDelete=[];
			if (fClass.objClass===fClass.friendClass)
			{
				var pattern={};
				pattern[fClass.objFieldname]=fids;
				pattern[fClass.friendFieldname]=id;
				toDelete.push(pattern);
			}
			var pattern={};
			pattern[fClass.objFieldname]=id;
			pattern[fClass.friendFieldname]=fids;
			toDelete.push(pattern);

			return new SC.prom.always(toDelete.map(p=>this.delete(fClass,p)),{scope:this});
		},
		connectFriends:function(dbObjects)
		{
			//TODO
		}
	});

	DBC.sortObjs=function(objs)
	{
		var rtn={friend:{},fresh:{},preserved:{}};
		for(var i=0;i<objs.length;i++)
		{
			var obj=objs[i],
			type=(obj instanceof DBFRIEND ? "friend" :(obj.getID()===undefined ? "fresh" : "preserved")),
			objType=obj.objectType;
			
			if(rtn[type][objType]===undefined)
			{
				rtn[type][objType]=[];
			}
			rtn[type][objType].push(obj);
		}
		return rtn;
	};

	//make toDelete a Pattern from Number, DB.Object or Array
	DBC.getDeletePattern=function(objClass,toDelete)
	{
		if(typeof toDelete==="number" || toDelete instanceof DB.Object)
		{
			toDelete=[toDelete];
		}
		if(Array.isArray(toDelete))
		{
			var ids=[];
			for(var i=0;i<toDelete.length;i++)
			{
				if(toDelete[i] instanceof objClass)
				{
					ids.push(toDelete[i].getID());
				}
				else if (typeof toDelete[i]==="number") ids.push(toDelete[i]);
			}
			toDelete={ID:ids};
		}
		return toDelete;
	};
	DBC.getFriendTableName=function(objType,relationName,friendType,friendRelationName)
	{
		return [objType,relationName,friendType,friendRelationName].sort().join("_");
	};
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
			Object.defineProperty(this,name,{
				configurable:false,
				enumerable:true,
				get:()=>this.getValueOf(name),
				set:v=>this.setValueOf(name,v)
			});
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
		connectObjects:function(dbObjects)
		{
			var relationKeys=Object.keys(this.relations);
			for(var i=0;i<relationKeys.length;i++)
			{
				var relation=this.relations[relationKeys[i]];

				if(relation.type===REL.TYPES.FRIEND) continue; // use DBConn

				for(var dbObject of dbObjects)
				{
					if(dbObject instanceof relation.relatedClass)
					{
						var parent,child,childRelation;
						switch (relation.type)
						{
							case REL.TYPES.PARENT:
								child=this;
								childRelation=relation;
								parent=dbObject;
								break;
							case REL.TYPES.CHILD:
								child=dbObject;
								childRelation=dbObject.relations[relation.targetRelationName];
								parent=this;
								break;
						}
						if(child.getValueOf(childRelation.fieldName)==parent.getID())
						{
							parent.addChild(child);
						}
					}
				}
			}
		},
		toJSON:function()
		{
			var rtn={};
			for(var f in this.fields)
			{
				rtn[f]=this.fields[f].toJSON();
			}
			return rtn;
		},
		fromJSON:function(jsonObject)
		{
			for(var i in this.fields)
			{
				if(jsonObject[i]!==undefined)
				{
					this.fields[i].fromJSON(jsonObject[i]);
				}
			}
			return this;
		},
		toString:function()
		{
			return JSON.stringify(this);
		}
	});
	DBOBJECT.connectObjects=function(dbObjects)
	{
		for(var i=0;i<dbObjects.length;i++)
		{
			var dbObj=dbObjects[i];
			if(dbObj instanceof DBOBJECT)
			{
				dbObj.connectObjects(dbObjects.slice(i));
			}
		}
	}
	SMOD("DBObj",DBOBJECT);
	
	var DBFRIEND=DB.Firendship=µ.Class(
	{
		init:function()
		{
			throw "DB.Friendship is abstract.\nPlease use the generator";
		},
		toJSON:DBOBJECT.prototype.toJSON,
		fromJSON:DBOBJECT.prototype.fromJSON
	});
	DBFRIEND.generator=function(DBobj,relationName)
	{
		var objClass=DBobj.constructor,
			rel=DBobj.relations[relationName],
			friendClass=rel.relatedClass,
			friendInst=new friendClass(),
			objFieldname=DBobj.objectType+"_ID",
			friendFieldname=friendClass.prototype.objectType+"_ID",
			type=[DBobj.objectType,relationName,friendInst.objectType,rel.targetRelationName].sort().join("_");

		if (objClass===friendClass)
		{
			friendFieldname+=2;
		}

		var friendship=µ.Class(DBFRIEND,
		{
			objectType:type,
			init:function(objId,friendId)
			{
				this.fields={};
				this.fields[objFieldname]=new FIELD(FIELD.TYPES.INT,objId);
				this.fields[friendFieldname]=new FIELD(FIELD.TYPES.INT,friendId);
			},
			objClass:objClass,
			objFieldname:objFieldname,
			friendClass:friendClass,
			friendFieldname:friendFieldname
		});
		friendship.objClass=objClass;
		friendship.objFieldname=objFieldname;
		friendship.friendClass=friendClass;
		friendship.friendFieldname=friendFieldname;
		return friendship;
	};
	SMOD("DBFriend",DBFRIEND);
	
	REL=DB.Relation=µ.Class(
	{
		init:function(relatedClass,type,targetRelationName,fieldName)
		{
			if(fieldName==null)
			{
				if(type==REL.TYPES.PARENT)
					throw "DB.Relation: parent relation needs a fieldName";
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
			this.type=type;
			this.value=value;
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
					if(date instanceof Date)
						return date.getUTCFullYear()+","+date.getUTCMonth()+","+date.getUTCDate()+","+date.getUTCHours()+","+date.getUTCMinutes()+","+date.getUTCSeconds()+","+date.getUTCMilliseconds();
					break;
				default:
					return this.getValue();
			}
		},
		fromJSON:function(jsonObj)
		{
			switch(this.type)
			{
				case FIELD.TYPES.DATE:
					this.value=new Date(Date.UTC.apply(Date,jsonObj.split(",")));
					break;
				//TODO other conversions e.g. number from string
				default:
					this.value=jsonObj;
			}
		},
		toString:function()
		{
			return JSON.stringify(this);
		},
		fromString:function(val)
		{
			switch(this.type)
			{
				case FIELD.TYPES.BOOL:
					this.value=!!(~~val);
					break;
				case FIELD.TYPES.INT:
					this.value=~~val;
					break;
				case FIELD.TYPES.DOUBLE:
					this.value=1*val;
					break;
				case FIELD.TYPES.DATE:
				case FIELD.TYPES.STRING:
				    this.value=val;
				    break;
				case FIELD.TYPES.JSON:
				default:
					this.fromJSON(JSON.parse(val));
					break;
			}
		}
	});
	FIELD.TYPES={
		"BOOL"		:0,
		"INT"		:1,
		"DOUBLE"	:2,
		"STRING"	:3,
		"DATE"		:4,
		"JSON"		:5,
		"BLOB"		:6
	};
	SMOD("DBField",FIELD);
})(Morgas,Morgas.setModule,Morgas.getModule,Morgas.hasModule,Morgas.shortcut);