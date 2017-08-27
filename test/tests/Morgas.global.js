QUnit.module("global",function()
{
	QUnit.test("window",function(assert)
	{
		assert.equal(µ.global,window);
	})
})