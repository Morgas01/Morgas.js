(function(µ,SMOD,GMOD,HMOD,SC){

	let path=require("path");

	SC=SC({
    	File:"File",
    	flatten:"flatten",
    	uniquify:"uniquify",
    	removeIf:"array.removeIf"
    });

	let morgasJsFile=new SC.File(µ.dirname).changePath("Morgas.js");

	let dependencyParser=µ.Class({
		constructor:function()
		{
			this.sources=[];
			this.relativeTarget=null;
			this.moduleRegister={};
			this.moduleDependencies={};
			this.providedModules=new Set();
    		this.fileDependencies={};
		},
		addSources(sources)
		{
			this.sources.push(...sources);
			return this;
		},
		addSource(source)
		{
			this.sources.push(source);
			return this;
		},
		addModuleRegister(moduleRegister,relativeTarget)
		{
			for(let module in moduleRegister)
			{
				let file=moduleRegister[module];
				this.addModule(module,file,relativeTarget);
			}
			return this;
		},
    	addModule(module,file,relativeTarget)
		{
			addModuleToRegister(this.moduleRegister,module,file,relativeTarget);
			return this;
		},
		addModuleDependencies(moduleDependencies)
		{
			for (let file in moduleDependencies)
			{
				let dependencies=moduleDependencies[file];
				this.addModuleDependency(file,dependencies);
			}
			return this;
		},
		addModuleDependency(module,dependencies)
		{
			addDependencyToRegister(this.moduleDependencies,module,dependencies);
			return this;
		},
		addFileDependencies(fileDependencies,relativeTarget)
		{
			for (let file in fileDependencies)
			{
				let dependencies=fileDependencies[file];
				this.addFileDependency(file,dependencies,relativeTarget);
			}
			return this;
		},
		addFileDependency(file,dependencies,relativeTo)
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
		},
		addProvidedModules(providedModules)
		{
			for(let module of providedModules) this.providedModules.add(module);
			return this;
		},
    	async parse(relativeTo)
		{
			rtn={
				moduleRegister:{},
				moduleDependencies:{},
				fileDependencies:{},
				consumingDependencies:{}
			};

			//set provided data
			for(let module in this.moduleRegister) addModuleToRegister(rtn.moduleRegister,module,this.moduleRegister[module],relativeTo);
			for(let module in this.moduleDependencies) addDependencyToRegister(rtn.moduleDependencies,module,this.moduleDependencies[module]);
			for(let file in this.fileDependencies) addDependencyToRegister(rtn.fileDependencies,file,this.fileDependencies[file]);

			let parsedFiles=await this._parseFiles(relativeTo);

			//create modulRegister and moduleDependencies
			for(let parsedFile of parsedFiles)
			{
				if(parsedFile.prov)
				{
					for(let module of parsedFile.prov)
					{
						addModuleToRegister(rtn.moduleRegister,module,parsedFile.file,relativeTo);
						addDependencyToRegister(rtn.moduleDependencies,module,{
							deps:parsedFile.deps,
							uses:parsedFile.uses
						});
					}
				}
				else
				{
					let path=relativatePath(parsedFile.file,relativeTo);
					rtn.consumingDependencies[path]={
						deps:parsedFile.deps,
						uses:parsedFile.uses
					};
				}
			}

			for(let parsedFile of parsedFiles)
			{
				let file=parsedFile.file;
				let deps={
					deps:mapModuleToFile(parsedFile.deps,[rtn.moduleRegister],relativeTo,this.providedModules),
					uses:mapModuleToFile(parsedFile.uses,[rtn.moduleRegister],relativeTo,this.providedModules)
				}
				addDependencyToRegister(rtn.fileDependencies,relativatePath(parsedFile.file,relativeTo),deps);
			}

			//convert moduleRegister files to paths
			for(let module in rtn.moduleRegister) rtn.moduleRegister[module]=relativatePath(rtn.moduleRegister[module],relativeTo);

			return rtn;
		},
		async _parseFiles(relativeTo)
		{
			let files=await this._explodeFolders()
			files=SC.uniquify(files,f=>f.getAbsolutePath());
			SC.removeIf(files,f=>morgasJsFile.equals(f));
			files = await Promise.all(files.map(parseFile));
			files.sort(this._fileSorter(relativeTo));
			return files;
		},
		_explodeFolders()
		{
			return Promise.all(this.sources.map(SC.File.stringToFile).map(async file=>
			{
				let stat=await file.stat();
				if(stat.isDirectory())
				{
					let list=await file.listFiles();
					return list.filter(f=>f.slice(-3)===".js")
					.map(f=>file.clone().changePath(f));
				}
				return file;
			}))
			.then(SC.flatten);
		},
		_fileSorter(relativeTo)
		{
			return function(a,b)
			{
				a=relativatePath(a.file,relativeTo).toLowerCase();
				b=relativatePath(b.file,relativeTo).toLowerCase();
				let depth=a.split("/").length-b.split("/").length;
				if(depth!=0) return depth;
				if(a>b) return 1;
				if (b>a) return -1;
				return 0;
			};
		}
	});

    module.exports=dependencyParser;

    let addModuleToRegister=function(moduleRegister,module,file,relativeTarget)
    {
    	if(relativeTarget)
		{
			relativeTarget=SC.File.stringToFile(relativeTarget);
			file=relativeTarget.clone().changePath(file);
		}
		else file=SC.File.stringToFile(file);
		if(module in moduleRegister) µ.logger.warn("#dependencyParser:001 module",module,"aleardy defined in",moduleRegister[module]);
		moduleRegister[module]=file;
    };

	let addDependencyToRegister=function(dict,file,dependencies)
	{
		let fDeps;
		if(file in dict) fDeps=dict[file]
		else fDeps=dict[file]={deps:[],uses:[]};
		for(let d of dependencies.deps)
		{
			if(fDeps.deps.indexOf(d)==-1)fDeps.deps.push(d);
			let index=fDeps.uses.indexOf(d);
			if(index!=-1)fDeps.uses.splice(index,1);
		}
		for(let u of dependencies.uses)
		{
			if(fDeps.deps.indexOf(u)==-1&&fDeps.uses.indexOf(u)==-1) fDeps.uses.push(u);
		}
	};

	let scRegex=/SC=SC\(((?:[^\)]+||\);))\);/m;
	let usesRegex=/"[^"]+"/g;
	let depRegex=/GMOD\("[^"]+"\)/g;
	let smodRegex=/SMOD\("[^"]+"/g;
	let parseFile=function(file)
	{
		return file.read({encoding:"UTF-8"})
		.then(function(data)
		{
			let deps,uses,prov;
			let match=data.match(scRegex);
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
				µ.logger.warn("#dependencyParser:002 "+file.getName()+" does not have a shortcut section [ SC=SC({}); ]")
			}

			prov=data.match(smodRegex);
			if (prov)
			{
				prov=prov.map(function(a){return a.slice(6,-1)});
			}
			else
			{
				prov=null;
				µ.logger.warn("#dependencyParser:003 "+file.getName()+' does not provide a module [ SMOD(""); ]');
			}

			return {
				file:file,
				deps:deps,
				uses:uses,
				prov:prov
			};
		});
	};

	let relativatePath=function(file,referencePath)
	{
		let filePath=SC.File.fileToAbsoluteString(file);
		if(referencePath) filePath=path.relative(SC.File.fileToAbsoluteString(referencePath),filePath);
		return filePath.replace(/\\/g,"/");
	};

	let mapModuleToFile=function (modules,registers,referencePath,providedModules)
	{
		if(!Array.isArray(modules)) return [];
		return SC.uniquify(modules.map(m=>
		{
			for(let register of registers)
			{
				if(m in register)
				{
					return relativatePath(register[m],referencePath);
				}
			}
			if(!providedModules.has(m)) µ.logger.warn("#dependencyParser:004 module "+m+" not found");
			return false;
		})
		.filter(µ.constantFunctions.pass));//filter unknown modules (false values)
	};
})(Morgas,Morgas.setModule,Morgas.getModule,Morgas.hasModule,Morgas.shortcut);