var fs=require("fs");
var path=require("path");

var dirs=["src","src/DB"];

function concatall(results)
{
	return Array.prototype.concat.apply([],results);
	//return [].concat(Array.slice(results,0));
}
function getFileList()
{
	var p=[];
	dirs.forEach(function(dir)
	{
		p.push(new Promise(function(rs)
		{
			fs.readdir(dir,function(err,list)
			{
				if(err) throw err;
				var fList=[];
				list.forEach(function(file)
				{
					if(path.extname(file)===".js")fList.push(path.join(dir,file))
				});
				rs(fList);
			})
		}))
	});
	return Promise.all(p).then(concatall)
}

function collectDependencies()
{
	var depsRegEx=/SC=SC\(((?:[^\)]||\);)+)\);/m;
	return getFileList().then(function(list)
	{
		var pFile=[];
		list.forEach(function(filePath)
		{
			pFile.push(new Promise(function (rs)
			{
				fs.readFile(filePath,{encoding:"UTF-8"},function(err,data)
				{
					var deps,uses,prov;
					var match=data.match(depsRegEx);
					if(match)
					{
						uses=match[1].match(/"[^"]+"/g);
						if(uses)uses=uses.map(function(a){return a.slice(1,-1)});
						deps=data.slice(0,match.index).match(/GMOD\("[^"]+"\)/g);
						if (deps)deps=deps.map(function(a){return a.slice(6,-2)});
					}
					prov=data.match(/SMOD\("[^"]+"/g);
					if (prov)prov=prov.map(function(a){return a.slice(6,-1)});
					rs({file:filePath.slice(4).replace(/\\/g,"/"),deps:deps,uses:uses,prov:prov});
				});
			}));
		});
		return Promise.all(pFile);
	})
	.then(function(dependencies)
	{
		var moduleFiles={};
		for(var i=0;i<dependencies.length;i++)
		{
			var dep=dependencies[i];
			if(dep.prov)
			{
				for(var p=0;p<dep.prov.length;p++)
				{
					if(dep.prov[p] in moduleFiles) console.warn("module",dep.prov[p],"aleardy defined in",moduleFiles[dep.prov[p]]);
					moduleFiles[dep.prov[p]]=dep.file;
				}
			}
		}
		fs.writeFile("src/Morgas.ModuleRegister.json",JSON.stringify(moduleFiles,null,"\t"),function(err)
		{
			if(err) console.error("could not save ModuleRegister",err);
		});
		var rtn={};
		for(var i=0;i<dependencies.length;i++)
		{
			var dep=dependencies[i];
			rDep=rtn[dep.file]={};
			if(!dep.deps)
			{
				if(dep.file=="Morgas.js")rDep.deps=true;
				else rDep.deps=["Morgas.js"];
			}
			else
			{
				rDep.deps=mapToMap(dep.deps,moduleFiles,dep.file);
				rDep.deps.unshift("Morgas.js");
			}
			if(dep.uses)rDep.uses=mapToMap(dep.uses,moduleFiles,dep.file);
		}
		fs.writeFile("src/Morgas.Dependencies.json",JSON.stringify(rtn,null,"\t"),function(err)
		{
			if(err) console.error("could not save Dependencies",err);
		});
		return rtn;
	});
}
function mapToMap(arr,map,file)
{
	var set=new Set();
	for(var a of arr)
	{
		if(!(a in map)) console.warn("module",a,"not found",file);
		else set.add(map[a]);
	}
	var rtn=[];
	var it=set.values();
	var step=null;
	while(!(step=it.next()).done) rtn.push(step.value);
	return rtn;
}

//execute
collectDependencies().then(function(dependencies)
{
	require("./src/Morgas.js");

	require("./src/Morgas.DependencyResolver.js");
	var resolver=new µ.DependencyResolver(dependencies);

	/*

	 - make async
	 - hold read files

	var uglify=require("uglify-js");

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
		var packageFiles=resolver.resolve(sources).map(function(f)
		{
			return "//"+f+EOL+fs.readFileSync(__dirname+"/src/"+f, FILE_ENCODING);}
		).join(EOL);
		fs.writeFileSync(__dirname+"/build/"+name+".js",packageFiles);
		try
		{
			var minPackage=uglify.minify(__dirname+"/build/"+name+".js",{outSourceMap: name+"-min.js.map"});
			fs.writeFileSync(__dirname+"/build/"+name+"-min.js",minPackage.code);
			fs.writeFileSync(__dirname+"/build/"+name+"-min.js.map",minPackage.map);
		} catch(e){console.log("could not minify "+name+".js");}
	};

	var files=Object.keys(resolver.config);
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
	createPackage("Morgas_FULL",Object.keys(resolver.config));
	*/
});