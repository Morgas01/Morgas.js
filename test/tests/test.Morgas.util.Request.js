(function(µ,GMOD){

	module("util.Request");
	
	var REQ=GMOD("Request");
	var RJS=GMOD("Request.json");
	var scope={};
	
	asyncTest("request",function()
	{
		REQ("resources/request.json",scope).then(function(xhr,s)
		{
			strictEqual(xhr.response,'{\r\n	"name":"test response",\r\n	"value":"something"\r\n}',"response");
			strictEqual(s,scope,"scope");
			start();
		});
	});
	asyncTest("request json",function()
	{
		RJS("resources/request.json",scope).then(function(json,s)
		{
			deepEqual(json,{"name":"test response","value":"something"},"response");
			strictEqual(s,scope,"scope");
			start();
		});
	});
	
})(Morgas,Morgas.getModule);