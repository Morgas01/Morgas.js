QUnit.module("util.fuzzySearch",function()
{
	/*
	QUnit.test("search",function(assert)
	{
		assert.deepEqual(µ.util.fuzzySearch("fo FB",
			["Foo bar FooBar","food","food at the foodbar","FaBo","cherry"],{threshold:0}),
			[
				{
					"data": "Foo bar FooBar",
					"index": 0,
					"score": [0,0,1,2,2]
				},
				{
					"data": "food at the foodbar",
					"index": 2,
					"score": [0,0,1,2,2]
				},
				{
					"data": "food",
					"index": 1,
					"score": [0,0,0,1,1]
				},
				{
					"data": "FaBo",
					"index": 3,
					"score": [0,0,0,0,1]
				}
			]);
	});
	*/

	let testScorer=function(name,fn,param,tests)
	{
		QUnit.test(name,function(assert)
		{
			let scorers=[fn(param)];
			for(let [data,score] of tests)
			{
				assert.strictEqual(µ.util.fuzzySearch.score(data,scorers),score);
			}
		});
	};
	QUnit.module("score functions",function()
	{
		QUnit.module("string",function()
		{
			testScorer("complete",µ.util.fuzzySearch.scoreFunctions.string.complete,"Foo",[
				["Foo",1],
				["foo",1],
				["bar",0],
				["Foobar",0.5],
				["Barfoo",0.5],
				["Foofoo",1],
			]);
			testScorer("wordOrder",µ.util.fuzzySearch.scoreFunctions.string.wordOrder,["Foo","Bar","bazz"],[
				["FooBarBazz",1],
				["Foo",1/3],
				["bar",0],
				["Foobar",2/3],
				["BazzFooBar",2/3],
				["BazzBarFoo",0],
				["Foofoo",1/3],
			]);
			testScorer("words",µ.util.fuzzySearch.scoreFunctions.string.words,["Foo","Bar"],[
				["FooBar",1],
				["Foo",0.5],
				["bar",0.5],
				["BarFoo",1],
				["Foofoo",0.5],
				["bazz",0],
			]);
		});
	});
});