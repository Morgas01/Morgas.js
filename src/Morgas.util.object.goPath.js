(function(µ,SMOD,GMOD,HMOD,SC){

	let util=µ.util=µ.util||{};
	let uObj=util.object=util.object||{};

	let pathRegEx=/\[[^\]]+\]|\.?[^.\[]+/g;
	let arrayRegEx=/^\[(\d+)\]$/;
	let trimRegEx=/^\.|^\["?|"?]$/g;

	/** goPath
	 * Goes the {path} from {obj} checking all but last step for existance.
	 * 
	 * goPath(obj,"path.to.target") === goPath(obj,["path","to","target"]) === obj.path.to.target
	 * 
	 * when creating is enabled use "foo[]" or "foo[2]" instead of "foo.2" to create an array 
	 * 
	 * @param {any} obj
	 * @param {string|string[]} path
	 * @param {boolean} (create=false) create missing structures
	 */
	uObj.goPath=function(obj,path,create)
	{
		if(typeof path=="string")path=path.match(pathRegEx);

		for(let index=0; index<path.length;index++)
		{
			let key=path[index].replace(trimRegEx,"");
			if(!(key in obj))
			{
				if(create&&index+1<path.length)
				{
					let value;
					if(arrayRegEx.test(path[index+1])) value=[];
					else value={};

					obj=obj[key]=value;
					continue;
				}
				return undefined;
			}
			obj=obj[key];
		}
		return obj;
	};
	/**
	 * 
	 * @param {string|string[]} path
	 * @returns function 
	 */
	uObj.goPath.guide=function(path)
	{
		return function(obj){return uObj.goPath(obj,path)};
	};
	SMOD("goPath",uObj.goPath);
	
})(Morgas,Morgas.setModule,Morgas.getModule,Morgas.hasModule,Morgas.shortcut);