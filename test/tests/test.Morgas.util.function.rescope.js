(function(µ,GMOD){

	module("util.function.rescope");
	
	test("rescope",function()
	{
		let scope={
			fn:function(){
				ok(this===otherScope);
			}
		};
		let otherScope={};
		
		scope.fn=GMOD("rescope")(scope.fn,otherScope);
		scope.fn();
	})
})(Morgas,Morgas.getModule);