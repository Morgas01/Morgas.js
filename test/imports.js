(function(){
	var WR=function(path){
		document.write('<script type="text/javascript" charset="utf-8" src="'+path+'"></script>');
	};
	
	var srcDir="./",
	testDir="tests/";

	
	WR(srcDir+"Morgas.js");
	WR(testDir+"test.Morgas.js");

	WR(srcDir+"Morgas.Detached.js");
	WR(testDir+"test.Morgas.Detached.js");

	WR(srcDir+"Morgas.util.object.js");
	WR(testDir+"test.Morgas.util.object.js");

	WR(srcDir+"Morgas.Organizer.js");
	WR(testDir+"test.Morgas.Organizer.js");
	
	WR(srcDir+"Morgas.NodePatch.js");
	WR(testDir+"test.Morgas.NodePatch.js");
})()