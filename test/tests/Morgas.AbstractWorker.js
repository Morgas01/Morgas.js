QUnit.module("AbstractWorker",function()
{
	QUnit.test("dummy",function(assert)
	{
		assert.expect(3);

		let DummyWorker=µ.Class(µ.AbstractWorker,{
			constructor:function()
			{
				this.mega();
				this._onMessage({request:"init",data:"initData"});
			},
			_send:function(payload)
			{
				assert.deepEqual(payload,{request:0,method:"foo",args:[1,2,3]});
				this._onMessage({request:0,data:[4,5,6]});
			},
			_start:function()
			{
				assert.ok(true,"start");
			}
		});

		return new DummyWorker().ready.then(function(initData)
		{
			assert.strictEqual(initData,"initData","init data");
			this.request("foo",[1,2,3])
		});
	});

	/**
	 * @param {Function} generator - function(loadScripts){returns new worker(loadScripts)}
	 */
	WorkerTest=function(name,generator,testWorkerScript)
	{
		QUnit.module(name,function()
        {
        	QUnit.test("init",function(assert)
        	{
        		assert.expect(1);

        	    let worker=generator();
        		return worker.ready.then(function(initData)
        		{
        			this.addEventListener("error",null,function(event)
        			{
        				console.error(event);
        				assert.ok(false,event.reason);
        			});
        			assert.strictEqual(worker.id,initData.id);
        			return this.stop();
        		});
        	});
        	QUnit.test("util test",function(assert)
        	{
        		assert.expect(1);

        		return generator().ready.then(function()
        		{
        			this.addEventListener("error",null,function(event)
        			{
        				console.error(event);
        				assert.ok(false,event.reason);
        			});
        			this.send("loadScripts",["Morgas.util.crc32.js"]);
        			return this.request("util",["util.crc32","123456789"]).then(function(result)
        			{
        				assert.strictEqual(result,0xCBF43926,"util result");
        				return this.stop();
        			},
        			function(error)
        			{
        				µ.logger.error(error);
        				assert.ok(false,error)
        			});
        		});
        	});
        	QUnit.test("feedback",function(assert)
        	{
        		assert.expect(2);

        		return generator().ready.then(function()
        		{
        			this.addEventListener("error",null,function(event)
        			{
        				console.error(event);
        				assert.ok(false,event.reason);
        			});
        			this.onFeedback=function(data)
        			{
        				assert.strictEqual(data,"ask feedback");
        				return "own feedback";
        			};

        			return this.request("feedback",["ask feedback"]).then(function(result)
        			{
        				assert.strictEqual(result,"own feedback");
        				return this.stop();
        			},
        			function(error)
        			{
        				µ.logger.error(error);
        				assert.ok(false,error)
        			});
        		});
        	});
        	QUnit.test("loadScripts",function(assert)
        	{
        		assert.expect(4);

        		return generator(testWorkerScript).ready.then(function(initData)
        		{
                    return this.request("increment",[3]).then(function(four)
					{
						assert.strictEqual(four,4,"increment");
					})
                    .then(()=>
                    {
                    	return this.request("timeout",undefined,200).catch(function(error)
                    	{
                    		assert.strictEqual(error,"timeout","timeout");
                    	});
                    })
                    .then(()=>
                    {
                    	return this.request("error").catch(function(error)
                    	{
                    		assert.strictEqual(error,"test error","error");
                    	});
                    })
                    .then(function()
                    {
                    	return this.request("exception").catch(function(error)
                    	{
                    		assert.strictEqual(error,"test exception","exception");
        					return this.stop();
                    	});
                    });
        		});
        	});
        	QUnit.test("no autoStart",function(assert)
        	{
        		assert.expect(5);
				let worker=generator(undefined,false);
				return worker.ready
				.catch(function()
				{
					assert.ok(true,"not started");
					return worker.restart(undefined,testWorkerScript)
				})
        		.then(function(initData)
        		{
                    return this.request("increment",[3]).then(function(four)
					{
						assert.strictEqual(four,4,"increment");
					})
                    .then(()=>
                    {
                    	return this.request("timeout",undefined,200).catch(function(error)
                    	{
                    		assert.strictEqual(error,"timeout","timeout");
                    	});
                    })
                    .then(()=>
                    {
                    	return this.request("error").catch(function(error)
                    	{
                    		assert.strictEqual(error,"test error","error");
                    	});
                    })
                    .then(function()
                    {
                    	return this.request("exception").catch(function(error)
                    	{
                    		assert.strictEqual(error,"test exception","exception");
        					return this.stop();
                    	});
                    });
        		});
        	});
        });
	};
});