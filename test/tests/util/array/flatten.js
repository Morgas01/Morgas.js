QUnit.module("util.array.flatten",function()
{
	QUnit.test("flatten",function(assert)
	{
		let arr=[[1,2,3],[4,5,6],[7,8,9]];
		assert.deepEqual(µ.util.array.flatten(arr),[1,2,3,4,5,6,7,8,9]);
	});
	QUnit.test("flatten all",function(assert)
	{
		let arr=[[1,2,3],[4,5,6],[7,8,9]];
		assert.deepEqual(µ.util.array.flatten.all(arr[0],arr[1],arr[2]),[1,2,3,4,5,6,7,8,9]);
	});
})