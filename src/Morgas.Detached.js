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
	})
	
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
			} catch (e) {
				SC.debug(e,1);
				reject(e);
			}
		}
	}
	
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
			this.onError=[];
			this.onComplete=[];
			this.status=0;
			this.args=undefined;
			
			if(this.fn.length>0&&!wait)
				this._start();
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
				_self.args=args;
				_self.status=1;
				while(_self.onComplete.length>0)
				{
					_self.onComplete.shift()._start(args);
				}
				_self.onComplete.length=_self.onError.length=_self.fn.length=0;
			},
			function()
			{
				this.args=arguments;
				_self.status=-1;
				while(_self.onError.length>0)
				{
					_self.onError.shift()._start(arguments);
				}
				_self.onComplete.length=_self.onError.length=_self.fn.length=0;
			});
			
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
				else
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
			this.error(error);
			return this.complete(complete);
		}
	});
	DET.WAIT={};
	SMOD("Detached",DET);
	DET.complete=function()
	{
		var d=new DET(DET.WAIT);
		d.status=1;
		d.args=arguments;
		return d;
	};
	DET.error=function()
	{
		var d=new DET(DET.WAIT);
		d.status=-1;
		d.args=arguments;
		return d;
	};
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