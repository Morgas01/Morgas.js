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
	let LISTENER=µ.Listener=µ.Class(
	{
		init:function ListenerInit()
		{
			this.listeners=new Map(); //TODO use WeakMap when its capable of iterations
			this.disabled=false;
		},
		addListener:function addListener(fn,scope,type)
		{
            let fnType=typeof fn;
			if(fnType==="function"||fnType==="string")
			{
                scope=scope||this;
                let entry=null;
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
            let rtn=[];
            for(let i=0;i<fns.length;i++)
            {
                rtn.push(this.addListener(fns[i],scope,type));
            }
            return rtn;
        },
		removeListener:function removeListener(fn,scope)
		{
            //TODO remove fn from all scopes
			let timesFound=0;
            let entry=this.listeners.get(scope);
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
			let rtn=[];
			if(fns.length==0)fns.push("all");
			for(let i=0;i<fns.length;i++)
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
				let run=true;
                for(let [scope,entry] of this.listeners)
                {
                    let it=entry.first.values();
                    let step=undefined;
                    let value=undefined;
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
	let STATELISTENER=LISTENER.StateListener=µ.Class(LISTENER,
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

			let rtn=false;
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
			let doFire=this.state&&!this.stateDisabled;
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
	let LISTENERS=µ.Listeners=µ.Class(
	{
		rNames:/[\s|,]+/,
		rNameopt:":",
		init:function ListenersInit()
		{
			this.listeners={};
			this.createListener(".created");
		},
		createListener:function createListener(types)
		{
			let typeArr=types.split(this.rNames);
			let fnarr=[].slice.call(arguments,1);
			for(let i=0;i<typeArr.length;i++)
			{
				let name_type=typeArr[i].split(this.rNameopt);
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
			let typeArr=types.split(this.rNames);
			let fnarr=[].slice.call(arguments,2);
			for(let i=0;i<typeArr.length;i++)
			{
				let name_type=typeArr[i].split(this.rNameopt);
				if(this.listeners[name_type[0]]!==undefined)
				{
					this.listeners[name_type[0]].addListeners(fnarr,scope,name_type[1]);
				}
			}
		},
		removeListener:function removeListener(names,scope/*,functions...*/)
		{
			let removeCount=0;
			if(names.toLowerCase()=="all")
			{
				for(let i in this.listeners)
				{
					removeCount+=this.listeners[i].removeListeners(names,scope);
				}
			}
			else
			{
				let nameArr=names.split(this.rNames);
				let fnarr=[].slice.call(arguments,2);
				for(let i=0;i<nameArr.length;i++)
				{
					let name=nameArr[i];
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
			let nameArr=names.split(this.rNames);
			for(let i=0;i<nameArr.length;i++)
			{
				let lstnr=this.listeners[nameArr[i]];
				if(lstnr!=null)
					lstnr.setDisabled(bool);
			}
		},
		isDisabled:function isDisabled(names)
		{
			let rtn=true;
			let nameArr=names.split(this.rNames);
			for(let i=0;rtn&&i<nameArr.length;i++)
			{
				let lstnr=this.listeners[nameArr[i]];
				if(lstnr!=null)
					rtn&=lstnr.isDisabled();
			}
			return rtn;
		},
		setState:function setState(name,event)
		{
			event=event||{};
			event.type=name;
			let lstnr=this.listeners[name];
			if (lstnr&&lstnr instanceof STATELISTENER)
			{
				return lstnr.setState(this,event);
			}
			return undefined;
		},
		resetState:function resetState(names)
		{
			let nameArr=names.split(this.rNames);
			for(let i=0;i<nameArr.length;i++)
			{
				let lstnr=this.listeners[nameArr[i]];
				if(lstnr!=null&&lstnr instanceof STATELISTENER)
					lstnr.resetState();
			}
		},
		getState:function getState(names)
		{
			let rtn=true;
			let nameArr=names.split(this.rNames);
			for(let i=0;rtn&&i<nameArr.length;i++)
			{
				let lstnr=this.listeners[nameArr[i]];
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
		for(let i in LISTENERS.prototype)
		{
			if (i!="init"&&i!="constructor"&&i!="superInit"&&i!="superInitApply")
				instance[i]=LISTENERS.prototype[i];
		}
		LISTENERS.prototype.init.call(instance);
		instance.setState(".created");
	};
	SMOD("attachListeners",LISTENERS.attachListeners);
	
})(Morgas,Morgas.setModule,Morgas.getModule);