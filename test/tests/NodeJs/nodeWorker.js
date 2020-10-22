let path=require("path");
WorkerTest("nodeWorker",function(loadScripts,autoStart)
{
	let NodeWorker=µ.getModule("nodeWorker");
	return new NodeWorker({
		startTimeout:5000,
		initScripts:loadScripts,
		cwd:path.resolve(__dirname,"../../../src"),
		autoStart:autoStart
	});
},"../test/tests/Worker/testWorker.js");
