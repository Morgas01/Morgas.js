(function(){
/*
	var globals=Object.keys(window);
	QUnit.done(function()
	{
		var addedGlobals=Object.keys(window).filter(e=>globals.indexOf(e)==-1&&e!="Morgas"&&e!="µ"&&e!="DBTest")
		if(addedGlobals.length>0) alert(`⚠ added globals: ${addedGlobals}`);
	});
*/
	var srcDir="../src/",
	testDir="tests/";

	var WR=function(filenName){
		document.write('<script type="application/javascript" charset="utf-8" src="'+srcDir+filenName+'"></script>');
		document.write('<script type="application/javascript" charset="utf-8" src="'+testDir+filenName+'"></script>');
	};


	WR("Morgas.js");
	WR("Morgas.util.array.remove.js");
	WR("Morgas.util.function.rescope.js");
	WR("Morgas.Patch.js");
	WR("Morgas.global.js");
	WR("Morgas.Event.js");
	WR("Morgas.Config.js");
	WR("Morgas.util.fuzzySearch.js");
	WR("Morgas.util.object.uniquify.js");
	WR("Morgas.util.object.register.js");
	WR("Morgas.DependencyResolver.js");
	WR("Morgas.util.object.adopt.js");
	WR("Morgas.Promise.js");
	WR("Morgas.util.crc32.js");
	WR("Morgas.util.function.proxy.js");
	WR("Morgas.util.object.goPath.js");
	WR("Morgas.util.object.equals.js");
	WR("Morgas.util.object.inputValues.js");
/*

	WR(srcDir+"Morgas.util.object.iterate.js");
	WR(testDir+"test.Morgas.util.object.iterate.js");

	WR(srcDir+"Morgas.util.object.iterateAsync.js");
	WR(testDir+"test.Morgas.util.object.iterateAsync.js");

	WR(srcDir+"Morgas.util.Request.js");
	WR(testDir+"test.Morgas.util.request.js");

	WR(srcDir+"Morgas.util.converter.csv.js");
	WR(testDir+"test.Morgas.util.converter.csv.js");

	WR(srcDir+"Morgas.SortedArray.js");
	WR(testDir+"test.Morgas.SortedArray.js");

	WR(srcDir+"Morgas.Organizer.js");
	WR(testDir+"test.Morgas.Organizer.js");

	WR(srcDir+"Morgas.NodePatch.js");
	WR(testDir+"test.Morgas.NodePatch.js");

	WR(srcDir+"Morgas.NodePatch.treeCompare.js");
	WR(testDir+"test.Morgas.NodePatch.treeCompare.js");

	WR(srcDir+"Morgas.Worker.js");
	WR(testDir+"test.Morgas.Worker.js");

	WR(srcDir+"DB/Morgas.DB.js");
	WR(testDir+"test.Morgas.DB.js");

	WR(srcDir+"DB/Morgas.DB.ObjectConnector.js");
	WR(testDir+"test.Morgas.DB.ObjectConnector.js");

	WR(srcDir+"DB/Morgas.DB.IndexedDBConnector.js");
	WR(testDir+"test.Morgas.DB.IndexedDBConnector.js");
	*/

})();
