(function(µ,SMOD,GMOD){

	var util=µ.util=µ.util||{};
	var uObj=util.object||{};

	/** goPath
	 * Goes the {path} from {obj} checking all but last step for existance.
	 * 
	 * goPath(obj,"path.to.target") === goPath(obj,["path","to","target"]) === obj.path.to.target
	 */
	uObj.goPath=function(obj,path)
	{
		var todo=path;
		if(typeof todo=="string")
			todo=todo.split(".");
		
		while(todo.length>0&&obj)
		{
			obj=obj[todo.shift()];
		}
		if(todo.length>0)
		{
			return undefined
		}
		return obj;
	};
	SMOD("goPath",uObj.goPath);
	
})(Morgas,Morgas.setModule,Morgas.getModule);