(function(µ,SMOD,GMOD,HMOD,SC){

	QUnit.module("DependencyResolver");

	var DependencyResolver=GMOD("DependencyResolver")
	QUnit.test("simple",function(assert)
	{
		var dr=new DependencyResolver({
     		a:true,
     		aa:"a",
     		ab:["a","b"],
     		ba:{deps:["b","a"]}
     	});

		assert.deepEqual(dr.resolve("aa"),["a","aa"],"single");
		assert.deepEqual(dr.resolve(["aa","ab","ba"]),["a","aa","b","ab","ba"],"multiple");
	});

	QUnit.test("depend uses",function(assert)
	{
		var dr=new DependencyResolver({
			a:{deps:["b"],uses:[]},
			b:{deps:[],uses:["c"]},
			c:{deps:["d"],uses:[]},
			d:{deps:[],uses:["a"]}
		});
		assert.deepEqual(dr.resolve("a"),["b","d","c","a"],"single");
		assert.deepEqual(dr.resolve("c"),["d","b","a","c"],"single 2");
		assert.deepEqual(dr.resolve(["a","c"]),["b","a","d","c"],"multiple");
	});

	QUnit.test("added",function(assert)
	{
		var dr=new DependencyResolver({
    		a:true,
    		aa:"a",
    		ab:["a","b"],
    		ba:{deps:["b","a"]}
    	});

		dr.addConfig({
			b:true,
			cc:["ab","c"],
			abcc:["a","b","cc"]
		});
		assert.deepEqual(dr.resolve("abcc"),["a","b","ab","c","cc","abcc"]);
	});

})(Morgas,Morgas.setModule,Morgas.getModule,Morgas.hasModule,Morgas.shortcut);