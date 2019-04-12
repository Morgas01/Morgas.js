QUnit.module("util.object.register",function()
{
	QUnit.test("simple",function(assert)
	{
		let r=µ.util.object.register();
		assert.deepEqual(Object.keys(r),[]);
		r.foo.bar="foobar";
		assert.deepEqual(Object.keys(r),["foo"]);
		assert.strictEqual(r.foo.bar,"foobar");
	});

	QUnit.test("stages",function(assert)
	{
		let r=µ.util.object.register(2);
		r.foo.bar.foobar="bazz";
		r.first.second.third=3;

		assert.deepEqual(JSON.parse(JSON.stringify(r)),{
			foo:{
				bar:{
					foobar:"bazz"
				}
			},
			first:{
				second:{
					third:3
				}
			}
		});
	});

	QUnit.test("lastType",function(assert)
	{
		let r=µ.util.object.register(1,()=>[]);
		r.foo.push("bar");

		assert.deepEqual(JSON.parse(JSON.stringify(r)),{
			foo:["bar"]
		});
	});

	QUnit.test("delete",function(assert)
	{
		var r=µ.util.object.register();
		assert.deepEqual(Object.keys(r),[]);
		r.foo.bar="foobar";
		assert.deepEqual(Object.keys(r),["foo"]);
		delete r.foo;
		assert.deepEqual(Object.keys(r),[]);
	});

});