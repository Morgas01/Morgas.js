
let FEEDBACK_COUNTER=0;
let FEEDBACK_MAP=new Map();

let setInitialized;
let initialize=new Promise(function(resolve){setInitialized=resolve});

worker={
	//out (worker -> main)
/*	webWorker defaults defined later
	importScripts:function(scripts),
	send:function(payload){},
	stop:function(){},
*/
	// in (main to worker)
	handleMessage:function(message)
	{
		if(worker.id===null) // not initialized
		{
			if(message.id==null) throw new Error("worker id is not defined");

			worker.config=message;
			worker.id=message.id;

			setInitialized(message);

			//respond the init request
			worker.send({request:"init",data:message});
		}
		else
		{
			if("feedback" in message)
			{
				if(!FEEDBACK_MAP.has(message.feedback))
				{
					worker.error({message:"no such feedback",feedback:message.feedback,data:message.data});
				}
				else
				{
					if(message.error) FEEDBACK_MAP.get(message.feedback).reject(message.error);
					else FEEDBACK_MAP.get(message.feedback).resolve(message.data);
				}
				return;
			}

			let callPromise;
			if(message.method in worker)
			{
				try
				{
					callPromise=Promise.resolve(worker[message.method](...message.args));
				}
				catch(e)
				{
					callPromise=Promise.reject(e);
				}
			}
			else
			{
				callPromise=Promise.reject(`method ${message.method} is not defined in worker ${worker.id}`);
			}
			if("request" in message)
			{
				callPromise.then(result=>worker.send({request:message.request,data:result}))
				.catch(error=>
				{
					if(error instanceof Error) error=error.message+"\n"+error.stack;
					worker.send({request:message.request,error:error})
				});
			}
			else callPromise.catch(error=>worker.error(error));
		}
	},

	//api
	id:null,
	initialize:initialize,
	config:null,
	loadScripts:function(scripts)
	{
		worker.importScripts([].concat(scripts));
	},
	message:function(data)
	{
		worker.send({data:data});
	},
	error:function(error)
	{
		if(error instanceof Error) error=error.message+"\n"+error.stack;
		worker.send({error:error});
	},
	feedback:function(data,timeout=60000)
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
			worker.send(payload);
		});
		feedbackPromise.catch(a=>a).then(function()
		{
			FEEDBACK_MAP.delete(payload.feedback);
			clearTimeout(timer);
		});
		return feedbackPromise;
	},
	util:function(module,...args)
	{
		if(µ.hasModule(module))
		{
			return µ.getModule(module)(...args);
		}
		else
		{
			return Promise.reject("module not loaded");
		}
	}
};

//webWorker specifics
if(typeof self!=="undefined")
{
	worker.send=function(payload)
	{
		self.postMessage(payload);
	};
	worker.stop=function()
	{
		self.close();
	};
	worker.importScripts=function(scripts)
	{
		self.importScripts(scripts.map(s=>worker.config.basePath+s));
	};
	worker.initialize.then(function()
	{
		//load Morgas.js
		worker.loadScripts(worker.config.morgasPath);
	})
	.catch(worker.error);
	self.onmessage=function init(event)
	{
		worker.handleMessage(event.data);
	};
}
