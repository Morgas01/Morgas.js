QUnit.module("Promise",function()
{
	QUnit.test("call",function(assert)
	{
		return new µ.Promise(function(signal)
		{
			assert.ok(true);
			signal.resolve();
		});
	});
	QUnit.test("call arguments",function(assert)
	{
		var scope={};
		return new µ.Promise(function(signal,arg,arg2)
		{
			assert.propEqual([arg,arg2],["callarg","callarg2"],"arguments");
			assert.strictEqual(this,scope,"scope");
			signal.resolve();
		},{args:["callarg","callarg2"],scope:scope});
	});

	QUnit.test("on complete",function(assert)
	{
		return new µ.Promise(function(signal){signal.resolve("some arg");}).then(function(arg)
		{
			assert.strictEqual(arg,"some arg");
		});
	});
	QUnit.test("on complete no args",function(assert)
	{
		return new µ.Promise().then(function()
		{
			assert.ok(true);
		});
	});
	
	QUnit.test("chain",function(assert)
	{
		return new µ.Promise(function(signal)
		{
			signal.resolve("this");
		})
		.then(function(arg)
		{
			var rtn=new µ.Promise(function(signal)
			{
				signal.resolve(arg+" is")
			});
			rtn=rtn.then(function(arg)
			{
				return arg+" chaining";
			});
			return rtn;
		})
		.then(function(arg)
		{
			assert.strictEqual(arg,"this is chaining");
		});
	});
	
	QUnit.test("on error called",function(assert)
	{
		return new µ.Promise(function(signal)
		{
			signal.reject("reason");
		}).catch(function(err)
		{
			assert.strictEqual(err,"reason","error called");
		});
	});
	QUnit.test("on error thrown",function(assert)
	{
		return new µ.Promise(function()
		{
			throw("reason");
		}).catch(function(err)
		{
			assert.strictEqual(err,"reason","error thrown");
		});
	});
	QUnit.test("on error propagate",function(assert)
	{
		var d1=new µ.Promise(function()
		{
			throw("reason");
		});
		var d2=d1.then(function()
		{
			return "complete";
		});
		return d2.catch(function(err)
		{
			assert.strictEqual(err,"reason","error propagated");
		});
	});
	QUnit.test("add abort",function(assert)
	{
		assert.expect(2);
		var d1=new µ.Promise(function(signal)
		{
			let fn=()=>assert.ok(true,"abort callback");
			signal.addAbort(fn);
		});
		d1.abort();
		return d1.catch(function(err)
		{
			assert.strictEqual(err,"abort","abort");
		});
	});
	QUnit.test("remove abort",function(assert)
	{
		assert.expect(1)
		var d1=new µ.Promise(function(signal)
		{
			let fn=()=>assert.ok(false,"abort callback");
			signal.addAbort(fn);
			signal.removeAbort(fn);
		});
		d1.abort();
		return d1.catch(function(err)
		{
			assert.strictEqual(err,"abort","abort");
		});
	});
	QUnit.test("abort promise",function(assert)
	{
		assert.expect(2);

		var d1=new µ.Promise(function(signal)
		{
			signal.addAbort(function()
			{
				return new Promise(function(resolve)
				{
					resolve("abort promise");
				});
			});
		});
		d1.abort().then(function(onAbortResults)
		{
			assert.strictEqual(onAbortResults[0],"abort promise");
		});
		return d1.catch(function(err)
		{
			assert.strictEqual(err,"abort","abort");
		});
	});
	
	QUnit.test("pledged function",function(assert)
	{
		var scope={};
		var func=µ.Promise.pledge(function(signal,arg)
		{
			assert.strictEqual(this,scope);
			signal.resolve(arg);
		},scope);
		return func(3).then(function(arg)
		{
			assert.strictEqual(arg,3);
		});
	});
	
	QUnit.test("wait for native",function(assert)
	{
		return new µ.Promise(function(signal)
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
		return new µ.Promise([function(signal)
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
		.then(function(){
			assert.strictEqual(Array.slice(arguments).join(" "),"Hello Promise World !");
		})
	});
	
	QUnit.test("simple",function(assert)
	{
		return new µ.Promise(function(a,b)
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
		return new µ.Promise(function(signal)
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
		var p=µ.Promise.open(scope);
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

	QUnit.test("bug: catch wraps result in array",function(assert)
	{
		return new µ.Promise(function(signal){signal.resolve("some arg");})
		.catch(function(){throw "called"}) // never called
		.then(function(arg)
		{
			assert.strictEqual(arg,"some arg");
		});
	});
});