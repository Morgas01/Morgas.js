(function(µ,SMOD,GMOD,HMOD,SC){

	let PROMISE=GMOD("Promise");

	//SC=SC({});

	PROMISE.delay=function(timeOut)
	{
		return new PROMISE(function timer(signal)
		{
			let id=setTimeout(resolve,timeOut);
			signal.addAbort(()=>clearTimeout(id));
		});
	};

})(Morgas,Morgas.setModule,Morgas.getModule,Morgas.hasModule,Morgas.shortcut);