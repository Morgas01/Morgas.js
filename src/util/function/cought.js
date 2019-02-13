(function(µ,SMOD,GMOD,HMOD,SC){

	let util=µ.util=µ.util||{};
	let uFn=util.function=util.function||{};

	//SC=SC({});

	/**
	 * catches and logs exception on fn execution
	 * @param {Function} fn
	 */
	uFn.caught=function(fn)
	{
		try
		{
			return fn();
		}
		catch(e)
		{
			µ.logger.error(e);
		}
	};

	SMOD("caught",uFn.caught);

})(Morgas,Morgas.setModule,Morgas.getModule,Morgas.hasModule,Morgas.shortcut);