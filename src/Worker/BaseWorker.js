
const MESSAGE_TYPES={
	MESSAGE:"message",
	REQUEST:"request",
	FEEDBACK:"feedback",
	ERROR:"error"
};
const INIT_REQUEST_ID="init";

let FEEDBACK_COUNTER=0;
let FEEDBACK_MAP=new Map();

let setInitialized;
let initialize=new Promise((resolve)=>setInitialized=resolve);

worker={
	defualts:{
		TIMEOUT:6e4,
	},
	id:null,
	initialize:initialize,
	config:null,
	_init: function (message)
	{
		let config=worker.config = message.config;
		worker.id = config.id;

		if(config.loadMorgas!==false)
		{
				worker._loadMorgas();
		}

		if(config.initScripts&&config.initScripts.length>0)
		{
			worker.methods.loadScripts(config.initScripts);
		}

		setInitialized(config);

		//respond the init request
		worker._send({
			type: MESSAGE_TYPES.REQUEST,
			id: INIT_REQUEST_ID,
			data: config
		});
	},
	/* "abstract" methods
		_send:function(payload){},
		stop:function(){},
		importScripts:function(scripts),
		_loadMorgas:function(){}
	*/
	// incoming (main to worker)
	handleMessage:function(message)
	{
		if(worker.id===null) // not initialized
		{
			if(message.type===MESSAGE_TYPES.REQUEST&&message.id===INIT_REQUEST_ID)
			{
				try
				{
					worker._init(message);
				}
				catch (e)
				{
					worker.error(e);
				}
			}
		}
		else
		{
			if(message.type===MESSAGE_TYPES.FEEDBACK)
			{
				if(!FEEDBACK_MAP.has(message.id))
				{
					worker.error({message:"no such feedback",id:message.id,data:message.data});
				}
				else
				{
					let feedback=FEEDBACK_MAP.get(message.id);
					if(message.error) feedback.reject(message.error);
					else feedback.resolve(message.data);
				}
				return;
			}

			let callPromise;
			if(message.method in worker.methods)
			{
				try
				{
					callPromise=Promise.resolve(worker.methods[message.method](...message.args));
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
			if(message.type===MESSAGE_TYPES.REQUEST)
			{
				callPromise.then(result=>worker._send({
					type:MESSAGE_TYPES.REQUEST,
					id:message.id,
					data:result
				}))
				.catch(error=>
				{
					if(error instanceof Error) error=error.message+"\n"+error.stack;
					worker._send({
						type:MESSAGE_TYPES.REQUEST,
						id:message.id,
						error:error
					});
				});
			}
			else
			{
				callPromise.catch(error => worker.error(error));
			}
		}
	},
	send:function(data)
	{
		worker._send({
			type:MESSAGE_TYPES.MESSAGE,
			data:data
		});
	},
	error:function(error)
	{
		if(error instanceof Error) error=error.message+"\n"+error.stack;
		worker._send({
			type:MESSAGE_TYPES.ERROR,
			error:error
		});
	},
	feedback:function(data,timeout=worker.defualts.TIMEOUT)
	{
		let feedbackMessage={
			type:MESSAGE_TYPES.FEEDBACK,
			id:"F"+FEEDBACK_COUNTER++,
			data:data
		};
		let timer;
		let feedbackPromise=new Promise(function(resolve,reject)
		{
			let signal={resolve:resolve,reject:reject};
			FEEDBACK_MAP.set(feedbackMessage.id,signal);
			timer=setTimeout(function()
			{
				reject("timeout");
			},timeout);
			worker._send(feedbackMessage);
		});
		feedbackPromise.catch(a=>a).then(function()
		{
			FEEDBACK_MAP.delete(feedbackMessage.id);
			clearTimeout(timer);
		});
		return feedbackPromise;
	},
	methods: {
		stop:function()
		{
			worker.stop();
		},
		loadScripts:function(scripts)
		{
			worker.importScripts([].concat(scripts));
		},
		util: function (module, ...args)
		{
			if (µ.hasModule(module))
			{
				return µ.getModule(module)(...args);
			}
			else
			{
				return Promise.reject("module not loaded");
			}
		}
	}
};

//webWorker specifics
if(typeof self!=="undefined")
{
	worker._send=function(payload)
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
	worker._loadMorgas=function()
	{
		//load Morgas.js
		worker.methods.loadScripts(worker.config.morgasPath);
	};
	self.onmessage=function init(event)
	{
		worker.handleMessage(event.data);
	};
}
