QUnit.module("util.fuzzySearch",function()
{
	QUnit.test("search",function(assert)
	{
		assert.deepEqual(µ.util.fuzzySearch("fo FB",
			["Foo bar FooBar","food","food at the foodbar","FaBo"]),
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
	
});