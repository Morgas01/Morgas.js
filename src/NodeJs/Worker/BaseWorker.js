var path=require("path");
require("../Morgas.NodeJs");

var SC=µ.shortcut({
	Promise:"Promise",
	es:"errorSerializer"
});


var initParam=JSON.parse(process.argv[2]);
var nextFeedbackId=0;

worker={
	args:initParam.args,
	init:µ.constantFunctions.t,
	feedbackTimeout:60000,
	feedbacks:new Map(),
	setFeedbackTimeout:function(time)
	{
		worker.feedbackTimeout=time;
	},
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
		require(path.resolve(process.cwd(),script));
		return true;
	}
};
worker.feedback=SC.Promise.pledge(function(signal,type, data,timeout)
{
	var timeoutEvent={
		feedback:nextFeedbackId++,
		error:"timeout",
		timeout:null,
		signal:signal
	};
	timeoutEvent.timeout=setTimeout(()=>handleMessage(timeoutEvent),timeout||worker.feedbackTimeout);
	worker.feedbacks.set(timeoutEvent.feedback,timeoutEvent);
	process.send({
		feedback:timeoutEvent.feedback,
		type:type,
		data:data
	});
},worker);

var handleMessage=function(message,handle)
{
	if(message.feedback!=null)
	{
		var timeoutEvent=worker.feedbacks.get(message.feedback);
		if(timeoutEvent)
		{
			if(message.error) timeoutEvent.signal.reject(message.error);
			else timeoutEvent.signal.resolve(message.data);
			worker.feedbacks.delete(message.feedback);
			clearTimeout(timeoutEvent.timeout);
		}
		else
		{
			µ.logger.warning(new µ.Warning("tried to respond to unknown feedback",message));
		}
	}
	else if(message.method in worker)
	{
		if("request" in message)
		{
			var p;
			try {
				p=Promise.resolve(worker[message.method].apply(worker,message.args));
			} catch (e) {
				p=Promise.reject(e);
			}
			return p.then(result=>process.send({request:message.request,data:result}),
			error=>process.send({request:message.request,error:SC.es(error)}))
			.catch(µ.logger.error);
		}
		else
		{
			return worker[message.method].apply(worker,message.args)
		}
	}
	else
	{
		var text=`method ${message.method} is unknown in worker`;
		µ.logger.warn(text);
		process.send({request:message.request,error:text});
		return false;
	}
};

process.on("message",handleMessage);

if(initParam.script) require(path.resolve(process.cwd(),initParam.script));

handleMessage({method:"init",request:"init",args:worker.args});
