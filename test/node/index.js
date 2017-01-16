var path=require("path");
var fs=require("fs");

require("../..");

fs.readdir(path.resolve(__dirname,"tests"),function(err,files)
{
	if(err) µ.logger.error(err);
	else
	{
		µ.getModule("iterateAsync")(files,function(index,file)
		{
			µ.logger.info("start "+file);
			try
			{
				return require("./tests/"+file);
			}
			catch(e)
			{
				µ.logger.error(e);
				return Promise.reject(e);
			}
		}).then(function(results)
		{
			//if(typeof results[results.length-1])
			µ.logger.info("end",results,results[results.length-1] instanceof Error);
		});
	}
});
