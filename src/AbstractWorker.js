(function(µ,SMOD,GMOD,HMOD,SC){

	let Event=GMOD("Event");

	SC=SC({
		Reporter:"EventReporterPatch",
		ErrorEvent:"ErrorEvent",
		StateEvent:"StateEvent",
		Promise:"Promise"
	});

	let ID_COUNTER=0;
	let REQUEST_COUNTER=0;
	const INIT_REQUEST_ID="init";

	let AbstractWorker=µ.AbstractWorker=µ.Class({
		[µ.Class.symbols.abstract]:true,
		[µ.Class.symbols.onExtend]:function(sub)
		{
			if(typeof sub.prototype._send!="function") throw new SyntaxError("#AbstractWorker:001 _send() is not defined");
			if(typeof sub.prototype._start!="function") throw new SyntaxError("#AbstractWorker:002 _start() is not defined");
		},
		constructor:function({initScripts=[],autoStart=true,startTimeout=AbstractWorker.defaults.TIMEOUT,loadMorgas=true,onFeedback=this.onFeedback||null}={})
		{
			this.requestMap=new Map();
			this.id=ID_COUNTER++;
			this.initScripts=[].concat(initScripts);
			this.loadMorgas=loadMorgas;
			this.startTimeout=startTimeout;
			this.ready=null;
			this.onFeedback=onFeedback;

			let reporter=new SC.Reporter(this,[WorkerStateEvent,WorkerMessageEvent,SC.ErrorEvent]);


			let state;
			Object.defineProperty(this,"state",{
				enumerable:true,
				configurable:true,
				get:function()
				{
					return state;
				},
				set:(newState)=>
				{
					state=newState;
					if(newState===AbstractWorker.states.CLOSE)
					{
						this.ready=Promise.reject("closed");
						this.ready.catch(µ.constantFunctions.pass); //suppress uncaught promise/exception
					}
					reporter.report(new WorkerStateEvent(newState));
				}
			});
			this.state=AbstractWorker.states.CLOSE;

			if(autoStart) this.restart();
		},
//		_send:function(payload){},
//		_start:function(){}, // returns config object
		_onMessage(message)
		{
			switch(message.type)
			{
				case AbstractWorker.messageTypes.REQUEST:
				{
					if (!this.requestMap.has(message.id))
					{
						this.reportEvent(new SC.ErrorEvent("no such request", `request ${message.id} is not known`));
					}
					else
					{
						let request=this.requestMap.get(message.id);
						if (message.error) request.reject(message.error);
						else request.resolve(message.data);
					}
					break;
				}
				case AbstractWorker.messageTypes.FEEDBACK:
				{
					if (!this.onFeedback)
					{
						this._send({
							type: AbstractWorker.messageTypes.FEEDBACK,
							id: message.id,
							error: "no feedback handler"
						});
					}
					else
					{
						let feedbackPromise = null;
						try
						{
							feedbackPromise = Promise.resolve(this.onFeedback(message.data))
							.catch(function (error)
							{
								if (error instanceof Error) error = error.message + "\n" + error.stack;
								return Promise.reject(error);
							});
						}
						catch (e)
						{
							feedbackPromise = Promise.reject(e.message + "\n" + e.stack);
						}

						feedbackPromise.then(
							result => this._send({
								type: AbstractWorker.messageTypes.FEEDBACK,
								id: message.id,
								data: result
							}),
							error => this._send({
								type: AbstractWorker.messageTypes.FEEDBACK,
								id: message.id,
								error: error
							})
						)
						.catch(µ.logger.error);
					}
					break;
				}
				case AbstractWorker.messageTypes.ERROR:
				{
					if (this.requestMap.has(INIT_REQUEST_ID)) this.requestMap.get(INIT_REQUEST_ID).reject(message.error);
					this.reportEvent(new SC.ErrorEvent(message.error));
					break;
				}
				case AbstractWorker.messageTypes.MESSAGE:
				default:
				{
					//(other) messages are emitted as an event
					this.reportEvent(new WorkerMessageEvent(message));
				}
			}
		},
		send(method,args=[])
		{
			if(this.state!==AbstractWorker.states.OPEN) throw new Error("#AbstractWorker:003 worker is not open");

			this._send({
				type:AbstractWorker.messageTypes.MESSAGE,
				method:method,
				args:args
			});
			return this;
		},
		request(method,args=[],timeout=AbstractWorker.defaults.TIMEOUT)
		{
			if(this.state!==AbstractWorker.states.OPEN) return Promise.reject(new Error("#AbstractWorker:004 worker is not open"));

			let requestMessage={
				type:AbstractWorker.messageTypes.REQUEST,
				id:"R"+REQUEST_COUNTER++,
				method:method,
				args:args
			};
			let timer;
			let promise=new SC.Promise((signal)=>
			{
				this.requestMap.set(requestMessage.id,signal);
				timer=setTimeout(function()
				{
					signal.reject("timeout");
				},timeout);
				this._send(requestMessage);
				signal.addAbort(()=>
				{
					this._send({
						type:AbstractWorker.messageTypes.REQUEST,
						id:requestMessage.id,
						method:"_abort"
					});
				})
			},{scope:this});
			promise.always(()=>
			{
				this.requestMap.delete(requestMessage.id);
				clearTimeout(timer);
			});
			return promise;
		},
		stop(timeout=AbstractWorker.defaults.TIMEOUT)
		{
			return this.send("stop",[],timeout);
		},
		async restart(timeout=this.startTimeout)
		{
			if(this.state!==AbstractWorker.states.CLOSE) throw SC.Promise.reject(new Error("#AbstractWorker:005 worker is already open"),this);
			let timer;
			this.state=AbstractWorker.states.START;
			this.ready=new Promise((resolve,reject)=>
			{
				let signal={resolve,reject};
				this.requestMap.set(INIT_REQUEST_ID,signal);
				timer=setTimeout(function()
				{
					signal.reject("timeout");
				},timeout);
			});
			this.ready.then(()=>
			{
				this.state=AbstractWorker.states.OPEN;
			},
			error=>
			{
				this.state=AbstractWorker.states.CLOSE;
				µ.logger.error(error);
			})
			.finally(()=>
			{
				this.requestMap.delete(INIT_REQUEST_ID);
				clearTimeout(timer);
			});

			let config=Object.assign({
				id:this.id,
				loadMorgas:this.loadMorgas,
				initScripts:this.initScripts
			},await this._start());

			this._send({
				type:AbstractWorker.messageTypes.REQUEST,
				id:INIT_REQUEST_ID,
				config
			});

			return this.ready;
		},
		destroy()
		{
			if(this.state!==AbstractWorker.states.CLOSE)
			{
				this.state=AbstractWorker.states.CLOSE; // trigger workerState Event
				this.stop();
			}
			this.mega();
		}
	});
	AbstractWorker.states={
		START:"start",
		OPEN:"open",
		CLOSE:"close",
	};
	AbstractWorker.messageTypes={
		MESSAGE:"message",
		REQUEST:"request",
		FEEDBACK:"feedback",
		ERROR:"error"
	};
	AbstractWorker.defaults={
		TIMEOUT:6e4
	};
	SMOD("AbstractWorker",AbstractWorker);

	let WorkerMessageEvent=AbstractWorker.WorkerMessageEvent=µ.Class(Event,{
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