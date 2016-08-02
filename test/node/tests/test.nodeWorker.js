var path=require("path");

var Worker=µ.getModule("nodeWorker");

var testWorker=new Worker(path.resolve(__dirname,"..","testWorker"),["testArgument"]);

module.exports=new Promise(function(resolve)
{
	µ.logger.info("--- create");
	testWorker.addListener(".readyState",null,function(result)
	{
		resolve(result);
	});
})
.then(function(e)
{
	µ.logger.info(e.value.state=="running",e.state);
	µ.logger.info("\targuments:");
	µ.logger.info(e.value.data=="testArgument");
})
.then(function()
{
	µ.logger.info("--- request");
	return testWorker.request("increment",3).then(function(four)
	{
		µ.logger.info(four==4);
	});
})
.then(function()
{
	µ.logger.info("--- util");
	return testWorker.request("util",["util.crc32","123456789"]).then(function(result)
	{
		µ.logger.info(result==0xCBF43926);
	});
})
.then(function()
{
	µ.logger.info("--- timeout");
	return testWorker.request("timeout",[],200).catch(function(error)
	{
		µ.logger.info(error=="timeout");
	});
})
.then(function()
{
	µ.logger.info("--- error");
	return testWorker.request("error").catch(function(error)
	{
		µ.logger.info(error=="test error");
	});
})
.then(function()
{
	µ.logger.info("--- exception");
	return testWorker.request("exception").catch(function(error)
	{
		µ.logger.info(error=="test exception");
	});
})
.then(function()
{
	µ.logger.info("--- feedback");
	testWorker.onFeedback=function(type,data)
	{
		switch (type)
		{
			case "simple":
				return data;
			case "promise":
				return new Promise(function(resolve,reject)
				{
					setTimeout(function()
					{
						if(data=="resolve") resolve(data);
						else reject(data);
					},200);
				});
		}
	};
	µ.logger.info("\tsimple");
	return testWorker.request("feedback",["simple",3])
	.then(function(result)
	{
		µ.logger.info(result==3);
		µ.logger.info("\tpromise resolve");
		return testWorker.request("feedback",["promise","resolve"]);
	})
	.then(function(result)
	{
		µ.logger.info(result);
		µ.logger.info(result=="resolve");
		µ.logger.info("\tpromise reject");
		return testWorker.request("feedback",["promise","reject"]);
	})
	.then(function()
	{
		µ.logger.info("false not rejected");
	},
	function(result)
	{
		µ.logger.info(result=="reject");
	});
})
.then(function()
{
	µ.logger.info("--- close");
	return testWorker.close(200).then(function()
	{
		µ.logger.info(true);
	},
	function()
	{
		µ.logger.info(false);
	})
})
.then(µ.constantFunctions.t);
