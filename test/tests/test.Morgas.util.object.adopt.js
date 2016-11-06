(function(µ,SMOD,GMOD,HMOD,SC){

	QUnit.module("util.object.adopt");
	
	var adopt=GMOD("adopt");
	
	QUnit.test("adopt",function(assert)
	{
		var target={
			v1:1,
			v2:2,
			v3:3
		};
		
		assert.deepEqual(adopt(target,{v1:-1,v2:0.2}),{v1:-1,v2:0.2,v3:3},"adopt");
		assert.deepEqual(adopt(target,{v3:30,v4:4},true),{v1:-1,v2:0.2,v3:30,v4:4},"extend");
	});

	QUnit.test("setDefault",function(assert)
	{
		var default1={
			v1:1,
			v2:2,
			v3:3
		};
		var default2={
			v1:1,
			v2:2,
			v3:3
		};
		var param1={
			v1:4,
			v3:null,
			v4:40
		};
		var param2={
			v1:4,
			v3:null,
			v4:40
		};

		var result=adopt.setDefaults(default1,param1);

		assert.deepEqual(result,{
			v1:4,
			v2:2,
			v3:null
		},"setDefault");
		assert.deepEqual(default1,default2,"default unaltered");
		assert.deepEqual(param1,param2,"param unaltered");

		result=adopt.setDefaults(default1,param1,true);

		assert.deepEqual(result,{
			v1:4,
			v2:2,
			v3:null,
			v4:40
		},"setDefault extend");
		assert.deepEqual(default1,default2,"default unaltered");
		assert.deepEqual(param1,param2,"param unaltered");
	})
	
})(Morgas,Morgas.setModule,Morgas.getModule,Morgas.hasModule,Morgas.shortcut);