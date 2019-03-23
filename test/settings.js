(function(){

	let globalScope=this;
	let globalKeys=Object.keys(globalScope);

	globalKeys.push("Morgas","µ","DBTest","testSettings","WorkerTest");

	testSettings={
		checkGlobals:function()
		{
			let addedGlobals=Object.keys(globalScope).filter(e=>globalKeys.indexOf(e)==-1);
			return addedGlobals;
		},
		tests:[
			{path:"Morgas.js",nodeJs:true,web:true},
			{path:"util/array/remove.js",nodeJs:true,web:true},
			{path:"util/array/flatten.js",nodeJs:true,web:true},
			{path:"util/function/rescope.js",nodeJs:true,web:true},
			{path:"Patch.js",nodeJs:true,web:true},
			{path:"Event.js",nodeJs:true,web:true},
			{path:"Config.js",nodeJs:true,web:true},
			{path:"util/fuzzySearch.js",nodeJs:true,web:true},
			{path:"util/object/uniquify.js",nodeJs:true,web:true},
			{path:"util/object/register.js",nodeJs:true,web:true},
			{path:"DependencyResolver.js",nodeJs:true,web:true},
			{path:"util/object/adopt.js",nodeJs:true,web:true},
			{path:"Promise.js",nodeJs:true,web:true},
			{path:"util/crc32.js",nodeJs:true,web:true},
			{path:"util/function/proxy.js",nodeJs:true,web:true},
			{path:"util/object/goPath.js",nodeJs:true,web:true},
			{path:"util/object/equals.js",nodeJs:true,web:true},
			{path:"util/object/inputValues.js",nodeJs:false,web:true},
			{path:"util/map/register.js",nodeJs:true,web:true},
			{path:"util/request.js",nodeJs:false,web:true},
			{path:"util/converter/csv.js",nodeJs:false,web:true}, //TODO remove request module from test for nodeJs
			{path:"util/converter/metricUnit.js",nodeJs:true,web:true},
			{path:"SortedArray.js",nodeJs:true,web:true},
			{path:"Organizer.js",nodeJs:true,web:true},
			{path:"NodePatch.js",nodeJs:true,web:true},
			{path:"NodePatch/Compare.js",nodeJs:true,web:true},
			{path:"AbstractWorker.js",nodeJs:true,web:true},
			{path:"Worker.js",nodeJs:false,web:true},
			{path:"DB.js",nodeJs:true,web:true},
			{path:"DB/ObjectConnector.js",nodeJs:true,web:true},
			{path:"DB/IndexedDBConnector.js",nodeJs:false,web:true},
			{path:"Transmuter.js",nodeJs:true,web:true},

			{path:"NodeJs/nodeWorker.js",nodeJs:true,web:false}
		]
	};
})()