QUnit.module("Event",function()
{
	this.TestEvent=µ.Event.implement("testEvent");
	this.TestStateEvent=µ.Event.StateEvent.implement("testState");
	this.TestCancelEvent=µ.Event.CancelEvent.implement("cancelEvent");

	QUnit.test("rqeuire name",function(assert)
	{
		assert.throws(function()
		{
			µ.Event.implement();
		},
		error => (error instanceof SyntaxError)&&error.message.startsWith("#Event:001 "));
	});

	QUnit.test("name start with lowercase",function(assert)
	{
		assert.throws(function()
		{
			µ.Event.implement("Test");
		},
		error => (error instanceof SyntaxError)&&error.message.startsWith("#Event:002 "));
	});

	QUnit.test("name only alphabetic",function(assert)
	{
		assert.throws(function()
		{
			µ.Event.implement("test3");
		},
		error => (error instanceof SyntaxError)&&error.message.startsWith("#Event:003 "));
	});

	QUnit.test("require unique name",function(assert)
	{
		assert.throws(function()
		{
			µ.Event.implement("testEvent");
		},
		error => (error instanceof RangeError)&&error.message.startsWith("#Event:004 "));
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
		assert.throws(reporter.add("unknownEvent"),error=>error.message.startsWith("#ReporterPatch:001 "));
		assert.throws(reporter.add("testEvent"),error=>error.message.startsWith("#ReporterPatch:002 "));

		reporter.introduce(this.TestEvent);
		reporter.add("testEvent");
		assert.ok(true);
	});

	QUnit.test("listen",function(assert)
	{
		let instance={};
		let reporter = new µ.Event.ReporterPatch(instance,{add:"add",report:"report"});
		let event=new this.TestEvent();

		assert.expect(4);

		assert.throws(reporter.report(event),error=>error.message.startsWith("#ReporterPatch:003 "));
		reporter.introduce(this.TestEvent);
		reporter.add("testEvent",null,function(e)
		{
			assert.equal(e,event);
			assert.equal(this,window);
		});

		let listener={};
		reporter.add("TestEvent",listener,function()
		{
			assert.equal(this,listener);
		});

		instance.report(event);
	});

	QUnit.test("stop listen",function(assert)
	{
		let instance={};
		let reporter = new µ.Event.ReporterPatch(instance,{add:"add",report:"report",remove:"remove"});
		reporter.introduce(this.TestEvent);
		let event=new this.TestEvent();

		assert.expect(1);

		reporter.add("testEvent",null,function(e)
		{
			assert.equal(e,event);
		});

		instance.report(event);
		instance.remove(null);
		instance.report(event);
	});

	QUnit.test("state event",function(assert)
	{
		let instance={};
		let reporter = new µ.Event.ReporterPatch(instance,{add:"add",report:"report",remove:"remove"});
		reporter.introduce(this.TestStateEvent);
		let event=new this.TestStateEvent("before");

		assert.expect(2);

		instance.report(event);

		reporter.add("testState",null,function(e)
		{
			assert.ok(true,e.state);
		});
		event=new this.TestEvent("after");
		instance.report(event);
	});

	QUnit.test("cancel event",function(assert)
	{
		let instance={};
		let reporter = new µ.Event.ReporterPatch(instance,{add:"add",report:"report",remove:"remove"});
		reporter.introduce(this.TestStateEvent);

		assert.expect(5);

		let event=new this.TestCancelEvent();
		event.pass=true;
		reporter.add("cancelEvent",null,function(e)
		{
			assert.ok(true,"check "+e.pass);
			return event.pass;
		},true);
		reporter.add("cancelEvent",null,function(e)
		{
			assert.ok(true,"not canceled");
		});
		event=new this.TestCancelEvent();
		event.pass=true;
		instance.report(event);
		event=new this.TestCancelEvent();
		event.pass=false;
		instance.report(event);
		event=new this.TestCancelEvent();
		event.pass=null;
		instance.report(event);
	});
});