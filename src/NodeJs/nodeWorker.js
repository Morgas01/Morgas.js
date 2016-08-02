(function(µ,SMOD,GMOD,HMOD,SC){

	µ.NodeJs=µ.NodeJs||{};

	var fork=require("child_process").fork;

	var Listeners=GMOD("Listeners");
	SC=SC({
		rs:"rescope",
		prom:"Promise"
	});

	var path=require("path");

	var NODEWORKER=µ.NodeJs.Worker=µ.Class(Listeners,{
		init:function(script,args,cwd)
		{
			this.mega();
			this.createListener(".readyState message");
			SC.prom.pledgeAll(this,["request","close"]);
			SC.rs.all(this,["_onMessage"]);

			this.nextRequestId=0;
			this.requests=new Map();

			this.worker=fork(path.join(__dirname,"Worker","baseWorker"),
			[JSON.stringify({
				script:script,
				args:[].concat(args)
			})],{cwd:cwd});
			this.worker.on("error",e=>
			{
				this.setState(".readyState",{state:"error",error:e});
			});
			this.worker.on("close",(code,signal)=>
			{
				this.setState(".readyState",{state:"close",code:code,signal:signal});
			});
			this.worker.on("message",this._onMessage);
		},
		onFeedback:null,
		_onMessage:function(message)
		{
			if(message.request=="init")
			{
				if(message.error) this.setState(".readyState",{state:"error",error:message.error});
				else this.setState(".readyState",{state:"running",data:message.data});
			}
			else if (message.feedback!=null)
			{
				var result;
				if(!this.onFeedback)
				{
					result=Promise.reject("no feedback");
					µ.logger.warn("no feedback");
				}
				else
				{
					try {
						result=Promise.resolve(this.onFeedback(message.type,message.data));
					} catch (e) {
						µ.logger.error(e);
						result=Promise.reject(e);
					}
				}
				result.then(
					data=>this.worker.send({feedback:message.feedback,data:data}),
					error=>this.worker.send({feedback:message.feedback,error:error})
				);
			}
			else if (message.request==null)
			{
				this.fire("message",message.data);
			}
			else
			{
				var timeoutEvent=this.requests.get(message.request);
				if(timeoutEvent)
				{
					if(message.error) timeoutEvent.signal.reject(message.error);
					else timeoutEvent.signal.resolve(message.data);
					this.requests.delete(message.request);
					clearTimeout(timeoutEvent.timeout);
				}
				else
				{
					µ.logger.warn(new µ.Warning("tried to respond to unknown request",message));
				}
			}
		},
		send:function(method,args)
		{
			this.worker.send({method:method,args:[].concat(args)});
		},
		request:function(signal,method,args,timeout)
		{
			var timeoutEvent={
				request:this.nextRequestId++,
				timeout:null,
				error:"timeout",
				signal:signal
			};
			timeoutEvent.timeout=setTimeout(()=>this._onMessage(timeoutEvent),timeout||NODEWORKER.REQUESTTIMEOUT);
			this.requests.set(timeoutEvent.request,timeoutEvent);
			this.worker.send({method:method,request:timeoutEvent.request,args:[].concat(args)});
		},
		close:function(signal,timeout)
		{
			var onClose=function()
			{
				clearTimeout(timer);
				signal.resolve();
			};
			var timer=setTimeout(()=>
			{
				signal.reject();
				this.worker.removeListener("close",onClose);
			},timeout||NODEWORKER.REQUESTTIMEOUT);
			this.worker.on("close",onClose);
			this.worker.kill();
		},
		destroy:function()
		{
			this.worker.kill("SIGKILL");
		}
	});
	NODEWORKER.REQUESTTIMEOUT=60000;

	SMOD("nodeWorker",NODEWORKER);

})(Morgas,Morgas.setModule,Morgas.getModule,Morgas.hasModule,Morgas.shortcut);
