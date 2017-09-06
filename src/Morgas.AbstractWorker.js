(function(µ,SMOD,GMOD,HMOD,SC){

	SC=SC({
		Event:"Event",
		Reporter:"EventReporterPatch",
		ErrorEvent:"ErrorEvent",
		StateEvent:"StateEvent",
		Promise:"Promise"
	});

	let ID_COUNTER=0;
	let REQUEST_COUNTER=0;

	let AbstractWorker=µ.AbstractWorker=µ.Class({
		[µ.Class.symbols.abstract]:true,
		[µ.Class.symbols.onExtend]:function(sub)
		{
			if(typeof sub.prototype._send!="function") throw new SyntaxError("#AbstractWorker:001 _send is not defined");
			if(typeof sub.prototype._start!="function") throw new SyntaxError("#AbstractWorker:002 _start is not defined");
		},
		constructor:function(startTimeout)
		{
			this.requestMap=new Map();
			this.id=ID_COUNTER++;
			this.ready=null;
			this.onFeedback=null;

			let reporter=new SC.Reporter(this,[WorkerStateEvent,WorkerMessageEvent,SC.ErrorEvent]);


			let state=AbstractWorker.states.CLOSE;
			Object.defineProperty(this,"state",{
				enumerable:true,
				get:function()
				{
					return state;
				},
				set:(newState)=>
				{
					state=newState;
					if(newState===AbstractWorker.states.CLOSE)
					{
						this.ready=new SC.Promise.reject("closed",this);
					}
					reporter.report(new WorkerStateEvent(newState));
				}
			});

			this.restart(startTimeout);
		},
//		_send:function(payload){},
//		_start:function(){}, // propagate id and other parameters to actual worker
		_onMessage(message)
		{
			if("request" in message)
			{
				if(!this.requestMap.has(message.request))
				{
					this.reportEvent(new SC.ErrorEvent("no such request",`request ${message.request} is not known`));
				}
				else
				{
					if(message.error) this.requestMap.get(message.request).reject(message.error);
					else this.requestMap.get(message.request).resolve(message.data);
				}
			}
			else if("feedback" in message)
			{
				if(!this.onFeedback)
				{
					this._send({feedback:message.feedback,error:"no feedback handler"});
				}
				else
				{
					try
					{
						let result=this.onFeedback(message.data);
						this._send({feedback:message.feedback,data:result});
					}
					catch(e)
					{
						this._send({feedback:message.feedback,error:e.message+"\n"+e.stack});
					}
				}
			}
			else if ("error" in message)
			{
				if(this.requestMap.has("init"))this.requestMap.get("init").reject(message.error);
				else this.reportEvent(new SC.ErrorEvent(message.error));
			}
			else
			{
				this.reportEvent(new WorkerMessageEvent(message));
			}
		},
		send(method,args=[])
		{
			if(this.state!==AbstractWorker.states.OPEN) throw new Error("#AbstractWorker:003 worker is not open");

			this._send({method:method,args:args});
			return this;
		},
		request(method,args=[],timeout=AbstractWorker.defaults.TIMEOUT)
		{
			if(this.state!==AbstractWorker.states.OPEN) return SC.Promise.reject(new Error("#AbstractWorker:004 worker is not open"),this);

			let requestData={
				request:REQUEST_COUNTER++,
				method:method,
				args:args
			};
			let timer;
			let promise=new SC.Promise(function(signal)
			{
				this.requestMap.set(requestData.request,signal);
				timer=setTimeout(function()
				{
					signal.reject("timeout");
				},timeout);
				this._send(requestData);
				signal.addAbort(function()
				{
					this._send({
						request:requestData.request,
						method:"_abort"
					});
				})
			},{scope:this});
			promise.always(function()
			{
				this.requestMap.delete(requestData.request);
				clearTimeout(timer);
			});
			return promise;
		},
		stop(timeout)
		{
			return this.request("stop",[],timeout);
		},
		restart(timeout=AbstractWorker.defaults.TIMEOUT)
		{
			if(this.state!==AbstractWorker.states.CLOSE) throw new Error("#AbstractWorker:005 worker is already open");
			let timer;
			this.state=(this.ready==null ? AbstractWorker.states.START:AbstractWorker.states.RESTART);
			this.ready=new SC.Promise(function(signal)
			{
				this.requestMap.set("init",signal);
				timer=setTimeout(function()
				{
					signal.reject("timeout");
				},timeout);
			},{scope:this});

			this._start();

			this.ready.always(function()
			{
				this.requestMap.delete("init");
				clearTimeout(timer);
			});

			this.ready.then(function()
			{
				this.state=AbstractWorker.states.OPEN;
			},
			function()
			{
				this.state=AbstractWorker.states.CLOSE;
			});
			return this.ready;
		}
	});
	AbstractWorker.states={
		START:"start",
		OPEN:"open",
		CLOSE:"close",
		RESTART:"restart"
	};
	AbstractWorker.defaults={
		TIMEOUT:60000
	};
	SMOD("AbstractWorker",AbstractWorker);

	let WorkerMessageEvent=AbstractWorker.WorkerMessageEvent=µ.Class(SC.Event,{
		name:"workerMessage",
		constructor:function(message)
		{
			this.data=message.data;
			this.time=new Date();
			this.raw=message;
		}
	});

	let WorkerStateEvent=AbstractWorker.WorkerStateEvent=SC.StateEvent.implement("workerState");


})(Morgas,Morgas.setModule,Morgas.getModule,Morgas.hasModule,Morgas.shortcut);