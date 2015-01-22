(function(µ,GMOD){

	module("util.function.proxy");
	
	let P=GMOD("proxy");
	
	test("proxy",function()
	{
		let target={
			innerSource:{
				f1:function(v)
				{
					strictEqual(this,target.innerSource,"key scope");
					return v+1;
				}
			}
		};
		let outerSource={
			function2:function(v)
			{
				strictEqual(this,outerSource,"object scope");
				return v+2;
			}
		};
		let dynamicSource=null;
		let getter=function(key)
		{
			dynamicSource={};
			dynamicSource[key]=function(v)
			{
				strictEqual(this,dynamicSource,"getter scope");
				return v+3;
			};
			return dynamicSource;
		};
		
		P(target.innerSource,["f1"],target);
		P(outerSource,{"function2":"f2"},target);
		P(getter,["f3"],target);
		
		strictEqual(target.f1(1),2,"key value");
		strictEqual(target.f2(1),3,"object value");
		strictEqual(target.f3(1),4,"getter value");
	});
	
})(Morgas,Morgas.getModule);