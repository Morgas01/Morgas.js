let fs=require("fs");
let path=require("path");

console.log(process.argv);

require("./..");

let dependencyParser=require("./dependencyParser");
let minify=require("./minify");

let SC=µ.shortcut({
	File:"File",
	util:"File.util",
	DepRes:"DepRes"
});

let rootDir=new SC.File(__dirname).changePath("..");
let sourceDir=rootDir.clone().changePath("src");
let outputDir=rootDir.clone().changePath("build");

new dependencyParser()
.addSources([sourceDir,sourceDir.clone().changePath("DB")])
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

	if(process.argv.length>2)
	{
		let outputFilename=process.argv[2];
		let outputFile=outputDir.clone().changePath(outputFilename);
		let outputMap=outputDir.clone().changePath(outputFilename+".map");
		let resolver=new SC.DepRes(result.fileDependencies);

		let moduleFiles=process.argv.slice(3)
		.map(module=>
		{
			let file=result.moduleRegister[module];
			if(!file) throw `module "${module}" unknown`;
			return file;
		});
        let resolvedFiles=resolver.resolve(moduleFiles);

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
				outputFile.write(concat.content),
				outputMap.write(new Buffer(concat.sourceMap).toString("base64"))
			]);
		});
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