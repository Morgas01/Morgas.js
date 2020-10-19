QUnit.module("util.Request",function()
{
	const RESOURCE_URL = "base/test/resources/request.json";

	QUnit.test("simple",function(assert)
	{
		return µ.util.request(RESOURCE_URL).then(function(text)
		{
			assert.strictEqual(text,'{\n	"name":"test response",\n	"value":"something"\n}',"response");
		});
	});
	QUnit.test("bad request",function(assert)
	{
		return µ.util.request(["bad/url"]).catch(function(error)
		{
			assert.ok(error.url==="bad/url","error: "+error.response)
		});
	});
	QUnit.test("fallback",function(assert)
	{
		return µ.util.request(["bad/url",RESOURCE_URL]).then(function(text)
		{
			assert.strictEqual(text,'{\n	"name":"test response",\n	"value":"something"\n}',"fallback response");
		});
	});
	QUnit.test("json",function(assert)
	{
		return µ.util.request.json(RESOURCE_URL).then(function(json)
		{
			assert.deepEqual(json,{"name":"test response","value":"something"},"response");
		});
	});
	
});