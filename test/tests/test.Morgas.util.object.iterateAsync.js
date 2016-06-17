(function(µ,SMOD,GMOD,HMOD,SC){

	module("util.object.iterateAsync");
	
	var itAS=GMOD("iterateAsync");
	
	asyncTest("iterateAsync",function()
	{
		ok(true,"start: "+new Date());
		itAS({length:1E6},function(value,index)
		{
			//doSomething
		}).complete(function()
		{
			ok(true,"finish: "+new Date());
			start();
		});
	});
	
	asyncTest("iterateAsync",function()
	{
		ok(true,"start: "+new Date());
		itAS([0,1,2,3,4,5000,6,7,8,9],function(index,value)
		{
			if(index==value) return value;
			else return Promise.reject(value)
		}).then(function(result)
		{
			ok(false,"iteration did not stop");
			start();
		},function(result)
		{
			ok(result[result.length-1]==5000,"finish: "+new Date());
			start();
		});
	});
	
})(Morgas,Morgas.setModule,Morgas.getModule,Morgas.hasModule,Morgas.shortcut);