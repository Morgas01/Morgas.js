(function(µ,SMOD,GMOD,HMOD,SC){

	let PROMISE=GMOD("Promise");

	//SC=SC({});

	PROMISE.frame=function(timeOut)
	{
		return new PROMISE(function timer(resolve)
		{
			let id=requestAnimationFrame(resolve,timeOut);
			signal.addAbort(()=>cancelAnimationFrame(id));
		});
	};

})(Morgas,Morgas.setModule,Morgas.getModule,Morgas.hasModule,Morgas.shortcut);