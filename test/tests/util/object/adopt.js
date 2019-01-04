QUnit.module("util.object.adopt",function()
{
	QUnit.test("adopt",function(assert)
	{
		assert.deepEqual(µ.util.object.adopt({
			v1:1,
			v2:2,
			v3:3
		},
		{
			v1:-1,
			v2:0.2
		}),
		{
			v1:-1,
			v2:0.2,
			v3:3
		},"adopt");
	});

	QUnit.test("extend",function(assert)
	{
		assert.deepEqual(µ.util.object.adopt({
			v1:1,
			v2:2,
			v3:3
		},
		{
			v3:30,
			v4:4
		},
		true),
		{
			v1:1,
			v2:2,
			v3:30,
			v4:4
		},
		"extend");
	});

	QUnit.test("proto adopt",function(assert)
	{
		let prot={
			v1:1
		};
		let target=Object.create(prot);
		target.v2=2;
		assert.deepEqual(µ.util.object.adopt(target,{v3:3},true),
		{
			v1:1,
			v2:2,
			v3:3
		},"proto adopt");
	});

	QUnit.test("setDefault",function(assert)
	{
		let default1={
			v1:1,
			v2:2,
			v3:3
		};
		let default2={
			v1:1,
			v2:2,
			v3:3
		};
		let param1={
			v1:4,
			v3:null,
			v4:40
		};
		let param2={
			v1:4,
			v3:null,
			v4:40
		};

		let result=µ.util.object.adopt.setDefaults(default1,param1);

		assert.deepEqual(result,{
			v1:4,
			v2:2,
			v3:null
		},"setDefault");
		assert.deepEqual(default1,default2,"default unaltered");
		assert.deepEqual(param1,param2,"param unaltered");

		result=µ.util.object.adopt.setDefaults(default1,param1,true);

		assert.deepEqual(result,{
			v1:4,
			v2:2,
			v3:null,
			v4:40
		},"setDefault extend");
		assert.deepEqual(default1,default2,"default unaltered");
		assert.deepEqual(param1,param2,"param unaltered");
	})
	
});