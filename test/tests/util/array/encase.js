QUnit.module("util.function.encase",function()
{

	QUnit.test("encase",async function(assert)
	{
		assert.deepEqual(µ.util.array.encase("foo"),["foo"]);
		let bar=["bar"]
		assert.strictEqual(µ.util.array.encase(bar),bar);
	});

});