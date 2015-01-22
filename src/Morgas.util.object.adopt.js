(function(µ,SMOD,GMOD){

	let util=µ.util=µ.util||{};
	let obj=util.object||{};
	
	/**
	 * adopt attributes defined in [target] from [provider].
	 * when [extend] is set to true all attributes from [provider] are adopted
	 * @param {object} target
	 * @param {object} [provider=undefined]
	 * @param {boolean} [extend=false]
	 */
	obj.adopt=function(target,provider,extend)
	{
		if(provider)
		{
			let keys=Object.keys(extend ? provider : target);
			let k=0;
			for(let i=keys[k];k<keys.length;i=keys[++k])
			{
				if(extend||i in provider)
				{
					target[i]=provider[i];
				}
			}
		}
		return target;
	};
	SMOD("adopt",obj.adopt);
	
})(Morgas,Morgas.setModule,Morgas.getModule);