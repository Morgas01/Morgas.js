require("../Morgas.NodeJs");


var initParam=JSON.parse(process.argv[2]);

worker={
	args:initParam.args,
	init:µ.constantFunctions.t,
	send:function(data)
	{
		process.send({data:data});
	},
	util:function(module)
	{
		var args=Array.prototype.slice.call(arguments,1);
		if(µ.hasModule(module))
		{
			return µ.getModule(module).apply(null,args);
		}
		return Promise.reject(`uknown module ${module}`);
	},
	loadScript:function(script)
	{
		require(script);
		return true;
	}
};

var handleMessage=function(message,handle)
{
	if(message.method in worker)
	{
		if("request" in message)
		{
			Promise.resolve(worker[message.method].apply(worker,message.args))
			.then(result=>process.send({request:message.request,data:result}),
			error=>process.send({request:message.request,error:result}));
		}
		else
		{
			worker[message.method].apply(worker,message.args)
		}
	}
	else
	{
		µ.logger.warn(`method ${message.method} is unknown in worker`);
	}
};

process.on("message",handleMessage);

if(initParam.script) reqire(initParam.script);

handleMessage({method:"init",request:"init",args:worker.args});