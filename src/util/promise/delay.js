(function(µ,SMOD,GMOD,HMOD,SC){

	let util=µ.util=µ.util||{};
	let uProm=util.uProm=util.uProm||{};

	//SC=SC({});

	uProm.delay=function(timeOut)
	{
		return new Promise(function timer(resolve)
		{
			setTimeout(resolve,timeOut);
		});
	};

})(Morgas,Morgas.setModule,Morgas.getModule,Morgas.hasModule,Morgas.shortcut);