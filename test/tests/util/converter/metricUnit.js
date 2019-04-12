QUnit.module("util.converter.metricUnit",function()
{
	QUnit.test("to",function(assert)
	{
		assert.strictEqual(µ.util.converter.metricUnit.to(100,{base:"B"}),"100.00B","byte");
		assert.strictEqual(µ.util.converter.metricUnit.to(2E3,{decimalPlaces:0}),"2K","Kilo (decimal places)");
		assert.strictEqual(µ.util.converter.metricUnit.to(3*1024**2,{factor:1024,base:"B",decimalPlaces:0}),"3MB","Megabyte (factor)");
		assert.strictEqual(µ.util.converter.metricUnit.to(4E3,{currentStage:"µ",decimalPlaces:0}),"4m","milli (base)");
		assert.strictEqual(µ.util.converter.metricUnit.to(5E-6,{decimalPlaces:0}),"5µ","micro (small)");
		assert.strictEqual(µ.util.converter.metricUnit.to(0,{base:"€"}),"0.00€","don't convert zero");
	});
	QUnit.test("from",function(assert)
	{
		assert.strictEqual(µ.util.converter.metricUnit.from("100B",{base:"B"}),100,"byte");
		assert.strictEqual(µ.util.converter.metricUnit.from("2.2K"),2200,"Kilo (decimal places)");
		assert.strictEqual(µ.util.converter.metricUnit.from("3MB",{factor:1024,base:"B"}),3*1024**2,"Megabyte (factor)");
		assert.strictEqual(µ.util.converter.metricUnit.from("4m",{toStage:"µ"}),4E3,"milli (base)");
		assert.strictEqual(µ.util.converter.metricUnit.from("6µ"),6E-6,"micro (small)");
		assert.strictEqual(µ.util.converter.metricUnit.from("0.00€",{base:"€"}),0,"don't convert zero");
	});

});