var fs=require("fs");
var path=require("path");

require("./..");

var dependencyParser=require("./dependencyParser");
var minify=require("./minify");

var SC=µ.shortcut({
	File:"File",
	DepRes:"DepRes"
});

var rootDir=new SC.File(".");
var outputDir=rootDir.clone().changePath("build");

new dependencyParser()
.addSources(["src","src/DB"])
.parse("src")
.then(function(result)
{
	rootDir.clone().changePath("src/Morgas.ModuleRegister.json").write(JSON.stringify(result.moduleRegister,null,"\t")).then(null,function(err)
	{
		µ.logger.error("could not save ModuleRegister",err);
	});
	rootDir.clone().changePath("src/Morgas.ModuleDependencies.json").write(JSON.stringify(result.moduleDependencies,null,"\t")).then(null,function(err)
	{
		µ.logger.error("could not save ModuleDependencies",err);
	});
	rootDir.clone().changePath("src/Morgas.Dependencies.json").write(JSON.stringify(result.fileDependencies,null,"\t")).then(null,function(err)
	{
		µ.logger.error("could not save Dependencies",err);
	});
/*
	outputDir.remove().then(function()
	{
		var resolver=new SC.DepRes(result.fileDependencies,"src/");

		files=Object.keys(resolver.config);

		return SC.itAs(files,(i,f)=>minify(f.slice(4),[f],"build"))
	})
	.then(()=>minify("Morgas_DB.js",resolver.resolve(["src/DB/Morgas.DB.js","src/DB/Morgas.DB.ObjectConnector.js","src/DB/Morgas.DB.IndexedDBConnector.js"]),"build"))
	.then(()=>minify("Morgas_FULL.js",resolver.resolve(Object.keys(resolver.config)),"build"));
*/
})
.then(function()
{
	console.log("build finished!");
},
function(error)
{
	console.error("build failed!",error,error.stack);
});