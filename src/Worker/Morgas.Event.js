(function(µ,SMOD,GMOD,HMOD,SC){

	let Patch=GMOD("Patch");

	SC=SC({});

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
			if(sProt.name.match(firstLowerCase)) throw new SyntaxError("#Event:002 Event name must start lower case");
			if(sProt.name.match(alphabetic)) throw new SyntaxError("#Event:003 Event name must only consist of alphabetic characters");

			eventClassesMap.set(sProt.name,sub);
		},
		[cSym.abstract]:abstractImplementor,
		constructor:function Event(){}
	});
	SMOD("Event",µ.Event);

	µ.Event.StateEvent=µ.Class(Event,{
		[cSym.abstract]:abstractImplementor
		constructor:function StateEvent(state)
		{
			this.state=state;
		}
	});
	SMOD("StateEvent",µ.Event.StateEvent);

	µ.Event.CancelEvent=µ.Class(Event,{
		[cSym.abstract]:abstractImplementor
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

	let rPatch=µ.Event.ReporterPatch=µ.Class(Patch,{
		patch(keys=rPatch.defaultKeys)
		{
			this.eventMap=new Map();
			this.composeInstance(keys);
		},
		composeKeys:["introduce","add","remove","report"],
		introduce(eventClass)
		{

		},
		add(eventName,scope,fn,phase)
		{
			let eventClass=eventClassesMap.get(eventName);
			if(!eventClass) throw new ReferenceError(`#ReporterPatch:001 Event class with name ${eventName} does not exist`);
			if(!this.eventMap.has(eventClass)) throw new ReferenceError(`#ReporterPatch:002 Event ${eventName} is not introduced`);
			this.eventMap.get(eventClass).add(scope,fn,phase);
		},
		remove(eventName,scope,fn,phase)
		{
			let eventClass=eventClassesMap.get(eventName);
			if(!eventClass||!this.eventMap.has(eventClass)) return;
			this.eventMap.get(eventClass).remove(scope,fn,phase);
		},
		report(event,fn)
		{
			if(!this.eventMap.has(event.constructor)) throw new ReferenceError(`#ReporterPatch:003 tried to report unintroduced Event ${event.name}`);
			this.eventMap.get(event.constructor).report(event,fn);
		}
	});
	rPatch.defaultKeys={
		add:"addEventListener",
		remove:"removeEventListener",
		report:"reportEvent"
	};

})(Morgas,Morgas.setModule,Morgas.getModule,Morgas.hasModule,Morgas.shortcut);