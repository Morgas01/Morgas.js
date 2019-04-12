QUnit.module("DependencyResolver",function()
{
	QUnit.test("simple",function(assert)
	{
		var dr=new µ.DependencyResolver({
     		a:true,
     		aa:"a",
     		b:true,
     		ab:["a","b"],
     		ba:{deps:["b","a"]}
     	});

		assert.deepEqual(dr.resolve("aa"),["a","aa"],"single");
		assert.deepEqual(dr.resolve(["aa","ab","ba"]),["a","aa","b","ab","ba"],"multiple");
	});
	QUnit.test("cycle",function(assert)
	{
		var dr=new µ.DependencyResolver({
     		a:"b",
     		b:"c",
     		c:"a"
     	});

		assert.throws(function()
		{
			dr.resolve("c");
		},
		function(error)
		{
			return (error instanceof Error) &&
			error.message.startsWith("#DependencyResolver:003 ") &&
			error.message.indexOf("[c,a,b]")!=-1;
		},
		"throws");

		assert.throws(function()
		{
			dr.resolve("a");
		},
		function(error)
		{
			return error.message.indexOf("[a,b,c]")!=-1;
		},
		"cycle message");
	});

	QUnit.test("depend uses",function(assert)
	{
		var dr=new µ.DependencyResolver({
			a:{deps:["b"],uses:[]},
			b:{deps:[],uses:["c"]},
			c:{deps:["d"],uses:[]},
			d:{deps:[],uses:["a"]}
		});

		assert.deepEqual(dr.resolve("a"),["d","c","b","a"],"single");
		assert.deepEqual(dr.resolve("c"),["b","a","d","c"],"single 2");

		assert.throws(function()
		{
			dr.resolve("c",false);
		},
		function(error){return (error instanceof Error)&&error.message.startsWith("#DependencyResolver:004 ")},
		"strict");

		assert.deepEqual(dr.resolve(["a","c"]),["d","c","b","a"],"multiple");
	});

	QUnit.test("added",function(assert)
	{
		var dr=new µ.DependencyResolver({
    		a:true,
    		aa:"a",
    		ab:["a","b"],
    		ba:{deps:["b","a"]},
    		c:true
    	});

		dr.addConfig({
			b:true,
			cc:["ab","c"],
			abcc:["a","b","cc"]
		});
		assert.deepEqual(dr.resolve("abcc"),["a","b","ab","c","cc","abcc"],"added");

		dr.addConfig({cc:true});
		assert.deepEqual(dr.resolve("abcc"),["a","b","ab","c","cc","abcc"],"not overwrite");
		dr.addConfig({cc:true},undefined,true);
		assert.deepEqual(dr.resolve("abcc"),["a","b","cc","abcc"],"overwrite");
	});

});