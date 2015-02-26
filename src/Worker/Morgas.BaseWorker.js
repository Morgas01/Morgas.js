self.onmessage=function init(initEvent)
{
	var [initRequest,config]=initEvent.data.args;
	//load Morgas.js
	importScripts(config.basePath+config.morgasPath);
	
	if(config.debug&&config.debug.send)
	{
		µ.debug.out=function(msg,verbose)
		{
			self.send("debug",{msg:msg,verbose:verbose});
		}
	}
	µ.debug.verbose=config.debug&&config.debug.verbose||µ.debug.verbose;
	
	self.onmessage=function(event)
	{
		if(event.data.method&&event.data.method in self)
		{
			console.log(event.data);
			var rtn=self[event.data.method].apply(self,event.data.args);
			
			if(rtn!==undefined&&event.data.isRequest) self.respond(event.data.args[0],true,rtn);
		}
		else
		{
			µ.debug(event.type+" is not defined in worker "+config.workerID,µ.debug.LEVEL.WARNING);
		}
	};
	/**
	 * send Event to main thread
	 * @param {string} type
	 * @param {any} data
	 */
	self.send=function(type,data)
	{
		self.postMessage({type:type,data:data});
	};
	/** 
	 * respond a request
	 * @param {number} requestID
	 * @param {boolean} success
	 * @param {any} data
	 */
	self.respond=function(requestID,success,data)
	{
		self.postMessage({
			request:requestID,
			type:success?"complete":"error",
			data:data
		});
	};
	
	//-------- METHODS --------//
	
	self.loadScripts=function(_request)
	{
		var i=0;
		if(typeof _request==="number")
		{
			i=1;
		}
		console.log(i);
		console.log(Array.slice(arguments,i));
		console.log(Array.slice(arguments,i).map(s=>config.basePath+s));
		self.importScripts.apply(self,Array.slice(arguments,i).map(s=>config.basePath+s));
		
		if(i===1) self.respond(_request,true);
	};
	/**
	 * execute utils
	 * @param {number} request
	 * @param {string} module
	 * @param {any} ...args
	 */
	self.util=function(request,module,...args)
	{
		if(µ.hasModule(module))
		{
			self.respond(request,true,µ.getModule(module)(...args));
		}
		else
		{
			self.respond(request,false,"module not loaded");
		}
	};
	
	//respond the init request
	self.respond(initRequest,true);
};