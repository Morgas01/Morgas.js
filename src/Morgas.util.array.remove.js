(function(µ,SMOD,GMOD,HMOD,SC){

	var util=µ.util=µ.util||{};
	var utilArray=util.array=util.array||{};

	//SC=SC({});

	utilArray.remove=function(array,item)
	{
		var index=array.indexOf(item);
		if(index!=-1) array.splice(index,1);
		return index;
	};
	SMOD("array.remove",utilArray.remove);

	utilArray.removeIf=function(array,predicate,all=false,scope=null)
	{
		if(all)
		{
			for(var i=array.length-1;i>=0;i--)
			{
				if(predicate.call(scope,array[i],i,array)) array.splice(i,1);
			}
		}
		else
		{
			var index=array.findIndex(predicate,scope);
			if(index!=-1) array.splice(index,1);
		}
	};
	SMOD("array.removeIf",utilArray.removeIf);

})(Morgas,Morgas.setModule,Morgas.getModule,Morgas.hasModule,Morgas.shortcut);