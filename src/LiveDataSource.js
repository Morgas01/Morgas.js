(function(µ,SMOD,GMOD,HMOD,SC){

	let Event=GMOD("Event");

	SC=SC({
		Reporter:"EventReporterPatch"
	});

	let LiveDataSource=µ.Class({
		constructor:function({
			url,
			key="ID",
			connect=true,
			retryCount=6,
			retryDelay=20E3,
			parser,
			events
		}={})
		{

			new SC.Reporter(this,[LiveDataEvent]);

			this.url=url;
            this.key=key;
            if(typeof this.key==="string") this.key=d=>d[key];
            this.retryCount=retryCount;
            this.retryCounter=0;
            this.retryDelay=retryDelay;
            this.parser=parser;

            this.data=undefined;

            this.events=Object.assign({},this.events);

            if(connect) this.connect();
            window.addEventListener("beforeunload",()=>this.disconnect()); //TODO remove listener when destroy
		},
		connect()
		{
			this.eventSource=new EventSource(this.url);
			for(let name in this.events)
			{
				this.eventSource.addEventListener(name,this.events[name].bind(this));
			}
		},
		disconnect()
		{
			if(this.eventSource)
			{
				this.eventSource.close();
				this.eventSource=null;
			}
		},
		events:{
			ping()
			{
				µ.logger.debug(`LiveDataSource [${this.url}] ping`);
			},
			error(event)
			{
				if(this.eventSource.readyState==EventSource.CLOSED)
				{
					if(++this.retryCounter<this.retryCount)
					{
						setTimeout(()=>this.connect(),this.retryDelay);
					}
					else
					{
						this.retryCounter=0;
					}
				}
			},
			open()
			{
				this.retryCounter=0;
			},
			init(event)
			{
				let data=JSON.parse(event.data);
				if(this.parser)data=data.map(this.parser,this);
				this.data=data;
				this.reportEvent(new LiveDataEvent({type:"init",data:this.data}));
			},
			add(event)
			{
				let data=JSON.parse(event.data);
				if(this.parser)data=this.parser(data);
				this.data.push(data);
				this.reportEvent(new LiveDataEvent({type:"add",data}));
			},
			change(event)
			{
				let data=JSON.parse(event.data);
				if(this.parser)data=this.parser(data);

				let id=this.key(data);
				let index=this.data.findIndex(d=>this.key(d)===id);
				if(index!==-1)
				{
					this.data.splice(index,1,data);
					this.reportEvent(new LiveDataEvent({type:"change",data}));
				}
				else µ.logger.warn(`LiveDataSource [${this.url}] unknown data changed [${id}]`);
			},
			remove(event)
			{
				let id=JSON.parse(event.data);
				let index=this.data.findIndex(d=>this.key(d)===id);
				if(index!==-1)
				{
					let data=this.data.splice(index,1);
					this.reportEvent(new LiveDataEvent({type:"remove",data}));
				}
				else µ.logger.warn(`LiveDataSource [${this.url}] unknown data removed [${id}]`);
			}
		}
	});

	let LiveDataEvent=LiveDataSource.LiveDataEvent=µ.Class(Event,{
		name:"liveDataEvent",
		constructor:function({type,data,detail}={})
		{
			this.type=type;
			this.data=data;
			this.detail=detail;
		}
	});

	SMOD("LiveDataSource",LiveDataSource);

})(Morgas,Morgas.setModule,Morgas.getModule,Morgas.hasModule,Morgas.shortcut);