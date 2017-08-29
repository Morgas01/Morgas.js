QUnit.module("core",function()
{
	QUnit.module("class",function(hooks)
	{
		var class1=this.class1=µ.Class(function(val)
		{
			this.value=val;
		});
		class1.prototype._name="class1";

		var class2=this.class2=function(param)
		{
			this.mega(param.val);
			this.isSubClass=this instanceof class1;
		};
		class2.prototype=Object.create(class1.prototype);
		class2.prototype.constructor=class2;
		class2.prototype.increment=function()
		{
			this.value++;
		}
		class2.prototype._name="class2";

		var class3=this.class3=µ.Class(class2,
		{
			constructor:function(val)
			{
				this.isSubSubClass=this instanceof class2;
				this.mega({val:val});
			},
			increment()
			{
				this.oldValue=this.value;
				this.mega();
			},
			_name:"class3"
		});

		var class4=this.class4=µ.Class(class3,{

			[µ.Class.symbols.onExtend]:function(sub)
			{
				if(sub.prototype.throwError) throw new Error("testError");
			},
			_name:"class4"
		});

		QUnit.test("class",function(assert)
		{
			assert.propEqual(new this.class1(10),{value:10},"class creation");
			assert.propEqual(new this.class2({val:20}),{value:20,isSubClass:true},"class creation 2 + inheritance");
			var c3=new this.class3(30);
			assert.propEqual(c3,{value:30,isSubClass:true,isSubSubClass:true},"class creation 3 + inheritance");
			c3.increment();
			assert.propEqual(c3,{value:31,oldValue:30,isSubClass:true,isSubSubClass:true},"class mega on method");
			assert.propEqual(new this.class4(40),{value:40,isSubClass:true,isSubSubClass:true},"class creation 4");
			assert.throws(()=>{µ.Class(this.class4,{throwError:true})},new Error("testError"),"onExtend hook");
		});
		QUnit.test("afterConstruct hook",function(assert)
		{
			let instanceArr=[];
			let hookedClass=µ.Class({
				[µ.Class.symbols.afterConstruct]:function(arg1,arg2)
				{
					instanceArr.push(this);
					assert.equal(arg1,"arg1");
					assert.equal(arg2,"arg2");
				}
			});
			let instance=new hookedClass("arg1","arg2");
			assert.deepEqual(instanceArr,[instance]);
		});
		QUnit.test("abstract hook",function(assert)
		{
			let abstractClass=µ.Class({
				foo()
				{
					return this.bar;
				},
				[µ.Class.symbols.abstract]:function(bar)
				{
					return {bar:bar};
				}
			});

			assert.throws(function()
			{
				new abstractClass();
			},
			function(error)
			{
				return error.message.startsWith("#Class:001 ");
			},"prevent abstract instances");

			let impl=abstractClass.implement("foobar");
			let inst=new impl();
			assert.strictEqual(inst.foo(),"foobar","implemantation via helper function");
		})
	});

	QUnit.test("shortcut",function(assert)
	{
		var s1=null;
		var context={path:{to:{value:2}}};
		var SC=µ.shortcut({s1:function(){return s1;},s2:"s2"});
		assert.strictEqual(SC.s1,null,"function before set");
		assert.strictEqual(SC.s2,undefined,"module before set");

		s1={};
		µ.setModule("s2",{});
		context.path.to.value=4;

		assert.strictEqual(SC.s1,s1,"function after set");
		assert.strictEqual(SC.s2,µ.getModule("s2"),"module after set");
	});
});