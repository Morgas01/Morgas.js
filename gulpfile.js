
const nodeTestExcludes = ['test/tests/DB/IndexedDBConnector.js','test/tests/util/object/inputValues.js','test/tests/util/request.js','test/tests/Worker.js','test/tests/Worker/testWorker.js'];
module.exports={
	async test()
	{
		let µ=require(".");//morgas
		let moduleExcludes = ["IDBConn","download","queryParam","request","request.json","setInputValues","getInputValues"];
		for(let module in µ.getModule("Morgas.ModuleRegister"))
		{
			if(!moduleExcludes.includes(module)) µ.getModule(module);
		}

		QUnit=require("qunit");
		QUnit.dump.multiline=false;
		require("qunit-tap")(QUnit,console.log);

		let glob = require("glob").sync;
		let tests=[...glob("test/tests/**/*.js")]
		.map(f=>f.replace(/\\/g,"\/"))
		.filter(f=>!nodeTestExcludes.includes(f));

		require("./test/checkGlobals");
		require("./test/DBTest");
		require("./test/WorkerTest");

		require("qunit/src/cli/run")(tests,{requires:[],reporter:"tap"});
		checkGlobals();
	}
};