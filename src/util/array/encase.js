(function(µ,SMOD,GMOD,HMOD,SC){

	var util=µ.util=µ.util||{};
	var array=util.array=util.array||{};

	//SC=SC({});

	/**
	 * ensures that 'value' is an array
	 * @param {*|Array.<*>}value
	 * @return {Array.<*>}
	 */
	array.encase=function(value)
	{
		if(Array.isArray(value)) return value;
		if(value==null) return [];
		return [value];
	};

	SMOD("encase",array.encase);

})(Morgas,Morgas.setModule,Morgas.getModule,Morgas.hasModule,Morgas.shortcut);