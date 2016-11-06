(function(µ,SMOD,GMOD,HMOD,SC){

	QUnit.module("util.function.rescope");
	
	QUnit.test("rescope",function(assert)
	{
		var scope={
			fn:function(){
				assert.ok(this===otherScope);
			}
		};
		var otherScope={};
		
		scope.fn=GMOD("rescope")(scope.fn,otherScope);
		scope.fn();
	})
})(Morgas,Morgas.setModule,Morgas.getModule,Morgas.hasModule,Morgas.shortcut);