WorkerTest("Worker",function(loadScripts,autoStart)
{
	return new µ.Worker({
		basePath:"base/src/",
		startTimeout:5000,
		loadScripts:loadScripts,
		autoStart:autoStart
	});
},"../test/tests/Worker/testWorker.js");
