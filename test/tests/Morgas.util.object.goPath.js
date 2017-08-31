QUnit.module("util.object.goPath",function()
{
	QUnit.test("goPath",function(assert)
	{
		var obj={path:{to:{
			value:"something",
			"other value":"something else",
			arr:["something1","something2"]
		}}};
		assert.strictEqual(µ.util.object.goPath(null,"path.to.value"),undefined,"do not break on undefined");
		assert.strictEqual(µ.util.object.goPath(obj,"path.to.value"),obj.path.to.value,"valid path");
		assert.strictEqual(µ.util.object.goPath(obj,"path.to.no.value"),undefined,"nonvalid path");
		assert.strictEqual(µ.util.object.goPath(obj,["path","to","other value"]),obj.path.to["other value"],"valid path as array");
		assert.strictEqual(µ.util.object.goPath(obj,'path.to["other value"]'),obj.path.to["other value"],"valid path complex key");
		µ.util.object.goPath(obj,["path","to","new","value"],true);
		assert.ok("new" in obj.path.to,"create path");
		assert.strictEqual(µ.util.object.goPath(obj,["path","to","arr","0"],true),obj.path.to.arr[0],"array path");
		µ.util.object.goPath(obj,["path","to","new","arr","[1]"],true);
		assert.ok(Array.isArray(obj.path.to["new"].arr),"create array");
		assert.strictEqual(µ.util.object.goPath(obj,"path.to.arr[1]",true),obj.path.to.arr[1],"array notation");
	});

	QUnit.test("goPath.guide",function(assert)
	{
		var obj={path:{to:{
			value:"something",
			"other value":"something else",
			arr:["something1","something2"]
		}}};
		assert.strictEqual(µ.util.object.goPath.guide("path.to.value")(obj),obj.path.to.value,"valid path");
		assert.strictEqual(µ.util.object.goPath.guide("path.to.no.value")(obj),undefined,"nonvalid path");
		assert.strictEqual(µ.util.object.goPath.guide(["path","to","other value"])(obj),obj.path.to["other value"],"valid path as array");
	});

	QUnit.test("default value",function(assert)
	{
		var obj={};
		assert.strictEqual(µ.util.object.goPath(obj,"value"),undefined,"not exists");
		assert.notOk("value" in obj,"still not exists");
		assert.strictEqual(µ.util.object.goPath(obj,"value",false,2),2,"default");
		assert.ok("value" in obj,"exists");
	});
	
});