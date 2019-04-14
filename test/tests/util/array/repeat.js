QUnit.module("util.function.repeat",function()
{

	QUnit.test("repeat",async function(assert)
	{
		let scope={
			val:0,
			getInc:function(){return this.val++}
		};
		assert.deepEqual(µ.util.array.repeat(5,scope.getInc,scope),[0,1,2,3,4]);
	});

});