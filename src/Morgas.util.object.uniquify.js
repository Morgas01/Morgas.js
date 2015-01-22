(function(µ,SMOD,GMOD){

	let util=µ.util=µ.util||{};
	let obj=util.object||{};

	/** uniquify
	 * Creates a copy of {arr} without duplicates.
	 * Generates an ID via {fn}(value)
	 */
	obj.uniquify=function(arr,fn)
	{
		let values;
		if(fn)
		{
			values=new Map();
			for(let i=0;i<arr.length;i++)
			{
				let id=arr[i];
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
		let rtn=[];
		let it=values.values();
		for(let step=it.next();!step.done;step=it.next())
		{
			rtn.push(step.value);
		}
		return rtn;
	};
	SMOD("uniquify",obj.uniquify);
	
})(Morgas,Morgas.setModule,Morgas.getModule);