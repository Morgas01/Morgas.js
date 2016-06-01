var fs=require("fs");
var path=require("path");

require("./src/NodeJs/Morgas.NodeJs");

var parseDependencies=require("./parseDependencies");
var minify=require("./minify");

var SC=µ.shortcut({
	File:"File",
	DepRes:"DepRes",
	itAs:"iterateAsync"
});

var rootDir=new SC.File(".");
var outputDir=rootDir.clone().changePath("build");

outputDir.remove().then(function()
{
	return parseDependencies("src/Morgas.js",["src","src/DB"],"src");
})
.then(function(result)
{
	rootDir.clone().changePath("src/Morgas.ModuleRegister.json").write(JSON.stringify(result.modules,null,"\t")).then(null,function(err)
	{
		if(err) console.error("could not save ModuleRegister",err);
	});
	rootDir.clone().changePath("src/Morgas.Dependencies.json").write(JSON.stringify(result.dependencies,null,"\t")).then(null,function(err)
	{
		if(err) console.error("could not save Dependencies",err);
	});

	var resolver=new SC.DepRes(result.dependencies,"src/");

	files=Object.keys(resolver.config);
	
	return SC.itAs(files,(i,f)=>minify(f.slice(4),[f],"build"))
	.then(()=>minify("Morgas_DB.js",resolver.resolve(["src/DB/Morgas.DB.js","src/DB/Morgas.DB.ObjectConnector.js","src/DB/Morgas.DB.IndexedDBConnector.js","src/DB/Morgas.Organizer.LazyCache.js"]),"build"))
	.then(()=>minify("Morgas_FULL.js",resolver.resolve(Object.keys(resolver.config)),"build"));
})
.then(function()
{
	console.log("build finished!");
},
function(error)
{
	console.error("build failed!",error,error.stack);
});