/** process.argv:  filename, module[, ...module_n] */

let fs=require("fs");
let path=require("path");

require("..");

let packageJson=require("../package");
if(packageJson.version!=µ.version) µ.logger.warn(`code version (${µ.version}) not equals to npm package version (${packageJson.version})!`)

let dependencyParser=require("./dependencyParser");
let minify=require("./minify");

let SC=µ.shortcut({
	File:"File",
	util:"File/util",
	DepRes:"DepRes"
});

let rootDir=new SC.File(__dirname).changePath("..");
let sourceDir=rootDir.clone().changePath("src");
let outputDir=rootDir.clone().changePath("build");

new dependencyParser()
.addSources([
	sourceDir,
	sourceDir.clone().changePath("DB"),
	sourceDir.clone().changePath("util"),
	sourceDir.clone().changePath("util/array"),
	sourceDir.clone().changePath("util/converter"),
	sourceDir.clone().changePath("util/function"),
	sourceDir.clone().changePath("util/map"),
	sourceDir.clone().changePath("util/object"),
	sourceDir.clone().changePath("NodePatch")
])
.parse(sourceDir)
.then(function(result)
{
	sourceDir.clone().changePath("Morgas.ModuleRegister.json").write(JSON.stringify(result.moduleRegister,null,"\t")).then(null,function(err)
	{
		µ.logger.error("could not save ModuleRegister",err);
	});
	sourceDir.clone().changePath("Morgas.ModuleDependencies.json").write(JSON.stringify(result.moduleDependencies,null,"\t")).then(null,function(err)
	{
		µ.logger.error("could not save ModuleDependencies",err);
	});
	sourceDir.clone().changePath("Morgas.Dependencies.json").write(JSON.stringify(result.fileDependencies,null,"\t")).then(null,function(err)
	{
		µ.logger.error("could not save Dependencies",err);
	});

	let resolver=new SC.DepRes(result.fileDependencies);
	let createBundle=function(outputFilename,modules)
	{
		let outputFile=outputDir.clone().changePath(outputFilename);
		let outputMap=outputDir.clone().changePath(outputFilename+".map");

		let moduleFiles=modules.map(module=>
		{
			let file=result.moduleRegister[module];
			if(!file) throw `module "${module}" unknown`;
			return file;
		});
		let resolvedFiles=resolver.resolve(moduleFiles);
		resolvedFiles.unshift("Morgas.js");

		return SC.util.enshureDir(outputDir)
		.then(()=>Promise.all(resolvedFiles
			.map(f=>sourceDir.clone().changePath(f)
				.read()
				.then(data=>({name:f,data:data}))
			)
		))
		.then(function(fileContents)
		{
			let Concat=require("concat-with-sourcemaps");
			let concat=new Concat(true,outputFilename,"\n/********************/\n");
			for (let {name,data} of fileContents)
			{
				concat.add(name,data);
			}

			return Promise.all([
				outputFile.write(concat.content+"\n//# sourceMappingURL="+outputMap.getName()),
				outputMap.write(new Buffer(concat.sourceMap))
			]);
		});
	};

	createBundle("Morgas-"+µ.version+".js",Object.keys(result.moduleRegister));

	if(process.argv.length>2)
	{
		let outputFilename=process.argv[2];
		let modules=process.argv.slice(3);

		createBundle(outputFilename,modules);
	}
})
.then(function()
{
	console.log("build finished!");
},
function(error)
{
	console.error("build failed!",error,error.stack);
});