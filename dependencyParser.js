(function(µ,SMOD,GMOD,HMOD,SC){

	var path=require("path");

	var SC=µ.shortcut({
    	File:"File",
    	adopt:"adopt",
    	flatten:"flatten",
    	uniquify:"uniquify"
    });

	var morgasJsFile=new SC.File(µ.dirname).changePath("Morgas.js");

	var dependencyParser=function()
    {
    	this.sources=[];
    	this.relativeTarget=null;
    	this.moduleRegister={};
    	this.moduleDependencies={};
    	this.fileDependencies={};
    };
    dependencyParser.prototype.addSource=function(source)
    {
    	this.sources.push(source);
    	return this;
    };
    dependencyParser.prototype.addSources=function(sources)
    {
    	for(var s of sources)this.addSource(s);
    	return this;
    };
    dependencyParser.prototype.addModule=function(module,file,relativeTarget)
    {
    	addModule(this.moduleRegister,module,file,relativeTarget);
    	return this;
    };
    dependencyParser.prototype.addModuleRegister=function(moduleRegister,relativeTarget)
    {
		if(relativeTarget) relativeTarget=new SC.File(relativeTarget);
    	for(var module in moduleRegister)
    	{
    		var file=moduleRegister[module];
    		this.addModule(module,file,relativeTarget);
    	}
    	return this;
    };
    dependencyParser.prototype.addModuleDependency=function(file,dependencies,relativeTarget)
    {
		if(relativeTarget)
		{
			relativeTarget=SC.File.stringToFile(relativeTarget);
			file=relativeTarget.clone().changePath(file).getAbsolutePath();
		}
    	addDependency(this.moduleDependencies,file,dependencies);
    	return this;
    };
    dependencyParser.prototype.addModuleDependencies=function(moduleDependencies,relativeTarget)
    {
		for (var file in moduleDependencies)
		{
			var dependencies=moduleDependencies[file];
			this.addModuleDependency(file,dependencies,relativeTarget);
		}
    	return this;
    };
    dependencyParser.prototype.addFileDependency=function(file,dependencies,relativeTarget)
    {
		if(relativeTarget)
		{
			relativeTarget=SC.File.stringToFile(relativeTarget);
			file=relativeTarget.clone().changePath(file).getAbsolutePath();
			dependencies.deps=dependencies.deps.map(d=>relativeTarget.clone().changePath(d).getAbsolutePath);
			dependencies.uses=dependencies.uses.map(u=>relativeTarget.clone().changePath(u).getAbsolutePath);
		}
    	addDependency(this.fileDependencies,file,dependencies);
    	return this;
    };
    dependencyParser.prototype.addFileDependencies=function(fileDependencies,relativeTarget)
    {
		for (var file in fileDependencies)
		{
			var dependencies=fileDependencies[file];
			this.addFileDependency(file,dependencies,relativeTarget);
		}
    	return this;
    };
    dependencyParser.prototype.parse=function(relativeTo)
    {
		rtn={
			moduleRegister:{},
			moduleDependencies:{},
			fileDependencies:{}
		};

		return explodeFolders(this.sources)
		.then(files=>Promise.all(files.map(parseFile)))
		.then(sorting(relativeTo))
		.then(parsedFiles=>
		{
			//create modulRegister and moduleDependencies
			for(var parsedFile of parsedFiles)
			{
				if(parsedFile.prov)
				{
					for(var module of parsedFile.prov)
					{
						addModule(rtn.moduleRegister,module,parsedFile.file);
					}
				}
				rtn.moduleDependencies[relativatePath(parsedFile.file,relativeTo)]={
					deps:parsedFile.deps,
					uses:parsedFile.uses
				};
			}

			//add additional module dependencies
			for(var file in this.moduleDependencies)
			{
				var mDep=this.moduleDependencies[file];
				mDep.file=file;
				parsedFiles.push(mDep);
			}

			for(var parsedFile of parsedFiles)
			{
				var file=parsedFile.file;
				var deps={
					deps:mapModuleToFile(parsedFile.deps,[rtn.moduleRegister,this.moduleRegister],relativeTo),
					uses:mapModuleToFile(parsedFile.uses,[rtn.moduleRegister,this.moduleRegister],relativeTo)
				}
				addDependency(rtn.fileDependencies,relativatePath(parsedFile.file,relativeTo),deps);
			}
			for(var file in this.fileDependencies)
			{
				var deps={
					deps:mapModuleToFile(this.fileDependencies[file].deps,[rtn.moduleRegister,this.moduleRegister],relativeTo),
					uses:mapModuleToFile(this.fileDependencies[file].uses,[rtn.moduleRegister,this.moduleRegister],relativeTo)
				}
				addDependency(rtn.fileDependencies,relativatePath(file,relativeTo),deps);
			}

			//convert moduleRegister files to paths
			for(var module in rtn.moduleRegister) rtn.moduleRegister[module]=relativatePath(rtn.moduleRegister[module],relativeTo);

			return rtn;
		});
    };

    module.exports=dependencyParser;


    var addModule=function(moduleRegister,module,file,relativeTarget)
	{
		if(relativeTarget)
		{
			relativeTarget=SC.File.stringToFile(relativeTarget);
			console.log(file);
			file=relativeTarget.clone().changePath(file);
		}
		else file=SC.File.stringToFile(file);
		if(module in moduleRegister) µ.logger.warn("module",module,"aleardy defined in",moduleRegister[module]);
		moduleRegister[module]=file;
	};
	var addDependency=function(dict,file,dependencies)
	{
		var fDeps;
		if(file in dict) fDeps=dict[file]
		else fDeps=dict[file]={deps:[],uses:[]};
		for(var d of dependencies.deps)
		{
			if(fDeps.deps.indexOf(d)==-1)fDeps.deps.push(d);
			var index=fDeps.uses.indexOf(d);
			if(index!=-1)fDeps.uses.splice(index,1);
		}
		for(var u of dependencies.uses)
		{
			if(fDeps.deps.indexOf(u)==-1&&fDeps.uses.indexOf(u)==-1) fDeps.uses.push(u);
		}
	};
	var explodeFolders=function(files)
	{
		return Promise.all(files.map(SC.File.stringToFile).map(file=>
			file.stat().then(s=>
				s.isDirectory() ?
					file.listFiles().then(list=>
						list.filter(f=>f.slice(-3)===".js")
						.map(f=>file.clone().changePath(f)))
					:
					file
				)
			)
		)
		.then(SC.flatten)
		.then(files=>SC.uniquify(files,f=>f.getAbsolutePath()));
	};

	var scRegex=/SC=SC\(((?:[^\)]||\);)+)\);/m;
	var usesRegex=/"[^"]+"/g;
	var depRegex=/GMOD\("[^"]+"\)/g;
	var smodRegex=/SMOD\("[^"]+"/g;
	var parseFile=function(file)
	{
		return file.read({encoding:"UTF-8"})
		.then(function(data)
		{
			var deps,uses,prov;
			var match=data.match(scRegex);
			if(match)
			{
				uses=match[1].match(usesRegex);
				if(uses)uses=uses.map(function(a){return a.slice(1,-1)});
				else uses=[];
				deps=data.slice(0,match.index).match(depRegex);
				if (deps)deps=deps.map(function(a){return a.slice(6,-2)});
				else deps=[];
			}
			else
			{
				deps=uses=[];
				µ.logger.warn(file.getName()+" does not have a shortcut section [ SC=SC({}); ]")
			}

			prov=data.match(smodRegex);
			if (prov)
			{
				prov=prov.map(function(a){return a.slice(6,-1)});
			}
			else
			{
				prov=[];
				µ.logger.error(file.getName()+' does not provide a module [ SMOD(""); ]');
			}

			return {
				file:file,
				deps:deps,
				uses:uses,
				prov:prov
			};
		});
	};

	var relativatePath=function(file,referencePath)
	{
		var filePath=SC.File.fileToAbsoluteString(file);
		if(referencePath) filePath=path.relative(referencePath,filePath);
		return filePath.replace(/\\/g,"/");
	};

	var sorting=function(relativeTo)
	{
		return function(arr)
		{
			return arr.sort(function(a,b)
			{
				a=relativatePath(a.file,relativeTo).toLowerCase();
				b=relativatePath(b.file,relativeTo).toLowerCase();
				var depth=a.split("/").length-b.split("/").length;
				if(depth!=0) return depth;
				if(a>b) return 1;
				if (b>a) return -1;
				return 0;
			});
		};
	};

	var mapModuleToFile=function (modules,registers,referencePath)
	{
		if(!Array.isArray(modules)) return [];
		return SC.uniquify(modules.map(m=>
		{
			for(var register of registers)
			{
				if(m in register)
				{
					return relativatePath(register[m],referencePath);
				}
			}
			µ.logger.warn("module",m,"not found");
			return false;
		})
		.filter(µ.constantFunctions.pass));//filter unknown modules (false values)
	};
})(Morgas,Morgas.setModule,Morgas.getModule,Morgas.hasModule,Morgas.shortcut);