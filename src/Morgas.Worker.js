(function(µ){
	/**
	 * Depends on	: Morgas overlay
	 * Uses			: 
	 *
	 * Worker Class
	 * change µ.Worker.prototype.MorgasPath and µ.Worker.prototype.BaseWorkerPath if necessary
	 */
	
	let WORKER;
	WORKER=µ.Worker=µ.Class(µ.Listeners,
	{
		init:function(param)
		{
			let BaseWorkerPath=param.BaseWorkerPath||WORKER.BaseWorkerPath;
			let MorgasPath=param.MorgasPath||WORKER.MorgasPath;
			this.superInit(µ.Listeners);
			this.listeners[".created"].setDisabled(true);
			this.createListener("error scriptsImported");
			
			//this.worker = new ChromeWorker(BaseWorkerPath)
			this.worker=new Worker(BaseWorkerPath);
			let _self=this;
			this.worker.onmessage=µ.Callback(this._onMessage,this,undefined,1);
			this.worker.onerror=µ.Callback(this._onError,this,undefined,1);
			this.post(MorgasPath);
		},
		getRequiredScripts:function()
		{//overwrite with:  return superclass.prototype.getRequiredScripts.call(this).concat(...your scripts...);
			return [];
		},
		scriptsImported:function()
		{
			this.listeners[".created"].setDisabled(false);
			this.setState(".created");
			//do stuff
		},
		_onMessage:function _onMessage(event)
		{
			if(this[event.data.func]==null)
			{
				this.fire("error",new Error("no such main function "+event.data.func));
			}
			else
			{
				this[event.data.func].apply(this,event.data.param);
			}
		},
		_onError:function _onError(event)
		{
			this.fire("error",event);
		},
		post:function(/*function name,args...*/)
		{
			this.worker.postMessage({func:Array.prototype.shift.call(arguments),param:Array.prototype.slice.call(arguments,0)});
		},
		sendRequiredScripts:function()
		{
			this.post("importScripts",this.getRequiredScripts());
		},
		importScripts:function(ulrs)
		{
			this._post("importScripts",urls);
		}
	});
	WORKER.BaseWorkerPath="chrome://morgas/content/Morgas.Worker.BaseWorker.js";
	WORKER.MorgasPath="chrome://morgas/content/Morgas-0.2.js";
})(Morgas);