self.worker={};
self.onmessage=function init(initEvent)
{
	let config=initEvent.data;
	//load Morgas.js
	importScripts(config.basePath+config.morgasPath);

	let FEEDBACK_COUNTER=0;
	let FEEDBACK_MAP=new Map();

	self.onmessage=function(event)
	{
		if("feedback" in event.data)
		{
			if(!FEEDBACK_MAP.has(event.data.feedback))
			{
				worker.error({message:"no such feedback",feedback:event.data.feedback,data:event.data.data});
			}
			else
			{
				if(event.data.error) FEEDBACK_MAP.get(event.data.feedback).reject(event.data.error);
				else FEEDBACK_MAP.get(event.data.feedback).resolve(event.data.data);
			}
			return;
		}
		let callPromise;
		if(event.data.method in worker)
		{
			try
			{
				callPromise=Promise.resolve(worker[event.data.method](...event.data.args));
			}
			catch(e)
			{
				callPromise=Promise.reject(e);
			}
		}
		else
		{
			callPromise=Promise.reject(event.data.method+" is not defined in worker "+config.id);
		}
		if("request" in event.data)
		{
			callPromise.then(result=>self.postMessage({request:event.data.request,data:result}))
			.catch(error=>
			{
				if(error instanceof Error) error=error.message+"\n"+error.stack;
				self.postMessage({request:event.data.request,error:error})
			});
		}
		else callPromise.catch(error=>worker.error(error));
	};
	worker.id=config.id;
	worker.message=function(data)
	{
		self.postMessage({data:data});
	};
	worker.error=function(error)
	{
		if(error instanceof Error) error=error.message+"\n"+error.stack;
		self.postMessage({error:error});
	};
	worker.feedback=function(data,timeout=60000)
	{
		let payload={
			feedback:FEEDBACK_COUNTER++,
			data:data
		};
		let timer;
		let feedbackPromise=new Promise(function(resolve,reject)
		{
			let signal={resolve:resolve,reject:reject};
			FEEDBACK_MAP.set(payload.feedback,signal);
			timer=setTimeout(function()
			{
				reject("timeout");
			},timeout);
			self.postMessage(payload);
		});
		feedbackPromise.catch(a=>a).then(function()
		{
			FEEDBACK_MAP.delete(payload.feedback);
			clearTimeout(timer);
		});
		return feedbackPromise;
	};
	worker.loadScript=function(script,path=config.basePath)
	{
		self.importScripts(path+script);
	};
	worker.util=function(module,...args)
	{
		if(µ.hasModule(module))
		{
			return µ.getModule(module)(...args);
		}
		else
		{
			return Promise.reject("module not loaded");
		}
	};
	worker.stop=function()
	{
		self.close();
	}

	//respond the init request
	self.postMessage({request:"init"});
};
