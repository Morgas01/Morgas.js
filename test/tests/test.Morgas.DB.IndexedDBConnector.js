(function(µ,GMOD){
	module("DB.IndexedDBConnector");
	let ICON=GMOD("IndexedDBConnector");
	
	indexedDB.deleteDatabase("testDB");
	window.DBTest(new ICON("testDB"));
	
})(Morgas,Morgas.getModule);