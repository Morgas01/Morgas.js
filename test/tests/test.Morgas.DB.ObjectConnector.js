(function(µ,GMOD){
	module("DB.ObjectConnector");
	let OCON=GMOD("ObjectConnector");
	
	window.DBTest(new OCON(true));
	
})(Morgas,Morgas.getModule);