//Morgas.js
﻿(function MorgasInit(oldµ){
	Morgas={version:"0.3"};
	µ=Morgas;
	/**
	 * revert "µ" to its old value
	 */
	µ.revert=function()
	{
		return µ=oldµ;
	};
	
	µ.constantFunctions={
			"ndef":function(){return undefined},
			"nul":function(){return null},
			"f":function(){return false},
			"t":function(){return true;},
			"zero":function(){return 0;},
			"boolean":function(val){return !!val}
		};

	/** Modules
	 *	Every class and utility function should define a Module, which can
	 *	be replaced by any other function or class that has similar structure.
	 *
	 *	However they should NEVER only define a Module! It should only be used to
	 *	shortcut paths and ensure flexibility.
	 */
	(function(){
		var modules={};
		µ.setModule=function(key,value)
		{
			if(modules[key])
			{
				µ.debug("module "+key+" is overwritten",2);
			}
			return modules[key]=value;
		};
		µ.hasModule=function(key)
		{
			return !!modules[key];
		};
		µ.getModule=function(key)
		{
			if(!modules[key])
				µ.debug("module "+key+" is not defined\n use µ.hasModule to check for existence",0);
			return modules[key];
		};
	})();
	var SMOD=µ.setModule,GMOD=µ.getModule,HMOD=µ.hasModule;
	
	/**
	 * Debug message if it's verbose is >= the current verbose.
	 * If a message is a function its return value will be logged.
	 * 
	 * Set µ.debug.verbose to any number >= 0 to control wich events should be logged.
	 * Set it to False to turn it off.
	 * 
	 * Set µ.debug.out to any function you like to log the events and errors.
	 */
	µ.debug=function(msg,verbose)
	{
		if(!verbose)
		{
			verbose=0;
		}
		if(µ.debug.verbose!==false&&µ.debug.verbose>=verbose)
		{
			if(typeof msg == "function")
				msg=msg();
				
			µ.debug.out(msg,verbose);
		}
	};
	SMOD("debug",µ.debug);
	
	µ.debug.LEVEL={
		OFF:false,
		ERROR:0,
		WARNING:1,
		INFO:2,
		DEBUG:3
	};
	µ.debug.verbose=µ.debug.LEVEL.WARNING;
	µ.getDebug=function(debug){µ.debug.verbose=debug};
	µ.setDebug=function(debug){µ.debug.verbose=debug};
	µ.debug.out=function(msg,verbose)
	{
		switch(verbose)
		{
			case 0:
				console.error(msg);
				break;
			case 1:
				console.warn(msg);
				break;
			case 2:
				console.info(msg);
				break;
			case 3:
			default:
				console.log(msg);
		}
	};
	
	/** shortcut
	 * creates an object that will evaluate its values defined in {map} on its first call.
	 * when {context} is provided and {map.value} is not a function it will treated as a path from {context}
	 *
	 * uses goPath
	 *
	 * map:	{key:("moduleOrPath",function)}
	 * context: any (optional)
	 * target: {} (optional)
	 *
	 * returns {key:value}
	 */
	µ.shortcut=function(map,target,context,dynamic)
	{
		if(!target)
		{
			target={};
		}
		for(var m in map){(function(path,key)
		{
			var value=undefined;
			Object.defineProperty(target,key,{
				configurable:false,
				enumerable:true,
				get:function()
				{
					if(value==null||dynamic)
					{
						if(typeof path=="function")
							value=path(context);
						else if(context&&HMOD("goPath"))
							value=GMOD("goPath")(context,path);
						else if (HMOD(path))
							value=GMOD(path);
						else
							GMOD("debug")("shortcut: could not evaluate "+path)
					}
					return value;
				}
			});
		})(map[m],m)}
		return target;
	};
	SMOD("shortcut",µ.shortcut);
	
	/** Class function
	 * Designed to create JavaScript Classes
	 * 
	 *  It does the inheritance, checks for arguments,
	 *  adds the core patch to it and calls the init() method.
	 *  
	 *  
	 *  To create a class do this:
	 *  
	 *  myClass=µ.Class(mySuperClass,myPrototype)
	 *  
	 *  OR
	 *  
	 *  myClass=µ.Class(mySuperClass)
	 *  myClass.protoype.init=function()
	 *  {
	 *  	//call constructor of superclass
	 *  	mySuperClass.prototype.init.call(this,arg1,arg2...);
	 *  	//or this.superInit(mySuperClass,arg1,arg2...);
	 *  	//or this.superInitApply(mySuperClass,arguments);
	 *  
	 *  	//your constructor
	 *  }
	 *  
	 *  You also can derive this classes with "ordinary" classes like this:
	 *  
	 *  myClass=µ.Class(mySuperClass,myPrototype)
	 *  mySubClass=function()
	 *  {
	 *  	//whatever you like
	 *  }
	 *  mySubClass.protoytpe=new myClass(µ._EXTEND);
	 *  mySubClass.prototype.constructor=mySubClass;
	 *  
	 *  @param	superClass	(optional)	default: µ.BaseClass
	 *  @param	prototype	(optional)
	 */
	var CLASS=µ.Class=function ClassFunc(superClass,prot)
	{
		var newClass = function ClassConstructor()
		{
			this.init.apply(this,arguments);
			if(HMOD("Listeners")&&this instanceof GMOD("Listeners"))
			{
				this.setState(".created");
			}
		};

		if(typeof superClass !== "function")
		{
			prot=superClass;
			superClass=BASE;
		}
		if(superClass)
		{
			newClass.prototype=Object.create(superClass.prototype);
			newClass.prototype.constructor=newClass;
		}
		for(var i in prot)
		{
			newClass.prototype[i]=prot[i];
		}
		return newClass;
	};
	SMOD("Class",CLASS);
	
	/** Base Class
	 *	allows to check of being a class ( foo instanceof µ.BaseClass )
	 */
	var BASE=µ.BaseClass=CLASS(
	{
		init:function baseInit(){},
		superInit:function superInit(_class/*,arg1,arg2,...,argN*/)
		{
			_class.prototype.init.apply(this,[].slice.call(arguments,1));
		},
		superInitApply:function superInitApply(_class,args)
		{
			this.superInit.apply(this,[_class].concat([].slice.call(args)));
		}
	});
	SMOD("Base",BASE);
})(this.µ);

