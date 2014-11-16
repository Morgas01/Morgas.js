(function(µ,SMOD,GMOD){

	var util=µ.util=µ.util||{};
	var obj=util.object||{};

	/** uniquify
	 * Creates a copy of {arr} without duplicates.
	 * Generates an ID via {fn}(value)
	 */
	obj.uniquify=function(arr,fn)
	{
		var values;
		if(fn)
		{
			values=new Map();
			for(var i=0;i<arr.length;i++)
			{
				var id=arr[i];
				if(fn)
				{
					id=fn(arr[i]);
				}
				values.set(id,arr[i]);
			}
		}
		else
		{
			values=new Set(arr);
		}
		var rtn=[];
		for(var it=values.values(),step=it.next();!step.done;step=it.next())
		{
			rtn.push(step.value);
		}
		return rtn;
	};
	SMOD("uniquify",obj.uniquify);
	
})(Morgas,Morgas.setModule,Morgas.getModule);