(function(µ,SMOD,GMOD){
    µ.dependencies={
        "Morgas.js":true,
        "Morgas.Patch.js":{
        	deps:["Morgas.js"],
        	uses:[]
        },
        "Morgas.Listeners.js":"Morgas.js",
        "Morgas.util.function.bind.js":"Morgas.js",
        "Morgas.util.function.rescope.js":"Morgas.js",
        "Morgas.util.function.proxy.js":{
        	deps:["Morgas.js"],
        	uses:["Morgas.util.object.iterate.js"]
        },
        "Morgas.DependencyResolver.js":"Morgas.js",
        "Morgas.NodePatch.js":{deps:["Morgas.js","Morgas.Patch.js"],uses:["Morgas.util.function.proxy.js"]},
        "Morgas.util.object.adopt.js":"Morgas.js",
        "Morgas.util.object.goPath.js":"Morgas.js",
        "Morgas.util.object.equals.js":"Morgas.js",
        "Morgas.util.object.find.js":{
        	deps:["Morgas.js"],
        	uses:["Morgas.util.object.equals.js"]
        },
        "Morgas.util.object.inputValues.js":{
        	deps:["Morgas.js"],
        	uses:["Morgas.util.object.goPath.js"]
        },
        "Morgas.util.object.iterate.js":"Morgas.js",
        "Morgas.util.object.iterateAsync.js":{
        	deps:["Morgas.js"],
        	uses:["Morgas.util.object.iterate.js","Morgas.Detached.js"]
        },
        "Morgas.util.object.uniquify.js":"Morgas.js",
        "Morgas.util.download.js":"Morgas.js",
        "Morgas.util.crc32.js":"Morgas.js",
        "Morgas.util.converter.csv.js":"Morgas.js",
        "Morgas.util.queryParam.js":"Morgas.js",
		"Morgas.util.request.js":{
			deps:["Morgas.js"],
			uses:["Morgas.Detached.js"]
		},
        "Morgas.Organizer.js":{
        	deps:["Morgas.js"],
        	uses:["Morgas.util.object.equals.js","Morgas.util.object.iterate.js","Morgas.util.object.goPath.js"]
        },
        "Morgas.Detached.js":"Morgas.js",
        "Morgas.Promise.js":"Morgas.js",

        "DB/Morgas.DB.js":{
        	deps:["Morgas.js"],
        	uses:["Morgas.Detached.js"]
        },
        "DB/Morgas.DB.ObjectConnector.js":{
        	deps:["Morgas.js","DB/Morgas.DB.js","Morgas.Organizer.js"],
        	uses:["Morgas.util.object.equals.js","Morgas.util.object.find.js"]
        },
        "DB/Morgas.DB.IndexedDBConnector.js":{
        	deps:["Morgas.js","DB/Morgas.DB.js"],
        	uses:["Morgas.Detached.js","Morgas.util.object.equals.js","Morgas.util.object.find.js","Morgas.util.object.iterate.js"]
        },
        "DB/Morgas.Organizer.LazyCache.js":{
        	deps:["Morgas.js","Morgas.Organizer.js"],
        	uses:["Morgas.Detached.js","Morgas.util.object.iterate.js"]
        }
    };
})(Morgas,Morgas.setModule,Morgas.getModule);