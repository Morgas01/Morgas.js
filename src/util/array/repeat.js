(function(µ,SMOD,GMOD,HMOD,SC){

	let util=µ.util=µ.util||{};
    let utilArray=util.array=util.array||{};
	//SC=SC({});

	/**
	 * fills an array with the results of repeated calls of fn
	 */
	utilArray.repeat=function(count,fn,scope)
	{
		let rtn=[];
		for(let i=0;i<count;i++)
		{
			rtn.push(fn.call(scope,i));
		}
		return rtn;
	};

	SMOD("array.repeat",utilArray.repeat);

})(Morgas,Morgas.setModule,Morgas.getModule,Morgas.hasModule,Morgas.shortcut);