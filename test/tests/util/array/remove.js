(function(µ,SMOD,GMOD,HMOD,SC){

	QUnit.module("Morgas.util.array.remove",function(hooks)
	{
		QUnit.test("remove",function(assert)
		{
			let arr=[1,2,3,2,1];
			GMOD("array.remove")(arr,2)
			assert.deepEqual(arr,[1,3,2,1,]);
		});
		QUnit.test("removeIf",function(assert)
		{
			let arr=[0,1,2,3,4,5,6,7,8,9];
			GMOD("array.removeIf")(arr,n=>n%2)
			assert.deepEqual(arr,[0,2,3,4,5,6,7,8,9]);
			GMOD("array.removeIf")(arr,n=>n%2,true)
			assert.deepEqual(arr,[0,2,4,6,8]);
		});
	});

})(Morgas,Morgas.setModule,Morgas.getModule,Morgas.hasModule,Morgas.shortcut);