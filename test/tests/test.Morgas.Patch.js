(function(){
	module("Patch");
	
	var class1=function(value)
	{
		this.value=value
	};
	var patch=µ.Class(µ.getModule("Patch"),
	{
		patchID:"patch1",
		patch:function(param)
		{
			this.instance.value+=param;
		}
	});
	var class2=µ.Class(µ.getModule("Listeners"),
	{
		init:function(value)
		{
			this.superInit(µ.Listeners);
			new patch(this,2);
			this.value=value
		}
	});
	
	
	test("Patch",function(assert)
	{
		
		assert.propEqual2(new patch(new class1(1),1),{instance:{value:2}},"Patch class");
		assert.propEqual2(new class2(2),{value:4},"Patch Listeners");
	});
})();