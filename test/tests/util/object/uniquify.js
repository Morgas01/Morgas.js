(function(µ,SMOD,GMOD,HMOD,SC){

	QUnit.module("util.object.uniquify");
	
	var U=GMOD("uniquify");
	
	QUnit.test("uniquify",function(assert)
	{
		var arr1=[1,2,5,3,6,5,7,8,9,0,4,5,6,2,9,7,8];
		var arr2=[
			{
				id:"1",
				value:1
			},
			{
				id:"2",
				value:2
			},
			{
				id:"1",
				value:3
			}
		];
		
		assert.deepEqual(U(arr1),[1,2,5,3,6,7,8,9,0,4],"literal");
		assert.deepEqual(U(arr2,function(v){return v.id}),[arr2[2],arr2[1]],"object");
		
	});
	
})(Morgas,Morgas.setModule,Morgas.getModule,Morgas.hasModule,Morgas.shortcut);