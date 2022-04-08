(function(µ,SMOD,GMOD,HMOD,SC){


	SC=SC({
		DependencyParser:"DependencyParser",
		PATH:require.bind(null,"path"),
		morgasModuleRegister:"Morgas.ModuleRegister",
		morgasModuleDependencies:"Morgas.ModuleDependencies",
		DependencyResolver:"DepRes",
		File:"File",
		uniquify:"uniquify"
	});

	let normalizePath=function(path){return path.replace(/\\/g,"/");};

	/**@type DependencyManager */
	let DependencyManager=µ.Class({
		constructor:function({basePath=".",addMorgasModule=true}={})
		{
			this.sourcesBasePath=".";
			this.sourcePaths=[];
			this.packages={};
			this.packageModuleRegister={};

			this.setSourcesBasePath(basePath);

			if(addMorgasModule)
			{
				this.addPackage({
					name:"morgas",
					basePath:µ.dirname,
					moduleDependencies:SC.morgasModuleDependencies,
					moduleRegister:SC.morgasModuleRegister,
					baseFile:"Morgas.js"
				});
			}
		},
		/**
		 * @param basePath
		 * @returns DependencyManager
		 */
		setSourcesBasePath(basePath)
		{
			this.sourcesBasePath=basePath;
			return this;
		},
		/**
		 *
		 * @param {String|String[]} sources
		 * @returns DependencyManager
		 */
		addSources(sources)
		{
			this.sourcePaths=this.sourcePaths.concat(sources);
			return this;
		},
		/**
		 * @param {Object} param
		 * @param {String} param.name - module name, base of model url
		 * @param {Object} param.moduleRegister
		 * @param {Object} param.moduleDependencies
		 * @param {String} [param.baseFile]
		 * @param {String} param.basePath
		 * @returns DependencyManager
		 */
		addPackage({name,moduleRegister,moduleDependencies,baseFile,basePath})
		{
			if(!name) throw "no package name";
			if(name in this.packages) throw "package name exists";
			if(!moduleRegister) throw "no moduleRegister";
			if(!moduleDependencies) throw "no dependencies";
			if(!basePath) throw "no basePath";

			if(baseFile&&SC.PATH.isAbsolute(baseFile))
			{
				baseFile=SC.PATH.relative(basePath,baseFile);
			}

			this.packages[name]={
				baseFile,
				basePath
			}

			for(let module in moduleRegister)
			{
				if(!(module in moduleDependencies)) continue;
				if(module in this.packageModuleRegister)
				{
					//TODO
					µ.logger.warn(`replacing ${this.packageModuleRegister[module].package} ${module} with ${name}`);
				}
				this.packageModuleRegister[module]={
					package:name,
					path:moduleRegister[module],
					dependencies:moduleDependencies[module]
				};
			}

			return this;
		},
		async getAllDependencies()
		{
			let parser=new SC.DependencyParser();
			parser.addSources(this.sourcePaths.map(s=>SC.PATH.join(this.sourcesBasePath,s)));
			parser.addProvidedModules(Object.keys(this.packageModuleRegister));
			let parseResult=await parser.parse(this.sourcesBasePath);

			let allModulesRegister=Object.create(this.packageModuleRegister);
			for(let module in parseResult.moduleRegister)
			{
				if(module in allModulesRegister)
				{
					//TODO
					µ.logger.warn(`replacing ${allModulesRegister[module].package} ${module} with [source]`);
				}
				allModulesRegister[module] = {
					package: "",
					path: parseResult.moduleRegister[module],
					dependencies: parseResult.moduleDependencies[module]
				};
			}

			let urlToPath={};
			let moduleToUrl=(module)=>
			{
				let packageName = allModulesRegister[module].package;
				let path = allModulesRegister[module].path;
				let url = normalizePath(SC.PATH.join(packageName, path));
				if(packageName==="")//source package
				{
					urlToPath[url]=path;
				}
				else
				{
					urlToPath[url] = SC.PATH.join(this.packages[packageName].basePath, path);
				}
				return url;
			};
			this.packages[""]={ //source "package"
				basePath:this.sourcesBasePath
			};
			let urlDependencies={};
			for(let packageName in this.packages)
			{
				let baseFile=this.packages[packageName].baseFile;
				if(baseFile)
				{
					let baseFileUrl=normalizePath(SC.PATH.join(packageName,this.packages[packageName].baseFile));
					urlDependencies[baseFileUrl]={
						deps:["morgas/Morgas.js"],
						uses:[]
					};
					if(baseFileUrl==="morgas/Morgas.js")
					{
						urlDependencies[baseFileUrl].deps.length=0;
					}
					urlToPath[baseFileUrl]=SC.PATH.join(this.packages[packageName].basePath,baseFile);
				}
			}
			for(let module in allModulesRegister)
			{
				let url=moduleToUrl(module);
				if(!(url in urlDependencies)) // only first module of file as dependencies are the same
				{
					let urlDeps=allModulesRegister[module].dependencies.deps.map(moduleToUrl);
					urlDeps.unshift("morgas/Morgas.js");
					let packageName = allModulesRegister[module].package;
					if(this.packages[packageName].baseFile)
					{
						let baseFileUrl=normalizePath(SC.PATH.join(packageName,this.packages[packageName].baseFile));
						urlDeps.push(baseFileUrl);
					}
					urlDependencies[url]={
						deps:SC.uniquify(urlDeps),
						uses:SC.uniquify(allModulesRegister[module].dependencies.uses.map(moduleToUrl))
					};
				}
			}
			for(let url in parseResult.consumingDependencies)
			{
				if(url in urlDependencies)
				{
					//TODO
					µ.logger.error(`source/package path clash ${url}. first folder and package name might be the same`);
				}
				let urlDeps=parseResult.consumingDependencies[url].deps.map(moduleToUrl);
				urlDeps.unshift("morgas/Morgas.js");
				urlDependencies[url]={
					deps:SC.uniquify(urlDeps),
					uses:SC.uniquify(parseResult.consumingDependencies[url].uses.map(moduleToUrl))
				};
				urlToPath[url]=url;
			}

			return {
				parseResult,
				allModulesRegister,
				urlDependencies,
				urlToPath
			};
		},
		async resolve(file)
		{
			let allDependencies=await this.getAllDependencies();
			if(file in allDependencies.urlDependencies)
			{
				let resolver=new SC.DependencyResolver(allDependencies.urlDependencies);
				let urls=resolver.resolve(file);
				let files=urls.map(url=>allDependencies.urlToPath[url]);
				return files;
			}
			else
			{
				throw `file '${file}' not found`;
			}
		}
	});
	module.exports=DependencyManager;

})(Morgas,Morgas.setModule,Morgas.getModule,Morgas.hasModule,Morgas.shortcut);