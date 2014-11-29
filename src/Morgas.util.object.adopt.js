(function(µ,SMOD,GMOD){

	var util=µ.util=µ.util||{};
	var obj=util.object||{};
	
	/**
	 * adopt attributes defined in [target] from [provider]
	 * when [extend] is set to true all attribues from [provider] are adopted
	 * @param {object} target
	 * @param {object} [provider=undefined]
	 * @param {boolean} [extend=false]
	 */
	obj.adopt=function(target,provider,extend)
	{
		if(provider)
		{
			var keys=Object.keys(extend ? provider : target);
			for(var k=0,i=keys[k];k<keys.length;i=keys[++k])
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