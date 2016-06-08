(function(µ,SMOD,GMOD,HMOD,SC){

	µ.NodeJs=µ.NodeJs||{};
	
	var fork=require("child_process").fork;
	
	var Listeners=GMOD("Listeners");
	SC=SC({
		rs:"rescope",
		prom:"Promise"
	});
	
	var NODEWORKER=µ.NodeJs.Worker=µ.Class(Listeners,{
		init:function(script,args,cwd)
		{
			this.mega();
			this.createListener(".readyState message");
			SC.prom.pledgeAll(this,["request"]);
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
		_onMessage:function(message)
		{
			if (message.request==null)
			{
				this.fire("message",message.data);
			}
			else if(message.request=="init")
			{
				this.setState(".readyState",{state:"running",data:message.data});
			}
			else
			{
				if(this.requests.has(message.request))
				{
					this.requests.get(message.request).resolve(message.data);
					this.requests.delete(message.request);
					clearTimeout(message.request);
				}
				else
				{
					µ.logger.warning(new µ.Warning("tried to respond to unknown request",message));
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
				data:{
					request:this.nextRequestId++,
					timeout:null,
					type:"error",
					data:"timeout"
				}
			};
			timeoutEvent.data.timeout=setTimeout(()=>this._onMessage(timeoutEvent),timeout||NODEWORKER.REQUESTTIMEOUT);
			this.requests.set(timeoutEvent.data.request,signal);
			this.worker.send({method:method,request:timeoutEvent.data.request,args:[].concat(args)});
		},
		stream:function(inStream,outStream,onMessage)
		{
			
		},
		destroy:function()
		{
		}
	});
	NODEWORKER.REQUESTTIMEOUT=60000;
	
	SMOD("nodeWorker",NODEWORKER);
	
})(Morgas,Morgas.setModule,Morgas.getModule,Morgas.hasModule,Morgas.shortcut);