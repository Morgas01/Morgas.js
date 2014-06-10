(function MorgasInit(oldµ){
	Morgas={version:"0.2"};
	µ=Morgas;
	/**
	 * revert "µ" to its old value
	 */
	µ.revert=function()
	{
		return µ=oldµ;
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
	var SMOD=µ.setModule,GMOD=µ.getModule;
	
	/**
	 * 
	 */
	µ.constantFunctions={
		"ndef":function(){return undefined},
		"nul":function(){return null},
		"f":function(){return false},
		"t":function(){return true;},
		"zero":function(){return 0;}
	};
	
	/** bind
	 * For more compatibility redefine the module.
	 * For more flexibility consider Callback
	 */
	µ.bind=Function.bind.call.bind(Function.bind);
	SMOD("bind",µ.bind);
	
	/** rescope
	 * faster than bind but only changes the scope.
	 */
	µ.rescope=function(fn,scope)
	{
		return function()
		{
			return fn.apply(scope,arguments);
		}
	};
	µ.rescope.all=function(keys,scope)
	{	
		keys=keys||Object.keys(scope);
		for(var i=0;i<keys.length;i++)
		{
			scope[keys[i]]=µ.rescope(scope[keys[i]],scope);
		}
	};
	SMOD("rescope",µ.rescope);
	
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
	µ.shortcut=function(map,context,target)
	{
		if(!target)
		{
			target={};
		}
		for(var m in map){(function(path,key)
		{
			var value=null;
			Object.defineProperty(target,key,{
				configurable:false,
				enumerable:true,
				get:function()
				{
					if(value==null)
					{
						if(typeof path=="function")
							value=path(context);
						else if(context)
							value=GMOD("goPath")(context,path);
						else
							value=GMOD(path);
					}
					return value;
				}
			});
		})(map[m],m)}
		return target;
	};
	SMOD("shortcut",µ.shortcut);
	
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
		if(µ.debug.verbose>=verbose)
		{
			if(typeof msg == "function")
				msg=msg();
				
			µ.debug.out(msg,verbose);
		}
	};
	SMOD("debug",µ.debug);
	
	µ.debug.verbose=1;//false:off 0:error 1:warning 2:info 3:debug
	µ.getDebug=function(debug){µ.debug.verbose=debug};
	µ.setDebug=function(debug){µ.debug.verbose=debug};
	µ.debug.out=function(msg,verbose)
	{
		switch(verbose)
		{
			case 0:
				console.error(msg)
				break;
			case 1:
				console.warn(msg);
				break;
			case 2:
				console.info(msg);
			case 3:
			default:
				console.log(msg);
		}
	};
	
	/** Callback function
	 * Creates a function that will call {callb} with {scope} as [this].
	 * 
	 * The passed arguments to {callb} are:
	 * old scope, args..., arguments...
	 * 
	 * 
	 * @param	callb* 		function to be called
	 * @param	scope		[this] of called function
	 * @param	args 		Array or Object to be passed
	 * @param	sliceFrom	slice the standard arguments
	 * @param	sliceTo		slice the standard arguments
	 * 
	 * @returns	function
	 */
	µ.Callback=function callback(callb,scope,args,sliceFrom,sliceTo)
	{
		if(!sliceFrom)
		{
			sliceFrom=0;
		}
		args=(args instanceof Array)?args:(args!==undefined)?[args]:[];
		return function()
		{
			callb.apply(scope,[].concat(this,args,args.slice.call(arguments,0)).slice(sliceFrom,sliceTo));
		};
	};
	SMOD("Callback",µ.Callback);

	var _EXTEND={},
	//shortcuts
	CLASS,BASE,LISTENER,STATELISTENER,LISTENERS,PATCH;
	
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
	CLASS=µ.Class=function ClassFunc(superClass,prot)
	{
		var newClass = function ClassConstructor()
		{
			if(arguments[0]!==_EXTEND)
			{
				this.init.apply(this,arguments);
				if(this instanceof LISTENERS)
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
			newClass.prototype=new superClass(_EXTEND);
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
	 *	allows to check of being a class ( instanceof µ.BaseClass )
	 */
	BASE=µ.BaseClass=CLASS(
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
	LISTENER=µ.Listener=µ.Class(BASE,
	{
		init:function ListenerInit()
		{
			this.superInit(BASE);
			this.listeners=[];
			this.listenOnce=[];
			this.fireIndex=null;	//indicates if and which listener fired
			this.disabled=false;
		},
		addListener:function addListener(fn,type)
		{
			if(typeof fn=="function")
			{
				var all=this.listeners.concat(this.listenOnce);
				for(var i=0;i<all.length;i++)
				{
					if(fn==all[i])
						return null;
				}
				if(type)
				{
					type=type.toLowerCase();
				}
				switch(type)
				{
					case "first":
						this.listeners.unshift(fn);
						break;
					case "last":
					default:
						this.listeners.push(fn);
						break;
					case "once":
						this.listenOnce.push(fn);
				}
				return fn;
			}
			return null;
		},
		addListeners:function addListeners(fns,type)
		{
			fns=(fns instanceof Array)?fns:[fns];
			var rtn=[];
			for(var i=0;i<fns.length;i++)
			{
				rtn.push(this.addListener(fns[i],type));
			}
			return rtn;
		},
		removeListener:function removeListener(fn)
		{
			var timesFound=0;
			if(typeof fn=="string"&&fn.toLowerCase()=="all")
			{
				timesFound=this.listeners.length+this.listenOnce.length;
				this.listeners.length=0;
				this.listenOnce.length=0;
			}
			else
			{
				for(var i=0;i<this.listeners.length;i++)
				{
					if(this.listeners[i]==fn)
					{
						this.listeners.splice(i,1);
						if(this.fireIndex!==null&&i<=this.fireIndex)
						{
							this.fireIndex--;
						}
						i--;
						timesFound++;
					}
				}
				for(var i=0;i<this.listenOnce.length;i++)
				{
					if(this.listenOnce[i]==fn)
					{
						this.listenOnce.splice(i,1);
						i--;
						timesFound++;
					}
				}
			}
			return timesFound;
		},
		removeListeners:function removeListeners(fns)
		{
			fns=(fns instanceof Array)?fns:[fns];
			var rtn=[];
			for(var i=0;i<fns.length;i++)
			{
				rtn.push(this.removeListener(fns[i]));
			}
			return rtn;
		},
		fire:function fire(scope,event)
		{
			event=event||{};
			event.source=scope;
			if(!this.disabled)
			{
				this.fireIndex=0;
				var abort=false;
				while(!abort&&this.fireIndex<this.listeners.length)
				{
					abort=false===this.listeners[this.fireIndex++].call(scope,event);
				}
				this.fireIndex=null;
				while(this.listenOnce.length>0)
				{
					this.listenOnce.shift().call(scope,event);
				}
				return abort;
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
	STATELISTENER=LISTENER.StateListener=CLASS(LISTENER,
	{
		init:function StateListenerInit(param)
		{
			this.superInit(LISTENER);
			this.state=param.state===true;
			this.stateDisabled=false;
			this.lastArgs=null;
		},
		setDisabled:function setDisabled(bool){this.stateDisabled=bool===true;},
		isDisabled:function isDisabled(){return this.stateDisabled;},
		setState:function setState(/*scope,event*/)
		{
			this.state=true;
			this.lastArgs=arguments;

			var rtn=false;
			if(!this.stateDisabled)
			{
				this.disabled=false;
				rtn=this.fire.apply(this,this.lastArgs);
				this.disabled=true
			}
			return rtn;
		},
		resetState:function resetState(){this.state=false;},
		getState:function getState(){return this.state},
		addListener:function addListener(fn,type)
		{
			var doFire=this.state&&!this.stateDisabled;
			if(doFire)
			{
				fn.apply(this.lastArgs[0],Array.prototype.slice.call(this.lastArgs,1));
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
	LISTENERS=µ.Listeners=CLASS(BASE,
	{
		rNames:/[\s|,]+/,
		rNameopt:":",
		init:function ListenersInit()
		{
			this.superInit(BASE);
			this.listeners={};
			this.createListener(".created");
		},
		createListener:function createListener(types/*,functions...*/)
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
				this.listeners[name_type[0]].addListeners(fnarr,name_type[1]);
			}
		},
		addListener:function addListener(types/*,functions...*/)
		{
			var typeArr=types.split(this.rNames);
			var fnarr=[].slice.call(arguments,1);
			for(var i=0;i<typeArr.length;i++)
			{
				var name_type=typeArr[i].split(this.rNameopt);
				if(this.listeners[name_type[0]]!==undefined)
				{
					this.listeners[name_type[0]].addListeners(fnarr,name_type[1]);
				}
			}
		},
		removeListener:function removeListener(names/*,functions...*/)
		{
			if(names.toLowerCase()=="all")
			{
				for(var i in this.listeners)
				{
					this.listeners[i].removeListeners(names);
				}
			}
			else
			{
				var nameArr=names.split(this.rNames);
				var fnarr=[].slice.call(arguments,1);
				for(var i=0;i<nameArr.length;i++)
				{
					var name=nameArr[i];
					if(this.listeners[name]!==undefined)
					{
						this.listeners[name].removeListeners(fnarr);
					}
				}
			}
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
	PATCH=µ.Patch=CLASS(BASE,
	{
		init:function Patchinit(instance,param)
		{
			this.superInit(BASE);
			if(instance.patches==null)
			{
				instance.patches={};
				instance.hasPatch=function(patch)
				{
					return this.getPatch(patch)!==undefined;
				};
				instance.getPatch=function(patch)
				{
					return this.patches[patch.patchID||patch.prototype.patchID];
				};
			}
			if(!instance.hasPatch(this))
			{
				this.instance=instance;
				instance.patches[this.patchID]=this;
				if(instance.listeners!=null)
				{
					this.instance.addListener(".created",µ.bind(this.patch,this,param,false));
				}
				else
				{
					this.patch(param,true);
				}
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
		if(instance.getPatch)
			return instance.getPatch(patch);
		return null;
	};
})(window.µ);
