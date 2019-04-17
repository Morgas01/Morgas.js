(function(µ,SMOD,GMOD,HMOD,SC){

	let util=µ.util=µ.util||{};
	let utilArray=util.array=util.array||{};

	//SC=SC({});

	utilArray.remove=function(array,item)
	{
		let index=array.indexOf(item);
		if(index!=-1) array.splice(index,1);
		return index;
	};
	SMOD("array.remove",utilArray.remove);

	utilArray.removeIf=function(array,predicate,all=false,scope=null)
	{
		let count=0;
		if(all)
		{
			for(let i=array.length-1;i>=0;i--)
			{
				if(predicate.call(scope,array[i],i,array))
				{
					array.splice(i,1);
					count++;
				}
			}
		}
		else
		{
			let index=array.findIndex(predicate,scope);
			if(index!=-1)
			{
				array.splice(index,1);
				count++;
			}
		}
		return count;
	};
	SMOD("array.removeIf",utilArray.removeIf);

})(Morgas,Morgas.setModule,Morgas.getModule,Morgas.hasModule,Morgas.shortcut);