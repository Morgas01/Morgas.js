(function(µ,SMOD,GMOD,HMOD,SC){

	let util=µ.util=µ.util||{};
	let uFn=util["function"]=util["function"]||{};

	//SC=SC({});

	/**
	 * proxy methods from source to target.
	 * called methods have scope of its source
	 *
	 * @param {Object|Function|String} source - source object, getter for dynamic source, or key in scope
	 * @param {Iterable<String|String[]>|Object<String,String>} mapping - Iterable with Strings or Array of Strings as [sourcekey,targetKey]. Objects will be converted via Object.entries()
	 * @param {Object} target
	 */
	uFn.proxy=function(source,mapping,target)
	{
		let isKey=false;
		let isGetter=false;
		switch(typeof source)
		{
			case "string":
				isKey=true;
				break;
			case "function":
				isGetter=true;
				break;
		}
		if(!(Symbol.iterator in mapping))
		{
			mapping=Object.entries(mapping);
		}
		for(let entry of mapping)
		{
			let sourcekey;
			let targetKey;

			if(Array.isArray(entry)) ([sourcekey,targetKey]=entry)
			else sourcekey=targetKey=entry;
			if(isKey)
			{
				target[targetKey]=function(){return this[source][sourcekey].apply(this[source],arguments)};
			}
			else if (isGetter)
			{
				target[targetKey]=function()
				{
					let scope=source.call(this,sourcekey);
					return scope[sourcekey].apply(scope,arguments);
				};
			}
			else
			{
				target[targetKey]=source[sourcekey].bind(source);
			}
		}
	};
	SMOD("proxy",uFn.proxy);

})(Morgas,Morgas.setModule,Morgas.getModule,Morgas.hasModule,Morgas.shortcut);
