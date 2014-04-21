(function(){
	var WR=function(path){
		document.write('<script type="text/javascript" charset="utf-8" src="'+path+'"></script>');
	};
	
	var srcDir="./",
	testDir="tests/";
	//core
	WR(srcDir+"Morgas.js");
	WR(testDir+"test.Morgas.js");

	//Detached
	WR(srcDir+"Morgas.Detached.js");
	WR(testDir+"test.Morgas.Detached.js");

	//util.object
	WR(srcDir+"Morgas.util.object.js");
	WR(testDir+"test.Morgas.util.object.js");
	
	//util.object
	WR(srcDir+"Morgas.Organizer.js");
	WR(testDir+"test.Morgas.Organizer.js");
})()