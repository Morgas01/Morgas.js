var path=require("path");
require(path.join("..","Morgas"));
require(path.join("..","Morgas.DependencyResolver"));

var moduleRegister =	require("../Morgas.ModuleRegister");
var dependencies =		require("../Morgas.Dependencies.json");
dependencies["Morgas.DependencyResolver.js"]=true;
var depRes =			new µ.DependencyResolver(dependencies);

var oldGetModule=µ.getModule;

µ.getModule=function(key)
{
	if(!µ.hasModule(key) && key in moduleRegister)
	{
		var files=depRes.resolve(moduleRegister[key]);
		for(var i=0;i<files.length;i++)
		{
			var file=files[i];
			if(dependencies[file]!==true)
			{
				require(path.join("..",file));
				dependencies[file]=true;
			}
		}
	}
	return oldGetModule(key);
};