(function(µ,SMOD,GMOD,HMOD,SC){

	//SC=SC({});

	µ.global=null;

	if(typeof window!=="undefined") µ.global=window;
	if(typeof global!=="undefined") µ.global=global;

	SMOD("global",µ.global);

})(Morgas,Morgas.setModule,Morgas.getModule,Morgas.hasModule,Morgas.shortcut);