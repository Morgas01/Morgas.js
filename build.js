var fs=require("fs");
var path=require("path");

var enshureFolder=require("./src/NodeJs/enshureFolder");
var removeFolder=require("./src/NodeJs/removeFolder");

removeFolder("build");

require("./parseDependencies")(["src","src/DB"]).then(function(dependencies)
{
	require("./src/Morgas.js");

	require("./src/Morgas.DependencyResolver.js");
	var resolver=new µ.DependencyResolver(dependencies);


	var uglify=require("uglify-js");

	var minify=function(packageName,files)
	{
		enshureFolder(path.dirname("build/"+packageName));
		files=files.map(function(a){return "src/"+a});
		try
		{
			var minPackage=uglify.minify(files,{outSourceMap: packageName+".map"});
			fs.writeFileSync("build/"+packageName,minPackage.code);
			fs.writeFileSync("build/"+packageName+".map",minPackage.map);
		}
		catch (e)
		{
			console.log("could not minify",packageName,e.message,e.filename,e.line);
			try
			{
				var code=files.map(function(f){return fs.readFileSync(f,{encode:"UTF-8"})}).join("\n");
				fs.writeFileSync("build/"+packageName,code);
			}
			catch(e)
			{
				console.error("could not copy",packageName,e);
			}
		}
	};
	files=Object.keys(resolver.config);
	for(var i=0;i<files.length;i++)
	{
			minify(files[i],[files[i]]);
	}

	minify("Morgas_CORE.js",["Morgas.js"]);
	minify("Morgas_DB.js",["DB/Morgas.DB.js","DB/Morgas.DB.ObjectConnector.js","DB/Morgas.DB.IndexedDBConnector.js","DB/Morgas.Organizer.LazyCache.js"]);
	minify("Morgas_FULL.js",Object.keys(resolver.config));
}).catch(function(error)
{
	console.error("build failed!",error,error.stack);
});