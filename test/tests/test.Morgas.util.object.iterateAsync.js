(function(µ,SMOD,GMOD,HMOD,SC){

	QUnit.module("util.object.iterateAsync");
	
	var itAS=GMOD("iterateAsync");
	
	QUnit.test("iterateAsync",function(assert)
	{
		assert.ok(true,"start: "+new Date());
		return itAS({length:1E6},function(value,index)
		{
			//doSomething
		}).complete(function()
		{
			assert.ok(true,"finish: "+new Date());
		});
	});
	
	QUnit.test("iterateAsync",function(assert)
	{
		assert.ok(true,"start: "+new Date());
		return itAS([0,1,2,3,4,5000,6,7,8,9],function(index,value)
		{
			if(index==value) return value;
			else return Promise.reject(value)
		}).then(function(result)
		{
			assert.ok(false,"iteration did not stop");
		},function(result)
		{
			assert.ok(result[result.length-1]==5000,"finish: "+new Date());
		});
	});
	
})(Morgas,Morgas.setModule,Morgas.getModule,Morgas.hasModule,Morgas.shortcut);