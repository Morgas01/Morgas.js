QUnit.module("util.object.inputValues",function()
{
	
	QUnit.test("inputValues",function(assert)
	{
		var domElement=document.createElement("div");
		domElement.innerHTML=`
<input type="text" name="field1">
<input type="number" name="field2">
<input type="checkbox" data-path="foo.bar" name="field3">
<input type="checkbox" data-path="foo2.bar" name="field4">
<select name="selection"><option value="select1"/><option value="select2"/></select>
<select name="selectionArr" multiple><option value="select1"/><option value="select2"/><option value="select3"/></select>
<textarea name="default">default value</textarea>`
		
		var set={
			"field1":"value1",
			"field2":5,
			"foo":{"bar":{"field3":true}},
			"selection":"select2",
			"selectionArr":["select1","select3"]
		};
		var get={
			"field1":null,
			"field2":null,
			"foo":{"bar":{"field3":null}},
			"selection":null,
			"selectionArr":["select1","select3"],
			"default":null
		};
		µ.util.object.setInputValues(domElement.children,set);
		µ.util.object.getInputValues(domElement.children,get);
		
		assert.deepEqual(get,{
			"field1":"value1",
			"field2":5,
			"foo":{"bar":{"field3":true}},
			"selection":"select2",
			"selectionArr":["select1","select3"],
			"default":"default value"
		},"simple");
		
		µ.util.object.getInputValues(domElement.children,get,true);

		assert.deepEqual(get,{
			"field1":"value1",
			"field2":5,
			"foo":{"bar":{"field3":true}},
			"foo2":{"bar":{"field4":false}},
			"selection":"select2",
			"selectionArr":["select1","select3"],
			"default":"default value"
		},"create new paths");
		assert.deepEqual(µ.util.object.getInputValues(domElement.children),get,"no target");
	});
	
});