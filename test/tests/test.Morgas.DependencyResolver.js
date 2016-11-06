(function(µ,SMOD,GMOD,HMOD,SC){

	QUnit.module("DependencyResolver");

	var dr=new (µ.getModule("DepRes"))({
		a:true,
		aa:"a",
		ab:["a","b"],
		ba:{deps:["b","a"]}
	});
	QUnit.test("simple",function(assert)
	{
		assert.deepEqual(dr.resolve("aa"),["a","aa"],"single");
		assert.deepEqual(dr.resolve(["aa","ab","ba"]),["a","aa","b","ab","ba"],"multiple");
	});

	QUnit.test("added",function(assert)
	{
		dr.addConfig({
			b:true,
			cc:["ab","c"],
			abcc:["a","b","cc"]
		});
		assert.deepEqual(dr.resolve("abcc"),["a","b","ab","c","cc","abcc"]);
	});
	
})(Morgas,Morgas.setModule,Morgas.getModule,Morgas.hasModule,Morgas.shortcut);