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