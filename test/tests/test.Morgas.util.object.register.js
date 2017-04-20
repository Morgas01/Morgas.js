(function(µ,SMOD,GMOD,HMOD,SC){

	QUnit.module("util.object.register");

	var register=GMOD("register");

	QUnit.test("simple",function(assert)
	{
		var r=register();
		assert.deepEqual(Object.keys(r),[]);
		r.foo.bar="foobar";
		assert.deepEqual(Object.keys(r),["foo"]);
		assert.strictEqual(r.foo.bar,"foobar");
	});

	QUnit.test("stages",function(assert)
	{
		var r=register(2);
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
		var r=register(1,Array);
		r.foo.push("bar");

		assert.deepEqual(JSON.parse(JSON.stringify(r)),{
			foo:["bar"]
		});
	});

})(Morgas,Morgas.setModule,Morgas.getModule,Morgas.hasModule,Morgas.shortcut);