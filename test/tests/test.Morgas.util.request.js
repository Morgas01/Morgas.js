(function(µ,GMOD){

	module("util.Request");
	
	var REQ=GMOD("request");
	var RJS=GMOD("request.json");

	asyncTest("request",function()
	{
		REQ("resources/request.json").then(function(signal,text)
		{
			strictEqual(text,'{\r\n	"name":"test response",\r\n	"value":"something"\r\n}',"response");
			start();
		});
	});
	asyncTest("request",function()
	{
		REQ(["bad/url","resources/request.json"]).then(function(signal,text)
		{
			strictEqual(text,'{\r\n	"name":"test response",\r\n	"value":"something"\r\n}',"fallback response");
			start();
		});
	});
	asyncTest("request json",function()
	{
		RJS("resources/request.json").then(function(signal,json)
		{
			deepEqual(json,{"name":"test response","value":"something"},"response");
			start();
		});
	});
	
})(Morgas,Morgas.getModule);