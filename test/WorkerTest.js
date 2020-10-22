(function(){
	/**
	 * @param {Function} generator - function(initScripts){returns new worker({initScripts})}
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
					worker.addEventListener("error",null,function(event)
					{
						console.error(event);
						assert.ok(false,event.reason);
					});
					assert.strictEqual(worker.id,initData.id);
					return worker.stop();
				});
			});

			QUnit.test("loadScripts",function(assert)
			{
				assert.expect(4);

				let worker = generator([testWorkerScript]);
				return worker.ready.then(function(initData)
				{
					return worker.request("increment",[3]).then(function(four)
					{
						assert.strictEqual(four,4,"increment");
					})
					.then(()=>
					{
						return worker.request("timeout",undefined,200).catch(function(error)
						{
							assert.strictEqual(error,"timeout","timeout");
						});
					})
					.then(()=>
					{
						return worker.request("error").catch(function(error)
						{
							assert.strictEqual(error,"test error","error");
						});
					})
					.then(function()
					{
						return worker.request("exception").catch(function(error)
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
				let worker=generator([testWorkerScript],false);
				return worker.ready.catch(function()
				{
					assert.ok(true,"not started");
					return worker.restart()
				})
				.then(function(initData)
				{
					return worker.request("increment",[3]).then(function(four)
					{
						assert.strictEqual(four,4,"increment");
					})
					.then(()=>
					{
						return worker.request("timeout",undefined,200).catch(function(error)
						{
							assert.strictEqual(error,"timeout","timeout");
						});
					})
					.then(()=>
					{
						return worker.request("error").catch(function(error)
						{
							assert.strictEqual(error,"test error","error");
						});
					})
					.then(function()
					{
						return worker.request("exception").catch(function(error)
						{
							assert.strictEqual(error,"test exception","exception");
							return worker.stop();
						});
					});
				});
			});

			QUnit.test("feedback",function(assert)
			{
				assert.expect(2);

				let worker = generator([testWorkerScript]);
				return worker.ready.then(function()
				{
					worker.addEventListener("error",null,function(event)
					{
						console.error(event);
						assert.ok(false,event.reason);
					});
					worker.onFeedback=function(data)
					{
						assert.strictEqual(data,"ask feedback");
						return "own feedback";
					};

					return worker.request("feedback",["ask feedback"])
					.then(function(result)
					{
						assert.strictEqual(result,"own feedback");
						return worker.stop();
					},
					function(error)
					{
						µ.logger.error(error);
						assert.ok(false,error)
					});
				});
			});

			QUnit.test("util test",function(assert)
			{
				assert.expect(1);

				let worker = generator();
				return worker.ready.then(function()
				{
					worker.addEventListener("error",null,function(event)
					{
						console.error(event);
						assert.ok(false,event.reason);
					});
					worker.send("loadScripts",["util/crc32.js"]);
					return worker.request("util",["util.crc32","123456789"])
					.then(function(result)
					{
						assert.strictEqual(result,0xCBF43926,"util result");
						return worker.stop();
					},
					function(error)
					{
						µ.logger.error(error);
						assert.ok(false,error)
					});
				});
			});
		});
	};
})();
