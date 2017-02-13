(function(µ,SMOD,GMOD,HMOD,SC){

	var util=µ.util=µ.util||{};
	var obj=util.object=util.object||{};

	var flattenAll=Array.prototype.concat.bind(Array.prototype);

	obj.flatten=flattenAll.apply.bind(flattenAll,null);
	obj.flatten.all=flattenAll;

	SMOD("flatten",obj.flatten);

})(Morgas,Morgas.setModule,Morgas.getModule,Morgas.hasModule,Morgas.shortcut);