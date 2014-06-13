(function(µ,GMOD){
	module("Morgas.util.object");
	var SC=GMOD("shortcut")({
		goPath:"goPath",
		it:"iterate",
		itAS:"iterateAsync",
		itDET:"iterateDetached",
		find:"find",
		eq:"equals"
	});
	
	test("goPath",function()
	{
		var obj={path:{to:{value:"something"}}};
		strictEqual(SC.goPath(obj,"path.to.value"),obj.path.to.value,"valid path");
		strictEqual(SC.goPath(obj,"path.to.no.value"),undefined,"nonvalid path");
	});

	test("equals",function()
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
		ok(SC.eq("string",pattern.string),"string");
		ok(SC.eq(pattern.regExp,pattern.regExp),"regExp 1");
		ok(!SC.eq(/[gerx]{4}p/,pattern.regExp),"regExp 2");
		ok(SC.eq("regExp",pattern.regExp),"regExp 3");
		ok(SC.eq(4,pattern.num),"number");
		ok(SC.eq(pattern.func,pattern.func),"function 1");
		ok(!SC.eq(function(){},pattern.func),"function 2");
		ok(SC.eq(5,pattern.value),"function 3");
		ok(!SC.eq(3,pattern.value),"function 4");
		ok(SC.eq(pattern.arr,pattern.arr),"array 1");
		ok(!SC.eq([1,4,1,4,2,1,3,5,6,2,3,7],pattern.arr),"array 2");
		ok(SC.eq(7,pattern.arr),"array 3");
		ok(SC.eq({
			string:"string",
			regExp:"regExp",
			num:4,
			func:pattern.func,
			value:5,
			obj:{recrusive:true},
			arr:3,
			anything:"more will be ignored",
		},pattern),"obj");
	});
	
	test("find",function()
	{
		var arr=[1,"4",1,4,2,1,3,5,6,2,3,7];
		var arr2=[
			{name:"tim"},
			{name:"george"},
			{name:"john"},
			{name:"alice"},
			{name:"erin"},
			{name:"lucy"},
			{name:"louise"},
		];
		var obj={
			id:5,
			price:20,
			stock:5
		};

		deepEqual(SC.find(arr,1),[{index:0,value:1},{index:2,value:1},{index:5,value:1}],"array 1");
		deepEqual(SC.find(arr,4),[{index:3,value:4}],"array 2");
		deepEqual(SC.find(arr,"4"),[{index:1,value:"4"}],"array 3");
		deepEqual(SC.find(arr2,{name:"lucy"}),[{index:5,value:arr2[5]}],"array 4");
		deepEqual(SC.find(arr2,{name:/i/}),[{index:0,value:arr2[0]},{index:3,value:arr2[3]},{index:4,value:arr2[4]},{index:6,value:arr2[6]},],"array 5");

		deepEqual(SC.find(obj,20),[{index:"price",value:20}],"object 1");
		deepEqual(SC.find(obj,5),[{index:"id",value:5},{index:"stock",value:5}],"object 2");
	});
	
	test("iterate",function(assert)
	{
		var arr=[3,1,4,1,5,9,2,6,5,3,5,8,9,7,9,3,2,3,8,4,6,2,6,4,3,3,8,3,2,7,9,5,0,2,8,8,4,1,9,7,1,6,9,3,9,9,3,7,5,1,0];
		var obj={
			"0":3,
			"1":1,
			"2":4,
			length:3,
			isArraylike:true,
			isArray:false,
			someValue:"anything"
		};

		var arrCopy=[];
		SC.it(arr,function(val,index)
		{
			arrCopy.push(val);
		});
		deepEqual(arrCopy,arr,"array");

		var arrReveseCopy=[];
		SC.it(arr,function(val,index)
		{
			arrReveseCopy.push(val);
		},true);
		deepEqual(arrReveseCopy,arr.slice(0).reverse(),"array reverse");

		var arrLikeCopy=[];
		SC.it(obj,function(val,index)
		{
			arrLikeCopy.push(val);
		});
		propEqual(arrLikeCopy,[3,1,4],"array like");
		
		var objCopy={};
		SC.it(obj,function(val,index)
		{
			objCopy[index]=val;
		},false,true);
		deepEqual(objCopy,obj,"object");
	});
	
	asyncTest("iterateAsync",function()
	{
		ok(true,"start: "+new Date());
		SC.itAS({length:1E6},function(value,index)
		{
			//doSomething
		}).complete(function()
		{
			ok(true,"finish: "+new Date());
			start();
		})
	});
})(Morgas,Morgas.getModule);