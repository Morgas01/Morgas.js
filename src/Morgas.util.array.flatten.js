(function(µ,SMOD,GMOD,HMOD,SC){

	var util=µ.util=µ.util||{};
	var array=util.array=util.array||{};

	//SC=SC({});

	var flattenAll=Array.prototype.concat.bind(Array.prototype);

	array.flatten=flattenAll.apply.bind(flattenAll,null);
	array.flatten.all=flattenAll;

	SMOD("flatten",array.flatten);

})(Morgas,Morgas.setModule,Morgas.getModule,Morgas.hasModule,Morgas.shortcut);