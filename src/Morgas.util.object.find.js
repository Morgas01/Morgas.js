(function(µ,SMOD,GMOD){

	let util=µ.util=µ.util||{};
	let obj=util.object||{};
	
	let SC=GMOD("shortcut")({
		eq:"equals",
		it:"iterate"
	});
	
	/** find
	 * Iterates over {source}.
	 * Returns an Array of {pattern} matching values 
	 */
	obj.find=function(source,pattern,onlyValues)
	{
		let rtn=[];
		SC.it(source,function(value,index)
		{
			if(SC.eq(value,pattern))
			rtn.push(onlyValues?value:{value:value,index:index});
		});
		return rtn;
	};
	SMOD("find",obj.find);
	
})(Morgas,Morgas.setModule,Morgas.getModule);