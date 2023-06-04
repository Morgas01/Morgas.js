(function(µ,SMOD,GMOD,HMOD,SC){

	//SC=SC({});

	/**
	 * A function with bound scope and parmeters.
	 * @typedef {Function} µ.Orchestrator~Task
	 */

	/**
	 * @class µ.Orchestrator
	 * Orchestrates/Manages parallel and sequential task execution
	 */
	µ.Orchestrator=µ.Class({
		constructor:function({maxRunning=1,delay=0}={})
		{
			this.maxRunning=Math.max(maxRunning,1)||1;
			this.delay=Math.max(delay,0)||0;
			this.lastRun=0;
			this.pending=[];
			this.running=new Set();
		},
		setMaxRunning(maxRunning=1)
		{
			this.maxRunning=Math.max(maxRunning,1)||1;
			this._check();
		},
		add(fn,scope,args=[])
		{
			/** @type µ.Orchestrator~Task **/
			let task=fn.bind(scope,...args);
			let rs,rj;
			let promise = new Promise((resolve, reject) =>
			{
				rs = resolve;
				rj = reject;
			});
			this.pending.push({task,rs,rj});
			this._check();
			return promise;
		},
		removePending(reason)
		{
			for(let pending of this.pending)
			{
				pending.rj(reason);
			}
			this.pending.length=0;
		},
		_check()
		{
			if(this.maxRunning===1&&this.delay>0&&Date.now()<this.lastRun+this.delay)
			{
				if(this.delayTimer==null)
				{
					this.delayTimer = setTimeout(() =>
					{
						this.delayTimer = null;
						this._check();
					}, this.lastRun + this.delay - Date.now());
					this.delayTimer?.unref?.(); // dont wait for nodejs timer
				}
				return;
			}
			while(this.running.size<this.maxRunning&&this.pending.length>0)
			{
				let pending = this.pending.shift();
				try
				{
					this.run(pending.task).then(pending.rs,pending.rj);
				}
				catch (e)
				{
					pending.rj(e);
				}
			}
		},
		/**
		 * runs task even if the concurrent running threshold is reached
		 * @param task
		 */
		run(task)
		{
			try
			{
				let promise=task();
				if (promise && typeof promise.then ==="function")
				{
					this.running.add(promise);
					let onFinish = ()=>
					{
						this.running.delete(promise);
						if(this.maxRunning===1&&this.delay>0) this.lastRun=Date.now();
						this._check();
					};
					promise.then(onFinish,onFinish);
					return promise;
				}
				return Promise.resolve(promise);
			}
			catch (e)
			{
				return Promise.reject(e);
			}
		},
		getStatus()
		{
			return {
				pending:this.pending.length,
				running:this.running.size
			};
		}
	});


	SMOD("Orchestrator",µ.Orchestrator);

})(Morgas,Morgas.setModule,Morgas.getModule,Morgas.hasModule,Morgas.shortcut);