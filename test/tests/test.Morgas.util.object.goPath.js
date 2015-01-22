(function(µ,GMOD){

	module("util.object.goPath");
	
	let goPath=GMOD("goPath");
	
	test("goPath",function()
	{
		let obj={path:{to:{
			value:"something",
			"other value":"something else"
		}}};
		strictEqual(goPath(obj,"path.to.value"),obj.path.to.value,"valid path");
		strictEqual(goPath(obj,"path.to.no.value"),undefined,"nonvalid path");
		strictEqual(goPath(obj,["path","to","other value"]),obj.path.to["other value"],"valid path as array");
	});
	
})(Morgas,Morgas.getModule);