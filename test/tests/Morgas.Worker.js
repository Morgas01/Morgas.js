WorkerTest("Worker",function(loadScripts)
{
	return new µ.Worker({basePath:"../src/",startTimeout:5000,loadScripts:loadScripts});
},"../test/tests/Worker/testWorker.js");
