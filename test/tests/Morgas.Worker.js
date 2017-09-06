QUnit.module("Worker",function()
{

	QUnit.test("init",function(assert)
	{
		assert.expect(1);

	    let worker=new µ.Worker({basePath:"../src/",startTimeout:5000});
		return worker.ready.then(function()
		{
			assert.ok(true);
			this.destroy();
		});
	});
	QUnit.test("util test",function(assert)
	{
		assert.expect(1);

		return new µ.Worker({basePath:"../src/"}).ready.then(function()
		{
			this.send("loadScript",["Morgas.util.crc32.js"]);
			return this.request("util",["util.crc32","123456789"]).then(function(result)
			{
				assert.strictEqual(result,0xCBF43926,"util result");
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

		return new µ.Worker({basePath:"../src/"}).ready.then(function()
		{
			this.onFeedback=function(data)
			{
				assert.strictEqual(data,"ask feedback");
				return "own feedback";
			};

			return this.request("feedback",["ask feedback"]).then(function(result)
			{
				assert.strictEqual(result,"own feedback");
			},
			function(error)
			{
				µ.logger.error(error);
				assert.ok(false,error)
			});
		});
	});
	
});