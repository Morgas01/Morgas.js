(function(µ,SMOD,GMOD){
    var DepRes=GMOD("DepRes");
    µ.dependencies=new DepRes({
        "Morgas.js":true,
        "Morgas.DependencyResolver.js":"Morgas.js",
        "Morgas.NodePatch.js":"Morgas.js",
        "Morgas.util.object.js":"Morgas.js",
        "Morgas.util.download.js":"Morgas.js",
        "Morgas.util.crc.js":"Morgas.js",
        "Morgas.Organizer.js":{deps:["Morgas.js"],uses:["Morgas.util.object.js"]},
        "Morgas.Detached.js":"Morgas.js",

        "DB/Morgas.DB.js":{deps:["Morgas.js"],uses:["Morgas.Detached.js"]},
        "DB/Morgas.DB.ObjectConnector.js":{deps:["Morgas.js","DB/Morgas.DB.js","Morgas.Organizer.js"],uses:["Morgas.util.object.js"]},
        "DB/Morgas.DB.IndexedDBConnector.js":{deps:["Morgas.js","DB/Morgas.DB.js"],uses:["Morgas.Detached.js","Morgas.util.object.js"]},
        "DB/Morgas.Organizer.LazyCache.js":{deps:["Morgas.js","Morgas.Organizer.js"],uses:["Morgas.Detached.js","Morgas.util.object.js"]}
    });
})(Morgas,Morgas.setModule,Morgas.getModule);