(function(µ,SMOD,GMOD,HMOD,SC){

	QUnit.module("Promise");

	var PROM=GMOD("Promise");
	var pledge=PROM.pledge;
	
	QUnit.test("call",function(assert)
	{
		return new PROM(function(signal)
		{
			assert.ok(true);
			signal.resolve();
		});
	});
	QUnit.test("call arguments",function(assert)
	{
		var scope={};
		return new PROM(function(signal,arg,arg2)
		{
			assert.propEqual([arg,arg2],["callarg","callarg2"],"arguments");
			assert.strictEqual(this,scope,"scope");
			signal.resolve();
		},{args:["callarg","callarg2"],scope:scope});
	});

	QUnit.test("on complete",function(assert)
	{
		return new PROM(function(signal){signal.resolve("some arg");}).complete(function(arg)
		{
			assert.strictEqual(arg,"some arg");
		});
	});
	QUnit.test("on complete no args",function(assert)
	{
		return new PROM().complete(function()
		{
			assert.ok(true);
		});
	});
	
	QUnit.test("chain",function(assert)
	{
		return new PROM(function(signal)
		{
			signal.resolve("this");
		})
		.complete(function(arg)
		{
			var rtn=new PROM(function(signal)
			{
				signal.resolve(arg+" is")
			});
			rtn=rtn.complete(function(arg)
			{
				return arg+" chaining";
			});
			return rtn;
		})
		.complete(function(arg)
		{
			assert.strictEqual(arg,"this is chaining");
		});
	});
	
	QUnit.test("on error called",function(assert)
	{
		return new PROM(function(signal)
		{
			signal.reject("reason");
		}).error(function(err)
		{
			assert.strictEqual(err,"reason","error called");
		});
	});
	QUnit.test("on error thrown",function(assert)
	{	
		return new PROM(function()
		{
			throw("reason");
		}).error(function(err)
		{
			assert.strictEqual(err,"reason","error thrown");
		});
	});
	QUnit.test("on error propagate",function(assert)
	{
		var d1=new PROM(function()
		{
			throw("reason");
		});
		var d2=d1.complete(function()
		{
			return "complete";
		});
		return d2.error(function(err)
		{
			assert.strictEqual(err,"reason","error propagated");
		});
	});
	QUnit.test("on abort",function(assert)
	{	
		var d1=new PROM(function(signal)
		{
			signal.onAbort(start);
		});
		d1.abort();
		return d1.error(function(err)
		{
			assert.strictEqual(err.reason,"abort","abort");
		});
	});
	QUnit.test("on abort time",function(assert)
	{	
		var d1=new PROM(function(signal)
		{
			signal.onAbort(function()
			{
				return new Promise(function(resolve)
				{
					setTimeout(resolve,501);
				});
			});
		});
		d1.abort();
		return d1.error(function(err)
		{
			assert.strictEqual(err.reason,"abort","abort");
			var abortStart=Date.now();
			err.promise.then(function()
			{
				assert.ok(abortStart+500<Date.now(),"time "+(Date.now()-abortStart)+"ms>500ms");
			});
		});
	});
	
	QUnit.test("pledged function",function(assert)
	{
		var scope={};
		var func=pledge(function(signal,arg)
		{
			assert.strictEqual(this,scope);
			signal.resolve(arg);
		},scope);
		return func(3).complete(function(arg)
		{
			assert.strictEqual(arg,3);
		});
	});
	
	QUnit.test("wait for native",function(assert)
	{
		return new PROM(function(signal)
		{
			signal.resolve(new Promise(function(resolve,reject)
			{
				resolve("args");
			}));
		}).then(function(fromNative)
		{
			assert.strictEqual(fromNative,"args");
		});
	});
	
	QUnit.test("when all",function(assert)
	{
		return new PROM([function(signal)
			{
				signal.resolve("Hello")
			},function(signal)
			{
				signal.resolve("Promise")
			},
			new Promise(function(resolve,reject)
			{//native
				resolve("World");
			}),
			"!"
		])
		.complete(function(){
			assert.strictEqual(Array.slice(arguments).join(" "),"Hello Promise World !");
		})
	});
	
	QUnit.test("simple",function(assert)
	{
		return new PROM(function(a,b)
		{
			return a*b;
		},{args:[6,7],simple:true}).then(function(result)
		{
			assert.strictEqual(result,42,"simple function");
		},µ.logger.error);
	});
	
	QUnit.test("scope",function(assert)
	{
		var scope={};
		return new PROM(function(signal)
		{
			assert.strictEqual(this,scope,"scope first");
			signal.resolve();
		},{scope:scope}).then(function()
		{
			assert.strictEqual(this,scope,"scope second");
		}).then(function()
		{
			assert.strictEqual(this,scope,"scope third");
		},µ.logger.error);
	});
	
	QUnit.test("open",function(assert)
	{
		var scope={};
		var p=PROM.open(scope);
		var rtn=p.then(function(arg)
		{
			assert.strictEqual(this,scope,"scope first");
			assert.strictEqual(arg,1,"arg first");
			return ++arg;
		}).then(function(arg)
		{
			assert.strictEqual(this,scope,"scope second");
			assert.strictEqual(arg,2,"arg second");
			return ++arg;
		}).then(function(arg)
		{
			assert.strictEqual(this,scope,"scope third");
			assert.strictEqual(arg,3,"arg third");
		},µ.logger.error);
		p.resolve(1);
		return rtn;
	});
})(Morgas,Morgas.setModule,Morgas.getModule,Morgas.hasModule,Morgas.shortcut);