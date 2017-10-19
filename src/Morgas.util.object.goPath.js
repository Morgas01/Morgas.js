(function(µ,SMOD,GMOD,HMOD,SC){

	let util=µ.util=µ.util||{};
	let uObj=util.object=util.object||{};

	let pathRegEx=/\[[^\]]+\]|\.?[^.\[]+/g;
	let arrayRegEx=/^\[(\d+)\]$|^\]$/;
	let trimRegEx=/^\.|^\["?|"?]$/g;

	//SC=SC({});

	/** goPath
	 * Goes the {path} from {obj} checking all but last step for existance.
	 * 
	 * goPath(obj,"path.to.target") === goPath(obj,["path","to","target"]) === obj.path.to.target
	 * 
	 * when creating is enabled use "foo[].n" or "foo[n]" instead of "foo.2" to create an array
	 * 
	 * @param {Any} obj
	 * @param {String|string[]} path
	 * @param {Boolean} (create=false) create missing structures
	 * @param {Any} (defaultValue) set missing value
	 */
	uObj.goPath=function(obj,path,create,defaultValue)
	{
		if(obj==null) return undefined;
		if(typeof path=="string")path=path.match(pathRegEx);

		for(let index=0; index<path.length;index++)
		{
			if(path[index]==="]") continue;
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
				if(index+1==path.length&&defaultValue!==undefined)
				{
					return obj[key]=defaultValue;
				}
				return undefined;
			}
			obj=obj[key];
		}
		return obj;
	};
	uObj.goPath.guide=function(...args)
	{
		return function(obj){return uObj.goPath(obj,...args)};
	};
	SMOD("goPath",uObj.goPath);
	
})(Morgas,Morgas.setModule,Morgas.getModule,Morgas.hasModule,Morgas.shortcut);