(function(µ,GMOD){

	module("util.function.rescope");
	
	test("rescope",function()
	{
		var scope={
			fn:function(){
				ok(this===otherScope);
			}
		};
		var otherScope={};
		
		scope.fn=GMOD("rescope")(scope.fn,otherScope);
		scope.fn();
	})
})(Morgas,Morgas.getModule);