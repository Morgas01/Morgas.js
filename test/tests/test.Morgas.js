(function(){
	module("core");
	
	µ.debug.verbose=3;
	
	var class1=µ.Class()
	class1.prototype.init=function(val){this.value=val};
	
	var class2=function(){class1.apply(this,arguments);}
	class2.prototype=new class1(µ._EXTEND);
	class2.prototype.init=function(param)
	{
		class1.prototype.init.call(this,param.val);
		this.isSubClass=this instanceof class1;
	};
	class2.prototype.constructor=class2;
	
	var class3=µ.Class(class2,
	{
		init:function(val)
		{
			this.superInit(class2,{val:val});
			this.isSubSubClass=this instanceof class2;
		}
	});

	test("class",function()
	{
		propEqual(new class1(10),{value:10},"class creation");
		propEqual(new class2({val:20}),{value:20,isSubClass:true},"class creation 2 + inheritance");
		propEqual(new class3(30),{value:30,isSubClass:true,isSubSubClass:true},"class creation 3 + inheritance");
	});
	
	var patch1=µ.Class(µ.Patch,
	{
		patchID:"patch1",
		patch:function(instance,noListeners)
		{
			this.hasListener=!noListeners;
		}
	});
	test("Patch",function(assert)
	{
		assert.propEqual2(new patch1(new class3(2)),{hasListener:false,instance:{value:2}},"Patch create");
		
		var t=new class3(3);
		µ.Listeners.attachListeners(t);

		assert.propEqual2(new patch1(t),{hasListener:true,instance:{value:3}},"Patch create + Listener");
	});
	
	test("Callback",function()
	{
		var scope1={scope1:1},scope2={scope2:2};

		µ.Callback(function(old,arg1,arg2)
		{
			deepEqual([this,old,arg1,arg2],[scope1,scope2,3,4]);
		},scope1,[3]).call(scope2,4);

		µ.Callback(function(arg1,arg2)
		{
			deepEqual([this,arg1,arg2],[scope1,4,undefined]);
		},scope1,undefined,2,3).call(scope2,3,4,5);
	});
	
	test("bind",function()
	{
		var scope1={scope1:1},scope2={scope2:2};
		µ.bind(function(arg1,arg2)
		{
			deepEqual([this,arg1,arg2],[scope1,2,3]);
		},scope1).call(scope2,2,3);
		µ.bind(function(arg1,arg2,arg3,arg4)
		{
			deepEqual([this,arg1,arg2,arg3,arg4],[scope1,2,3,4,5]);
		},scope1,2,3).call(scope2,4,5);
	});

	test("shortcut",function()
	{
		var s1=null;
		var SC=µ.shortcut({s1:function(){return s1;},s2:"s2"});
		strictEqual(SC.s1,null,"function before set");
		strictEqual(SC.s2,undefined,"module before set");
		
		s1={};
		µ.setModule("s2",{});

		strictEqual(SC.s1,s1,"function after set");
		strictEqual(SC.s2,µ.getModule("s2"),"module after set");
	});
})();