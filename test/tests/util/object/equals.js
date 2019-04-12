QUnit.module("util.object.equals",function()
{
	QUnit.test("equals",function(assert)
	{
		let pattern={
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
		let complex={
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
		let testlogic=function(key,tests)
		{
			QUnit.test(key,function(assert)
			{
				let index=1;
				for(let testParam of tests)
				{
					let fn=µ.util.object.equals[key](testParam.pattern);
					for (let {value,result=true,name=index} of testParam.checks)
					{
						assert.ok(µ.util.object.equals(value,fn)==result,key+" "+name);
						index++;
					}
					let clone=µ.util.object.equals.stringToPattern(µ.util.object.equals.patternToString(fn));
					assert.ok(µ.util.object.equals.patternToString(fn)===µ.util.object.equals.patternToString(clone),key+" serialize");
				}
			})
		};

		testlogic("Number.NaN",[
			{
				pattern:Number.NaN,
				checks:[
					{
						value:Number.NaN
					},
					{
						value:null,
						result:false
					}
				]
			}
		]);
		testlogic("Number.NEGATIVE_INFINITY",[
			{
				pattern:Number.NEGATIVE_INFINITY,
				checks:[
					{
						value:Number.NEGATIVE_INFINITY
					},
					{
						value:null,
						result:false
					}
				]
			}
		]);
		testlogic("Number.POSITIVE_INFINITY",[
			{
				pattern:Number.POSITIVE_INFINITY,
				checks:[
					{
						value:Number.POSITIVE_INFINITY
					},
					{
						value:null,
						result:false
					}
				]
			}
		]);
		testlogic("unset",[
			{
				checks:[
					{
						value:null,
						name:"null"
					},
					{
						value:undefined,
						name:"undefined"
					},
					{
						value:0,
						result:false,
						name:"zero"
					}
				]
			}
		]);
		testlogic("not",[
			{
				pattern:1,
				checks:[
					{
						value:2
					},
					{
						value:1,
						result:false
					}
				]
			},
			{
				pattern:"a",
				checks:[
					{
						value:"b"
					},
					{
						value:"a",
						result:false
					}
				]
			}
		]);
		testlogic("greater",[
			{
				pattern:2,
				checks:[
					{
						value:3
					},
					{
						value:10
					},
					{
						value:2,
						result:false
					},
					{
						value:-2,
						result:false
					}
				]
			}
		]);
		testlogic("greaterEqual",[
			{
				pattern:2,
				checks:[
					{
						value:2
					},
					{
						value:10
					},
					{
						value:1,
						result:false
					},
					{
						value:-2,
						result:false
					}
				]
			}
		]);
		testlogic("less",[
			{
				pattern:5,
				checks:[
					{
						value:3
					},
					{
						value:-11
					},
					{
						value:5,
						result:false
					},
					{
						value:11,
						result:false
					}
				]
			}
		]);
		testlogic("lessEqual",[
			{
				pattern:5,
				checks:[
					{
						value:3
					},
					{
						value:5
					},
					{
						value:6,
						result:false
					},
					{
						value:200,
						result:false
					}
				]
			}
		]);
		testlogic("between",[
			{
				pattern:["apple","coconut"],
				checks:[
					{
						value:"banana"
					},
					{
						value:"eggplant",
						result:false
					}
				]
			}
		]);
		testlogic("betweenInclude",[
			{
				pattern:[2,3],
				checks:[
					{
						value:1,
						result:false
					},
					{
						value:2
					},
					{
						value:3
					},
					{
						value:4,
						result:false
					}
				]
			}
		]);
		testlogic("containsOrdered",[
			{
				pattern:[1,4,7,8,5,2],
				checks:[
					{
						value:[1,4,7,8,5,2],
						name:"ok"
					},
					{
						value:[1,4,7,8,5],
						name:"missing",
						result:false
					},
					{
						value:[1,4,7,8,5,2,3],
						name:"more",
						result:false
					},
					{
						value:null,
						name:"not iterable",
						result:false
					}
				]
			}
		]);
	});

	QUnit.module("bugs",function()
	{
		QUnit.test("RegEx pattern on object",function(assert)
		{
			assert.notOk(µ.util.object.equals({},/./g));
		});
	});
});