(function(µ,SMOD,GMOD,HMOD,SC){

	QUnit.module("util.object.goPath");
	
	var goPath=GMOD("goPath");
	
	QUnit.test("goPath",function(assert)
	{
		var obj={path:{to:{
			value:"something",
			"other value":"something else",
			arr:["something1","something2"]
		}}};
		assert.strictEqual(goPath(obj,"path.to.value"),obj.path.to.value,"valid path");
		assert.strictEqual(goPath(obj,"path.to.no.value"),undefined,"nonvalid path");
		assert.strictEqual(goPath(obj,["path","to","other value"]),obj.path.to["other value"],"valid path as array");
		assert.strictEqual(goPath(obj,["path","to","new","value"],true),obj.path.to["new"].value,"create path");
		assert.strictEqual(goPath(obj,["path","to","arr","0"],true),obj.path.to.arr[0],"array path");
		assert.strictEqual(goPath(obj,["path","to","new","arr[]"],true),obj.path.to["new"].arr,"create array");
		assert.ok(Array.isArray(obj.path.to["new"].arr),"create array");
		assert.strictEqual(goPath(obj,["path","to","arr[1]"],true),obj.path.to.arr[1],"array notation");
	});

	QUnit.test("goPath.guide",function(assert)
	{
		var obj={path:{to:{
			value:"something",
			"other value":"something else",
			arr:["something1","something2"]
		}}};
		assert.strictEqual(goPath.guide("path.to.value")(obj),obj.path.to.value,"valid path");
		assert.strictEqual(goPath.guide("path.to.no.value")(obj),undefined,"nonvalid path");
		assert.strictEqual(goPath.guide(["path","to","other value"])(obj),obj.path.to["other value"],"valid path as array");
	});
	
})(Morgas,Morgas.setModule,Morgas.getModule,Morgas.hasModule,Morgas.shortcut);