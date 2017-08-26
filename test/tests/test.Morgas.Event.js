(function(µ,SMOD,GMOD,HMOD,SC){

	QUnit.module("Event");

	QUnit.test("Event Instance",function(assert)
	{
		let event=new µ.Event("test");
		assert.strictEqual(event.name,"test","name");
	});

	QUnit.test("rqeuire name",function(assert)
	{
		assert.throws(function()
		{
			new µ.Event();
		},
		TypeError,
		"TypeError");
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

	QUnit.test("ListenerPatch",function(assert)
	{
		let instanceMethods=["addEventListener","removeEventListener","reportEvent"];
		let patchMethods=["introduce","add","remove","report"];

		let listenerinstance={};
		let reporter= new µ.Event.ReporterPatch(instance);
		reporter.add

		for (let method of instanceMethods)
		{
			assert.ok(method in instance,method+" in instance");
		}
		for (let method of patchMethods)
		{
			assert.ok(method in reporter,method+" in patch");
		}
	});
})(Morgas,Morgas.setModule,Morgas.getModule,Morgas.hasModule,Morgas.shortcut);