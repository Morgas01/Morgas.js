(function(µ,SMOD,GMOD,HMOD){

	var SC=GMOD("shortcut")({
		debug:"debug",
		rs:"rescope"
	});
	var PROM=µ.Promise=µ.Class({
		init:function(fns,args,scope)
		{
			SC.rs.all(this,["_start","_error"]);
			
			this.scope=scope;
			var _=this._={};
			this.original=new Promise(function(rs,rj)
			{
				_.rs=rs;
				_.rj=rj;
			});
			if(!args||args!==PROM._WAIT)
			{
				Promise.all(PROM._MAPFNS(fns,args,scope,SC.rs(this.original.catch,this.original))).then(_.rs,_.rj);
				delete _.rs
			}
			else
			{
				_.fns=fns;
			}
			var cleanup=()=>delete this._;
			this.original.then(cleanup,cleanup);
		},
		_start:function(args)
		{
			this._.rs(Promise.all(PROM._MAPFNS(this._.fns,args,this.scope,SC.rs(this.original.catch,this.original))));
		},
		_error:function(error)
		{
			this._.rj(error);
		},
		complete:function(fn)
		{
			var rtn=new PROM(fn,PROM._WAIT,this.scope);
			this.original.then(rtn._start,rtn._error);
			return rtn;
		},
		error:function(efn)
		{
			var rtn=new PROM(efn,PROM._WAIT,this.scope);
			this.original.then(rtn._error,rtn._start);
			return rtn;
		},
		then:function(fn,efn)
		{
			this.error(efn);
			return this.complete(fn);
		},
		always:function(fn)
		{
			var rtn=new PROM(fn,PROM._WAIT,this.scope);
			this.original.then(rtn._start,rtn._start);
			return rtn;
		},
		abort:function()
		{
			if(this._)this._error("abort");
		},
		destroy:function()
		{
			this.abort();
			this.mega();
		}
	});
	PROM._WAIT={};
	PROM._MAPFNS=function(fns,args,scope,onAbort)
	{
		args=[].concat(args);
		return [].concat(fns).map(function(fn)
		{
			if(typeof fn==="function")return new Promise(function(rs,rj)
			{
				var signal={
					resolve:rs,
					reject:rj,
					scope:scope,
					onAbort:onAbort
				};
				var sArgs=args.slice();
				sArgs.unshift(signal);
				try
				{
					var result=fn.apply(scope,sArgs);
					if(result&&typeof result.then==="function")
					{
						if(result instanceof PROM)result.original.then(r=>rs(r[0]),rj);
						else result.then(rs,rj);
					}
					else if (result!==undefined)
					{
						rs(result);
					}
				}
				catch (e)
				{
					SC.debug(e,SC.debug.LEVEL.ERROR);
					rj(e);
				}
			});
			return fn;
		});
	};
	PROM.pledge=function(fn,scope,args)
	{
		if(args===undefined)args=[];
		else args=[].concat(args);
		return function vow(sig)
		{
			if(vow.caller===PROM._MAPFNS)
			{//called as chained µ.Promise
				return fn.apply(scope,[sig,...args].concat(Array.slice(arguments,1)));
			}
			var vArgs=args.concat(Array.slice(arguments));
			return new PROM(fn,vArgs	,scope);
		}
	};
	PROM.pledgeAll=function(scope,keys)
	{
		keys=keys||Object.keys(scope);
		for(var i=0;i<keys.length;i++)
		{
			if(typeof scope[keys[i]]==="function")scope[keys[i]]=PROM.pledge(scope[keys[i]],scope);
		}
	};
	
	SMOD("Promise",PROM);
	
})(Morgas,Morgas.setModule,Morgas.getModule,Morgas.hasModule);