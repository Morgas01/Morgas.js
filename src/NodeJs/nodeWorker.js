(function(µ,SMOD,GMOD,HMOD,SC){

	µ.NodeJs=µ.NodeJs||{};

	var fork=require("child_process").fork;
	var AbstractWorker=GMOD("AbstractWorker");

	SC=SC({
		Promise:"Promise"
	});

	var path=require("path");

	var NODEWORKER=µ.NodeJs.Worker=µ.Class(AbstractWorker,{
		constructor:function(param={})
		{
			({
				script:this.script=NODEWORKER.defaults.SCRIPT,
				cwd:this.cwd=path.dirname(this.script),
				param:this.param
			}=param);

			SC.Promise.pledgeAll(this,["stop"]);

			this.mega(param);
		},
		_start:function()
		{
			this.worker=fork(this.script,{cwd:this.cwd});
			this.worker.on("error",e=>
			{
				this._onMessage({error:e});
			});
			this.worker.on("exit",(code,signal)=>
			{
				this.state=AbstractWorker.states.CLOSE;
			});
			this.worker.on("message",msg=>this._onMessage(msg));

			this._send({
				id:this.id,
				param:this.param
			});
		},
		_send:function(payload)
		{
			this.worker.send(payload);
		},
		stop:function(signal,timeout=AbstractWorker.defaults.TIMEOUT)
		{
			this.send("stop");
			let timer;
			let onClose=(event)=>
			{
				if(event.state===AbstractWorker.states.CLOSE)
				{
					clearTimeout(timer);
					this.removeEventListener(null,onClose);
					signal.resolve();
				}
			};
			timer=setTimeout(()=>
			{
				this.removeEventListener(null,onClose);
				signal.reject("timeout");
			},timeout);
			this.addEventListener("workerState",null,onClose);
		},
		destroy:function()
		{
			this.worker.kill("SIGKILL");
			this.state=AbstractWorker.states.CLOSE;
			this.mega();
		}
	});
	NODEWORKER.defaults={
		SCRIPT:path.join(__dirname,"Worker","BaseWorker")
	};

	SMOD("nodeWorker",NODEWORKER);

})(Morgas,Morgas.setModule,Morgas.getModule,Morgas.hasModule,Morgas.shortcut);
