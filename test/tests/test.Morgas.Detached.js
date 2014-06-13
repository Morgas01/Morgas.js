(function(µ,GMOD){
	module("Detached");
	var DET=GMOD("Detached");
	var _det=DET.detache;
	
	asyncTest("call",function()
	{
		new DET(function()
		{
			ok(true);
			start();
			this.complete();
		});
	});
	
	asyncTest("on complete",function()
	{
		new DET(function(){this.complete("some arg");}).complete(function(arg)
		{
			strictEqual(arg,"some arg");
			start();
			this.complete();
		});
	});
	
	asyncTest("on error called",function()
	{
		new DET(function()
		{
			this.error();
		}).error(function()
		{
			ok(true);
			start();
			this.complete();
		});
	});
	asyncTest("on error thrown",function()
	{	
		new DET(function()
		{
			throw("test");
		}).error(function()
		{
			ok(true,"error thrown");
			start();
			this.complete();
		});
	});
	
	asyncTest("detached function",function()
	{
		var scope={};
		var func=_det(function(signal,arg)
		{
			strictEqual(this,scope);
			signal.complete(arg);
		},scope);
		func(3).complete(function(arg)
		{
			strictEqual(arg,3);
			start();
			this.complete()
		})
	});
	
	asyncTest("when all",function()
	{
		new DET([function()
		{
			this.complete("Hello")
		},function()
		{
			this.complete("Detached")
		},function()
		{
			this.complete("World")
		},function()
		{
			this.complete("!")
		}])
		.complete(function(){
			strictEqual("Hello Detached World !",Array.prototype.join.call(arguments," "));
			start();
			this.complete();
		})
	});
})(Morgas,Morgas.getModule);