(function(µ,GMOD){
	module("Promise");
	var PROM=GMOD("Promise");
	var pledge=PROM.pledge;
	
	asyncTest("call",function()
	{
		new PROM(function(signal)
		{
			ok(true);
			start();
			signal.resolve();
		});
	});
	asyncTest("call arguments",function()
	{
		var scope={};
		new PROM(function(signal,arg,arg2)
		{
			propEqual([arg,arg2],["callarg","callarg2"],"arguments");
			strictEqual(this,scope,"scope");
			start();
			signal.resolve();
		},["callarg","callarg2"],scope);
	});

	asyncTest("on complete",function()
	{
		new PROM(function(signal){signal.resolve("some arg");}).complete(function(signal,arg)
		{
			strictEqual(arg,"some arg");
			start();
			signal.resolve();
		});
	});
	asyncTest("on complete return",function()
	{
		new PROM(function(){return "some other arg"}).complete(function(signal,arg)
		{
			strictEqual(arg,"some other arg");
			start();
			signal.resolve();
		});
	});
	asyncTest("on complete no args",function()
	{
		new PROM().complete(function(signal)
		{
			ok(true);
			start();
			signal.resolve();
		});
	});
	
	asyncTest("chain",function()
	{
		new PROM(function(signal)
		{
			signal.resolve("this");
		})
		.complete(function(signal,arg)
		{
			var rtn=new PROM(function(signal)
			{
				signal.resolve(arg+" is")
			});
			rtn=rtn.complete(function(signal,arg)
			{
				signal.resolve(arg+" chaining");
			});
			return rtn;
		})
		.complete(function(signal,arg)
		{
			strictEqual(arg,"this is chaining");
			start();
			signal.resolve();
		});
	});
	
	asyncTest("on error called",function()
	{
		new PROM(function(signal)
		{
			signal.reject("reason");
		}).error(function(signal,err)
		{
			strictEqual(err,"reason","error called");
			start();
			signal.resolve();
		});
	});
	asyncTest("on error thrown",function()
	{	
		new PROM(function()
		{
			throw("reason");
		}).error(function(signal,err)
		{
			strictEqual(err,"reason","error thrown");
			start();
			signal.resolve();
		});
	});
	asyncTest("on error propagate",function()
	{
		var d1=new PROM(function()
		{
			throw("reason");
		});
		var d2=d1.complete(function(signal)
		{
			signal.resolve("complete");
		});
		d2.error(function(signal,err)
		{
			strictEqual(err,"reason","error propagated");
			start();
			signal.resolve();
		});
	});
	asyncTest("on abort",function()
	{	
		var d1=new PROM(function(signal)
		{
			signal.onAbort(start);
		});
		d1.error(function(signal,err)
		{
			strictEqual(err,"abort","abort");
			signal.resolve();
		});
		d1.abort();
	});
	
	asyncTest("pledged function",function()
	{
		var scope={};
		var func=pledge(function(signal,arg)
		{
			strictEqual(this,scope);
			signal.resolve(arg);
		},scope);
		func(3).complete(function(signal,arg)
		{
			strictEqual(arg,3);
			start();
			signal.resolve()
		})
	});
	
	asyncTest("when all",function()
	{
		new PROM([function(signal)
		{
			signal.resolve("Hello")
		},function(signal)
		{
			signal.resolve("Promise")
		},function(signal)
		{
			signal.resolve("World")
		},function(signal)
		{
			signal.resolve("!")
		}])
		.complete(function(signal){
			strictEqual(Array.slice(arguments,1).join(" "),"Hello Promise World !");
			start();
			signal.resolve();
		})
	});
})(Morgas,Morgas.getModule);