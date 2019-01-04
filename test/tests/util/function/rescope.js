QUnit.module("util.function.rescope",function()
{

	QUnit.test("rescope",function(assert)
	{
		let otherScope={};
		let scope={
			fn:function(){
				assert.ok(this===otherScope);
			}
		};

		scope.fn=µ.util.function.rescope(scope.fn,otherScope);
		scope.fn();
	});

});