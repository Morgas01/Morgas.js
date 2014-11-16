(function(µ,GMOD){
	
	module("util.object.inputValues");
	
	test("inputValues",function()
	{
		var domElement=document.createElement("div");
		domElement.innerHTML='<input type="text" name="field1">'+
		'<input type="checkbox" data-path="foo.bar" name="field2">'+
		'<select name="selection"><option value="select1"/><option value="select2"/></select>'+
		'<textarea name="default">default value</textarea>';
		
		var set={
			"field1":"value1",
			"foo":{"bar":{"field2":true}},
			"selection":"select2"
		};
		var get={
			"field1":null,
			"foo":{"bar":{"field2":null}},
			"selection":null,
			"default":null
		};
		GMOD("setInputValues")(domElement.children,set);
		GMOD("getInputValues")(domElement.children,get);
		
		deepEqual(get,{
			"field1":"value1",
			"foo":{"bar":{"field2":true}},
			"selection":"select2",
			"default":"default value"
		});
	});
	
})(Morgas,Morgas.getModule);