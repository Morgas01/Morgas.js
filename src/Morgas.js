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
	µ.getDebug=function(){return µ.debug.verbose};
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
	µ.debug.error=function(msg){µ.debug(msg,µ.debug.LEVEL.ERROR)};
	µ.debug.warning=function(msg){µ.debug(msg,µ.debug.LEVEL.WARNING)};
	µ.debug.info=function(msg){µ.debug(msg,µ.debug.LEVEL.INFO)};
	µ.debug.debug=function(msg){µ.debug(msg,µ.debug.LEVEL.DEBUG)};
	
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
	 *  	//or this.mega();
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
		if(superClass) //only undefined when creating BaseClass
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
	 *	provides mega and basic destroy method
	 */
	var BASE=µ.BaseClass=CLASS(
	{
		init:function baseInit(){},
		mega:function mega()
		{
			var isFirstCall=false,rtn;
			if(this.__magaKey===undefined)
			{
				isFirstCall=true;
				searchPrototype:for(var prot=Object.getPrototypeOf(this);prot!==null;prot=Object.getPrototypeOf(prot))
				{
					for(var i=0,names=Object.getOwnPropertyNames(prot);i<names.length;i++)
					{
						if(this.mega.caller===prot[names[i]])
						{
							Object.defineProperties(this,{
								__megaKey:{configurable:true,writable:true,value:names[i]},
								__megaProt:{configurable:true,writable:true,value:prot}
							});
							break searchPrototype;
						}
					}
				}
				if(this.__megaKey===undefined)
				{
					µ.debug("caller was not a member",µ.debug.LEVEL.ERROR);
					return;
				}
			}
			while((this.__megaProt=Object.getPrototypeOf(this.__megaProt))!==null&&!this.__megaProt.hasOwnProperty(this.__megaKey));
			var error=null;
			try
			{
				if(this.__megaProt===null)
				{
					µ.debug("no mega found for "+this.__megaKey,µ.debug.LEVEL.ERROR);
				}
				else
				{
					rtn=this.__megaProt[this.__megaKey].apply(this,arguments);
				}
			}
			catch (e){error=e;}
			if(isFirstCall)
			{
				delete this.__megaKey;
				delete this.__megaProt;
				if(error)µ.debug(error,µ.debug.LEVEL.ERROR);
			}
			if(error) throw error;
			return rtn;
		},
		destroy:function()
		{
			if(this.patches)for(var p in this.patches)this.patches[p].destroy();
			for(var i in this)
			{
				if(this[i]&&typeof this[i].destroy==="function")this[i].destroy();
				delete this[i];
			}
		}
	});
	SMOD("Base",BASE);
})(this.µ);