//DB/Morgas.DB.js
(function(µ,SMOD,GMOD){
	/**
	 * Depends on	: Morgas
	 * Uses			: util.object, Detached
	 *
	 * Database Classes
	 *
	 */

	var SC=GMOD("shortcut")({
		debug:"debug",
		det:"Detached"
	});
	
	var DB=µ.DB=µ.DB||{};
	
	var DBC,TRAN,STMT,DBOBJECT,REL,FIELD;
	
	DBC=DB.Connector=µ.Class(
	{
		/* override these */
		init:function()
		{
			SC.det.detacheAll(this,["save","load","delete","destroy"]);
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
				SC.debug("no friends in relation "+relationName+" found",2);
				return new SC.det.complete(false);
			}
			var fRel=friends[0].relations[rel.targetRelationName],
				id=obj.getID();
			if(id==null)
			{
				SC.debug("friend id is null",2);
				return new SC.det.complete(false);
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
				SC.debug("no friend with friend id found");
				return new SC.det.complete(false);
			}
			var tableName=DBC.getFriendTableName(obj.objectType,relationName,friends[0].objectType,rel.targetRelationName),
				idName=obj.objectType+"_ID",
				fidName=friends[0].objectType+"_ID",
				toSave=[];
			if (rel.relatedClass===fRel.relatedClass)
			{
				fidName+=2;
			}
			for(var i=0;i<fids.length;i++)
			{
				toSave.push(new DBFRIEND(tableName,idName,id,fidName,fids[i]));
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
				this.complete(parent);
			});
		},
		loadChildren:function(obj,relationName,pattern)
		{
			var relation=obj.relations[relationName],
				childClass=rel.relatedClass,
				fieldName=relation.fieldName;
			pattern[fieldName]=this.getID();
			return this.load(childClass,pattern).then(function(children)
			{
				obj.addChildren(children);
				this.complete(children);
			});
		},
		loadFriends:function(obj,relationName,pattern)
		{
			var _self=this,
				rel=obj.relations[relationName],
				friendClass=rel.relatedClass,
				fRel=new friendClass().relations[rel.targetRelationName],
				id=obj.objectType+"_ID",
				fid=friendClass.prototype.objectType+"_ID",
				type=DBC.getFriendTableName(obj.objectType,relationName,friendClass.prototype.objectType,rel.targetRelationName),
				fPattern={};
			
			if (rel.relatedClass===fRel.relatedClass)
			{
				fid+=2;
			}
			fPattern[id]=obj.getID();
			var friendship=DBFRIEND.Generator(type,id,fid);
			
			var p=this.load(friendship,fPattern);
			
			if (rel.relatedClass===fRel.relatedClass)
			{
				p=p.then(function(results)
				{
					var signal=this;
					fPattern[fid]=fPattern[id];
					delete fPattern[id];
					_self.load(friendship,fPattern).then(function(results2)
					{
						for(var i=0;i<results2.length;i++)
						{
							var t=results2[i].fields[id].value;
							results2[i].fields[id].value=results2[i].fields[fid].value;
							results2[i].fields[fid].value=t;
						}
						signal.complete(results.concat(results2));
					},SC.debug);
				},SC.debug)
			}
			return p.then(function(results)
			{
				pattern.ID=results.map(function(val)
				{
					return val.fields[fid].value;
				});
				return _self.load(friendClass,pattern);
			},SC.debug);
		},
		deleteFriendships:function(obj,relationName)
		{
			var rel=obj.relations[relationName],
				friends=obj.friends[relationName];
			if(!friends)
			{
				SC.debug("no friends in relation "+relationName+" found",2);
				return new SC.det.complete(false);
			}
			var fRel=friends[0].relations[rel.targetRelationName],
				id=obj.getID();
			if(id==null)
			{
				SC.debug("friend id is null",2);
				return new SC.det.complete(false);
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
				SC.debug("no friend with friend id found");
				return new SC.det.complete(false);
			}
			var tableName=DBC.getFriendTableName(obj.objectType,relationName,friends[0].objectType,rel.targetRelationName),
				idName=obj.objectType+"_ID",
				fidName=friends[0].objectType+"_ID",
				toDelete=[];
			if (rel.relatedClass===fRel.relatedClass)
			{
				fidName+=2;
				var pattern={};
				pattern[idName]=fids;
				pattern[fidName]=id;
				toDelete.push(pattern);
			}
			var pattern={};
			pattern[idName]=id;
			pattern[fidName]=fids;
			toDelete.push(pattern);
			
			var wait=[],
			fClass=DBFRIEND.Generator(tableName,idName,fidName);
			for(var i=0;i<toDelete.length;i++)
			{
				wait.push(this["delete"](fClass,toDelete[i]));
			}
			return new SC.det(wait)
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
		var type=typeof toDelete;
		if(type==="number" || toDelete instanceof DB.Object)
		{
			toDelete=[toDelete];
		}
		if(Array.isArray(toDelete))
		{
			for(var i=0;i<toDelete.length;i++)
			{
				if(toDelete[i] instanceof objClass)
				{
					toDelete[i]=toDelete[i].getID();
				}
			}
			toDelete={ID:toDelete};
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
	SMOD("DBObj",DBOBJECT);
	
	var DBFRIEND=DB.Firendship=µ.Class(
	{
		init:function(type,fieldName1,value1,fieldName2,value2)
		{
			this.objectType=type;
			this.fields={};
			this.fields[fieldName1]=new FIELD(FIELD.TYPES.INT,value1);
			this.fields[fieldName2]=new FIELD(FIELD.TYPES.INT,value2);
		},
		toJSON:DBOBJECT.prototype.toJSON,
		fromJSON:DBOBJECT.prototype.fromJSON
	});
	DBFRIEND.Generator=function(type,fieldname1,fieldname2)
	{
		return µ.Class(DBFRIEND,
		{
			objectType:type,
			init:function(){
				this.superInit(DBFRIEND,type,fieldname1,null,fieldname2,null);
			}
		});
	};
	SMOD("DBFriend",DBFRIEND);
	
	REL=DB.Relation=µ.Class(
	{
		init:function(relatedClass,type,targetRelationName,fieldName)
		{
			if(fieldName==null)
			{
				if(type==REL.TYPES.PARENT)
					throw "DB.Relation: "+type+" relation needs a fieldName";
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
					this.fromJSON(JSON.parse(val));
					break;
				case FIELD.TYPES.STRING:
				case FIELD.TYPES.JSON:
				default:
					this.value=JSON.parse(val);
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
})(Morgas,Morgas.setModule,Morgas.getModule);
//Morgas.Organizer.js
(function(µ,SMOD,GMOD){
	 /**
	 * Depends on	: Morgas
	 * Uses			: util.object
	 *
	 * Organizer to reindex and group arrays
	 *
	 */
	var SC=GMOD("shortcut")({
		it:"iterate",
		eq:"equals",
		path:"goPath"
	});
	 
	var ORG=µ.Organizer=µ.Class({
		init:function(values)
		{
			this.values=[];
			this.filters={};
			this.maps={};
			this.groups={};
			
			if(values)
				this.add(values);
		},
		add:function(values,groupName,groupKey)
		{
			if(groupName&&groupKey)
			{
				this.group(groupName);
				this.groups[groupName].values[groupKey]=[]
			}
			SC.it(values,function(value)
			{
				var index=this.values.length;
				this.values.push(value);
				for(var m in this.maps)
				{
					this._map(this.maps[m],index);
				}
				for(var f in this.filters)
				{
					this._filter(this.filters[f],index);
				}
				for(var g in this.groups)
				{
					this._group(this.groups[g],index);
				}
				
				if(groupName&&groupKey)
				{
					this.groups[groupName].values[groupKey].push(index);
				}
			},false,false,this);
			return this;
		},
		remove:function(value)
		{
			var valuesIndex=this.values.indexOf(value);
			if(valuesIndex!==-1)
			{
				for(var i in this.filters)
				{
					var index=this.filters[i].values.indexOf(valuesIndex);
					if(index!==-1)
					{
						this.filters[i].values.splice(index,1);
					}
				}
				for(var i in this.maps)
				{
					var map=this.maps[i].values;
					var keys=Object.keys(map);
					for(var i=0;i<keys.length;i++)
					{
						if(map[keys[i]]===value)
						{
							delete map[keys[i]];
							break;
						}
					}
				}
				for(var i in this.groups)
				{
					var group=this.groups[i].values;
					var keys=Object.keys(group);
					for(var i=0;i<keys.length;i++)
					{
						var index=group[keys[i]].indexOf(valuesIndex);
						if(index!==-1)
						{
							group[keys[i]].splice(index,1);
							break;
						}
					}
				}
				delete this.values[valuesIndex];
			}
			return this;
		},
		_removeType:function(type,name)
		{
			delete this[type][name];
		},
		clear:function()
		{
			for(var i in this.filters)
			{
				this.filters[i].values.length=0;
			}
			for(var i in this.maps)
			{
				this.maps[i].values={};
			}
			for(var i in this.groups)
			{
				this.groups[i].values={};
			}
			this.values.length=0;
			return this;
		},
		
		map:function(mapName,fn)
		{
			if(typeof fn==="string")
				fn=ORG._pathWrapper(fn);
			this.maps[mapName]={fn:fn,values:{}};
			for(var i=0;i<this.values.length;i++)
			{
				this._map(this.maps[mapName],i);
			}
			return this;
		},
		_map:function(map,index)
		{
			var key=""+map.fn(this.values[index]);
			map.values[key]=index;
		},
		getMap:function(mapName)
		{
			var rtn={};
			if(this.maps[mapName]!=null)
			{
				SC.it(this.maps[mapName].values,function(index,gIndex)
				{
					rtn[gIndex]=this.values[index];
				},false,true,this);
			}
			return rtn;
		},
		hasMap:function(mapName)
		{
			return !!this.maps[mapName];
		},
		hasMapKey:function(mapName,key)
		{
			return this.maps[mapName]&&key in this.maps[mapName].values;
		},
		getMapValue:function(mapName,key)
		{
			if(this.hasMapKey(mapName,key))
				return this.values[this.maps[mapName].values[key]];
			return undefined;
		},
		getMapKeys:function(mapName)
		{
			if(this.hasMap(mapName))
				return Object.keys(this.maps[mapName].values);
			return [];
		},
		removeMap:function(mapName)
		{
			this._removeType("maps",mapName);
			return this;
		},
		
		filter:function(filterName,filterFn,sortFn)
		{
			switch(typeof filterFn)
			{
				case "string":
					filterFn=ORG._pathWrapper(filterFn);
					break;
				case "object":
					filterFn=ORG.filterPattern(filterFn);
					break;
			}
			if(typeof sortFn==="string")
				sortFn=ORG.pathSort(sortFn);
			this.filters[filterName]={filterFn:filterFn,sortFn:sortFn,values:[]};
			for(var i=0;i<this.values.length;i++)
			{
				this._filter(this.filters[filterName],i);
			}
			return this;
		},
		_filter:function(filter,index)
		{
			if(!filter.filterFn||filter.filterFn(this.values[index]))
			{
				if(!filter.sortFn)
				{
					filter.values.push(index);
				}
				else
				{
					var i=ORG.getOrderIndex(this.values[index],this.values,filter.sortFn,filter.values);
					filter.values.splice(i,0,index);
				}
			}
		},
		hasFilter:function(filterName)
		{
			return !!this.filters[filterName];
		},
		getFilter:function(filterName)
		{
			var rtn=[];
			if(this.filters[filterName]!=null)
			{
				SC.it(this.filters[filterName].values,function(index,gIndex)
				{
					rtn[gIndex]=this.values[index];
				},false,false,this);
			}
			return rtn;
		},
		getFilterValue:function(filterName,index)
		{
			if(this.filters[filterName]&&this.filters[filterName].values[index])
				return this.values[this.filters[filterName].values[index]];
			return undefined;
		},
		getFilterLength:function(filterName)
		{
			if(this.filters[filterName])
				return this.filters[filterName].values.length;
			return 0;
		},
		removeFilter:function(filterName)
		{
			this._removeType("filters",filterName);
			return this;
		},
		
		group:function(groupName,groupFn)
		{
			if(typeof groupFn==="string")
				groupFn=ORG._pathWrapper(groupFn);
			this.groups[groupName]={values:{},fn:groupFn};
			if(groupFn)
			{
				for(var i=0;i<this.values.length;i++)
				{
					this._group(this.groups[groupName],i);
				}
			}
			return this;
		},
		_group:function(group,index)
		{
			if(group.fn)
			{
				var gKey=group.fn(this.values[index]);
				group.values[gKey]=group.values[gKey]||[];
				group.values[gKey].push(index);
			}
		},
		hasGroup:function(groupName)
		{
			return !!this.groups[groupName];
		},
		getGroup:function(groupName)
		{
			var rtn={};
			if(this.hasGroup(groupName))
			{
				for(var gKey in this.groups[groupName].values)
				{
					rtn[gKey]=this.getGroupValue(groupName,gKey);
				}
			}
			return rtn;
		},
		getGroupValue:function(groupName,key)
		{
			var rtn=[];
			if(this.hasGroup(groupName)&&this.groups[groupName].values[key])
			{
				var groupValues=this.groups[groupName].values[key];
				for(var i=0;i<groupValues.length;i++)
				{
					rtn.push(this.values[groupValues[i]]);
				}
			}
			return rtn;
		},
		hasGroupKey:function(groupName,key)
		{
			return this.hasGroup(groupName)&&key in this.groups[groupName].values;
		},
		getGroupKeys:function(groupName)
		{
			if(this.hasGroup(groupName))
				return Object.keys(this.groups[groupName].values);
			return [];
		},
		removeGroup:function(groupName)
		{
			this._removeType("groups",groupName);
			return this;
		},
		
		destroy:function()
		{
			this.values=this.filters=this.maps=this.groups=null;
			this.add=this.filter=this.map=this.group=µ.constantFunctions.ndef
		}
	});
	ORG._pathWrapper=function(path)
	{
		return function(obj)
		{
			return SC.path(obj,path);
		}
	};
	ORG.sort=function(obj,obj2,DESC)
	{
		return (DESC?-1:1)*(obj>obj2)?1:(obj<obj2)?-1:0;
	};
	ORG.pathSort=function(path,DESC)
	{
		path=path.split(",");
		return function(obj,obj2)
		{
			var rtn=0;
			for(var i=0;i<path.length&&rtn===0;i++)
			{
				rtn=ORG.sort(SC.path(obj,path[i]),SC.path(obj2,path[i]),DESC)
			}
			return rtn;
		}
	};
	ORG.filterPattern=function(pattern)
	{
		return function(obj)
		{
			return SC.eq(obj,pattern);
		}
	};
	
	/**
	 * get index of the {item} in the {source} or {order} defined by {sort}
	 * 
	 * item		any
	 * source	[any]
	 * sort		function		// param: item, source[?]  returns 1,0,-1 whether item is higher,equal,lower than source[?]
	 * order	[source index]	// optional
	 *
	 * returns	number
	 */
	ORG.getOrderIndex=function(item,source,sort,order)
	{
		//start in the middle
		var length=(order?order:source).length;
		var jump=Math.ceil(length/2);
		var i=jump;
		var lastJump=null;
		while(jump/*!=0||NaN||null*/&&i>0&&i<=length&&!(jump===1&&lastJump===-1))
		{
			lastJump=jump;
			var compare=order?source[order[i-1]] : source[i-1];
			//jump half the size in direction of this sort			(if equals jump 1 to conserv the order)
			jump=Math.ceil(Math.abs(jump)/2)*Math.sign(sort(item,compare)) ||1;
			i+=jump;
		}
		i=Math.min(Math.max(i-1,0),length);
		return i
	};
	/**
	 * create an Array of ordered indexes of {source} using {sort}
	 *
	 * source	[any]
	 * sort		function		// param: item, source[?]  returns 1,0,-1 whether item is higher,equal,lower than source[?]
	 *
	 * return [number]
	 */
	ORG.getSortedOrder=function(source,sort)
	{
		var order=[];
		SC.it(source,function(item,index)
		{
			var orderIndex=ORG.getOrderIndex(item,source,sort,order);
			order.splice(orderIndex,0,index);
		});
		return order;
	};
	
	SMOD("Organizer",ORG);
	
})(Morgas,Morgas.setModule,Morgas.getModule);
//DB/Morgas.DB.ObjectConnector.js
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
			toDelete={objectType:objClass.prototype.objectType,fields:DBC.getDeletePattern(objClass,toDelete)};
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
//DB/Morgas.DB.IndexedDBConnector.js
(function(µ,SMOD,GMOD){
	/**
	 * Depends on	: Morgas DB 
	 * Uses			: 
	 *
	 * DB.Connector for simple Javascript object
	 *
	 */
	var DBC=GMOD("DBConn"),
	SC=GMOD("shortcut")({
		det:"Detached",
		it:"iterate",
		eq:"equals",
		find:"find",
		
		DBObj:"DBObj",
		DBFriend:"DBFriend"
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
			var sortedObjs=ICON.sortObjs(objs);
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
					SC.it(objects,function(object,i)
					{
						var obj=object.toJSON(),
						method="put";
						if(obj.ID===undefined)
						{
							delete obj.ID;
							method="add";
						}
						var req=store[method](obj);
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
					var trans=db.transaction(objClass.prototype.objectType,"readonly"),
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

					var store = trans.objectStore(objClass.prototype.objectType);
					if(typeof pattern.ID==="number"|| Array.isArray(pattern.ID))
					{
						var reqs=SC.it([].concat(pattern.ID),function(ID)
						{
							var req=store.get(ID);
							req.onerror=function(event)
							{
								µ.debug(event,0);
							};
							req.onsuccess=function(event)
							{
								µ.debug(event, 3);
								if(SC.eq(req.result,pattern))
								{
									var inst=new objClass();
									inst.fromJSON(req.result);
									rtn.push(inst);
								}
							}
						});
					}
					else
					{
						var req=store.openCursor();
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
									var inst=new objClass();
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
			var _self=this,
			objectType=objClass.prototype.objectType,
			collectingIDs=null;
			if(typeof toDelete==="number"||toDelete instanceof SC.DBObj||toDelete instanceof SC.DBFriend||Array.isArray(toDelete))
			{
				var ids=DBC.getDeletePattern(objClass,toDelete).ID;
				collectingIDs=SC.det.complete(ids);
			}
			else
			{
				collectingIDs=this._open().then(function(db)
				{
					var _collectingSelf=this,
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

					var store = trans.objectStore(objectType);
					var req=store.openCursor();
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
						var trans=db.transaction(objClass.prototype.objectType,"readwrite");
						trans.onerror=function(event)
						{
							µ.debug(event,0);
							db.close();
							signal.error(event);
						};
						var store = trans.objectStore(objectType);
						
						var reqs=SC.it(ids,SC.det.detache(function(rSignal,ID)
						{
							var req=store["delete"](ID);
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
			var _self=this;
			var req=indexedDB.open(this.name);
			req.onerror=function(event){
				signal.error(event,0);
			};
			req.onsuccess=function()
			{
				var toCreate=[],
				db=req.result,
				version=req.result.version;
				for(var i=0;classNames&&i<classNames.length;i++)
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
					var req2=indexedDB.open(_self.name,version+1);
					req2.onerror=function(event){
						signal.error(event,0);
					};
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
					};
					db.close();
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
	};
	SMOD("IndexedDBConnector",ICON);	
	SMOD("IDBConn",ICON);
})(Morgas,Morgas.setModule,Morgas.getModule);
//DB/Morgas.Organizer.LazyCache.js
(function(µ,SMOD,GMOD)
{
	 /**
	 * Depends on	: Morgas, Organizer
	 * Uses			: util.object, DB
	 *
	 * LazyCache loads DB.Objects as needed and organizes them
	 *
	 */
	var ORG=GMOD("Organizer");

	var SC=GMOD("shortcut")({
		it:"iterate",
		debug:"debug",
		det:"Detache"
	});
	
	 var LC=ORG.LazyCache=µ.Class(ORG,
	 {
		init:function(dbClass,connector)
		{
			this.superInit(ORG);
			SC.det.detacheAll(this,["get","getUnique"]);
			
			this.dbClass=dbClass;
			this.connector=connector;

			
			var inst=new dbClass();
			for(var f in inst.fields)
			{
				if(inst.fields[f].options.UNIQUE)
				{
					this.map(f,"fields."+f+".value");
					this.maps[f].signals={};
				}
			}
		},
		add:function(items,force)
		{
			var rtn=[];
			var toAdd=[];
			SC.it(items,function(value)
			{
				var id=value.getID();
				if(value instanceof this.dbClass&&id!=null)
				{
					if (this.hasMapKey("ID",id))
					{
						if(force)
						{
							this.values[this.maps.ID.values[id]]=value;
						}
						rtn.push(this.values[this.maps.ID.values[id]]);
					}
					else
					{
						toAdd.push(value);
						rtn.push(value)
					}
				}
			},false,false,this);
			ORG.prototype.add.call(this,toAdd);
			return rtn;
		},
		get:function(signal,pattern,sort,force)
		{
			var key=JSON.stringify(pattern);
			if(!force&&this.filters[key]!=null)
			{
				if(this.filters[key].signals.length==0)
					signal.complete(this.getFilter(key));
				else
					this.filters[key].signals.push(signal);
			}
			else
			{
				if(sort)
					sort="fields."+sort+".value";
				this.filter(key,LC.filterPattern(pattern),sort);
				var signals=this.filters[key].signals=[signal];
				this._load(pattern,signals,false,force);
			}
		},
		getUnique:function(signal,fieldName,value,force)
		{
			if(this.maps[fieldName]!=null)
			{
				if(!force&&this.maps[fieldName].values[value]!=null)
				{
					signal.complete(this.getMapValue(fieldName,value));
				}
				else
				{
					var pattern={};
					pattern[fieldName]=value;
					if(this.maps[fieldName].signals[value]==null)
					{
						var signals=this.maps[fieldName].signals[value]=[signal];
						this._load(pattern,signals,true,force);
					}
					else
					{
						this.maps[fieldName].signals[value].push(signal);
					}
				}
			}
			else
			{
				signal.error("Field "+fieldName+" is not unique");
			}
		},
		_load:function(pattern,signals,single,force)
		{
			SC.debug(["LazyCache._load:",arguments],3);
			var _self=this;
			this.connector.load(this.dbClass,pattern).then(function(results)
			{
				_self.add([].concat(results),force);
				results=single?results[0]:results;
				var signal;
				while(signal=signals.shift())
				{
					signal.complete(results);
				}
			},function(e)
			{
				SC.debug(e,1);
				var signal;
				while(signal=signals.shift())
				{
					signal.complete(single?undefined:[]);
				}
			});
		}
	 });
	LC.filterPattern=function(pattern)
	{
		var newPattern={fields:{}};
		for(var i in pattern)
		{
			newPattern.fields[i]={value:pattern[i]};
		}
		return ORG.filterPattern(newPattern);
	};
})(Morgas,Morgas.setModule,Morgas.getModule);
//Morgas.Detached.js
(function(µ,SMOD,GMOD){
	 /**
	 * Depends on	: Morgas
	 * Uses			: 
	 *
	 * Detached class for asynchronous notification
	 *
	 */
	
	var SC=GMOD("shortcut")({
		debug:"debug"
	});
	
	var wrapFunction=function(fn,args)
	{
		return function(resolve,reject)
		{
			try {
				var p=fn.apply({complete:resolve,error:reject},args);
				if(p&&typeof p.then==="function")
				{
					p.then(resolve,reject);
				}
				else if (p!==undefined)
				{
					resolve(p);
				}
			} catch (e) {
				SC.debug(e,1);
				reject(e);
			}
		}
	};
	
	var DET=µ.Detached=µ.Class(
	{
		/**
		*	fn		function or [function]
		*/
		init:function(fn,args)
		{
			var wait=fn===DET.WAIT;
			if(wait)
				fn=arguments[1];

			this.fn=[].concat(fn||[]);
			this.onError=[];
			this.onComplete=[];
			this.onAlways=[];
			this.onPropagate=[];
			this.status=0;
			this.args=undefined;

			if(!wait)
			{
				if(this.fn.length===0)
				{
					this.status=1;
				}
				else
				{
					this._start(args);
				}
			}
		},
		_start:function(args)
		{
			for(var i=0;i<this.fn.length;i++)
			{
				if(typeof this.fn[i]==="function")
				{
					this.fn[i]=new Promise(wrapFunction(this.fn[i],args));
				}
			}
			var _self=this;
			Promise.all(this.fn).then(function(args)
			{
				_self._setStatus(1,args);
			},
			function()
			{
				_self._setStatus(-1,Array.slice(arguments,0));
			});
		},
		_setStatus:function(status,args)
		{
			this.status=status;
			this.args=args;
			if(status===1)
			{
				while(this.onComplete.length>0)
				{
					this.onComplete.shift()._start(this.args);
				}
			}
			else if (status===-1)
			{
				while(this.onError.length>0)
				{
					this.onError.shift()._start(this.args);
				}
				while(this.onPropagate.length>0)
				{
					this.onPropagate.shift()._setStatus(status,this.args);
				}

			}
			var alwaysArgs=[(this.status===1)].concat(this.args);
			while(this.onAlways.length>0)
			{
				this.onAlways.shift()._start(alwaysArgs);
			}
			this.onComplete.length=this.onError.length=this.onPropagate.length=this.onAlways.length=this.fn.length=0;
		},
		error:function(fn)
		{
			fn=[].concat(fn);
			for(var i=0;i<fn.length;i++)
			{
				fn[i]=new DET(DET.WAIT,fn[i]);
				if(this.status==-1&&this.finished>=this.fn.length)
				{
					fn[i]._start(this.args);
				}
				else if (this.status===0)
				{
					this.onError.push(fn[i]);
				}
			}
			return fn[fn.length-1];
		},
		complete:function(fn)
		{
			fn=[].concat(fn);
			for(var i=0;i<fn.length;i++)
			{
				fn[i]=new DET(DET.WAIT,fn[i]);
				if(this.status==1)
				{
					fn[i]._start(this.args);
				}
				else if (this.status==0)
				{
					this.onComplete.push(fn[i]);
				}
			}
			return fn[fn.length-1];
		},
		then:function(complete,error)
		{
			var next=this.complete(complete);
			if(error===true)
			{
				this.propagateError(next);
			}
			else
			{
				this.error(error);
			}
			return next;
		},
		always:function(fn)
		{
			fn=[].concat(fn);
			for(var i=0;i<fn.length;i++)
			{
				fn[i]=new DET(DET.WAIT,fn[i]);
				if(this.status!==0)
				{
					var args=[(this.status===1)].concat(this.args);
					fn[i]._start(args);
				}
				else if (this.status===0)
				{
					this.onAlways.push(fn[i]);
				}
			}
			return fn[fn.length-1];
		},
		propagateError:function(detached)
		{
			if(this.status===0)
			{
				this.onPropagate.push(detached);
			}
			else if (this.status===-1&&detached.status===0)
			{
				detached._setStatus(-1,this.args);
			}
		}
	});
	DET.WAIT={};
	SMOD("Detached",DET);
	DET.complete=function()
	{
		var d=new DET();
		d.args=arguments;
		return d;
	};
	DET.error=function()
	{
		var d=new DET();
		d.status=-1;
		d.args=arguments;
		return d;
	};
	DET.detache=function(fn,scope)
	{
		scope=scope||window;
		return function()
		{
			var args=Array.slice(arguments,0);
			return new DET(function()
			{
				args.unshift(this);
				try
				{
					return fn.apply(scope,args);
				}
				catch(e)
				{
					SC.debug(e,1);
					this.error(e);
				}
			})
		}
	};
	DET.detacheAll=function(scope,keys)
	{
		keys=[].concat(keys);
		for(var i=0;i<keys.length;i++)
		{
			var fn=scope[keys[i]];
			scope[keys[i]]=DET.detache(fn,scope);
		}
	};
})(Morgas,Morgas.setModule,Morgas.getModule);
//Morgas.util.object.equals.js
(function(µ,SMOD,GMOD){

	var util=µ.util=µ.util||{};
	var uObj=util.object||{};

	/** equals
	 * Matches {obj} against {pattern}.
	 * Returns: Boolean
	 *
	 * Matches strictly (===) and RegExp, function, Array, and Object.
	 * 
	 * RegExp: try to match strictly match and
	 * then return pattern.test(obj)
	 * 
	 * function: try to match strictly match and
	 * then if obj is not a function test it with
	 * the pattern function and return its result
	 *
	 * Array: try to match strictly match and
	 * then return pattern.indexOf(obj)!==-1
	 *
	 * Object: recurse.
	 *
	 */
	uObj.equals=function(obj,pattern)
	{
		if(obj===pattern)
			return true;
		if(obj===undefined||obj===null)
			return false;
		if(pattern instanceof RegExp)
			return pattern.test(obj);
		if(typeof pattern==="function")
		{
			if(typeof obj==="function")
				return false;
			else
				return pattern(obj);
		}
		if(typeof obj.equals==="function")
        {
            return obj.equals(pattern);
        }
		if(typeof pattern==="object")
		{
            if(typeof obj!=="object"&&Array.isArray(pattern))
            {
				return pattern.indexOf(obj)!==-1;
            }
			for(var i in pattern)
			{
				if(!uObj.equals(obj[i],pattern[i]))
					return false;
			}
			return true;
		}
		return false;
	};
	SMOD("equals",uObj.equals);
	
})(Morgas,Morgas.setModule,Morgas.getModule);
//Morgas.util.object.find.js
(function(µ,SMOD,GMOD){

	var util=µ.util=µ.util||{};
	var obj=util.object||{};
	
	var SC=GMOD("shortcut")({
		eq:"equals",
		it:"iterate"
	});
	
	/** find
	 * Iterates over {source}.
	 * Returns an Array of {pattern} matching values 
	 */
	obj.find=function(source,pattern,onlyValues)
	{
		var rtn=[];
		SC.it(source,function(value,index)
		{
			if(SC.eq(value,pattern))
			rtn.push(onlyValues?value:{value:value,index:index});
		});
		return rtn;
	};
	SMOD("find",obj.find);
	
})(Morgas,Morgas.setModule,Morgas.getModule);
//Morgas.util.object.iterate.js
(function(µ,SMOD,GMOD){

	var util=µ.util=µ.util||{};
	var obj=util.object||{};
	
	/** createIterator
	 * Creates an iterator for {any} in {backward} order.
	 * {isObject} declares {any} as a Map or Array. 
	 */
	//TODO iterator & Set & Map
	obj.createIterator=function* (any,backward,isObject)
	{
		if(any.length>=0&&!isObject)
		{
			for(var i=(backward?any.length-1:0);i>=0&&i<any.length;i+=(backward?-1:1))
			{
				yield [any[i],i];
			}
		}
		else if (typeof any.next==="function"||typeof any.entries==="function")
		{
			if(typeof any.entries==="function")
			{
				any=any.entries();
			}
			var step=null;
			while(step=any.next(),!step.done)
			{
				yield step.value.reverse();
			}
		}
		else
		{
			var k=Object.keys(any);
			if(backward)
			{
				k.revert();
			}
			for(var i=0;i<k.length;i++)
			{
				yield [any[k[i]],k[i]];
			}
		}
		
	};
	/** iterate
	 * Iterates over {any} calling {func} with {scope} in {backward} order.
	 * {isObject} declares {any} as an Object with a length property.
	 * 
	 * returns Array of {func} results
	 */
	//TODO iterator & Set & Map
	obj.iterate=function(any,func,backward,isObject,scope)
	{
		var rtn=[];
		if(!scope)
		{
			scope=window;
		}
		if(any.length>=0&&!isObject)
		{
			for(var i=(backward?any.length-1:0);i>=0&&i<any.length;i+=(backward?-1:1))
			{
				rtn.push(func.call(scope,any[i],i,i,false));
			}
		}
		else if (typeof any.next==="function"||typeof any.entries==="function")
		{
			if(typeof any.entries==="function")
			{
				any=any.entries();
			}
			var step=null,index=0;
			while(step=any.next(),!step.done)
			{
                isObject=step.value[1]!==step.value[0]&&step.value[0]!==index;
				rtn.push(func.call(scope,step.value[1],step.value[0],index,isObject));
                index++;
			}
		}
		else
		{
			var k=Object.keys(any);
			if(backward)
			{
				k.revert();
			}
			for(var i=0;i<k.length;i++)
			{
				rtn.push(func.call(scope,any[k[i]],k[i],i,true));
			}
		}
		return rtn;
	};
	SMOD("Iterator",obj.createIterator);
	SMOD("iterate",obj.iterate);
	
})(Morgas,Morgas.setModule,Morgas.getModule);
//Morgas.util.object.goPath.js
(function(µ,SMOD,GMOD){

	var util=µ.util=µ.util||{};
	var uObj=util.object||{};

	/** goPath
	 * Goes the {path} from {obj} checking all but last step for existance.
	 * 
	 * goPath(obj,"path.to.target") === goPath(obj,["path","to","target"]) === obj.path.to.target
	 */
	uObj.goPath=function(obj,path,create)
	{
		var todo=path;
		if(typeof todo=="string")
			todo=todo.split(".");
		
		while(todo.length>0&&obj)
		{
			if(create&&!(todo[0] in obj)) obj[todo[0]]={};
			obj=obj[todo.shift()];
		}
		if(todo.length>0)
		{
			return undefined
		}
		return obj;
	};
	SMOD("goPath",uObj.goPath);
	
})(Morgas,Morgas.setModule,Morgas.getModule);