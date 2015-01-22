(function(µ,SMOD,GMOD){
	
	let util=µ.util=µ.util||{};
	let uFn=util["function"]||{};
	
	let SC=GMOD("shortcut")({
		it:"iterate"
	});
	
	/** proxy
	 * proxy methods from source to target.
	 */
	uFn.proxy=function(source,listOrMapping,target)
	{
		let isKey=false,
		isGetter=false;
		switch(typeof source)
		{
			case "string":
				isKey=true;
				break;
			case "function":
				isGetter=true;
				break;
		}
		SC.it(listOrMapping,function(value,key,index,isObject)
		{
			let sKey=(isObject?key:value),
			tKey=value,
			fn=null;
			if(isKey)
			{
				fn=function(){return this[source][sKey].apply(this[source],arguments)};
			}
			else if (isGetter)
			{
				fn=function(){let scope=source.call(this,sKey);return scope[sKey].apply(scope,arguments);};
			}
			else
			{
				fn=function(){return source[sKey].apply(source,arguments)};
			}
			target[tKey]=fn;
		});
	};
	SMOD("proxy",uFn.proxy);
	
})(Morgas,Morgas.setModule,Morgas.getModule);