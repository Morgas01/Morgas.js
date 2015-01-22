(function(µ,GMOD){
	module("Detached");
	let DET=GMOD("Detached");
	let _det=DET.detache;
	
	asyncTest("call",function()
	{
		new DET(function()
		{
			ok(true);
			start();
			this.complete();
		});
	});
	asyncTest("call arguments",function()
	{
		new DET(function(arg)
		{
			strictEqual(arg,"callarg");
			start();
			this.complete();
		},["callarg"]);
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
	asyncTest("on complete return",function()
	{
		new DET(function(){return "some other arg"}).complete(function(arg)
		{
			strictEqual(arg,"some other arg");
			start();
			this.complete();
		});
	});
	asyncTest("on complete no args",function()
	{
		new DET().complete(function()
		{
			ok(true);
			start();
			this.complete();
		});
	});
	
	asyncTest("chain",function()
	{
		new DET(function()
		{
			this.complete("this");
		})
		.complete(function(arg)
		{
			return new DET(function(){this.complete(arg+" is")})
			.complete(function(arg)
			{
				this.complete(arg+" chaining");
			})
		})
		.complete(function(arg)
		{
			strictEqual(arg,"this is chaining");
			start();
			this.complete();
		});
	});
	
	asyncTest("on error called",function()
	{
		new DET(function()
		{
			this.error("reason");
		}).error(function(err)
		{
			strictEqual(err,"reason","error called");
			start();
			this.complete();
		});
	});
	asyncTest("on error thrown",function()
	{	
		new DET(function()
		{
			throw("reason");
		}).error(function(err)
		{
			strictEqual(err,"reason","error thrown");
			start();
			this.complete();
		});
	});
	asyncTest("on error propagate",function()
	{
		let d1=new DET(function()
		{
			throw("reason");
		});
		let d2=d1.complete(function()
		{
			this.complete("complete");
		});
		d2.error(function(err)
		{
			strictEqual(err,"reason","error propagated");
			start();
			this.complete();
		});
		d1.propagateError(d2);
	});
	
	asyncTest("detached function",function()
	{
		let scope={};
		let func=_det(function(signal,arg)
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