(function(µ,SMOD,GMOD,HMOD,SC){

	QUnit.module("util.object.equals");
	
	var EQ=GMOD("equals");

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
		assert.ok(EQ("string",pattern.string),"string 1");
		assert.notOk(EQ("stirgn",pattern.string),"string 2");
		assert.ok(EQ(4,pattern.num),"number 1");
		assert.notOk(EQ(5,pattern.num),"number 2");
		assert.ok(EQ(pattern.regExp,pattern.regExp),"regExp 1");
		assert.notOk(EQ(/[gerx]{4}p/,pattern.regExp),"regExp 2");
		assert.ok(EQ(/[gerx]{4}p/i,pattern.regExp),"regExp 3");
		assert.ok(EQ("regExp",pattern.regExp),"regExp 4");
		assert.ok(EQ("rexEgp",pattern.regExp),"regExp 5");
		assert.ok(EQ(pattern.func,pattern.func),"function 1");
		assert.notOk(EQ(function(){},pattern.func),"function 2");
		assert.ok(EQ(5,pattern.value),"function 3");
		assert.notOk(EQ(3,pattern.value),"function 4");
		assert.ok(EQ(pattern.arr,pattern.arr),"array 1");
		assert.notOk(EQ([1,4,1,4,2,1,3,5,6,2,3,7],pattern.arr),"array 2");
		assert.ok(EQ(7,pattern.arr),"array 3");
		assert.notOk(EQ(8,pattern.arr),"array 4");
		assert.ok(EQ({
			string:"string",
			regExp:"regExp",
			num:4,
			func:pattern.func,
			value:5,
			obj:{recrusive:true},
			arr:3,
			anything:"more will be ignored"
		},pattern),"obj");
		assert.ok(EQ(complex,5),"obj.equals 1");
		assert.notOk(EQ(complex,3),"obj.equals 2");
		assert.notOk(EQ(1,null),"pattern null");
	});

	QUnit.module("logic",function()
	{
		var testlogic=function(key,pattern,value)
		{
			QUnit.test(key,function(assert)
			{
				var fn=EQ[key](pattern);
				assert.ok(EQ(value,fn),key);
				var clone=EQ.stringToPattern(EQ.patternToString(fn));
				assert.ok(EQ.patternToString(fn)===EQ.patternToString(clone),key+" string");
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
})(Morgas,Morgas.setModule,Morgas.getModule,Morgas.hasModule,Morgas.shortcut);