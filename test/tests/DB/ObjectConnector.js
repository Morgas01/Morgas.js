(function(µ,SMOD,GMOD,HMOD,SC){

	QUnit.module("DB.ObjectConnector");

	var OCON=GMOD("ObjectConnector");
	
	DBTest(new OCON(true));
	
})(Morgas,Morgas.setModule,Morgas.getModule,Morgas.hasModule,Morgas.shortcut);