(function(µ,SMOD,GMOD,HMOD,SC){

	let AbstractWorker=GMOD("AbstractWorker");

	//SC=SC({});
	
	let WORKER=µ.Worker=µ.Class(AbstractWorker,{
		constructor:function({
			basePath=WORKER.defaults.BASEPATH,
			workerScript=WORKER.defaults.SCRIPT,
			workerBasePath="../", //relative from basePath
			morgasPath="Morgas.js",
			startTimeout
		}={})
		{
			this.basePath=basePath;
			this.morgasPath=morgasPath;
			this.workerBasePath=workerBasePath;
			this.workerScript=workerScript;
			this.mega(startTimeout);
		},
		_start:function()
		{
			this.worker=new Worker(this.basePath+this.workerScript);
			this.worker.onmessage = msg=>this._onMessage(msg.data);
			this.worker.onerror = error=>this._onMessage({error:error});

			this._send({
				id:this.id,
				basePath:this.workerBasePath,
				morgasPath:this.morgasPath
			});
		},
		_send(payload)
		{
			this.worker.postMessage(payload);
		},
		destroy:function()
		{
			this.worker.terminate();
			this.mega();
		}
	});
	WORKER.defaults={
		BASEPATH:"js/",
		SCRIPT:"Worker/Morgas.BaseWorker.js",
	};
	
	SMOD("Worker",WORKER);
	
})(Morgas,Morgas.setModule,Morgas.getModule,Morgas.hasModule,Morgas.shortcut);