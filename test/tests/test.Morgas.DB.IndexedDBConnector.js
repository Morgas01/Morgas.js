(function(µ,GMOD){
	module("IndexedDBConnector");
	var ICON=GMOD("IndexedDBConnector");
	
	indexedDB.deleteDatabase("testDB");
	window.DBTest(new ICON("testDB"));
	
})(Morgas,Morgas.getModule);