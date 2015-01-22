(function(){
	module("Patch");
	
	let class1=function(value)
	{
		this.value=value
	};
	let patch=µ.Class(µ.getModule("Patch"),
	{
		patchID:"patch1",
		patch:function(param)
		{
			this.instance.value+=param;
		}
	});
	let class2=µ.Class(µ.getModule("Listeners"),
	{
		init:function(value,patchNow)
		{
			this.superInit(µ.Listeners);
			let p=new patch(this,2);
			if(patchNow) p.patchNow();
			this.value=value
		}
	});
	
	
	test("Patch",function(assert)
	{
		
		assert.propEqual2(new patch(new class1(1),1),{instance:{value:2}},"Patch class");
		assert.propEqual2(new class2(2),{value:4},"Patch Listeners");
		assert.propEqual2(new class2(2,true),{value:2},"Patch Listeners now");
	});
})();