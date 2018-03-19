QUnit.module("util.function.proxy",function()
{
	QUnit.test("proxy",function(assert)
	{
		var target={
			innerSource:{
				f1:function(v)
				{
					assert.strictEqual(this,target.innerSource,"key scope");
					return v+1;
				}
			}
		};
		var outerSource={
			function2:function(v)
			{
				assert.strictEqual(this,outerSource,"object scope");
				return v+2;
			}
		};
		var dynamicSource=null;
		var getter=function(key)
		{
			dynamicSource={};
			dynamicSource[key]=function(v)
			{
				assert.strictEqual(this,dynamicSource,"getter scope");
				return v+3;
			};
			return dynamicSource;
		};
		
		µ.util.function.proxy("innerSource",["f1"],target);
		µ.util.function.proxy(outerSource,{"function2":"f2"},target);
		µ.util.function.proxy(getter,["f3"],target);
		
		assert.strictEqual(target.f1(1),2,"key value");
		assert.strictEqual(target.f2(1),3,"object value");
		assert.strictEqual(target.f3(1),4,"getter value");
	});

	QUnit.test("Array mapping",function(assert)
	{
		let target={};
		let source={fn:function(){return "proxy"}};

		µ.util.function.proxy(source,["fn"],target);

		assert.ok("fn" in target);
	});

	QUnit.test("nested Array mapping",function(assert)
	{
		let target={};
		let source={fn:function(){return "proxy"}};

		µ.util.function.proxy(source,[["fn","foobar"]],target);

		assert.ok("foobar" in target);
	});

	QUnit.test("Object mapping",function(assert)
	{
		let target={};
		let source={fn:function(){return "proxy"}};

		µ.util.function.proxy(source,{"fn":"foobar"},target);

		assert.ok("foobar" in target);
	});

	QUnit.test("Map mapping",function(assert)
	{
		let target={};
		let target2={};
		let source={fn:function(){return "proxy"}};

		let map = new Map([["fn","foobar"]]);

		µ.util.function.proxy(source,map.entries(),target);
		µ.util.function.proxy(source,map.keys(),target2);

		assert.ok("foobar" in target);
		assert.ok("fn" in target2);
	});
	
});