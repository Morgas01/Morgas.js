QUnit.module("util.object.equals",function()
{
	QUnit.test("equals",function(assert)
	{
		var pattern={
			string:"string",
			regExp:/[gerx]{4}p/i,
			num:4,
			func:function(){},
			value:function(value){return value>4},
			obj:{
				recrusive:true
			},
			arr:[1,"4",1,4,2,1,3,5,6,2,3,7]
		};
		var complex={
			equals:pattern.value
		};
		assert.ok(µ.util.object.equals("string",pattern.string),"string 1");
		assert.notOk(µ.util.object.equals("stirgn",pattern.string),"string 2");
		assert.ok(µ.util.object.equals(4,pattern.num),"number 1");
		assert.notOk(µ.util.object.equals(5,pattern.num),"number 2");
		assert.ok(µ.util.object.equals(pattern.regExp,pattern.regExp),"regExp 1");
		assert.notOk(µ.util.object.equals(/[gerx]{4}p/,pattern.regExp),"regExp 2");
		assert.ok(µ.util.object.equals(/[gerx]{4}p/i,pattern.regExp),"regExp 3");
		assert.ok(µ.util.object.equals("regExp",pattern.regExp),"regExp 4");
		assert.ok(µ.util.object.equals("rexEgp",pattern.regExp),"regExp 5");
		assert.ok(µ.util.object.equals(pattern.func,pattern.func),"function 1");
		assert.notOk(µ.util.object.equals(function(){},pattern.func),"function 2");
		assert.ok(µ.util.object.equals(5,pattern.value),"function 3");
		assert.notOk(µ.util.object.equals(3,pattern.value),"function 4");
		assert.ok(µ.util.object.equals(pattern.arr,pattern.arr),"array 1");
		assert.notOk(µ.util.object.equals([1,4,1,4,2,1,3,5,6,2,3,7],pattern.arr),"array 2");
		assert.ok(µ.util.object.equals(7,pattern.arr),"array 3");
		assert.notOk(µ.util.object.equals(8,pattern.arr),"array 4");
		assert.ok(µ.util.object.equals({
			string:"string",
			regExp:"regExp",
			num:4,
			func:pattern.func,
			value:5,
			obj:{recrusive:true},
			arr:3,
			anything:"more will be ignored"
		},pattern),"obj");
		assert.ok(µ.util.object.equals(complex,5),"obj.equals 1");
		assert.notOk(µ.util.object.equals(complex,3),"obj.equals 2");
		assert.notOk(µ.util.object.equals(1,null),"pattern null");
	});

	QUnit.module("logic",function()
	{
		var testlogic=function(key,pattern,value)
		{
			QUnit.test(key,function(assert)
			{
				var fn=µ.util.object.equals[key](pattern);
				assert.ok(µ.util.object.equals(value,fn),key);
				var clone=µ.util.object.equals.stringToPattern(µ.util.object.equals.patternToString(fn));
				assert.ok(µ.util.object.equals.patternToString(fn)===µ.util.object.equals.patternToString(clone),key+" string");
			})
		};

		testlogic("Number.NaN",Number.NaN,Number.NaN);
		testlogic("Number.NEGATIVE_INFINITY",Number.NEGATIVE_INFINITY,Number.NEGATIVE_INFINITY);
		testlogic("Number.POSITIVE_INFINITY",Number.POSITIVE_INFINITY,Number.POSITIVE_INFINITY);
		testlogic("unset",null,null);
		testlogic("not",1,2);
		testlogic("greater",1,2);
		testlogic("greaterEqual",1,1);
		testlogic("less",2,1);
		testlogic("lessEqual",1,1);
		testlogic("between",["apple","coconut"],"banana");
		testlogic("betweenInclude",[1,1],1);
	});

	QUnit.module("bugs",function()
	{
		QUnit.test("RegEx pattern on object",function(assert)
		{
			assert.notOk(µ.util.object.equals({},/./g));
		});
	});
});