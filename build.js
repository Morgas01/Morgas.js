require("./src/Morgas.js");
require("./src/Morgas.DependencyResolver.js");
require("./src/Morgas.Dependencies.js");

var fs=require("fs");

var uglify=require("uglify-js2");

var minify=function(name)
{
	var inFile=__dirname+"/src/"+name;
	var outFile=__dirname+"/build/"+name;
	console.info(inFile+" => "+outFile);
	try
	{
		fs.writeFileSync(outFile,uglify.minify(inFile).code);
	}
	catch (e)
	{
		fs.linkSync(inFile,outFile);
	}
};
var FILE_ENCODING = 'utf-8',EOL = '\n';
var createPackage=function(name,sources)
{
	var packageFiles=µ.dependencies.resolve(sources).map(function(f)
	{
		return "//"+f+EOL+fs.readFileSync(__dirname+"/build/"+f, FILE_ENCODING);}
	).join(EOL);
	fs.writeFileSync(__dirname+"/build/"+name,packageFiles);
};

var files=Object.keys(µ.dependencies.config);
for(var i=0;i<files.length;i++)
{
	try{
		minify(files[i]);
	}catch(e){
		console.error(e);
	}
}

createPackage("Morgas_CORE.js",["Morgas.js"]);
createPackage("Morgas_DB.js",["DB/Morgas.DB.js","DB/Morgas.DB.ObjectConnector.js","DB/Morgas.DB.IndexedDBConnector.js","DB/Morgas.Organizer.LazyCache.js"]);
createPackage("Morgas_FULL.js",Object.keys(µ.dependencies.config));