(function(µ,SMOD,GMOD,HMOD,SC){

	QUnit.module("util.function.proxy");
	
	var P=GMOD("proxy");
	
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
		
		P(target.innerSource,["f1"],target);
		P(outerSource,{"function2":"f2"},target);
		P(getter,["f3"],target);
		
		assert.strictEqual(target.f1(1),2,"key value");
		assert.strictEqual(target.f2(1),3,"object value");
		assert.strictEqual(target.f3(1),4,"getter value");
	});
	
})(Morgas,Morgas.setModule,Morgas.getModule,Morgas.hasModule,Morgas.shortcut);