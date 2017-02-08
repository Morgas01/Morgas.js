(function(){
	var path=require("path");
	var fs=require("fs");
	require(path.join("..","Morgas"));

	module.exports=µ;

	µ.dirname=path.resolve(__dirname,"..");

	var moduleRegister = require("../Morgas.ModuleRegister");

	var oldhasModule=µ.hasModule;
	var oldGetModule=µ.getModule;

	var resourceFolders=new Set();
	µ.addResourceFolder=function(folder)
	{
		if(!/[\\\/]/.test(folder.slice(-1)))folder+=path.sep;
		resourceFolders.add(folder);
	};
	µ.addResourceFolder(__dirname);

	µ.hasModule=function(key)
	{
		if(key in moduleRegister||oldhasModule(key))return true;
		for (var dir of resourceFolders)
		{
			if(fs.existsSync(path.resolve(dir,key+".js"))) return true;
		}
		return false;
	};
	µ.getModule=function(key)
	{
		var error=null;
		if(!oldhasModule(key))
		{
			if(key in moduleRegister)
			{
				try
				{
					require(path.join("..",moduleRegister[key]));
				}
				catch(e)
				{
					µ.logger.error(new µ.Warning("could not load js module "+key,{path:path.join("..",moduleRegister[key])},e));
				}
			}
			else
			{
				var folders={};
				for(var dir of resourceFolders)
				{
					try
					{
						var result=require(dir+key);
						if(!oldhasModule(key))µ.setModule(key,result);
						break;
					}
					catch(e)
					{
						folders[dir+key]=e;
					}
				}
				if(!oldhasModule(key))
				{
					µ.logger.error(new µ.Warning("could not load nodejs module '"+key+"'",folders));
				}
			}
		}
		return oldGetModule(key);
	};

	/* polyfills */

	//Array.slice=Array.prototype.slice.call.bind(Array.slice);
})();
