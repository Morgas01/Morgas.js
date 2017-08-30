QUnit.module("util.Request",function()
{
	QUnit.test("simple",function(assert)
	{
		return µ.util.request("resources/request.json").then(function(text)
		{
			assert.strictEqual(text,'{\r\n	"name":"test response",\r\n	"value":"something"\r\n}',"response");
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
		return µ.util.request(["bad/url","resources/request.json"]).then(function(text)
		{
			assert.strictEqual(text,'{\r\n	"name":"test response",\r\n	"value":"something"\r\n}',"fallback response");
		});
	});
	QUnit.test("json",function(assert)
	{
		return µ.util.request.json("resources/request.json").then(function(json)
		{
			assert.deepEqual(json,{"name":"test response","value":"something"},"response");
		});
	});
	
});