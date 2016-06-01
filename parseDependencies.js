var fs=require("fs");
var path=require("path");

var File=µ.getModule("File");
var uniquify=µ.getModule("uniquify");

var flatten= Array.prototype.concat.apply.bind(Array.prototype.concat,[]);

var mapModuleToFile=function (modules,register)
{
	return uniquify(modules.map(m=>
	{
		if(!(m in register))
		{
			µ.logger.warn("module",m,"not found");
			return false;
		}
		return register[m];
	}).filter(µ.constantFunctions.pass));
}

var depsRegEx=/SC=SC\(((?:[^\)]||\);)+)\);/m;

var relativatePath=function(file,referencePath)
{
	return path.relative(referencePath,file.getAbsolutePath()).replace(/\\/g,"/");
}

module.exports=function collectDependencies(morgasJs,files,referencePath)
{
	morgasJs=File.stringToFile(morgasJs);
	files.push(morgasJs);
	return Promise.all(files.map(File.stringToFile).map(file=>
		file.stat().then(s=>
			s.isDirectory() ?
				file.listFiles()
				.then(list=>
					list.filter(f=>path.extname(f)===".js")
					.map(f=>file.clone().changePath(f))) :
				file
			)
		)
	)
	.then(flatten)
	.then(files=>uniquify(files,f=>f.getAbsolutePath()))
	.then(function(files)
	{
		return Promise.all( files.map(file=>
			file.read({encoding:"UTF-8"})
			.then(function(data)
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
				else
				{
					µ.logger.warn(file.getName()+" does not have a shortcut section [ SC=SC({}); ]")
				}
				
				prov=data.match(/SMOD\("[^"]+"/g);
				if (prov)
				{
					prov=prov.map(function(a){return a.slice(6,-1)});
				}
				else
				{
					µ.logger.error(file.getName()+' does not provide a module [ SMOD(""); ]');
				}
				
				return {
					file:file,
					filePath:relativatePath(file,referencePath),
					deps:deps,
					uses:uses,
					prov:prov
				};
			})
		));
	})
	.then(function(dependencies)
	{
		var rtn={
			modules:{},
			dependencies:{}
		};

		for(var dep of dependencies)
		{
			if(dep.prov)
			{
				for(var module of dep.prov)
				{
					if(module in rtn.modules) µ.logger.warn("module",module,"aleardy defined in",rtn.modules[module]);
					rtn.modules[module]=dep.filePath;
				}
			}
		}
		
		for(var dep of dependencies)
		{
			if(dep.file===morgasJs)
			{
				rtn.dependencies[dep.filePath]=true;
			}
			else
			{
				var rDep={};
				rtn.dependencies[dep.filePath]=rDep;
				if(!dep.deps)
				{
					rDep.deps=[relativatePath(morgasJs,referencePath)];
				}
				else
				{
					rDep.deps=mapModuleToFile(dep.deps,rtn.modules);
					rDep.deps.unshift(relativatePath(morgasJs,referencePath));
				}
				if(dep.uses)
				{
					rDep.uses=mapModuleToFile(dep.uses,rtn.modules);
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
		return rtn;
	});
};