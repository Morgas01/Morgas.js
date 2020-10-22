worker.methods.increment=function(n)
{
	return n+1;
};
worker.methods.timeout=function()
{
	return new Promise(function(){});
};
worker.methods.error=function()
{
	return Promise.reject("test error");
};
worker.methods.exception=function()
{
	throw "test exception";
};
worker.methods.feedback=function(data)
{
	return worker.feedback(data)
};
