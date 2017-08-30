(function(µ,SMOD,GMOD,HMOD,SC){

	SC=SC({
		rs:"rescope"
	});
	
	let rescopeApply=function rescopeApply(fn,scope)
	{
		if(fn)return function(arr)
		{
			return fn.apply(scope,arr);
		};
	};

	let AbortHandle=function(reject)
	{
		let callbacks=new Set();

		return {
			add:SC.rs(callbacks.add,callbacks),
			remove:SC.rs(callbacks.delete,callbacks),
			trigger:function()
			{
				let calls=[];
				for(let callback of callbacks)
				{
					try
					{
						calls.push(callback());
					}
					catch (e)
					{
						calls.push(e);
					}
				}
				callbacks.clear();
				reject("abort");
				return Promise.all(calls);
			}
		};
	};
	/**
	 * Promise wrapper to provide arguments,scope and abort().
	 * scope is also provided to all chained methods.
	 */
	let PROM=µ.Promise=µ.Class({
		/**
		 * 
		 * @param {Function|Promise|Array<Function|Promise>} fns
		 * @param {object} (opts={})
		 * @param {object} (opts.scope=null)
		 * @param {object} (opts.args=[])
		 * @param {object} (opts.simple=false)
		 */
		constructor:function(fns,{scope=null,args=[],simple=false}={})
		{
			SC.rs.all(this,"abort");

			this.scope=scope;
			
			let resolve;
			let reject;

			this.original=new Promise(function(rs,rj)
			{
				resolve=rs;
				reject=rj;
			});

			let abortHandle=AbortHandle(reject);
			this.abort=abortHandle.trigger;
			
			// prepare functions
			args=[].concat(args);
			fns=[].concat(fns).map((fn)=>
			{
				if(typeof fn==="function")return new Promise((rs,rj)=>
				{
					let fnArgs=args.slice();
					if(!simple)
					{
						let signal={
							resolve:rs,
							reject:rj,
							scope:scope,
							addAbort:abortHandle.add,
							removeAbort:abortHandle.remove
						};
						fnArgs.unshift(signal);
					}
					try
					{
						let result=fn.apply(scope,fnArgs);
						if(simple)
						{
							rs(result);
						}
						else if (result)
						{
							µ.logger.warn("#Promise:001 function has a result but isn't called in simple mode");
						}
					}
					catch (e)
					{
						µ.logger.error(e);
						µ.logger.error(e.stack);
						rj(e);
					}
				});
				return fn;
			});
			Promise.all(fns).then(resolve,reject);
		},
		_rescopeFn:rescopeApply,// first: apply result of Promise.all | then: only rescope
		_wrapNext:function _wrapNext(next)
		{
			return {
				original:next,
				scope:this.scope,
				then:PROM.prototype.then,
				catch:PROM.prototype.catch,
				_rescopeFn:SC.rs,
				always:PROM.prototype.always,
				reverse:PROM.prototype.reverse,
				_wrapNext:_wrapNext
			};
		},
		"catch":function(efn)
		{
			// use pass function to unwrap results on first call
			return this.then(µ.constantFunctions.pass,efn);
		},
		then:function(fn,efn)
		{
			if(fn)fn=this._rescopeFn(fn,this.scope);
			if(efn)efn=SC.rs(efn,this.scope);
			return this._wrapNext(this.original.then(fn,efn));
		},
		always:function(fn)
		{
			return this.then(fn,fn);
		},
		reverse:function(rejectValue,fn)
		{
			if(fn)fn=SC.rs(fn,this.scope);
			return PROM.reverse(this,rejectValue,fn);
		},
		// abort:function(){} set in constructor
		destroy:function()
		{
			this.abort();
			this.mega();
		}
	});
	PROM.isThenable=function(thenable)
	{
		return thenable&&typeof thenable.then==="function";
	};
	PROM.pledge=function(fn,scope,args=[])
	{
		args=[].concat(args);
		return function vow()
		{
			let vArgs=args.concat(Array.prototype.slice.call(arguments));
			return new PROM(fn,{args:vArgs,scope:scope});
		}
	};
	PROM.pledgeAll=function(scope,keys)
	{
		keys=keys||Object.keys(scope);
		for(let i=0;i<keys.length;i++)
		{
			if(typeof scope[keys[i]]==="function")scope[keys[i]]=PROM.pledge(scope[keys[i]],scope);
		}
	};
	PROM.always=function(fns,opts)
	{
		fns=fns.map(fn=>
		{
			if (PROM.isThenable(fn))return fn.then(µ.constantFunctions.pass,µ.constantFunctions.pass);
			else return new PROM(fn,opts).always(µ.constantFunctions.pass);
		});
		return new PROM(fns,opts);
	};
	/* creates a pending Promise and attaches its resolve and reject to it */
	PROM.open=function(scope)
	{
		let rtn=PROM.prototype._wrapNext.call({
			scope:scope
		});
		rtn.original=new Promise((rs,rj)=>{rtn.resolve=rs;rtn.reject=rj});
		return rtn;
	};
	PROM.resolve=function(value,scope)
	{
		let rtn=PROM.prototype._wrapNext.call({
			scope:scope
		});
		rtn.original=Promise.resolve(value);
		return rtn;
	};
	PROM.reject=function(value,scope)
	{
		let rtn=PROM.prototype._wrapNext.call({
			scope:scope
		});
		rtn.original=Promise.reject(value);
		return rtn;
	};
	/** reverses the outcome of a thenable */
	PROM.reverse=function(thenable,rejectValue,fn)
	{
		if(!fn) fn=µ.constantFunctions.pass;
		return thenable.then(function()
		{
			return Promise.reject(rejectValue);
		},fn);
	};
	
	SMOD("Promise",PROM);
	
})(Morgas,Morgas.setModule,Morgas.getModule,Morgas.hasModule,Morgas.shortcut);