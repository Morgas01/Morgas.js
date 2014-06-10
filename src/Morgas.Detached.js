(function(µ,SMOD,GMOD){
	 /**
	 * Depends on	: Morgas
	 * Uses			: 
	 *
	 * Detached class for asynchronous notification
	 *
	 */
	 
	 var DET=µ.Detached=µ.Class(
	 {
		/**	
		*	fn		function or [function]
		*/
		init:function(fn)
		{
			var wait=fn===DET.WAIT
			if(wait)
				fn=arguments[1];
				
			this.fn=[].concat(fn||[]);
			this.args=[];
			this.onError=[];
			this.onComplete=[];
			this.finished=0;
			this.status=0;
			
			if(this.fn.length>0&&!wait)
				this._start();
		},
		error:function(fn,stay)
		{
			fn=[].concat(fn);
			for(var i=0;i<fn.length;i++)
			{
				if(!(fn[i] instanceof DET))
				{
					fn[i]=new DET(DET.WAIT,fn[i]);
				}
				if(this.status==-1&&this.finished>=this.fn.length)
				{
					fn[i]._start(this.args);
				}
				else
				{
					this.onError.push(fn[i]);
				}
			}
			return stay?this:fn[fn.length-1];
		},
		complete:function(fn,stay)
		{
			fn=[].concat(fn);
			for(var i=0;i<fn.length;i++)
			{
				if(!(fn[i] instanceof DET))
				{
					fn[i]=new DET(DET.WAIT,fn[i]);
				}
				if(this.status==1)
				{
					fn[i]._start(this.args);
				}
				else if (this.status==0)
				{
					this.onComplete.push(fn[i]);
				}
			}
			return stay?this:fn[fn.length-1];
		},
		then:function(complete,error)
		{
			this.error(error);
			return this.complete(complete);
		},
		_start:function(args)
		{
			this.args=args||this.args;
			for(var i=0;i<this.fn.length;i++)
			{
				this._go(i);
			}
			this._start=µ.emptyFunc;
		},
		_go:function(index)
		{
			var _self=this;
			setTimeout(function()
			{
				var s=_self.signal(index);
				try
				{
					var fn=_self.fn[index];
					if(typeof fn.then == "function")
						fn.then(s.complete,s.error)
					else
					{
						fn=fn.apply(s,_self.args);
						if(fn!=null&&typeof fn.then == "function")
							fn.then(s.complete,s.error)
					}
				}
				catch(e)
				{
					µ.debug(e,1)
					s.error(e);
				}
			},0);
			return this;
		},
		signal:function(index)
		{
			index=index||0;
			var _self=this;
			var destroy=function()
			{
				this.complete=this.fail=µ.emptyFunc;
			}
			return {
				complete:function(result)
				{
					_self.finished++;
					_self.args[index]=result;
					if(_self.status==0&&_self.finished>=_self.fn.length)
						_self.status=1;
					if(_self.status==1)
					{
						while(_self.onComplete.length>0)
						{
							_self.onComplete.shift()._start(_self.args);
						}
						_self.onComplete.length=_self.onError.length=_self.fn.length=0;
					}
					destroy.call(this);
				},
				error:function(result)
				{
					_self.status=-1;
					_self.finished++;
					_self.args[index]=result;
					if(_self.finished>=_self.fn.length)
					{
						while(_self.onError.length>0)
						{
							_self.onError.shift()._start(_self.args);
						}
						_self.onComplete.length=_self.onError.length=_self.fn.length=0;
					}
					destroy.call(this);
				},
			}
		}
	});
	DET.WAIT={};
	SMOD("Detached",DET);
	DET.detache=function(fn,scope)
	{
		scope=scope||window
		return function()
		{
			var args=[].slice.call(arguments,0);
			return new DET(function()
			{
				args.unshift(this);
				try
				{
					return fn.apply(scope,args);
				}
				catch(e)
				{
					µ.debug(e,1);
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
})(Morgas,Morgas.setModule,Morgas.getModule)