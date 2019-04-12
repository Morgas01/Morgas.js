(function(µ,SMOD,GMOD,HMOD,SC){

	let util=µ.util=µ.util||{};
	let obj=util.object=util.object||{};

	//SC=SC({});

	/** uniquify
	 * Creates a copy of {arr} without duplicates.
	 * Generates an ID via {fn}(value)
	 */
	obj.uniquify=function(arr,fn)
	{
		let values;
		if(fn)
		{
			let idMap=new Map();
			for(let i=0;i<arr.length;i++)
			{
				let id=arr[i];
				if(fn)
				{
					id=fn(arr[i]);
				}
				idMap.set(id,arr[i]);
			}
			values=idMap.values();
		}
		else
		{
			values=new Set(arr);
		}
		return Array.from(values);
	};
	SMOD("uniquify",obj.uniquify);
	
})(Morgas,Morgas.setModule,Morgas.getModule,Morgas.hasModule,Morgas.shortcut);