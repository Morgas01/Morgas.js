QUnit.module("util.converter.date",function()
{
	QUnit.test("to",function(assert)
	{
		let date=new Date(Date.UTC(1234,5,6,7,8,9,10));
		assert.strictEqual(µ.util.converter.date.to(date),"1234,5,6,7,8,9,10");
	});
	QUnit.test("from",function(assert)
	{
		let date=new Date(Date.UTC(1234,5,6,7,8,9,10));
		assert.strictEqual(µ.util.converter.date.from("1234,5,6,7,8,9,10").getTime(),date.getTime());
	});

});