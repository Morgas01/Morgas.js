(function(µ,SMOD,GMOD,HMOD,SC){
	
	let util=µ.util=µ.util||{};
	let uFn=util.function=util.function||{};
	
	/** rescope
	 * faster than bind but only changes the scope.
	 */
	uFn.rescope=function(fn,scope)
	{
		if(fn==null||fn.apply==null) throw new TypeError("#rescope:001 function is not defined");
		else return function(...args)
		{
			return fn.call(scope,...args);
		}
	};
	uFn.rescope.all=function(scope,keys)
	{
		keys=keys||Object.keys(scope);
		for(let key of keys)
		{
			if(typeof scope[key]==="function") scope[key]=uFn.rescope(scope[key],scope);
		}
	};
	SMOD("rescope",uFn.rescope);
	
})(Morgas,Morgas.setModule,Morgas.getModule,Morgas.hasModule,Morgas.shortcut);