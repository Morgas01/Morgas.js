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
		try{fs.unlinkSync(outFile);}catch(e){}
		fs.linkSync(inFile,outFile);
	}
};
var FILE_ENCODING = 'utf-8',EOL = '\n';
var createPackage=function(name,sources)
{
	console.log("package: "+name);
	var packageFiles=µ.dependencies.resolve(sources).map(function(f)
	{
		return "//"+f+EOL+fs.readFileSync(__dirname+"/src/"+f, FILE_ENCODING);}
	).join(EOL);
	fs.writeFileSync(__dirname+"/build/"+name+".js",packageFiles);
	try
	{
		var minPackage=uglify.minify(__dirname+"/build/"+name+".js",{outSourceMap: name+"-min.js.map"})
		fs.writeFileSync(__dirname+"/build/"+name+"-min.js",minPackage.code);
		fs.writeFileSync(__dirname+"/build/"+name+"-min.js.map",minPackage.map);
	} catch(e){console.log("could not minify "+name+".js");}
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

createPackage("Morgas_CORE",["Morgas.js"]);
createPackage("Morgas_DB",["DB/Morgas.DB.js","DB/Morgas.DB.ObjectConnector.js","DB/Morgas.DB.IndexedDBConnector.js","DB/Morgas.Organizer.LazyCache.js"]);
createPackage("Morgas_FULL",Object.keys(µ.dependencies.config));