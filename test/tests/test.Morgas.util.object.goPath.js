(function(µ,GMOD){

	module("util.object.goPath");
	
	var goPath=GMOD("goPath");
	
	test("goPath",function()
	{
		var obj={path:{to:{
			value:"something",
			"other value":"something else"
		}}};
		strictEqual(goPath(obj,"path.to.value"),obj.path.to.value,"valid path");
		strictEqual(goPath(obj,"path.to.no.value"),undefined,"nonvalid path");
		strictEqual(goPath(obj,["path","to","other value"]),obj.path.to["other value"],"valid path as array");
		strictEqual(goPath(obj,["path","to","new","value"],true),obj.path.to["new"].value,"create path");
	});
	
})(Morgas,Morgas.getModule);