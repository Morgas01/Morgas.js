(function(µ,GMOD){
	module("DB.IndexedDBConnector");
	var ICON=GMOD("IndexedDBConnector");
	
	indexedDB.deleteDatabase("testDB");
	window.DBTest(new ICON("testDB"));
	
})(Morgas,Morgas.getModule);