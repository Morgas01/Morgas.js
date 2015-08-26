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
			if(dep.file=="Morgas.js")
			{
				rtn[dep.file]=true;
			}
			else
			{
				rDep=rtn[dep.file]={};
				if(!dep.deps)
				{
					rDep.deps=["Morgas.js"];
				}
				else
				{
					rDep.deps=mapToMap(dep.deps,moduleFiles,dep.file);
					rDep.deps.unshift("Morgas.js");
				}
				if(dep.uses)
				{
					rDep.uses=mapToMap(dep.uses,moduleFiles);
					if(Array.isArray(rDep.deps))
					{
						for(var d=0;d<rDep.deps.length;d++)
						{
							var index=rDep.uses.indexOf(rDep.deps[d]);
							if(index!==-1)rDep.uses.splice(index,1);
						}
					}
				}
			}
		}
		fs.writeFile("src/Morgas.Dependencies.json",JSON.stringify(rtn,null,"\t"),function(err)
		{
			if(err) console.error("could not save Dependencies",err);
		});
		return rtn;
	});
}
function mapToMap(arr,map)
{
	var set=new Set();
	for(var a of arr)
	{
		if(!(a in map)) console.warn("module",a,"not found");
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


	var uglify=require("uglify-js");

	var minify=function(packageName,files)
	{
		files=files.map(function(a){return "src/"+a});
		try
		{
			var minPackage=uglify.minify(files,{outSourceMap: packageName+".map"});
			fs.writeFileSync("build/"+packageName,minPackage.code);
			fs.writeFileSync("build/"+packageName+".map",minPackage.map);
		}
		catch (e)
		{
			console.log("could not minify",packageName,e);
		}
	};
	files=Object.keys(resolver.config);
	for(var i=0;i<files.length;i++)
	{
			minify(files[i],[files[i]]);
	}

	minify("Morgas_CORE",["Morgas.js"]);
	minify("Morgas_DB",["DB/Morgas.DB.js","DB/Morgas.DB.ObjectConnector.js","DB/Morgas.DB.IndexedDBConnector.js","DB/Morgas.Organizer.LazyCache.js"]);
	minify("Morgas_FULL",Object.keys(resolver.config));
}).catch(function(error)
{
	console.error("build failed!",error,error.stack);
});