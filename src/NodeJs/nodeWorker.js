(function(µ,SMOD,GMOD,HMOD,SC){

	µ.NodeJs=µ.NodeJs||{};

	let fork=require("child_process").fork;
	let AbstractWorker=GMOD("AbstractWorker");

	//SC=SC({});

	let path=require("path");

	let NODEWORKER=µ.NodeJs.Worker=µ.Class(AbstractWorker,{
		constructor:function(param={})
		{
			({
				script:this.script=NODEWORKER.defaults.SCRIPT,
				cwd:this.cwd=path.dirname(this.script),
			}=param);

			this.mega(param);
		},
		_start:function()
		{
			this.worker=fork(this.script,{cwd:this.cwd});
			this.worker.on("error",e=>this._onMessage({error:e}));
			this.worker.on("exit",(code,signal)=>
			{
				this.state=AbstractWorker.states.CLOSE;
			});
			this.worker.on("message",msg=>this._onMessage(msg));
		},
		_send:function(payload)
		{
			this.worker.send(payload);
		},
		destroy:function()
		{
			this.worker.kill("SIGKILL");
			this.worker.removeAllListeners("error");
			this.worker.removeAllListeners("exit");
			this.worker.removeAllListeners("message");
			this.worker.unref();
			this.state=AbstractWorker.states.CLOSE;
			this.mega();
		}
	});
	NODEWORKER.defaults={
		SCRIPT:path.join(__dirname,"Worker","BaseWorker")
	};

	SMOD("nodeWorker",NODEWORKER);

})(Morgas,Morgas.setModule,Morgas.getModule,Morgas.hasModule,Morgas.shortcut);
