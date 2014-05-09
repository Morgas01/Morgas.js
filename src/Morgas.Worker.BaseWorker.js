(function(){
	/**
	 * Depends on	: - imports -
	 * Uses			: 
	 *
	 * Info:	Worker base Class
	 *			It is used to setup a worker
	 *			first event data has to be the path to the Morgas libary
	 */
	
	onmessage=function init(event)
	{
		importScripts(event.data.func);
		
		worker=this.worker=new µ.Listeners(null);
		worker.onmessage=function(event)
		{		
			if(this[event.data.func]==null)
			{
				throw new Error("no such worker function "+event.data.func);
			}
			else
			{
				this[event.data.func].apply(this,event.data.param);
			}
		};
		worker.post=function()
		{
			postMessage({func:Array.prototype.shift.call(arguments),param:Array.prototype.slice.call(arguments,0)});
		};
		worker.importScripts=function(urls)
		{
			for(var i=0;i<urls.length;i++)
			{
				importScripts(urls[i]);
			}
			this.post("scriptsImported");
		};
		
		onmessage=function(event){worker.onmessage(event)};
		worker.post("sendRequiredScripts");
	}
})();