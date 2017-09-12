worker.increment=function(n)
{
	return n+1;
}
worker.timeout=function()
{
	return new Promise(function(){});
};
worker.error=function()
{
	return Promise.reject("test error");
}
worker.exception=function()
{
	throw "test exception";
}
