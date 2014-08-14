(function(µ,SMOD,GMOD){
	
	µ.DependencyResolver=µ.Class({
		init:function(config)
		{
			this.config={};
			this.addConfig(config);
		},
		addConfig:function(obj,overwrite)
		{
			if(typeof obj==="object")
			{
				for(var keys=Object.keys(obj),l=keys.length,i=0;i<l;i++)
				{
					var k=keys[i];
					if(this.config[k]===undefined||overwrite)
					{
						this.config[k]=obj[k]
					}
				}
				return true;
			}
			µ.debug("DependencyResolver.setConfig: obj is not an object", 0);
			return false;
		},
		resolve:function(items)
		{
			var rtn=[],
			list=[].concat(items);
			items=[].concat(items);
			while(list.length>0)
			{
				var	resolved=true,
				conf=this.config[list[0]];
				if(conf===undefined)
				{
					µ.debug("DependencyResolver.resolve: "+list[0]+" is undefined", 2);
				}
				else if(conf!==true&&(typeof conf!=="object"||Array.isArray(conf)||conf.deps!==undefined))
				{
					var deps=conf;
					if(typeof deps==="object"&&!Array.isArray(conf))
					{
						deps=deps.deps;
					}
					var deps=[].concat(deps);
					for(var i=0;i<deps.length;i++)
					{
						var dep=deps[i];
						if(rtn.indexOf(dep)===-1)
						{
							var listIndex=list.indexOf(dep);
							if(listIndex!==-1)
							{
								
								if(items.indexOf(dep)===-1)
								{
									throw new TypeError("cyclic object Dependencies ["+list[0]+","+deps[i]+"]");
								}
								else
								{
									list.splice(listIndex, 1);
								}
							}
							list=[].concat(dep,list);
							resolved=false;
							break;
						}
					}
				}
				if(resolved)
				{
					rtn.push(list.shift());
				}
			}
			return rtn;
		}
	});
	SMOD("DepRes",µ.DependencyResolver);
	
})(Morgas,Morgas.setModule,Morgas.getModule);