(function(µ,SMOD,GMOD,HMOD,SC){

	let Patch=GMOD("Patch");

	SC=SC({
		removeIf:"array.removeIf",
		global:"global"
	});

	let cSym=µ.Class.symbols;

	let firstLowerCase=/^[a-z]/;
	let alphabetic=/^[a-zA-Z]+$/;
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
			if(!sProt.name.match(firstLowerCase)) throw new RangeError("#Event:002 Event name must start lower case");
			if(!sProt.name.match(alphabetic)) throw new RangeError("#Event:003 Event name must only consist of alphabetic characters");
			if(eventClassesMap.has(sProt.name)) throw new RangeError("#Event:004 Event name must be unique");

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
		constructor:function CancelEvent(state)
		{
			this.phase=CancelEvent.phases.CHECK;
		}
	});
	µ.Event.CancelEvent.phases={
		CHECK:"check",
		DONE:"done"
	};
	SMOD("CancelEvent",µ.Event.CancelEvent);
	


	let getListenerPatch=function(scope)
	{
		return Patch.getPatches(scope,ListenerPatch)[0];
	};
	let checkListenerPatch=function(scope,reporter)
	{
		if(scope&&SC.global!==scope)
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
		add(scope=null,fn,phase)
		{
			if(phase)
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
		},
		add(eventName,scope=null,fn,phase)
		{
			let eventClass=eventClassesMap.get(eventName);
			if(!eventClass) throw new ReferenceError(`#ReporterPatch:001 Event class with name ${eventName} does not exist`);
			if(!this.eventMap.has(eventClass)) throw new ReferenceError(`#ReporterPatch:002 Event ${eventName} is not introduced`);
			this.eventMap.get(eventClass).add(scope,fn,phase);

			if(scope!=null&&scope!=SC.global) checkListenerPatch(scope,this);
		},
		remove(eventName,scope,fn,phase)
		{
			let eventClass=eventClassesMap.get(eventName);
			if(!eventClass||!this.eventMap.has(eventClass)) return;
			this.eventMap.get(eventClass).remove(scope,fn,phase);
			if(scope!=null&&scope!=SC.global)
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
			if(!this.eventMap.has(event.constructor)) throw new ReferenceError(`#ReporterPatch:003 tried to report unintroduced Event ${event.name}`);
			this.eventMap.get(event.constructor).report(event,fn);
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
			scopes.delete(SC.global);
			scopes.forEach(scope=>getListenerPatch(scope).remove(this));
			this.mega();
		}
	});
	ReporterPatch.defaultKeys={
		add:"addEventListener",
		remove:"removeEventListener",
		report:"reportEvent"
	};

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
	})

})(Morgas,Morgas.setModule,Morgas.getModule,Morgas.hasModule,Morgas.shortcut);