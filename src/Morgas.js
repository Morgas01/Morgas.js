(function MorgasInit(oldµ){
	globalThis.Morgas={version:"0.8.9"};
	globalThis.µ=Morgas;
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
		"scope":function(){return this},
		"same":function (a,b){return a===b}
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
			if(!modules[key]) throw new Error("#getModule:001 "+key+" is not defined");
			return modules[key];
		};
	}

	/**
	 * log message if it's verbose is >= the current verbose.
	 * If a message is a function its return value will be logged.
	 *
	 * Set µ.logger.out to any function you like to log the events and errors.
	 * µ.logger.out will be called with (verbose level, [messages...])
	 */
	µ.logger={
		log:function(verbose,...msgs)
		{
			if(!verbose||verbose<=0) return;
			if(µ.logger.verbose>=verbose)
			{
				µ.logger.out(verbose,msgs);
			}
		},
		LEVEL:{
				//off:0, - set after log method generation
				error:10,
				warn:20,
				info:30,
				debug:40,
				trace:50
		},
		verbose:30,
		getLevel:function(){return µ.logger.verbose},
		setLevel:function(level)
		{
			if(!isNaN(level))µ.logger.verbose=parseFloat(level)
		},
		/**
		 * @param {Number}	verbose
		 * @param {Array}	msgs
		 */
		out:function(verbose,msgs)
		{
			var fn;
			if(verbose<=µ.logger.LEVEL.error) fn=console.error;
			else if(verbose<=µ.logger.LEVEL.warn) fn=console.warn;
			else if(verbose<=µ.logger.LEVEL.info) fn=console.info;
			else fn=console.log;

			fn.apply(console,msgs);
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
	µ.logger.LEVEL.off=0;

	/** shortcut
	 * creates/modifies an object that will evaluate its values defined in {map} on its first call.
	 *
	 *
	 * @param {Object} map	-	{key:("moduleOrPath",function)}
	 * @param {Object} [target={}]	-	{} (optional)
	 * @param {Any} [context] - argument for getter functions
	 * @param {Boolean} {dynamic=false] - don't cache evaluations
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
			Object.defineProperty(target,key,{
				configurable:true,
				enumerable:true,
				get:function()
				{
					let value=undefined;

					if(typeof path=="function") value=path.call(this,context);
					else if (µ.hasModule(path)) value=µ.getModule(path);
					else throw new ReferenceError("#shortcut:001 could not evaluate "+path);

					if(value!=null&&!dynamic)
					{//replace getter with actual value
						Object.defineProperty(this,key,{value});
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
			superClass=µ.BaseClass;
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
	µ.BaseClass=µ.Class({
		/**
		 * TODO remove or function key as parameter
		 * @deprecated
		 * calls same function from prototype chain as the caller
		 */
		mega:function mega()
		{
			//µ.logger.warn(".mega() is deprecated use prototype[].call() instead");
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
})(globalThis.µ);
