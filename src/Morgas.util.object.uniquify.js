(function(µ,SMOD,GMOD,HMOD,SC){

	var util=µ.util=µ.util||{};
	var obj=util.object=util.object||{};

	/** uniquify
	 * Creates a copy of {arr} without duplicates.
	 * Generates an ID via {fn}(value)
	 */
	obj.uniquify=function(arr,fn)
	{
		var values;
		if(fn)
		{
			var idMap=new Map();
			for(var i=0;i<arr.length;i++)
			{
				var id=arr[i];
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