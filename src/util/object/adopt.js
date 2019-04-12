(function(µ,SMOD,GMOD,HMOD,SC){

	let util=µ.util=µ.util||{};
	let obj=util.object=util.object||{};

	//SC=SC({});

	/**
	 * adopt attributes defined in [target] from [provider].
	 * when [extend] is set to true all attributes from [provider] are adopted
	 * @param {Object} target
	 * @param {Object|Object[]} [provider=undefined]
	 * @param {Boolean} [extend=false]
	 */
	obj.adopt=function(target,provider,extend)
	{
		if(provider)
		{
			let keys=Object.keys(extend ? provider : target);
			for(let key of keys)
			{
				if(extend||key in provider)
				{
					target[key]=provider[key];
				}
			}
		}
		return target;
	};
	/**
	 * creates a new object so that parameters are left unchanged
	 *
	 * @param {object} target
	 * @param {object} [provider=undefined]
	 * @param {boolean} [extend=false]
	 */
	obj.adopt.setDefaults=function(defaults,param,extend)
	{
		return obj.adopt(obj.adopt({},defaults,true),param,extend);
	};
	SMOD("adopt",obj.adopt);
	
})(Morgas,Morgas.setModule,Morgas.getModule,Morgas.hasModule,Morgas.shortcut);