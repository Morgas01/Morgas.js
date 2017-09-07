(function(µ,SMOD,GMOD,HMOD,SC){

	SC=SC({
		prom:"Promise"
	});
	
	let DB=µ.DB=µ.DB||{};
	
	let DBC,DBOBJECT,REL,FIELD;
	
	DBC=DB.Connector=µ.Class(
	{
		[µ.Class.symbols.onExtend]:function(sub)
		{
			if(typeof sub.prototype.load!="function") throw new Error("#DB.Connector:001 load() is not defined");
			if(typeof sub.prototype.save!="function") throw new Error("#DB.Connector:002 save() is not defined");
			if(typeof sub.prototype.delete!="function") throw new Error("#DB.Connector:003 delete() is not defined");
		},
		constructor:function()
		{
			SC.prom.pledgeAll(this,["save","load","delete","destroy"]);
		},
		/*
		save:function(signal,objs)
		{
			objs=[].concat(objs);
			let sortedObjs=DBC.sortObjs(objs);
		},
		load:function(signal,objClass,pattern)
		{
		},
		"delete":function(signal,objClass,toDelete)
		{
			let toDelete=DBC.getDeletePattern(objClass,toDelete);
		},
		*/
		
		/* these should be same for everyone*/
		saveChildren:function(obj,relationName)
		{
			return this.save(obj.getChildren(relationName));
		},
		saveFriendships:function(obj,relationName)
		{
			let rel=obj.relations[relationName],
				friends=obj.friends[relationName];
			if(!friends)
			{
				µ.logger.warn("no friends in relation "+relationName+" found");
				return new SC.prom.resolve(false,this);
			}
			let fRel=friends[0].relations[rel.targetRelationName],
				id=obj.ID;
			if(id==null)
			{
				µ.logger.warn("friend id is null");
				return new SC.prom.resolve(false,this);
			}
			let fids=[];
			for(let i=0;i<friends.length;i++)
			{
				let fid=friends[i].ID;
				if(fid!=null)
					fids.push(fid);
			}
			if(fids.length===0)
			{
				µ.logger.warn("no friend with friend id found");
				return new SC.prom.resolve(false,this);
			}
			let tableName=DBC.getFriendTableName(obj.objectType,relationName,friends[0].objectType,rel.targetRelationName),
				idName=obj.objectType+"_ID",
				fidName=friends[0].objectType+"_ID",
				toSave=[];
			if (rel.relatedClass===fRel.relatedClass)
			{
				fidName+=2;
			}
			let friendship=DBFRIEND.implement(obj,relationName);
			for(let i=0;i<fids.length;i++)
			{
				toSave.push(new friendship(id,fids[i]));
			}
			return this.save(toSave);
		},
		
		loadParent:function(child,relationName)
		{
			let relation=child.relations[relationName],
				parentClass=relation.relatedClass,
				fieldName=relation.fieldName,
				targetRelationName=relation.targetRelationName;
			return this.load(parentClass,{ID:child.getValueOf(fieldName)}).then(function(result)
			{
				let parent=result[0];
				if(parent)
				{
					if(targetRelationName) parent.addChild(targetRelationName,child);
					else child.setParent(relationName,parent);
				}
				return parent;
			});
		},
		loadChildren:function(obj,relationName,pattern)
		{
			let relation=obj.relations[relationName],
				childClass=relation.relatedClass,
				childRelation=new childClass().relations[relation.targetRelationName],
				fieldName=childRelation.fieldName;

			pattern=pattern||{};
			pattern[fieldName]=obj.ID;

			return this.load(childClass,pattern).then(function(children)
			{
				obj.addChildren(relationName,children);
				return children;
			});
		},
		loadFriends:function(obj,relationName,pattern)
		{
			let friendship=DBFRIEND.implement(obj,relationName);
			let fPattern={};
			fPattern[friendship.prototype.objFieldname]=obj.ID;

			let p=this.load(friendship,fPattern);
			
			if (friendship.prototype.objClass===friendship.prototype.friendClass)
			{
				p=p.then(function(results)
				{
					fPattern[friendship.prototype.friendFieldname]=fPattern[friendship.prototype.objFieldname];
					delete fPattern[friendship.prototype.objFieldname];
					return this.load(friendship,fPattern).then(function(results2)
					{
						for(let i=0;i<results2.length;i++)
						{
							let t=results2[i].fields[friendship.prototype.objFieldname].value;
							results2[i].fields[friendship.prototype.objFieldname].value=results2[i].fields[friendship.prototype.friendFieldname].value;
							results2[i].fields[friendship.prototype.friendFieldname].value=t;
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
						return val.fields[friendship.prototype.friendFieldname].value;
					});
					return this.load(friendship.prototype.friendClass,pattern);
				}
				else return [];
			});
			return p;
		},
		deleteFriendships:function(obj,relationName)
		{
			let rel=obj.relations[relationName],
				friends=obj.friends[relationName];
			if(!friends)
			{
				SC.debug("no friends in relation "+relationName+" found",2);
				return new SC.prom.resolve(false,this);
			}
			let fRel=friends[0].relations[rel.targetRelationName],
				id=obj.ID;
			if(id==null)
			{
				µ.logger.warn("object's id is null",2);
				return new SC.prom.resolve(false,this);
			}
			let fids=[];
			for(let i=0;i<friends.length;i++)
			{
				let fid=friends[i].ID;
				if(fid!=null)
					fids.push(fid);
			}
			if(fids.length===0)
			{
				µ.logger.warn("no friend with friend id found");
				return new SC.prom.resolve(false,this);
			}
			let friendship=DBFRIEND.implement(obj,relationName),
				toDelete=[];
			if (friendship.prototype.objClass===friendship.prototype.friendClass)
			{
				let pattern={};
				pattern[friendship.prototype.objFieldname]=fids;
				pattern[friendship.prototype.friendFieldname]=id;
				toDelete.push(pattern);
			}
			let pattern={};
			pattern[friendship.prototype.objFieldname]=id;
			pattern[friendship.prototype.friendFieldname]=fids;
			toDelete.push(pattern);

			return new SC.prom.always(toDelete.map(p=>this.delete(friendship,p)),{scope:this});
		},
		connectFriends:function(dbObjects)
		{
			throw "TODO";
		}
	});

	DBC.sortObjs=function(objs)
	{
		let rtn={friend:{},fresh:{},preserved:{}};
		for(let i=0;i<objs.length;i++)
		{
			let obj=objs[i],
			type=(obj instanceof DBFRIEND ? "friend" :(obj.ID===null ? "fresh" : "preserved")),
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
			let ids=[];
			for(let i=0;i<toDelete.length;i++)
			{
				if(toDelete[i] instanceof objClass)
				{
					ids.push(toDelete[i].ID);
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
		[µ.Class.symbols.onExtend]:function(sub)
		{
			if(sub.prototype.objectType==null) throw new SyntaxError("#DB.Object:001 objectType is not defined");
			if(DBOBJECT.classesMap.has(sub.prototype.objectType)) throw new RangeError("#DB.Object:002 objectType mut be unique");
		},
		[µ.Class.symbols.abstract]:true,
		constructor:function(param={})
		{
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
			if(type===REL.TYPES.PARENT)
			{
				this.fields[fieldName]=new REFERENCEFIELD(this,name);
				Object.defineProperty(this,fieldName,{
					configurable:false,
					enumerable:true,
					get:()=>this.getValueOf(fieldName),
					set:v=>this.setValueOf(fieldName,v)
				});
			}
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
		setValueOf:function(fieldName,val){this.fields[fieldName].setValue(val);},
		getParent:function(relationName)
		{
			return this.parents[relationName];
		},
		setParent:function(relationName,parent)
		{
			let rel=this.relations[relationName];
			this.parents[relationName]=parent;
			this.setValueOf(rel.fieldName,null);
		},
		_add:function(container,relationName,value)
		{
			let c=container[relationName]=container[relationName]||[];
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
				child.setParent(this.relations[relationName].targetRelationName,this);
			}
		},
		addChildren:function(relationName,children)
		{
			for(let i=0;i<children.length;i++)
			{
				this.addChild(relationName,children[i]);
			}
		},
		getChildren:function(relationName)
		{
			return this._get(this.children,relationName);
		},
		removeChild:function(relationName,child)
		{
			if(relationName in this.relations)
			{
				let rel=this.relations[relationName];
				let container=this.children[relationName];
				if(container)
				{
					let index=container.findIndex(c=>c===child||(c.objectType===child.objectType&&c.ID==child.ID));
					if(index!==-1) container.splice(index,1);
				}

				let cRel=child.relations[rel.targetRelationName];
				if(child.getValueOf(cRel.fieldName)===this.ID) child.setParent(rel.targetRelationName,null);
			}
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
			for(let i=0;i<friends.length;i++)
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
			let relationKeys=Object.keys(this.relations);
			for(let i=0;i<relationKeys.length;i++)
			{
				let relation=this.relations[relationKeys[i]];

				if(relation.type===REL.TYPES.FRIEND) continue; // use DBConn //TODO search for DBFriend

				for(let dbObject of dbObjects)
				{
					if(dbObject instanceof relation.relatedClass)
					{
						let parent,child,childRelation,childRelationName;
						switch (relation.type)
						{
							case REL.TYPES.PARENT:
								child=this;
								childRelation=relation;
								childRelationName=relation.targetRelationName;
								parent=dbObject;
								break;
							case REL.TYPES.CHILD:
								child=dbObject;
								childRelationName=relationKeys[i];
								childRelation=dbObject.relations[relation.targetRelationName];
								parent=this;
								break;
						}
						if(child.getValueOf(childRelation.fieldName)==parent.ID)
						{
							parent.addChild(childRelationName,child);
						}
					}
				}
			}
		},
		toJSON:function()
		{
			let rtn={};
			for(let f in this.fields)
			{
				let value=this.fields[f].toJSON();
				if(value!=null)rtn[f]=value;
			}
			return rtn;
		},
		fromJSON:function(jsonObject)
		{
			for(let i in this.fields)
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
		for(let i=0;i<dbObjects.length;i++)
		{
			let dbObj=dbObjects[i];
			if(dbObj instanceof DBOBJECT)
			{
				dbObj.connectObjects(dbObjects.slice(i));
			}
		}
	}
	DBOBJECT.classesMap=new Map();
	SMOD("DBObj",DBOBJECT);
	
	let DBFRIEND=DB.Firendship=µ.Class(
	{
		[µ.Class.symbols.abstract]:function(DBobj,relationName)
		{
			let objClass=DBobj.constructor,
				rel=DBobj.relations[relationName],
				friendClass=rel.relatedClass.prototype.constructor,
				friendInst=new friendClass(),
				objFieldname=DBobj.objectType+"_ID",
				friendFieldname=friendClass.prototype.objectType+"_ID",
				type=[DBobj.objectType,relationName,friendInst.objectType,rel.targetRelationName].sort().join("_");

			if (objClass===friendClass)
			{
				friendFieldname+=2;
			}

			return {
				objectType:type,
				constructor:function(objId,friendId)
				{
					this.fields={};
					this.fields[objFieldname]=new FIELD(FIELD.TYPES.INT,objId);
					this.fields[friendFieldname]=new FIELD(FIELD.TYPES.INT,friendId);
				},
				objClass:objClass,
				objFieldname:objFieldname,
				friendClass:friendClass,
				friendFieldname:friendFieldname
			}
		},
		toJSON:DBOBJECT.prototype.toJSON,
		fromJSON:DBOBJECT.prototype.fromJSON
	});
	SMOD("DBFriend",DBFRIEND);

	//TODO integrate into DBObject
	REL=DB.Relation=µ.Class(
	{
		constructor:function(relatedClass,type,targetRelationName,fieldName)
		{
			if(fieldName==null)
			{
				if(type==REL.TYPES.PARENT)
					throw "DB.Relation: parent relation needs a fieldName";
				else
					fieldName="ID";
			}
			if(type==null) throw "no relation type";
			this.type=type;
			this.relatedClass=relatedClass; //TODO change to array of classes to support inheritance
			this.fieldName=fieldName;
			if(targetRelationName==null&&(type==REL.TYPES.CHILD||type==REL.TYPES.FRIEND)) throw "DB.Relation: relations other than parent need a targetRelationName";
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
		constructor:function(type,value,options)
		{
			this.type=type;
			this.value=value;
			this.options=options||{};	// depends on connector
		},
		setValue:function(val)
		{
			this.value=val;
		},
		getValue:function()
		{
			if(this.value===undefined) return null;
			return this.value;
		},
		toJSON:function()
		{
			switch(this.type)
			{
				case FIELD.TYPES.DATE:
					let date=this.getValue();
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

	let REFERENCEFIELD=DB.Field.Reference=µ.Class(FIELD,{
		constructor:function(dbObj,relationName)
		{
			this.mega(FIELD.TYPES.INT);
			this.dbObj=dbObj;
			this.relationName=relationName;
		},
		getValue:function()
		{
			let parent=this.dbObj.parents[this.relationName];
			if(parent) return parent.ID;
			return this.mega();
		}
	})
})(Morgas,Morgas.setModule,Morgas.getModule,Morgas.hasModule,Morgas.shortcut);