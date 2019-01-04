QUnit.module("util.map.register",function()
{
	QUnit.test("simple",function(assert)
	{
		let r=µ.util.map.register(1,Object,Map);
		assert.deepEqual(Array.from(r.keys()),[]);
		r.get("foo").bar="foobar";
		assert.deepEqual(Array.from(r.keys()),["foo"]);
		assert.strictEqual(r.get("foo").bar,"foobar");
	});

	let mapToJSON=function()
	{
		return Array.from(this.entries());
	}

	QUnit.test("stages",function(assert)
	{
		let r=µ.util.map.register(2,Map,Map);
		let inst={id:Math.random()};
		r.get("foo").get(inst).set("foobar","bazz");
		r.get(inst).get("second").set(inst,3);

		r.toJSON=mapToJSON;
		r.get("foo").toJSON=mapToJSON;
		r.get("foo").get(inst).toJSON=mapToJSON;
		r.get(inst).toJSON=mapToJSON;
		r.get(inst).get("second").toJSON=mapToJSON;

		assert.deepEqual(JSON.parse(JSON.stringify(r)),[
			["foo",[
				[inst,[
					["foobar","bazz"]
				]]
			]],
			[inst,[
				["second",[
					[inst,3]
				]]
			]]
		]);
	});

	QUnit.test("lastType",function(assert)
	{
		let r=µ.util.map.register(1,Array,Map);
		r.get("foo").push("bar");

		r.toJSON=mapToJSON;

		assert.deepEqual(JSON.parse(JSON.stringify(r)),[
			["foo",["bar"]]
		]);
	});

});