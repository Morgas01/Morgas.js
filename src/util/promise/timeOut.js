(function(µ,SMOD,GMOD,HMOD,SC){

	let util=µ.util=µ.util||{};
	let uProm=util.uProm=util.uProm||{};

	//SC=SC({});

	uProm.timeOut=function(promise,timeOut,rejectValue="abort")
	{
		return new Promise(function timer(resolve,reject)
		{
			promise.then(resolve,reject);
			setTimeout(function(){reject(rejectValue)},timeOut);
		});
	};

})(Morgas,Morgas.setModule,Morgas.getModule,Morgas.hasModule,Morgas.shortcut);