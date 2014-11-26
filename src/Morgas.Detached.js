(function(µ,SMOD,GMOD){
	 /**
	 * Depends on	: Morgas
	 * Uses			: 
	 *
	 * Detached class for asynchronous notification
	 *
	 */
	
	var SC=GMOD("shortcut")({
		debug:"debug"
	});
	
	var wrapFunction=function(fn,args)
	{
		return function(resolve,reject)
		{
			try {
				var p=fn.apply({complete:resolve,error:reject},args);
				if(p&&typeof p.then==="function")
				{
					p.then(resolve,reject);
				}
				else if (p!==undefined)
				{
					resolve(p);
				}
			} catch (e) {
				SC.debug(e,1);
				reject(e);
			}
		}
	};
	
	var DET=µ.Detached=µ.Class(
	{
		/**
		*	fn		function or [function]
		*/
		init:function(fn,args)
		{
			var wait=fn===DET.WAIT;
			if(wait)
				fn=arguments[1];

			this.fn=[].concat(fn||[]);
			this.onError=[];
			this.onComplete=[];
			this.onAlways=[];
			this.onPropagate=[];
			this.status=0;
			this.args=undefined;

			if(!wait)
			{
				if(this.fn.length===0)
				{
					this.status=1;
				}
				else
				{
					this._start(args);
				}
			}
		},
		_start:function(args)
		{
			for(var i=0;i<this.fn.length;i++)
			{
				if(typeof this.fn[i]==="function")
				{
					this.fn[i]=new Promise(wrapFunction(this.fn[i],args));
				}
			}
			var _self=this;
			Promise.all(this.fn).then(function(args)
			{
				_self._setStatus(1,args);
			},
			function()
			{
				_self._setStatus(-1,Array.slice(arguments,0));
			});
		},
		_setStatus:function(status,args)
		{
			this.status=status;
			this.args=args;
			if(status===1)
			{
				while(this.onComplete.length>0)
				{
					this.onComplete.shift()._start(this.args);
				}
			}
			else if (status===-1)
			{
				while(this.onError.length>0)
				{
					this.onError.shift()._start(this.args);
				}
				while(this.onPropagate.length>0)
				{
					this.onPropagate.shift()._setStatus(status,this.args);
				}

			}
			var args=[(this.status===1)].concat(this.args);
			while(this.onAlways.length>0)
			{
				this.onAlways.shift()._start(args);
			}
			this.onComplete.length=this.onError.length=this.onPropagate.length=this.onAlways.length=this.fn.length=0;
		},
		error:function(fn)
		{
			fn=[].concat(fn);
			for(var i=0;i<fn.length;i++)
			{
				fn[i]=new DET(DET.WAIT,fn[i]);
				if(this.status==-1&&this.finished>=this.fn.length)
				{
					fn[i]._start(this.args);
				}
				else if (this.status===0)
				{
					this.onError.push(fn[i]);
				}
			}
			return fn[fn.length-1];
		},
		complete:function(fn)
		{
			fn=[].concat(fn);
			for(var i=0;i<fn.length;i++)
			{
				fn[i]=new DET(DET.WAIT,fn[i]);
				if(this.status==1)
				{
					fn[i]._start(this.args);
				}
				else if (this.status==0)
				{
					this.onComplete.push(fn[i]);
				}
			}
			return fn[fn.length-1];
		},
		then:function(complete,error)
		{
			var next=this.complete(complete);
			if(error===true)
			{
				this.propagateError(next);
			}
			else
			{
				this.error(error);
			}
			return next;
		},
		always:function(fn)
		{
			fn=[].concat(fn);
			for(var i=0;i<fn.length;i++)
			{
				fn[i]=new DET(DET.WAIT,fn[i]);
				if(this.status!==0)
				{
					var args=[(this.status===1)].concat(this.args);
					fn[i]._start(args);
				}
				else if (this.status===0)
				{
					this.onAlways.push(fn[i]);
				}
			}
			return fn[fn.length-1];
		},
		propagateError:function(detached)
		{
			if(this.status===0)
			{
				this.onPropagate.push(detached);
			}
			else if (this.status===-1&&detached.status===0)
			{
				detached._setStatus(-1,this.args);
			}
		}
	});
	DET.WAIT={};
	SMOD("Detached",DET);
	DET.complete=function()
	{
		var d=new DET();
		d.args=arguments;
		return d;
	};
	DET.error=function()
	{
		var d=new DET();
		d.status=-1;
		d.args=arguments;
		return d;
	};
	DET.detache=function(fn,scope)
	{
		scope=scope||window;
		return function()
		{
			var args=Array.slice(arguments,0);
			return new DET(function()
			{
				args.unshift(this);
				try
				{
					return fn.apply(scope,args);
				}
				catch(e)
				{
					SC.debug(e,1);
					this.error(e);
				}
			})
		}
	};
	DET.detacheAll=function(scope,keys)
	{
		keys=[].concat(keys);
		for(var i=0;i<keys.length;i++)
		{
			var fn=scope[keys[i]];
			scope[keys[i]]=DET.detache(fn,scope);
		}
	};
})(Morgas,Morgas.setModule,Morgas.getModule);