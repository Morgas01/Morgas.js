(function(µ,SMOD,GMOD){

	var util=µ.util=µ.util||{};
	var obj=util.object||{};
	
	var SC=GMOD("shortcut")({
		eq:"equals",
		it:"iterate"
	});
	
	/** find
	 * Iterates over {source}.
	 * Returns an Array of {pattern} matching values 
	 */
	obj.find=function(source,pattern,onlyValues)
	{
		var rtn=[];
		SC.it(source,function(value,index)
		{
			if(SC.eq(value,pattern))
			rtn.push(onlyValues?value:{value:value,index:index});
		});
		return rtn;
	};
	SMOD("find",obj.find);
	
})(Morgas,Morgas.setModule,Morgas.getModule);