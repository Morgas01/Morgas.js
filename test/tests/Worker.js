WorkerTest("Worker",function(initScripts,autoStart)
{
	return new µ.Worker({
		basePath:"base/src/",
		startTimeout:5000,
		initScripts:initScripts,
		autoStart:autoStart
	});
},"../test/tests/Worker/testWorker.js");
