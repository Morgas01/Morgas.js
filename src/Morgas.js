(function MorgasInit(oldµ){
	Morgas={version:"0.8.0"};
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
		"n":function(){return null},
		"f":function(){return false},
		"t":function(){return true},
		"zero":function(){return 0},
		"es":function(){return ""},
		"boolean":function(val){return !!val},
		"pass":function(a){return a},
		"scope":function(){return this}
	};

	/** Modules
	 *	Every class and utility function should define a Module, which can
	 *	be replaced by any other function or class that has similar structure.
	 *
	 */

	{
		let modules={};
		µ.setModule=function(key,value)
		{
			if(modules[key])
			{
				µ.logger.warn("#setModule:001 "+key+" is overwritten");
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
				µ.logger.info("#getModule:001 "+key+" is not defined\n use µ.hasModule to check for existence");
			return modules[key];
		};
	};

	/**
	 * log message if it's verbose is >= the current verbose.
	 * If a message is a function its return value will be logged.
	 *
	 * Set µ.logger.out to any function you like to log the events and errors.
	 * µ.logger.out will be called with (verbose level, [messages...])
	 */
	µ.logger={
		log:function(verbose,msg/*,msg...*/)
		{
			if(!verbose||verbose<=0)
			{
				return;
			}
			if(µ.logger.verbose>=verbose)
			{
				if(typeof msg == "function") msg=[].concat(msg());
				else msg=Array.prototype.slice.call(arguments,1);

				µ.logger.out(verbose,msg);
			}
		},
		LEVEL:{
				//off:0,
				error:10,
				warn:20,
				info:30,
				debug:40,
				trace:50
		},
		verbose:30,
		getLevel:function(){return µ.logger.verbose},
		setLevel:function(level){µ.logger.verbose=level},
		/**
		 * @param {number}	verbose
		 * @param {any[]}	msg
		 */
		out:function(verbose,msg)
		{
			var fn;
			switch(verbose)
			{
				case µ.logger.LEVEL.error:
					fn=console.error;
					break;
				case µ.logger.LEVEL.warn:
					fn=console.warn;
					break;
				case µ.logger.LEVEL.info:
					fn=console.info;
					break;
				default:
					fn=console.log;
			}
			fn.apply(console,msg);
		}
	};
	//create methods for each level (e.g. µ.logger.warn)
	Object.keys(µ.logger.LEVEL).forEach(function(level)
	{
		µ.logger[level]=function(...args)
		{
			args.unshift();
			µ.logger.log.call(null,µ.logger.LEVEL[level],...args);
		}
	});

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
		Object.entries(map).forEach(([key,path])=>
		{
			let value=undefined;
			Object.defineProperty(target,key,{
				configurable:true,
				enumerable:true,
				get:function()
				{
					if(value==null||dynamic)
					{
						if(typeof path=="function")
						{
							value=path(context);
						}
						else if (µ.hasModule(path))
						{
							value=µ.getModule(path);
						}
						else
						{
							µ.logger.error(new ReferenceError("#shortcut:001 could not evaluate "+path))
						}
					}
					if(value!=null&&!dynamic)
					{//replace getter with actual value
						delete target[key];
						target[key]=value;
					}
					return value;
				}
			});
		});
		return target;
	};
	let CLASS_PROXY={
		construct:function(target,argumentList)
		{
			if(target.prototype.hasOwnProperty(µ.Class.symbols.abstract)) throw new Error("#Class:001 can not instantiate abstract class");

			let instance=new target(...argumentList);
			if(µ.Class.symbols.afterConstruct in target.prototype)
			{
				target.prototype[µ.Class.symbols.afterConstruct].call(instance,...argumentList)
			}
			return instance;
		}
	};


	/** Class function
	 * Designed to create JavaScript Classes
	 *
	 * It does the inheritance, and wires some hooks and defreezes the constructor method.
	 * If only 1 argument is passed it will be handled as the newClass.
	 *
	 * @param {Function} (superClass)
	 * @param {Function|Object} newClass
	 * @return {Function}
	 */
	µ.Class=function ClassFunc(superClass,newClass)
	{
		if(arguments.length==1)
		{
			newClass=superClass;
			superClass=BASE;
		}

		if(typeof newClass=="object")
		{
			if(!newClass.hasOwnProperty("constructor"))
			{
				if(!superClass) newClass.constructor=function(){};
				else newClass.constructor=function(...args){superClass.call(this,...args)};
			}
			newClass.constructor.prototype=newClass;
			newClass=newClass.constructor;
		}
		else if (!newClass)
		{
			newClass=function(){};
		}

		if(superClass) //only undefined when creating BaseClass
		{
			let prot=Object.create(superClass.prototype);
			Object.assign(prot,newClass.prototype);
			prot.constructor=newClass;
			newClass.prototype=prot;
		}

		if(newClass.prototype.hasOwnProperty(µ.Class.symbols.abstract) && typeof newClass.prototype[µ.Class.symbols.abstract]==="function")
		{
			newClass.implement=function(...args)
			{
				return µ.Class(newClass,newClass.prototype[µ.Class.symbols.abstract](...args));
			};
		}

		let classProxy=new Proxy(newClass,CLASS_PROXY)

		if(superClass&&µ.Class.symbols.onExtend in superClass.prototype&&!newClass.prototype.hasOwnProperty(µ.Class.symbols.abstract))
		{
			superClass.prototype[µ.Class.symbols.onExtend](classProxy);
		}
		return classProxy;
	};
	µ.Class.symbols={
		"onExtend":Symbol("onExtend"),
		"abstract":Symbol("abstract"),
		"afterConstruct":Symbol("afterConstruct")
	};


	let megaSymbol=Symbol("mega");
	/** Base Class
	 *	allows to check of being a class ( foo instanceof µ.BaseClass )
	 *	provides mega and basic destroy method
	 */
	var BASE=µ.BaseClass=µ.Class({
		mega:function mega()
		{
			let isFirstCall=false,rtn;
			// check if it is the same as the las one
			if(this[megaSymbol]!==undefined&&this.mega.caller!==this[megaSymbol].prot[this[megaSymbol].key])
			{
				delete this[megaSymbol];
			}
			//search for key and prototype of the caller
			if(this[megaSymbol]===undefined)
			{
				isFirstCall=true;
				searchPrototype:for(let prot=Object.getPrototypeOf(this);prot!==null;prot=Object.getPrototypeOf(prot))
				{
					for(let i=0,names=Object.getOwnPropertyNames(prot);i<names.length;i++)
					{
						if(this.mega.caller===prot[names[i]])
						{
							this[megaSymbol]={
								key:names[i],
								prot:prot
							};
							break searchPrototype;
						}
					}
				}
				if(this[megaSymbol]===undefined)
				{
					µ.logger.error(new ReferenceError("caller was not a member"));
					return;
				}
			}
			let nextPrototype=Object.getPrototypeOf(this[megaSymbol].prot);
			let functionName=this[megaSymbol].key
			//go to next prototype with functionName defined
			while(nextPrototype!==null&&!nextPrototype.hasOwnProperty(functionName))
			{
				nextPrototype=Object.getPrototypeOf(nextPrototype);
			};
			var error=null;
			try
			{
				if(nextPrototype===null)
				{
					µ.logger.error(new ReferenceError("no mega found for "+this.__megaKey));
				}
				else
				{
					this[megaSymbol].prot=nextPrototype;
					rtn=nextPrototype[functionName].apply(this,arguments);
				}
			}
			catch (e){error=e;}
			if(isFirstCall)
			{
				delete this[megaSymbol];
				if(error)µ.logger.error(error);
			}
			if(error) throw error;
			return rtn;
		},
		destroy()
		{
			if(µ.hasModule("Patch"))
			{
				µ.getModule("Patch").getPatches(this).forEach(p=>p.destroy());
			}
			for(var i in this)
			{
				delete this[i];
			}
			Object.setPrototypeOf(this,null);
		}
	});
})(this.µ);
