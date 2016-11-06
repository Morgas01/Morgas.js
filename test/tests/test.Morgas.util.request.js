(function(µ,SMOD,GMOD,HMOD,SC){

	QUnit.module("util.Request");
	
	var REQ=GMOD("request");
	var RJS=GMOD("request.json");

	QUnit.test("request",function(assert)
	{
		return REQ("resources/request.json").then(function(text)
		{
			assert.strictEqual(text,'{\r\n	"name":"test response",\r\n	"value":"something"\r\n}',"response");
		});
	});
	QUnit.test("bad request",function(assert)
	{
		return REQ(["bad/url"]).catch(function(error)
		{
			assert.ok(error.url==="bad/url","error: "+error.response)
		});
	});
	QUnit.test("request fallback",function(assert)
	{
		return REQ(["bad/url","resources/request.json"]).then(function(text)
		{
			assert.strictEqual(text,'{\r\n	"name":"test response",\r\n	"value":"something"\r\n}',"fallback response");
		});
	});
	QUnit.test("request json",function(assert)
	{
		return RJS("resources/request.json").then(function(json)
		{
			assert.deepEqual(json,{"name":"test response","value":"something"},"response");
		});
	});
	
})(Morgas,Morgas.setModule,Morgas.getModule,Morgas.hasModule,Morgas.shortcut);