(function(µ,SMOD,GMOD,HMOD,SC){

	let AbstractWorker=GMOD("AbstractWorker");

	//SC=SC({});
	
	let WORKER=µ.Worker=µ.Class(AbstractWorker,{
		constructor:function(param={})
		{
			({
				basePath:this.basePath=WORKER.defaults.BASE_PATH,
				workerScript:this.workerScript=WORKER.defaults.SCRIPT,
				workerBasePath:this.workerBasePath=WORKER.defaults.WORKER_BASE_PATH, //relative from path of loaded script
				morgasPath:this.morgasPath=WORKER.defaults.MORGAS_PATH, // relative from workerBasePath
			}=param);

			this.mega(param);
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
		stop:function()
		{
			this.mega();
			this.state=AbstractWorker.states.CLOSE;
		},
		destroy:function()
		{
			this.worker.terminate();
			this.state=AbstractWorker.states.CLOSE;
			this.mega();
		}
	});
	WORKER.defaults={
		BASE_PATH:"js/",
		SCRIPT:"Worker/BaseWorker.js",
		WORKER_BASE_PATH:"../", //relative from path of loaded script
		MORGAS_PATH:"Morgas.js", // relative from WORKER_BASE_PATH
	};
	
	SMOD("Worker",WORKER);
	
})(Morgas,Morgas.setModule,Morgas.getModule,Morgas.hasModule,Morgas.shortcut);