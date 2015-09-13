var path=require("path");
var fs=require("fs");
require(path.join("..","Morgas"));

var moduleRegister =	require("../Morgas.ModuleRegister");

var oldGetModule=µ.getModule;

µ.getModule=function(key)
{
	if(!µ.hasModule(key))
	{
		if(key in moduleRegister)require(path.join("..",moduleRegister[key]));
		else
		{
			try
			{
				µ.setModule(key,require("./"+key));
			}
			catch(e)
			{
				µ.logger.error(new µ.Warning("could not load nodejs module "+key,e));
			}
		}
	}
	return oldGetModule(key);
};