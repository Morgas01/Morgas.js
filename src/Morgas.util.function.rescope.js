(function(µ,SMOD,GMOD){
	
	var util=µ.util=µ.util||{};
	var uFn=util.function||{};
	
	/** rescope
	 * faster than bind but only changes the scope.
	 */
	uFn.rescope=function(fn,scope)
	{
		return function()
		{
			return fn.apply(scope,arguments);
		}
	};
	uFn.rescope.all=function(keys,scope)
	{	
		keys=keys||Object.keys(scope);
		for(var i=0;i<keys.length;i++)
		{
			scope[keys[i]]=uFn.rescope(scope[keys[i]],scope);
		}
	};
	SMOD("rescope",uFn.rescope);
	
})(Morgas,Morgas.setModule,Morgas.getModule);