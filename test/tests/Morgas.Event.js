QUnit.module("Event",function()
{
	let TestEvent=µ.Event.implement("testEvent");
	let TestStateEvent=µ.Event.StateEvent.implement("testState");
	let TestCancelEvent=µ.Event.CancelEvent.implement("cancelEvent");

	QUnit.test("rqeuire name",function(assert)
	{
		assert.throws(function()
		{
			µ.Event.implement();
		},
		function(error){return (error instanceof SyntaxError)&&error.message.startsWith("#Event:001 ")});
	});

	QUnit.test("name start with lowercase",function(assert)
	{
		assert.throws(function()
		{
			µ.Event.implement("Test");
		},
		function(error){return (error instanceof RangeError)&&error.message.startsWith("#Event:002 ")});
	});

	QUnit.test("name only alphabetic",function(assert)
	{
		assert.throws(function()
		{
			µ.Event.implement("test3");
		},
		function(error){return (error instanceof RangeError)&&error.message.startsWith("#Event:003 ")});
	});

	QUnit.test("require unique name",function(assert)
	{
		assert.throws(function()
		{
			µ.Event.implement("testEvent");
		},
		function(error){return (error instanceof RangeError)&&error.message.startsWith("#Event:004 ")});
	});

	QUnit.test("ReporterPatch",function(assert)
	{
		let instanceMethods=["addEventListener","removeEventListener","reportEvent"];
		let patchMethods=["introduce","add","remove","report"];

		let instance={};
		let reporter= new µ.Event.ReporterPatch(instance);

		for (let method of instanceMethods)
		{
			assert.ok(method in instance,method+" in instance");
		}
		for (let method of patchMethods)
		{
			assert.ok(method in reporter,method+" in patch");
		}
	});

	QUnit.test("unknown event",function(assert)
	{
		let reporter= new µ.Event.ReporterPatch({});
		assert.throws(function()
		{
			reporter.add("unknownEvent");
		},
		function(error){return error.message.startsWith("#ReporterPatch:001 ")});

		assert.throws(function()
		{
			reporter.add("testEvent")
		},function(error){return error.message.startsWith("#ReporterPatch:002 ")});

		reporter.introduce(TestEvent);
		reporter.add("testEvent");
		assert.ok(true);
	});

	QUnit.test("listen",function(assert)
	{
		let instance={};
		let reporter = new µ.Event.ReporterPatch(instance,undefined,{add:"add",report:"report"});
		let event=new TestEvent();

		assert.expect(4);

		assert.throws(function()
		{
			reporter.report(event)
		},function(error){return error.message.startsWith("#ReporterPatch:003 ")});
		reporter.introduce(TestEvent);
		reporter.add("testEvent",null,function(e)
		{
			assert.equal(e,event);
			assert.equal(this,window);
		});

		let listener={};
		reporter.add("testEvent",listener,function()
		{
			assert.equal(this,listener);
		});

		instance.report(event);
	});

	QUnit.test("stop listen",function(assert)
	{
		let instance={};
		let reporter = new µ.Event.ReporterPatch(instance,undefined,{add:"add",report:"report",remove:"remove"});
		reporter.introduce(TestEvent);
		let event=new TestEvent();

		assert.expect(1);

		reporter.add("testEvent",null,function(e)
		{
			assert.equal(e,event);
		});

		instance.report(event);
		instance.remove("testEvent",null);
		instance.report(event);
	});

	QUnit.test("state event",function(assert)
	{
		let instance={};
		let reporter = new µ.Event.ReporterPatch(instance,undefined,{add:"add",report:"report",remove:"remove"});
		reporter.introduce(TestStateEvent);
		let event=new TestStateEvent("before");

		assert.expect(2);

		instance.report(event);

		reporter.add("testState",null,function(e)
		{
			assert.ok(true,e.state);
		});
		event=new TestStateEvent("after");
		instance.report(event);
	});

	QUnit.test("cancel event",function(assert)
	{
		let instance={};
		let reporter = new µ.Event.ReporterPatch(instance,undefined,{add:"add",report:"report",remove:"remove"});
		reporter.introduce(TestCancelEvent);

		assert.expect(6);

		reporter.add("cancelEvent",null,function(e)
		{
			assert.ok(true,"check "+e.pass);
			return e.pass;
		},true);
		reporter.add("cancelEvent",null,function(e)
		{
			assert.ok(true,"not canceled "+e.pass);
		});
		let event=new TestCancelEvent();
		event.pass=true;
		instance.report(event,e=>assert.equal(e,event,"not canceled callback"));
		event=new TestCancelEvent();
		event.pass=false;
		instance.report(event,µ.constantFunctions.n);
		event=new TestCancelEvent();
		event.pass=null;
		instance.report(event,µ.constantFunctions.n);
	});

	QUnit.test("ListenerPatch",function(assert)
	{
		let reporter = new µ.Event.ReporterPatch({},[TestEvent]);

		let instance={};
		reporter.add("testEvent",instance,µ.constantFunctions.n);
		assert.equal(µ.Patch.getPatches(instance).length,1);
		assert.equal(µ.Patch.getPatches(instance)[0].reporters.values().next().value,reporter);

		instance={};
		new µ.Event.ListenerPatch(instance);
		reporter.add("testEvent",instance);
		assert.equal(µ.Patch.getPatches(instance).length,1);
		assert.equal(µ.Patch.getPatches(instance)[0].reporters.values().next().value,reporter);
	});

	QUnit.test("ListenerPatch remove",function(assert)
	{
		let reporter = new µ.Event.ReporterPatch({},[TestEvent]);

		let instance={};
		reporter.add("testEvent",instance,µ.constantFunctions.n);
		assert.equal(µ.Patch.getPatches(instance)[0].reporters.values().next().value,reporter);
		reporter.remove("testEvent",instance);
		assert.equal(µ.Patch.getPatches(instance)[0].reporters.size,0);

	});

	QUnit.test("destroy",function(assert)
	{
		let instance={}
		let listener=new µ.Event.ListenerPatch(instance);
		let reporter=new µ.Event.ReporterPatch(instance,[TestEvent]);

		let toDestroy=new µ.BaseClass();
		let destroyListener=new µ.Event.ListenerPatch(toDestroy);
		reporter.add("testEvent",toDestroy,µ.constantFunctions.n);
		let destroyReporter=new µ.Event.ReporterPatch(toDestroy,[TestEvent]);
		destroyReporter.add("testEvent",instance,µ.constantFunctions.n);

		assert.equal(listener.reporters.values().next().value,destroyReporter);
		assert.ok(reporter.eventMap.get(TestEvent.prototype.constructor).has(toDestroy));

		toDestroy.destroy();

		assert.equal(listener.reporters.size,0);
		assert.notOk(reporter.eventMap.get(TestEvent.prototype.constructor).has(toDestroy));

	});

});