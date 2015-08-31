var path=require("path");
require(path.join("..","Morgas"));

var moduleRegister =	require("../Morgas.ModuleRegister");

var oldGetModule=µ.getModule;

µ.getModule=function(key)
{
	if(!µ.hasModule(key) && key in moduleRegister)
		require(path.join("..",moduleRegister[key]));
	return oldGetModule(key);
};