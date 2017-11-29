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
			{path:"Morgas.util.array.remove.js",nodeJs:true,web:true},
			{path:"Morgas.util.array.flatten.js",nodeJs:true,web:true},
			{path:"Morgas.util.function.rescope.js",nodeJs:true,web:true},
			{path:"Morgas.Patch.js",nodeJs:true,web:true},
			{path:"Morgas.Event.js",nodeJs:true,web:true},
			{path:"Morgas.Config.js",nodeJs:true,web:true},
			{path:"Morgas.util.fuzzySearch.js",nodeJs:true,web:true},
			{path:"Morgas.util.object.uniquify.js",nodeJs:true,web:true},
			{path:"Morgas.util.object.register.js",nodeJs:true,web:true},
			{path:"Morgas.DependencyResolver.js",nodeJs:true,web:true},
			{path:"Morgas.util.object.adopt.js",nodeJs:true,web:true},
			{path:"Morgas.Promise.js",nodeJs:true,web:true},
			{path:"Morgas.util.crc32.js",nodeJs:true,web:true},
			{path:"Morgas.util.function.proxy.js",nodeJs:true,web:true},
			{path:"Morgas.util.object.goPath.js",nodeJs:true,web:true},
			{path:"Morgas.util.object.equals.js",nodeJs:true,web:true},
			{path:"Morgas.util.object.inputValues.js",nodeJs:false,web:true},
			{path:"Morgas.util.request.js",nodeJs:false,web:true},
			{path:"Morgas.util.converter.csv.js",nodeJs:false,web:true}, // remove request module from test for nodeJs
			{path:"Morgas.util.converter.metricUnit.js",nodeJs:true,web:true},
			{path:"Morgas.SortedArray.js",nodeJs:true,web:true},
			{path:"Morgas.Organizer.js",nodeJs:true,web:true},
			{path:"Morgas.NodePatch.js",nodeJs:true,web:true},
			{path:"Morgas.NodePatch.Compare.js",nodeJs:true,web:true},
			{path:"Morgas.AbstractWorker.js",nodeJs:true,web:true},
			{path:"Morgas.Worker.js",nodeJs:false,web:true},
			{path:"DB/Morgas.DB.js",nodeJs:true,web:true},
			{path:"DB/Morgas.DB.ObjectConnector.js",nodeJs:true,web:true},
			{path:"DB/Morgas.DB.IndexedDBConnector.js",nodeJs:false,web:true},

			{path:"NodeJs/nodeWorker.js",nodeJs:true,web:false}
		]
	};
})()