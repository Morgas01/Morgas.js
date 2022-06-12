(function(µ,SMOD,GMOD,HMOD,SC){

	let Event=GMOD("Event");

	SC=SC({
		Reporter:"EventReporterPatch"
	});

	/**
	 * @typedef {*} LiveDataSource~rawEntry
	 */
	/**
	 * @typedef {*} LiveDataSource~parsedEntry
	 */

	/**
	 * Parses the raw data and returns an array of parsed entries
	 * @callback LiveDataSource~parser
	 * @param {LiveDataSource~rawEntry} entries
	 * @returns {LiveDataSource~parsedEntry|LiveDataSource~parsedEntry[]}
	 */

	/**
	 * handles the update of a parsed entry
	 * @callback LiveDataSource~onUpdate
	 * @param {LiveDataSource~parsedEntry} newEntry
	 * @param {LiveDataSource~parsedEntry} oldEntry
	 * @returns {undefined}
	 */



	let LiveDataSource=µ.Class({
		/**
		 * @param {!String} url url of eventsource
		 * @param {String|function} key key or getter function to determine the identity
		 * @param {?Boolean} connect automatically connect to eventsource
		 * @param {number} retryCount
		 * @param {number} retryDelay
		 * @param {LiveDataSource~parser} parser
		 * @param {number} flattenParsed depth to flatten the parse results to in case the parser returns arrays
		 * @param {LiveDataSource~onUpdate} onUpdate if provided entries won't be replaced
		 * @param {Object<String,function>} events object map of custom events and/or custom handlers
		 */
		constructor:function({
			url,
			key="ID",
			connect=true,
			retryCount=6,
			retryDelay=20E3,
			parser,
			flattenParsed=0,
			onUpdate,
			events
		}={})
		{

			//TODO replace with rescope?
			this.disconnect.bind(this);

			new SC.Reporter(this,[LiveDataEvent]);

			this.url=url;
            this.key=key;
            if(typeof this.key==="string") this.key=d=>d[key];
            this.retryCount=retryCount;
            this.retryCounter=0;
            this.retryDelay=retryDelay;
            this.parser=parser;
			this.flattenParsed=flattenParsed;
			this.onUpdate=onUpdate;

            this.data=undefined;

            this.events=Object.assign({},events,this.events);

            if(connect) this.connect();
            window.addEventListener("beforeunload",this.disconnect);
		},
		connect()
		{
			this.eventSource=new EventSource(this.url);
			for(let name in this.events)
			{
				this.eventSource.addEventListener(name,this.events[name].bind(this));
			}
		},
		isConnected()
		{
			return this.eventSource!=null&&this.eventSource.readyState!==EventSource.CLOSED;
		},
		disconnect()
		{
			this.retryCounter=0;
			if(this.eventSource)
			{
				this.eventSource.close();
				this.eventSource=null;
				this.reportEvent(new LiveDataEvent({type:"disconnect"}));
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
						this.reportEvent(new LiveDataEvent({type:"disconnect"}));
					}
				}
				this.reportEvent(new LiveDataEvent({type:"error",detail:{retry:this.retryCounter!==0}}));
			},
			open()
			{
				this.retryCounter=0;
				this.reportEvent(new LiveDataEvent({type:"connect"}));
			},
			init(event)
			{
				let data=JSON.parse(event.data);
				if(this.parser)data=data.map(this.parser,this).flat(this.flattenParsed);
				this.data=data;
				this.reportEvent(new LiveDataEvent({type:"init",data:this.data}));
			},
			add(event)
			{
				let data=JSON.parse(event.data);
				if(this.parser)data=this.parser(data).flat(this.flattenParsed);
				this.data.push(data);
				this.reportEvent(new LiveDataEvent({type:"add",data}));
			},
			change(event)
			{
				let data=JSON.parse(event.data);
				if(this.parser)data=this.parser(data).flat(this.flattenParsed);

				let id=this.key(data);
				let index=this.data.findIndex(d=>this.key(d)===id);
				if(index!==-1)
				{
					if(this.onUpdate!=null)
					{
						let old=this.data[index];
						this.onUpdate(data,old);
						data=old;
					}
					else
					{
						this.data.splice(index,1,data);
					}
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
		},
		destroy()
		{
			this.disconnect();
			window.removeEventListener("beforeunload",this.disconnect);
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