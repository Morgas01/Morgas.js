(function(){
	var path=require("path");
	var fs=require("fs");
	require(path.join("..","Morgas"));
	
	module.exports=µ;
	
	µ.dirname=path.resolve(__dirname,"..");
	
	var moduleRegister = require("../Morgas.ModuleRegister");
	
	var oldhasModule=µ.hasModule;
	var oldGetModule=µ.getModule;
	
	var resourceFolders=new Set(["./"]);
	µ.addResourceFolder=function(folder)
	{
		if(folder.slice(-1)!=="/")folder+="/";
		resourceFolders.add(folder);
	};
	
	µ.hasModule=function(key)
	{
		if(key in moduleRegister||oldhasModule(key)||fs.existsSync(path.resolve(__dirname,key+".js")))return true;
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
					µ.logger.error(new µ.Warning("could not load js module "+key,{
						path:path.join("..",moduleRegister[key]),
						name:e.name,
						message:e.message,
						stack:e.stack,
						original:e
					}));
				}
			}
			else
			{
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
						µ.logger.info(new µ.Warning("could not load nodejs module "+dir+key,{
							name:e.name,
							message:e.message,
							stack:e.stack,
							original:e
						}));
						lastError=e;
					}
				}
				if(!oldhasModule(key))
				{
					µ.logger.error(new µ.Warning("could not load nodejs module "+key))
				}
			}
		}
		return oldGetModule(key);
	};
	
	/* polyfills */
	
	//Array.slice=Array.prototype.slice.call.bind(Array.slice);
})();