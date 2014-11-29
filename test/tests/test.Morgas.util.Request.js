(function(µ,GMOD){

	module("util.Request");
	
	var REQ=GMOD("Request");
	var RJS=GMOD("Request.json");
	
	asyncTest("request",function()
	{
		REQ("resources/request.json").then(function(xhr)
		{
			strictEqual(xhr.response,'{\r\n	"name":"test response",\r\n	"value":"something"\r\n}');
			start();
		});
	});
	asyncTest("request",function()
	{
		RJS("resources/request.json").then(function(json)
		{
			deepEqual(json,{"name":"test response","value":"something"});
			start();
		});
	});
	
})(Morgas,Morgas.getModule);