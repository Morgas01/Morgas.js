(function(µ,SMOD,GMOD,HMOD,SC){

	QUnit.module("Worker");
	
	var WORKER=GMOD("Worker");
	
	var worker=null;
	QUnit.test("init",function(assert)
	{
	    var done=assert.async();
		worker=new WORKER({basePath:"../src/"});
		worker.addListener(".created",null,function()
		{
			assert.ok(true,"created");
			done();
		})
	});
	QUnit.test("util test",function(assert)
	{
		worker.send("loadScripts","Morgas.util.crc32.js");
		return worker.request("util",["util.crc32","123456789"]).then(function(result)
		{
			assert.strictEqual(result,0xCBF43926,"util result");
		},function(error)
		{
			µ.logger.error(error);
			assert.ok(false,error)
		});
	});
	
})(Morgas,Morgas.setModule,Morgas.getModule,Morgas.hasModule,Morgas.shortcut);