(function(testSettings){

	let srcDir="../src/",
	testDir="tests/";

	testSettings.tests.forEach(function(test)
	{
		if(test.web)
		{
			document.write('<script type="application/javascript" charset="utf-8" src="'+srcDir+test.path+'"></script>');
			document.write('<script type="application/javascript" charset="utf-8" src="'+testDir+test.path+'"></script>');
		}
	});

	QUnit.on("runStart",function()
	{
		µ.logger.setLevel(µ.logger.LEVEL.trace);
	});

	QUnit.log(console.info);

	QUnit.done(function()
	{
		let addedGlobals=testSettings.checkGlobals();
		if(addedGlobals.length>0) alert(`⚠ added globals: ${addedGlobals}`);
	});
})(window.testSettings);
