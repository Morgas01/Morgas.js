(function(µ,SMOD,GMOD,HMOD,SC){

	QUnit.module("util.function.bind");
	
	QUnit.test("bind",function(assert)
	{
		var scope={
			fn:function(value){
				assert.ok(this===otherScope,"scope");
				assert.ok(value===3,"param")
			}
		};
		var otherScope={};
		
		scope.fn=GMOD("bind")(scope.fn,otherScope,3);
		scope.fn(1);
	});
	
})(Morgas,Morgas.setModule,Morgas.getModule,Morgas.hasModule,Morgas.shortcut);