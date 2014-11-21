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
                        if(typeof obj[k]==="string")
                        {
                            this.config[k]={deps:[obj[k]],uses:[]};
                        }
                        else if (Array.isArray(obj[k]))
                        {
                            this.config[k]={deps:obj[k].slice(),uses:[]};
                        }
                        else if (obj[k]!==true)
                        {
                            this.config[k]={deps:(obj[k].deps||[]).slice(),uses:(obj[k].uses||[]).slice()}
                        }
                        else
                        {
                            this.config[k]=true;
                        }
					}
				}
				return true;
			}
			µ.debug("DependencyResolver.addConfig: obj is not an object", 0);
			return false;
		},
		resolve:function(items)
		{
			var rtn=[], list=[].concat(items), items=[].concat(items);
			while(list.length>0)
			{
				var	resolved=true,conf=this.config[list[0]];
				if(conf===undefined)
				{
					µ.debug("DependencyResolver.resolve: "+list[0]+" is undefined", 2);
				}
				else if(conf!==true)
				{
					var deps=conf.deps;
                    for(var i=0;i<conf.uses.length;i++)
                    {
                        if(list.indexOf(conf.uses[i])===-1&&rtn.indexOf(conf.uses[i])===-1)
                        {
                            list.push(conf.uses[i]);
                            items.push(conf.uses[i]);
                        }
                    }
					for(var i=0;i<deps.length;i++)
					{
						var dep=deps[i];
						if(rtn.indexOf(dep)===-1)
						{//not yet depending
							var listIndex=list.indexOf(dep);
							if(listIndex!==-1)
							{//as remaining item
								
								if(items.indexOf(dep)===-1)
								{//not as item
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
		},
        clone:function(prefix)
        {
            var config=null;
            if(prefix)
            {
                config={};
                var mapFn=function(v){return prefix+v};
                for(var i in this.config)
                {
                    config[prefix+i]=(this.config[i]===true ? true : {deps:this.config[i].deps.map(mapFn),uses:this.config[i].uses.map(mapFn)})
                }
            }
            return new µ.DependencyResolver(config);
        }
	});
	SMOD("DepRes",µ.DependencyResolver);
	
})(Morgas,Morgas.setModule,Morgas.getModule);