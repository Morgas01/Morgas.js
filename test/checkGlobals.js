(function(){
	let globalScope=this;
	let globalKeys=Object.keys(globalScope);

	globalKeys.push("Morgas","µ","DBTest","WorkerTest","checkGlobals");

	checkGlobals=function()
	{
		let addedGlobals=Object.keys(globalScope).filter(e=>globalKeys.indexOf(e)==-1);

		QUnit.test("globals",function(assert)
		{
			assert.deepEqual(addedGlobals,[],"added globals");
		});
	}
})();