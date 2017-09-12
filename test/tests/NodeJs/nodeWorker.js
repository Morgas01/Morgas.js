let path=require("path");
WorkerTest("nodeWorker",function(loadScripts)
{
	let NodeWorker=µ.getModule("nodeWorker");
	return new NodeWorker({startTimeout:5000,loadScripts:loadScripts,cwd:path.resolve(__dirname,"../../../src")});
},"../test/tests/Worker/testWorker.js");
