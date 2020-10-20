(function(){
	let path=require("path");
	let fs=require("fs");
	require(path.join("..","Morgas"));

	module.exports=µ;

	µ.dirname=path.resolve(__dirname,"..");

	let moduleRegister = require("../Morgas.ModuleRegister.json");
	moduleRegister["Morgas.Dependencies"]=path.resolve(µ.dirname,"Morgas.Dependencies.json");
	moduleRegister["Morgas.ModuleDependencies"]=path.resolve(µ.dirname,"Morgas.ModuleDependencies.json");
	µ.setModule("Morgas.ModuleRegister",moduleRegister);

	let oldhasModule=µ.hasModule;
	let oldGetModule=µ.getModule;

	let resourceFolders=new Set();
	µ.addResourceFolder=function(folder)
	{
		if(!/[\\\/]/.test(folder.slice(-1)))folder+=path.sep;
		resourceFolders.add(folder);
	};
	µ.addResourceFolder(__dirname);

	µ.addModuleRegister=function(register,dir)
	{
		for(let module in register)
		{
			let modulePath=path.resolve(dir,register[module]);
			if(module in moduleRegister) µ.logger.warn("module "+key+" is overwritten",{old:moduleRegister[module],"new":modulePath});
			moduleRegister[module]=modulePath;
		}
	};

	µ.hasModule=function(key)
	{
		if(key in moduleRegister||oldhasModule(key))return true;
		for (let dir of resourceFolders)
		{
			if(fs.existsSync(path.resolve(dir,key+".js"))||fs.existsSync(path.resolve(dir,key+".json"))) return true;
		}
		return false;
	};
	µ.getModule=function(key)
	{
		let error=null;
		if(!oldhasModule(key))
		{
			if(key in moduleRegister)
			{
				try
				{
					let filePath=moduleRegister[key];
					if(!path.isAbsolute(filePath))filePath=path.join("..",filePath);
					let rtn=require(filePath);
					if(!oldhasModule(key)) µ.setModule(key,rtn);
				}
				catch(e)
				{
					µ.logger.error("could not load js module "+key,{path:path.join("..",moduleRegister[key])},e);
				}
			}
			else
			{
				let folders={};
				for(let dir of resourceFolders)
				{
					let filePath=path.resolve(dir,key);
					try
					{
						let result=require(filePath);
						if(!oldhasModule(key))µ.setModule(key,result);
						break;
					}
					catch(e)
					{
						folders[filePath]=e;
					}
				}
				if(!oldhasModule(key))
				{
					µ.logger.error("could not load nodejs module '"+key+"'",folders);
				}
			}
		}
		return oldGetModule(key);
	};
})();
