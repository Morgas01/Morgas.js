(function(µ,GMOD){
	module("DB.ObjectConnector");
	var OCON=GMOD("ObjectConnector");
	
	window.DBTest(new OCON(true));
	
})(Morgas,Morgas.getModule);