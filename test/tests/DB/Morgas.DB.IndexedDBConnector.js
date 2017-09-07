(function(µ,SMOD,GMOD,HMOD,SC){

	QUnit.module("DB.IndexedDBConnector");

	var ICON=GMOD("IndexedDBConnector");

	try
	{
		indexedDB.deleteDatabase("testDB");
		window.DBTest(new ICON("testDB"));
	}
	catch(error)
	{
		if(error.name=="SecurityError")
		{
			QUnit.test("available",function(assert)
			{
				assert.ok(false);
			});
		}
		else throw error;
	}

})(Morgas,Morgas.setModule,Morgas.getModule,Morgas.hasModule,Morgas.shortcut);