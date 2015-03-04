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

//Morgas.Patch.js
(function(µ,SMOD,GMOD){

	/**Patch Class
	 * Adds functionality to an instance
	 * 
	 * Patches add themself in a the "patches" map of the instance with their patchID
	 * The core patch adds the "patches" map and the functions "hasPatch" and "getPatch"
	 * 
	 * Normaly a Patch does not add functions direct to the instance but uses listeners
	 * 
	 * 
	 * To create a new patch do sth. like this
	 * 
	 * var myPatch=µ.Class(µ.patch,
	 * {
	 * 		patchID:"myPatchID",
	 * 		patch:function(param,noListeners)
	 * 		{
	 * 			this.superPatch(µ.patch);//call super.patch // in case of µ.Patch its not necessary 
	 * 			//your constructor after instance is created
	 * 		}
	 * }
	 * 
	 * The "patch" function is called on the create event (when the constructor of the instance is finished)
	 * If the instance has no listeners, "noListeners" is true and "patch" was called immediately
	 * 
	 * If you want to override the init function do it like this:
	 * 
	 * var myPatch=µ.Class(mySuperPatch,
	 * {
	 * 		patchID:"myPatchID",
	 * 		init:function(instance,param)
	 * 		{
	 * 			//call constructor of superclass
	 * 			this.superInit(mySuperPatch,instance,param);
	 * 			//or this.superInitApply(mySuperPatch,arguments);
	 * 
	 * 			if(this.instance!=null)
	 * 			{
	 * 				//your constructor
	 * 				//post patch:  this.instance.addListener("created",function(param,noListeners){}) 
	 * 			}
	 * 		},
	 * 		patch:function(param,noListeners)
	 * 		{
	 * 			this.superPatch(mySuperPatch,param,noListeners);
	 * 			//post constructor
	 * 		}
	 * }  
	 */
	var _hasPatch=function hasPatch(patch)
	{
		return this.getPatch(patch)!==undefined;
	};
	var _getPatch=function getPatch(patch)
	{
		return this.patches[patch.patchID||patch.prototype.patchID];
	};
	var _callPatch=function()
	{
		this.patch(this._patchParam,false);
		delete this._patchParam;
	};
	
	var PATCH=µ.Patch=µ.Class(
	{
		init:function Patchinit(instance,param,doPatchNow)
		{
			if(instance.patches==null)
			{
				instance.patches={};
				instance.hasPatch=_hasPatch;
				instance.getPatch=_getPatch;
			}
			if(!instance.hasPatch(this))
			{
				this.instance=instance;
				instance.patches[this.patchID]=this;
				if(typeof this.instance.addListener==="function")//instanceof Listeners or has Listeners attached
				{
					this._patchParam=param;
					this.instance.addListener(".created:once",this,_callPatch);
					if(doPatchNow) this.patchNow();
				}
				else
				{
					this.patch(param,true);
				}
			}
		},
		patchNow:function()
		{
			if(this.instance.patches[this.patchID]===this&&typeof this.instance.removeListener==="function"&&this.instance.removeListener(".created",this))
			{
				this.patch(this._patchParam,false);
			}
		},
		patch:function patch(param,noListeners){},
		superPatch:function superPatch(_class/*,arg1,arg2,...,argN*/)
		{
			_class.prototype.patch.apply(this,[].slice.call(arguments,1));
		},
		superPatchApply:function superPatchApply(_class,args)
		{
			this.superPatch.apply(this,[_class].concat([].slice.call(args)));
		}
	});
	SMOD("Patch",PATCH);
	PATCH.hasPatch=function(instance, patch)
	{
		if(instance.hasPatch)
			return instance.hasPatch(patch);
		return false;
	};
	PATCH.getPatch=function(instance, patch)
	{
		if(instance&&instance.getPatch)
			return instance.getPatch(patch);
		return null;
	};
	
})(Morgas,Morgas.setModule,Morgas.getModule);
//Morgas.Listeners.js
(function(µ,SMOD,GMOD){
	
	/**Listener Class
	 * Holds Arrays of functions to fire or fire once when "fire" is called
	 * When fired and a listening function returns false firing is aborted
	 * When added a type can be passed:
	 * 		"first" function gets prepended
	 * 		"last" function gets appended (default)
	 * 		"once" function is removed after call 
	 * 			(will only be called when "normal" listeners haven't abort firing.
	 * 			cant abort other "once" listening functions)
	 *  
	 * Can be disabled
	*/
	var LISTENER=µ.Listener=µ.Class(
	{
		init:function ListenerInit()
		{
			this.listeners=new Map(); //TODO use WeakMap when its capable of iterations
			this.disabled=false;
		},
		addListener:function addListener(fn,scope,type)
		{
            var fnType=typeof fn;
			if(fnType==="function"||fnType==="string")
			{
                scope=scope||this;
                var entry=null;
                if(this.listeners.has(scope))
                {
                    entry=this.listeners.get(scope);
                    if(entry.first.has(fn)||entry.normal.has(fn)||entry.last.has(fn)||entry.once.has(fn))
                    {
                        return null;//already listens
                    }
                }
                else
                {
                    entry={first:new Set(),normal:new Set(),last:new Set(),once:new Set()};
                    this.listeners.set(scope,entry);
                }
				if(type)
				{
					type=type.toLowerCase();
				}
				switch(type)
				{
					case "first":
						entry.first.add(fn);
						break;
                    default:
                        entry.normal.add(fn);
                        break;
					case "last":
						entry.last.add(fn);
						break;
					case "once":
						entry.once.add(fn);
                        break;
				}
				return fn;
			}
			return null;//no function
		},
        addListeners:function addListeners(fns,scope,type)
        {
            fns=[].concat(fns);
            var rtn=[];
            for(var i=0;i<fns.length;i++)
            {
                rtn.push(this.addListener(fns[i],scope,type));
            }
            return rtn;
        },
		removeListener:function removeListener(fn,scope)
		{
            //TODO remove fn from all scopes
			var timesFound=0;
            var entry=this.listeners.get(scope);
            if(entry)
            {
                if(typeof fn=="string"&&fn.toLowerCase()=="all")
                {
                    timesFound=entry.first.size+entry.normal.size+entry.last.size+entry.once.size;
                    this.listeners.delete(scope);
                }
                else
                {
                    if(entry.first.delete(fn))
                    {
                        timesFound++;
                    }
                    if(entry.normal.delete(fn))
                    {
                        timesFound++;
                    }
                    if(entry.last.delete(fn))
                    {
                        timesFound++;
                    }
                    if(entry.once.delete(fn))
                    {
                        timesFound++;
                    }
                    if(entry.first.size===0&&entry.normal.size===0&&entry.last.size===0&&entry.once.size===0)
                    {
                        this.listeners.delete(scope);
                    }
                }
                return timesFound;
            }
            else if (typeof fn=="string"&&fn.toLowerCase()=="all"&&scope===undefined)
            {
            	this.listeners.clear();
            	return -1;//unknown count
            }
            return null;
		},
		removeListeners:function removeListeners(fns,scope)
		{
			fns=[].concat(fns);
			var rtn=[];
			if(fns.length==0)fns.push("all");
			for(var i=0;i<fns.length;i++)
			{
				rtn.push(this.removeListener(fns[i],scope));
			}
			return rtn;
		},
		fire:function fire(source,event)
		{
			event=event||{};
			event.source=source;
			if(!this.disabled)
			{
				var run=true;
                for(var [scope,entry] of this.listeners)
                {
                    var it=entry.first.values();
                    var step=undefined;
                    var value=undefined;
                    while(run&&(step=it.next(),value=step.value,!step.done))
                    {
                        if(typeof value==="string")
                        {
                            value=scope[value];
                        }
                        run=false!==value.call(scope,event);
                    }
                    it=entry.normal.values();
                    while(run&&(step=it.next(),value=step.value,!step.done))
                    {
                        if(typeof value==="string")
                        {
                            value=scope[value];
                        }
                        run=false!==value.call(scope,event);
                    }
                    it=entry.last.values();
                    while(run&&(step=it.next(),value=step.value,!step.done))
                    {
                        if(typeof value==="string")
                        {
                            value=scope[value];
                        }
                        run=false!==value.call(scope,event);
                    }
                    it=entry.once.values();
                    while((step=it.next(),value=step.value,!step.done))
                    {
                        if(typeof value==="string")
                        {
                            value=scope[value];
                        }
                        value.call(scope,event);
                    }
                    entry.once.clear();
                    if(entry.first.size===0&&entry.normal.size===0&&entry.last.size===0)
                    {
                        this.listeners["delete"](scope);
                    }
                }
				return run;
			}
			return null;
		},
		setDisabled:function setDisabled(bool){this.disabled=bool===true;},
		isDisabled:function isDisabled(){return this.disabled;}
	});
	SMOD("Listener",LISTENER);
	
	/** StateListener Class
	 * Listener that fires only when "setState" is called
	 * When state is set it fires added listening functions with last arguments immediately
	 * reset trough "resetState";
	 */
	var STATELISTENER=LISTENER.StateListener=µ.Class(LISTENER,
	{
		init:function StateListenerInit(param)
		{
			this.superInit(LISTENER);
			this.state=param.state===true;
			this.stateDisabled=false;
			this.lastEvent=null;
		},
		setDisabled:function setDisabled(bool){this.stateDisabled=bool===true;},
		isDisabled:function isDisabled(){return this.stateDisabled;},
		setState:function setState(source,event)
		{
            event=event||{};
            event.source=source;

			this.state=true;
			this.lastEvent=event;

			var rtn=false;
			if(!this.stateDisabled)
			{
				this.disabled=false;
				rtn=this.fire.apply(this,this.lastEvent);
				this.disabled=true
			}
			return rtn;
		},
		resetState:function resetState(){this.state=false;},
		getState:function getState(){return this.state},
		addListener:function addListener(fn,scope,type)
		{
			var doFire=this.state&&!this.stateDisabled;
			if(doFire)
			{
				fn.apply(scope,this.lastEvent);
			}
			if(!(doFire&&typeof type=="string"&&type.toLowerCase()=="once"))
			{
				return LISTENER.prototype.addListener.apply(this,arguments);
			}
			return null;
		}
	});
	SMOD("StateListener",STATELISTENER);
	
	/** Listeners Class
	 * Manages several Listener instances
	 * provides a "createListener" function:
	 * 		prefix "." indicates a StateListener
	 * 	when adding a listening function the type
	 * 	can be passed followed after the name separated by ":" 
	 */
	var LISTENERS=µ.Listeners=µ.Class(
	{
		rNames:/[\s|,]+/,
		rNameopt:":",
		init:function ListenersInit(dynamic)
		{
			this.listeners={};
			this.createListener(".created");
			this.dynamicListeners=dynamic===true;
		},
		createListener:function createListener(types)
		{
			var typeArr=types.split(this.rNames);
			var fnarr=[].slice.call(arguments,1);
			for(var i=0;i<typeArr.length;i++)
			{
				var name_type=typeArr[i].split(this.rNameopt);
				if(this.listeners[name_type[0]]==null)
				{
					if(name_type[0][0]=='.')
					{
						this.listeners[name_type[0]]=new STATELISTENER({});
					}
					else
					{
						this.listeners[name_type[0]]=new LISTENER({});	
					}
				}
			}
		},
		addListener:function addListener(types,scope/*,functions...*/)
		{
			if(this.dynamicListeners) this.createListener(types);
			var typeArr=types.split(this.rNames);
			var fnarr=[].slice.call(arguments,2);
			for(var i=0;i<typeArr.length;i++)
			{
				var name_type=typeArr[i].split(this.rNameopt);
				if(this.listeners[name_type[0]]!==undefined)
				{
					this.listeners[name_type[0]].addListeners(fnarr,scope,name_type[1]);
				}
			}
		},
		removeListener:function removeListener(names,scope/*,functions...*/)
		{
			var removeCount=0;
			if(names.toLowerCase()=="all")
			{
				for(var i in this.listeners)
				{
					removeCount+=this.listeners[i].removeListeners(names,scope);
				}
			}
			else
			{
				var nameArr=names.split(this.rNames);
				var fnarr=[].slice.call(arguments,2);
				for(var i=0;i<nameArr.length;i++)
				{
					var name=nameArr[i];
					if(this.listeners[name]!==undefined)
					{
						removeCount+=this.listeners[name].removeListeners(fnarr,scope);
					}
				}
			}
			return removeCount;
		},
		fire:function fire(name,event)
		{
			event=event||{};
			event.type=name;
			if(this.listeners[name])
			{
				return this.listeners[name].fire(this,event);
			}
			return undefined
		},
		setDisabled:function setDisabled(names,bool)
		{
			var nameArr=names.split(this.rNames);
			for(var i=0;i<nameArr.length;i++)
			{
				var lstnr=this.listeners[nameArr[i]];
				if(lstnr!=null)
					lstnr.setDisabled(bool);
			}
		},
		isDisabled:function isDisabled(names)
		{
			var rtn=true;
			var nameArr=names.split(this.rNames);
			for(var i=0;rtn&&i<nameArr.length;i++)
			{
				var lstnr=this.listeners[nameArr[i]];
				if(lstnr!=null)
					rtn&=lstnr.isDisabled();
			}
			return rtn;
		},
		setState:function setState(name,event)
		{
			event=event||{};
			event.type=name;
			var lstnr=this.listeners[name];
			if (lstnr&&lstnr instanceof STATELISTENER)
			{
				return lstnr.setState(this,event);
			}
			return undefined;
		},
		resetState:function resetState(names)
		{
			var nameArr=names.split(this.rNames);
			for(var i=0;i<nameArr.length;i++)
			{
				var lstnr=this.listeners[nameArr[i]];
				if(lstnr!=null&&lstnr instanceof STATELISTENER)
					lstnr.resetState();
			}
		},
		getState:function getState(names)
		{
			var rtn=true;
			var nameArr=names.split(this.rNames);
			for(var i=0;rtn&&i<nameArr.length;i++)
			{
				var lstnr=this.listeners[nameArr[i]];
				if(lstnr!=null&&lstnr instanceof STATELISTENER)
					rtn&=lstnr.getState();
			}
			return rtn
		},
		destroy:function()
		{
			this.removeListener("all");
		}
	});
	SMOD("Listeners",LISTENERS);
	LISTENERS.attachListeners=function attachListeners(instance)
	{
		for(var i in LISTENERS.prototype)
		{
			if (i!="init"&&i!="constructor"&&i!="superInit"&&i!="superInitApply")
				instance[i]=LISTENERS.prototype[i];
		}
		LISTENERS.prototype.init.call(instance);
		instance.setState(".created");
	};
	SMOD("attachListeners",LISTENERS.attachListeners);
	
})(Morgas,Morgas.setModule,Morgas.getModule);
//Morgas.util.function.bind.js
(function(µ,SMOD,GMOD){
	
	var util=µ.util=µ.util||{};
	var uFn=util.function||{};
	
	/** bind
	 * For more compatibility redefine the module.
	 * For more flexibility consider Callback
	 */
	uFn.bind=Function.bind.call.bind(Function.bind);
	SMOD("bind",uFn.bind);
	
})(Morgas,Morgas.setModule,Morgas.getModule);
//Morgas.util.function.rescope.js
(function(µ,SMOD,GMOD){
	
	var util=µ.util=µ.util||{};
	var uFn=util.function||{};
	
	/** rescope
	 * faster than bind but only changes the scope.
	 */
	uFn.rescope=function(fn,scope)
	{
		return function()
		{
			return fn.apply(scope,arguments);
		}
	};
	uFn.rescope.all=function(keys,scope)
	{	
		keys=keys||Object.keys(scope);
		for(var i=0;i<keys.length;i++)
		{
			scope[keys[i]]=uFn.rescope(scope[keys[i]],scope);
		}
	};
	SMOD("rescope",uFn.rescope);
	
})(Morgas,Morgas.setModule,Morgas.getModule);
//Morgas.util.function.proxy.js
(function(µ,SMOD,GMOD){
	
	var util=µ.util=µ.util||{};
	var uFn=util["function"]||{};
	
	var SC=GMOD("shortcut")({
		it:"iterate"
	});
	
	/** proxy
	 * proxy methods from source to target.
	 */
	uFn.proxy=function(source,listOrMapping,target)
	{
		var isKey=false,
		isGetter=false;
		switch(typeof source)
		{
			case "string":
				isKey=true;
				break;
			case "function":
				isGetter=true;
				break;
		}
		SC.it(listOrMapping,function(value,key,index,isObject)
		{
			var sKey=(isObject?key:value),
			tKey=value,
			fn=null;
			if(isKey)
			{
				fn=function(){return this[source][sKey].apply(this[source],arguments)};
			}
			else if (isGetter)
			{
				fn=function(){var scope=source.call(this,sKey);return scope[sKey].apply(scope,arguments);};
			}
			else
			{
				fn=function(){return source[sKey].apply(source,arguments)};
			}
			target[tKey]=fn;
		});
	};
	SMOD("proxy",uFn.proxy);
	
})(Morgas,Morgas.setModule,Morgas.getModule);
//Morgas.DependencyResolver.js
(function(µ,SMOD,GMOD){
	
	µ.DependencyResolver=µ.Class({
		init:function(config)
		{
			this.config={};
			this.addConfig(config);
		},
		addConfig:function(obj,overwrite)
		{
			if(typeof obj==="object")
			{
				var keys=Object.keys(obj);
				for(var l=keys.length,i=0;i<l;i++)
				{
					var k=keys[i];
					if(this.config[k]===undefined||overwrite)
					{
                        if(typeof obj[k]==="string")
                        {
                            this.config[k]={deps:[obj[k]],uses:[]};
                        }
                        else if (Array.isArray(obj[k]))
                        {
                            this.config[k]={deps:obj[k].slice(),uses:[]};
                        }
                        else if (obj[k]!==true)
                        {
                            this.config[k]={deps:(obj[k].deps||[]).slice(),uses:(obj[k].uses||[]).slice()}
                        }
                        else
                        {
                            this.config[k]=true;
                        }
					}
				}
				return true;
			}
			µ.debug("DependencyResolver.addConfig: obj is not an object", 0);
			return false;
		},
		resolve:function(items)
		{
			var rtn=[], list=[].concat(items);
			items=[].concat(items);
			while(list.length>0)
			{
				var resolved=true,conf=this.config[list[0]];
				if(conf===undefined)
				{
					µ.debug("DependencyResolver.resolve: "+list[0]+" is undefined", 2);
				}
				else if(conf!==true)
				{
					var deps=conf.deps;
                    for(var i=0;i<conf.uses.length;i++)
                    {
                        if(list.indexOf(conf.uses[i])===-1&&rtn.indexOf(conf.uses[i])===-1)
                        {
                            list.push(conf.uses[i]);
                            items.push(conf.uses[i]);
                        }
                    }
					for(var i=0;i<deps.length;i++)
					{
						var dep=deps[i];
						if(rtn.indexOf(dep)===-1)
						{//not yet depending
							var listIndex=list.indexOf(dep);
							if(listIndex!==-1)
							{//as remaining item
								
								if(items.indexOf(dep)===-1)
								{//not as item
									throw new TypeError("cyclic object Dependencies ["+list[0]+","+deps[i]+"]");
								}
								else
								{
									list.splice(listIndex, 1);
								}
							}
							list=[].concat(dep,list);
							resolved=false;
							break;
						}
					}
				}
				if(resolved)
				{
					rtn.push(list.shift());
				}
			}
			return rtn;
		},
        clone:function(prefix)
        {
            var config=null;
            if(prefix)
            {
                config={};
                var mapFn=function(v){return prefix+v};
                for(var i in this.config)
                {
                    config[prefix+i]=(this.config[i]===true ? true : {deps:this.config[i].deps.map(mapFn),uses:this.config[i].uses.map(mapFn)})
                }
            }
            return new µ.DependencyResolver(config);
        }
	});
	SMOD("DepRes",µ.DependencyResolver);
	
})(Morgas,Morgas.setModule,Morgas.getModule);
//Morgas.NodePatch.js
(function(µ,SMOD,GMOD){

    var Patch=GMOD("Patch");
	var SC=GMOD("shortcut")({
		p:"proxy",
        d:"debug"
	});

	var NODE=µ.NodePatch=µ.Class(Patch,{
		patchID:"NodePatch",
		patch:function(aliasMap)
		{

			this.parent=null;
			this.children=[];

			aliasMap=aliasMap||{};
            this.aliasMap={};
            var proxyMap={};
			for (var i=0;i<NODE.Aliases.length;i++)
			{
                var target=NODE.Aliases[i];
                if(target in aliasMap)
                {
                    this.aliasMap[target]=aliasMap[target];
                    if(this.instance[this.aliasMap[target]]===undefined)
                    {
                        proxyMap[target]=this.aliasMap[target];
                    }
                }
			}
            SC.p(getNode,proxyMap,this.instance);

			for (var i=0;i<NODE.Symbols.length;i++)
			{
                var symbol=NODE.Symbols[i];
                if(symbol in aliasMap)
                {
                    setSymbol(this,symbol,aliasMap[symbol])
                }
			}
		},
		addChild:function(child,index)
		{
			var childPatch=getNode(child),alias;
            var childIndex=this.children.indexOf(child);
            if(!childPatch)
            {//is not a Node
            	SC.d([child," is not a Node"]);
            	return false;
            }
            else if(childIndex===-1)
			{//has not that child jet
				if(index!==undefined)
				{
					this.children.splice(index,0,child);
				}
				else
				{
                    index=this.children.length;
					this.children.push(child);
				}
				if(childPatch.parent!==null&&childPatch.parent!==this.instance)
				{//has other parent
					//remove other parent
                    alias=childPatch.aliasMap.remove;
                    if(alias)
                    {
                        if(!child[alias]())
                        {//won't var go of parent
                            SC.d(["rejected remove child ",child," from old parent ",childPatch.parent],SC.d.LEVEL.INFO);
                            this.children.splice(index,1);
                            return false;
                        }
                    }
                    else
                    {
					    childPatch.remove();
                    }
				}
				//add to parent
				alias=childPatch.aliasMap.setParent;
                if(alias)
                {
                    if(!child[alias](this.instance))
                    {//won't attach to me
                        SC.d(["rejected to set parent",this.instance," of child ",child],SC.d.LEVEL.INFO);
                        this.children.splice(index,1);
                        return false;
                    }
                }
                else
                {
                    childPatch.setParent(this.instance);
                }
			}
			return true;
		},
		removeChild:function(child)
		{
			var index=this.children.indexOf(child);
			if(index!==-1)
			{//has child
				this.children.splice(index, 1);
				var childPatch=getNode(child);
				if(childPatch&&childPatch.parent===this.instance)
				{//is still parent of child
					var alias=childPatch.aliasMap.remove;
	                if(alias)
	                {
	                    if(!child[alias]())
	                    {//won't var go of me
	                        SC.d(["rejected remove child ",child," from parent ",this.instance],SC.d.LEVEL.INFO);
	                        this.children.splice(index,0,child);
	                        return false;
	                    }
	                }
	                else
	                {
					    childPatch.remove();
	                }
                }
			}
			return true;
		},
		setParent:function(parent)
		{
			var parentPatch=getNode(parent),alias;
			if(!parentPatch)
			{//is not a Node
            	SC.d([parent," is not a Node"]);
            	return false;
			}
			if(parent&&this.parent!==parent)
			{
				if(this.parent!==null)
				{//has other parent
					//remove other parent
                    alias=childPatch.aliasMap.remove;
                    if(alias)
                    {
                        if(!child[alias]())
                        {//won't var go of parent
                            SC.d(["rejected remove child ",child," from old parent ",childPatch.parent],SC.d.LEVEL.INFO);
                            this.children.splice(index,1);
                            return false;
                        }
                    }
                    else
                    {
					    childPatch.remove();
                    }
				}
				this.parent=parent;
				alias=parentPatch.aliasMap.addChild;
				if(parentPatch.children.indexOf(this.instance)===-1)
				{//not already called from addChild
					if(alias)
					{
						if(!this.parent[alias](this.instance))
						{//won't accept me
							SC.d(["rejected to add child ",this.instance," to parent ",parent],SC.d.LEVEL.INFO);
							this.parent=null;
							return false;
						}
					}
					else
					{
						parentPatch.addChild(this.instance);
					}
				}
			}
            return true;

		},
		remove:function()
		{
			if(this.parent!==null)
			{
				var oldParent=this.parent;
				var oldParentPatch=getNode(oldParent);
				this.parent=null;
				if(oldParentPatch.children.indexOf(this.instance)!==-1)
				{//is still old parents child
					var alias=oldParentPatch.aliasMap.removeChild;
					if(alias)
					{
						if(!oldParent[alias](this.instance))
						{//I won't var go of parent
							this.parent=oldParent;
							SC.d(["rejected to remove child ",this.instance," from parent ",this.parent],SC.d.LEVEL.INFO);
							return false;
						}
					}
					else
					{
						oldParentPatch.removeChild(this.instance);
					}
				}
			}
			return true;
		},
		hasChild:function(child)
		{
			return this.children.indexOf(child)!==-1;
		},
        isChildOf:function(parent)
        {
            var parentPatch=getNode(parent);
            return parent&&parent.hasChild(this.instance);
        }
	});
	NODE.Aliases=["addChild","removeChild","remove","setParent","hasChild"];
    NODE.Symbols=["parent","children"];
    NODE.BasicAliases={
        parent:"parent",
        children:"children",
        addChild:"addChild",
        removeChild:"removeChild",
        remove:"remove",
        setParent:"setParent",
        hasChild:"hasChild"
    };
	NODE.Basic=µ.Class({
		init:function(aliasMap)
		{
			aliasMap=aliasMap||{};
			var map={};
            for(var i=0,targets=Object.keys(NODE.BasicAliases);i<targets.length;i++)
			{
            	var target=targets[i];
				var alias=aliasMap[target];
				if(alias===undefined)
				{
					alias=NODE.BasicAliases[target];
				}
				if(alias!==null)
				{
					map[target]=""+alias;
				}
			}
			new NODE(this,map);
		}
	});
	
	var getNode=function(obj)
	{
        if(typeof obj==="string")
        {//used as proxy getter
            obj=this
        }
        if(obj instanceof NODE)
        {
            return obj;
        }
        else
        {
        	return Patch.getPatch(obj,NODE);
        }
	};
	//TODO replace with GMOD("shortcut") dynamic
    var setSymbol=function(node,symbol,alias)
    {
        if(typeof node[symbol]!=="function")
        {
            Object.defineProperty(node.instance,alias,{
                get:function()
                {
                    return node[symbol];
                },
                set:function(arg)
                {
                    node[symbol]=arg;
                }
            })
        }
        else
        {
            node.instance[alias]=node[symbol];
        }
    };
	
	SMOD("NodePatch",NODE);
})(Morgas,Morgas.setModule,Morgas.getModule);
//Morgas.util.object.adopt.js
(function(µ,SMOD,GMOD){

	var util=µ.util=µ.util||{};
	var obj=util.object||{};
	
	/**
	 * adopt attributes defined in [target] from [provider].
	 * when [extend] is set to true all attributes from [provider] are adopted
	 * @param {object} target
	 * @param {object} [provider=undefined]
	 * @param {boolean} [extend=false]
	 */
	obj.adopt=function(target,provider,extend)
	{
		if(provider)
		{
			var keys=Object.keys(extend ? provider : target);
			var k=0;
			for(var i=keys[k];k<keys.length;i=keys[++k])
			{
				if(extend||i in provider)
				{
					target[i]=provider[i];
				}
			}
		}
		return target;
	};
	SMOD("adopt",obj.adopt);
	
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
//Morgas.util.object.inputValues.js
(function(µ,SMOD,GMOD){

	var util=µ.util=µ.util||{};
	var obj=util.object||{};
	
	var SC=GMOD("shortcut")({
		goPath:"goPath"
	});
	
	/**
	 * set input values from object
	 * path in object is defined by data-path attribute
	 * key in object is defined by data-field attribute
	 * @param inputs[] input Nodes
	 * @param {object} source
	 */
	obj.setInputValues=function(inputs,source)
	{
		for(var i=0;i<inputs.length;i++)
		{
			var path=(inputs[i].dataset.path ? inputs[i].dataset.path+"." : "")+inputs[i].name;
			var value=SC.goPath(source, path);
			if(value!==undefined)
			{
				if(inputs[i].type==="checkbox")
				{
					inputs[i].checked=!!value;
				}
				else
				{
					inputs[i].value=value;
				}
			}
		}
	};

	/**
	 * collect input values into object
	 * path in object is defined by data-path attribute
	 * key in object is defined by data-field attribute
	 * @param inputs[] input Nodes
	 * @param {object} target
	 */
	obj.getInputValues=function(inputs,target,create)
	{
		var rtn=target||{};
		for(var i=0;i<inputs.length;i++)
		{
			var t=rtn;
			if(inputs[i].dataset.path)
			{
				t=SC.goPath(t, inputs[i].dataset.path,!target||create);
			}
			if(t!==undefined&&(inputs[i].name in t||!target||create))
			{
				if(inputs[i].type==="checkbox")
				{
					t[inputs[i].name]=inputs[i].checked;
				}
				else
				{
					t[inputs[i].name]=inputs[i].value;
				}
			}
		}
		return rtn;
	};
	
	SMOD("setInputValues",obj.setInputValues);
	SMOD("getInputValues",obj.getInputValues);
	
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
//Morgas.util.object.iterateAsync.js
(function(µ,SMOD,GMOD){

	var util=µ.util=µ.util||{};
	var obj=util.object||{};
	
	var SC=GMOD("shortcut")({
		DET:"Detached",
		It:"Iterator"
	});
	/** iterateAsync
	 * As iterate but puts a timeout between the iteration steps
	 * 
	 * returns: µ.Detached
	 */
	obj.iterateAsync=function(any,func,backward,isObject,scope,chunk)
	{
		if(!scope)
		{
			scope=window;
		}
		if(!chunk)
		{
			chunk=obj.iterateAsync.chunk;
		}
		return new SC.DET(function()
		{
			var signal=this;
			var it=SC.It(any,backward,isObject);
			var interval=setInterval(function iterateStep()
			{
				try
				{
					var step=it.next();
					for(var i=0;i<chunk&&!step.done;i++,step=it.next())
					{
						func.call(scope,step.value,step.key);
					}
					if(step.done)
					{
						signal.complete();
						clearInterval(interval);
					}
				}
				catch (e)
				{
					signal.error(e);
				}
			},0)
		});
	};
	obj.iterateAsync.chunk=1E4;
	
	SMOD("iterateAsync",obj.iterateAsync);
	
})(Morgas,Morgas.setModule,Morgas.getModule);
//Morgas.util.object.uniquify.js
(function(µ,SMOD,GMOD){

	var util=µ.util=µ.util||{};
	var obj=util.object||{};

	/** uniquify
	 * Creates a copy of {arr} without duplicates.
	 * Generates an ID via {fn}(value)
	 */
	obj.uniquify=function(arr,fn)
	{
		var values;
		if(fn)
		{
			values=new Map();
			for(var i=0;i<arr.length;i++)
			{
				var id=arr[i];
				if(fn)
				{
					id=fn(arr[i]);
				}
				values.set(id,arr[i]);
			}
		}
		else
		{
			values=new Set(arr);
		}
		var rtn=[];
		var it=values.values();
		for(var step=it.next();!step.done;step=it.next())
		{
			rtn.push(step.value);
		}
		return rtn;
	};
	SMOD("uniquify",obj.uniquify);
	
})(Morgas,Morgas.setModule,Morgas.getModule);
//Morgas.util.download.js
(function(µ,SMOD,GMOD){
	
	var util=µ.util=µ.util||{};
	util.download=function(data,name,mediaType)
	{
		if(data instanceof Blob)
		{
			data=URL.createObjectURL(data)
		}
		name=name||"file";
		mediaType=mediaType||"";
		
		util.download.el.download=name;
		if(data.startsWith("data:")||data.startsWith("blob:"))
		{
			util.download.el.href=data;
		}
		else
		{
			util.download.el.href="data:"+mediaType+";base64,"+btoa(unescape(encodeURIComponent(data)));
		}
		document.body.appendChild(util.download.el);
		util.download.el.click();
		util.download.el.remove();
	};
	util.download.el=document.createElement("a");
	SMOD("download",util.download);
	
})(Morgas,Morgas.setModule,Morgas.getModule);
//Morgas.util.crc32.js
(function(µ,SMOD,GMOD){
	
	var util=µ.util=µ.util||{};
	
	// found somewhere on the internet
	
	var that=util.crc32=function(str)
	{
	   var crc=0^(-1);
	   for (var i=0;i<str.length;i++)
	   {
		   crc=(crc>>>8)^that.get((crc^str.charCodeAt(i))&0xFF);
	   }
	   return (crc^(-1))>>>0;
	};
	that.table={};
	that.get=function(n)
	{
	   if(that.table.n==null)
	   {
		   var c=n;
		   for(var k=0;k<8;k++){
			   c=((c&1)?(0xEDB88320^(c>>>1)):(c>>>1));
		   }
		   that.table[n]=c;
	   }
	   return that.table[n];
	};
	SMOD("util.crc32",util.crc32);
})(Morgas,Morgas.setModule,Morgas.getModule);
//Morgas.util.converter.csvToObject.js
(function(µ,SMOD,GMOD){

    var util=µ.util=µ.util||{};
    var uCon=util.converter||{};

    var lineEXP=/[\r\n]+/, cellEXP=/;"(([^"]|"")+)"|;([^;]*)/g, cleanUpEXP=/"(")/g, getCells=function(line)
    {
        var matches,
            cells=[];

        line=";"+line;
        cellEXP.lastIndex=0;
        while(matches=cellEXP.exec(line))
        {
            cells.push((matches[1]||matches[3]).replace(cleanUpEXP,"$1"));
        }
        return cells;
    };

    uCon.csvToObject=function(csv)
    {
        var lines = csv.split(lineEXP), keys = getCells(lines.shift()), rtn = [];
        if (lines[lines.length - 1] === "") {
            lines.length--;
        }
        if (keys[keys.length - 1] === "") {
            keys.length--;
        }
        rtn.keys=keys;
        for (var i = 0; i < lines.length; i++) {
            var cells = getCells(lines[i]);
            if (cells[cells.length - 1] === "") {
                cells.length--;
            }
            var obj = {_line:lines[i],_overflowCells:cells.slice(keys.length)};
            for (var k = 0; k < keys.length; k++) {
                obj[keys[k]] = cells[k];
            }
            rtn.push(obj);
        }
        return rtn;
    };
    SMOD("csvToObject",uCon.csvToObject);

})(Morgas,Morgas.setModule,Morgas.getModule);
//Morgas.util.queryParam.js
(function(µ,SMOD,GMOD){

    var util=µ.util=µ.util||{};

    var queryRegExp=/[\?&]([^=&]+)(=(([^&]|\\&)*))?/g;
    util.queryParam={};

    (function parseQueryParam(queryString){
        var matches;
        while(matches=queryRegExp.exec(queryString))
        {
            util.queryParam[matches[1]]=matches[3];
        }
    })(decodeURI(window.location.search));

    SMOD("queryParam",util.queryParam);

})(Morgas,Morgas.setModule,Morgas.getModule);
//Morgas.util.Request.js
(function(µ,SMOD,GMOD,HMOD){
	
	µ.util=µ.util||{};

	var SC=GMOD("shortcut")({
		det:"Detached"
	});

	REQ=µ.util.Request=function Request_init(param,scope)
	{
		if(typeof param ==="string")
		{
			param={url:param};
		}
		param={
			url:param.url,
			method:param.data?"POST":"GET",
			async:true,
			user:param.user,//||undefined
			password:param.password,//||undefined
			responseType:param.responseType||"",
			upload:param.upload,//||undefined
			withCredentials:param.withCredentials===true,
			contentType:param.contentType,//||undefined
			data:param.data//||undefined
		};
		return new SC.det([function()
		{
			var signal=this;
			var req=new XMLHttpRequest();
			req.open(param.method,param.url,param.async,param.user,param.password);
			req.responseType=param.responseType;
			if(param.contentType)
			{
				req.setRequestHeader("contentType", value);
			}
			else if (param.data)
			{
				param.contentType="application/x-www-form-urlencoded;charset=UTF-8";
				if(param.data.consctuctor===Object)
				{//is plain object
					param.contentType="application/json;charset=UTF-8";
					param.data=JSON.stringify(data);
				}
				req.setRequestHeader("contentType", param.contentType);
			}
			if(param.upload)
			{
				req.upload=param.upload;
			}
			req.onload=function()
			{
				if (req.status == 200)
				{
					signal.complete(req);
				}
				else
				{
					// todo try next if(Array.isArray(param.url))
					signal.error(req.statusText);
				}
			};
			req.onerror=function()
			{
				// todo try next if(Array.isArray(param.url))
				signal.error("Network Error");
			};
			if(param.progress)
			{
				req.onprogress=param.progress;
			}
			req.send(param.data);
		},scope]);
	};
	SMOD("Request",REQ);

	REQ.json=function Request_Json(param,scope)
	{
		if(typeof param ==="string")//TODO ||Array.isArray(param))
		{
			param={url:param};
		}
		param.responseType="json";
		var det=REQ(param);
		var jDet=det.then(function(r){return r.response},true);
		jDet.fn.push(scope);
		return jDet;
	};
	SMOD("Request.json",REQ.json);
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