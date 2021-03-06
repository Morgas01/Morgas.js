(function(µ,SMOD,GMOD,HMOD,SC){

	let Patch=GMOD("Patch");

	SC=SC({
		removeIf:"array.removeIf"
	});

	let globalScope=this;

	let cSym=µ.Class.symbols;

	let eventNamePattern=/^[a-z_][a-zA-Z_.:\-@#]+$/;
	let abstractImplementor=function(name)
	{
		if(typeof name==="string")
		{
			name={name:name};
		}
		return name;
	};

	let eventClassesMap=new Map();

	µ.Event=µ.Class({
		[cSym.onExtend]:function(sub)
		{
			let sProt=sub.prototype;
			if(!sProt.hasOwnProperty("name")||!sProt.name) throw new SyntaxError("#Event:001 Event has no name");
			if(!sProt.name.match(eventNamePattern)) throw new RangeError("#Event:002 Event name does not match pattern "+eventNamePattern);
			if(eventClassesMap.has(sProt.name)) throw new RangeError("#Event:003 Event name must be unique");

			sub.name=sProt.name;

			eventClassesMap.set(sProt.name,sProt.constructor);
		},
		[cSym.abstract]:abstractImplementor,
		constructor:function Event(){}
	});
	SMOD("Event",µ.Event);



	µ.Event.StateEvent=µ.Class(µ.Event,{
		[cSym.abstract]:abstractImplementor,
		constructor:function StateEvent(state)
		{
			this.state=state;
		}
	});
	SMOD("StateEvent",µ.Event.StateEvent);



	µ.Event.CancelEvent=µ.Class(µ.Event,{
		[cSym.abstract]:abstractImplementor,
		constructor:function CancelEvent()
		{
			//will also be set in reporter
			this.phase=CancelEvent.phases.CHECK;
		}
	});
	µ.Event.CancelEvent.phases={
		CHECK:"check",
		DONE:"done"
	};
	SMOD("CancelEvent",µ.Event.CancelEvent);



	µ.Event.ErrorEvent=µ.Class(µ.Event,{
		name:"error",
		constructor:function(reason,cause)
		{
			//                                  ErrorEvent is undefined in nodeJs
			if(reason instanceof Error||(typeof ErrorEvent!=="undefined"&&reason instanceof ErrorEvent))
			{
				cause=reason;
				reason=reason.message;
			}
			this.reason=reason;
			this.cause=cause;
		},
		toString()
		{
			return this.reason+"\n"+this.cause;
		}
	});
	SMOD("ErrorEvent",µ.Event.ErrorEvent);
	


	let getListenerPatch=function(scope)
	{
		return Patch.getPatches(scope,ListenerPatch)[0];
	};
	let checkListenerPatch=function(scope,reporter)
	{
		if(scope&&globalScope!==scope)
		{
			let listenerPatch=getListenerPatch(scope);
			if(!listenerPatch)
			{
				listenerPatch=new ListenerPatch(scope);
			}
			listenerPatch.add(reporter);
		}
	};

	let EventRegister=µ.Class({
		constructor:function()
		{
			this.listeners=[];
		},
		add(scope=null,fn)
		{
			this.listeners.push([scope,fn]);
		},
		has(scope=null)
		{
			return this.listeners.findIndex(([s])=>s===scope)!==-1;
		},
		remove(scope,fn)
		{
			SC.removeIf(this.listeners,([s,f])=>s===scope&&(!fn||fn===f),true);
		},
		report:function(event)
		{
			for(let [scope,fn] of this.listeners) fn.call(scope,event);
		},
		destroy()
		{
			this.listeners.length=0;
			this.mega();
		},
		getScopes()
		{
			return this.listeners.map(a=>a[0]);
		}
	});
	
	
	
	let StateEventRegister=µ.Class(EventRegister,{
		constructor:function()
		{
			this.mega();
			this.lastState=null;
		},
		add(scope=null,fn)
		{
			this.mega(scope,fn)
			if(this.lastState) fn.call(scope,this.lastState);
		},
		report(event)
		{
			this.mega(event);
			this.lastState=event;
		}
	});
	
	
	let CancelEventRegister=µ.Class(EventRegister,{
		constructor:function()
		{
			this.mega();
			this.checkListeners=[];
		},
		add(scope=null,fn,checkPhase)
		{
			if(checkPhase)
			{
				this.checkListeners.push([scope,fn]);
			}
			else
			{
				this.mega(scope,fn);
			}
		},
		has(scope=null)
		{
			return this.mega(scope)&&this.checkListeners.findIndex(([s])=>s===scope)!==-1;
		},
		remove(scope,fn,phase)
		{
			if(phase) SC.removeIf(this.checkListeners,([s,f])=>s===scope&&(!fn||fn===f),true);
			else this.mega(scope);
		},
		report(event,fn)
		{
			event.phase=µ.Event.CancelEvent.phases.CHECK;
			for(let [scope,fn] of this.checkListeners)
			{
				if(fn.call(scope,event)===false)
				{
					return;
				}
			}
			fn(event);
			event.phase=µ.Event.CancelEvent.phases.DONE;
			this.mega(event);
		},
		destroy()
		{
			this.checkListeners.length=0;
			this.mega();
		},
		getScopes()
		{
			let scopes=this.mega();
			this.checkListeners.forEach(a=>scopes.push(a[0]));
			return scopes;
		}
	});
	
	

	let ReporterPatch=µ.Event.ReporterPatch=µ.Class(Patch,{
		patch(eventClasses=[],keys=ReporterPatch.defaultKeys)
		{
			this.eventMap=new Map();
			for(let eventClass of eventClasses) this.introduce(eventClass);
			this.composeInstance(keys);
		},
		composeKeys:["introduce","add","remove","report"],
		introduce(eventClass)
		{
			if(!(eventClass.prototype instanceof µ.Event)) throw new TypeError("#ReporterPatch:001 'eventClass' does not derive from Event class");
			if(!this.eventMap.has(eventClass))
			{
				let eventRegister;
				if(eventClass.prototype instanceof µ.Event.StateEvent)
				{
					eventRegister=new StateEventRegister(this);
				}
				else if(eventClass.prototype instanceof µ.Event.CancelEvent)
				{
					eventRegister=new CancelEventRegister(this);
				}
				else
				{
					eventRegister=new EventRegister(this);
				}

				this.eventMap.set(eventClass.prototype.constructor,eventRegister);
			}
			return this;
		},
		add(eventName,scope=null,fn,checkPhase)
		{
			let eventClass=eventClassesMap.get(eventName);
			if(!eventClass) throw new ReferenceError(`#ReporterPatch:001 Event class with name ${eventName} does not exist`);
			if(!this.eventMap.has(eventClass)) throw new ReferenceError(`#ReporterPatch:002 Event ${eventName} is not introduced`);
			if(typeof fn!=="function") throw new TypeError("#ReporterPatch:003 fn is not a function");
			this.eventMap.get(eventClass).add(scope,fn,checkPhase);

			if(scope!=null&&scope!=globalScope) checkListenerPatch(scope,this);
		},
		remove(eventName,scope,fn,checkPhase)
		{
			let eventClass=eventClassesMap.get(eventName);
			if(!eventClass||!this.eventMap.has(eventClass)) return;
			this.eventMap.get(eventClass).remove(scope,fn,checkPhase);
			if(scope!=null&&scope!=globalScope)
			{// removed && not global
				for(let eventRegister of this.eventMap.values()) if (eventRegister.has(scope)) return ;
				
				let listenerPatch=getListenerPatch(scope);
				listenerPatch.remove(this);
			}
		},
		removeScope:function(scope)
		{
			for(let eventRegister of this.eventMap.values())
			{
				eventRegister.remove(scope);
			}
		},
		report(event,fn)
		{
			if(!this.eventMap.has(event.constructor)) throw new ReferenceError(`#ReporterPatch:004 tried to report unintroduced Event ${event.name}`);
			this.eventMap.get(event.constructor).report(event,fn);
			return event.phase!==µ.Event.CancelEvent.phases.CHECK;
		},
		destroy()
		{
			let scopes=new Set();
			for(let eventRegister of this.eventMap.values())
			{
				eventRegister.getScopes().forEach(s=>scopes.add(s));
				eventRegister.destroy();
			}
			scopes.delete(null);
			scopes.delete(globalScope);
			scopes.forEach(scope=>getListenerPatch(scope).remove(this));
			this.mega();
		}
	});
	ReporterPatch.defaultKeys={
		add:"addEventListener",
		remove:"removeEventListener",
		report:"reportEvent"
	};
	SMOD("EventReporterPatch",ReporterPatch);



	let ListenerPatch=µ.Event.ListenerPatch=µ.Class(Patch,{
		patch()
		{
			this.reporters=new Set();
		},
		add(reporter)
		{
			this.reporters.add(reporter);
		},
		remove(reporter)
		{
			this.reporters.delete(reporter);
		},
		destroy()
		{
			for(let reporter of this.reporters) reporter.removeScope(this.instance);
			this.reporters.clear();
			this.mega();
		}
	});
	SMOD("EventListenerPatch",ListenerPatch);

})(Morgas,Morgas.setModule,Morgas.getModule,Morgas.hasModule,Morgas.shortcut);