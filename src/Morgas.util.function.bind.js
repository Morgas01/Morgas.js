(function(µ,SMOD,GMOD){
	
	let util=µ.util=µ.util||{};
	let uFn=util.function||{};
	
	/** bind
	 * For more compatibility redefine the module.
	 * For more flexibility consider Callback
	 */
	uFn.bind=Function.bind.call.bind(Function.bind);
	SMOD("bind",uFn.bind);
	
})(Morgas,Morgas.setModule,Morgas.getModule);