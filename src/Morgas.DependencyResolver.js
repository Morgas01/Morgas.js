(function(µ,SMOD,GMOD,HMOD,SC){

	SC=SC({
		remove:"array.remove",
		uniquify:"uniquify",
		register:"register"
	});

	let applyPrefix=function(arr,prefix)
	{
		return (arr||[]).map(function(a){return prefix+a});
	};
	µ.DependencyResolver=µ.Class({
		constructor:function(config,prefix)
		{
			this.config={};
			if(config)this.addConfig(config,prefix);
		},
		addConfig:function(obj,prefix="",overwrite)
		{
			if(typeof obj==="object")
			{
				let keys=Object.keys(obj);
				for(let l=keys.length,i=0;i<l;i++)
				{
					let k=keys[i];
					if(this.config[prefix+k]===undefined||overwrite)//TODO overwrite message
					{
						let v=null;
                        if(typeof obj[k]==="string")
                        {
                            v={deps:[prefix+obj[k]],uses:[]};
                        }
                        else if (Array.isArray(obj[k]))
                        {
                            v={deps:applyPrefix(obj[k],prefix),uses:[]};
                        }
                        else if (obj[k]!==true)
                        {
                            v={deps:applyPrefix(obj[k].deps,prefix),uses:applyPrefix(obj[k].uses,prefix)}
                        }
                        else
                        {
                            v={deps:[],uses:[]};
                        }
						this.config[prefix+k]=v;
					}
				}
				return true;
			}
			µ.logger.error(new TypeError("#DependencyResolver:001 DependencyResolver.addConfig: obj is not an object"));
			return false;
		},
		getConfig:function(item)
		{
			let config=this.config[item];
			if(!config) throw new ReferenceError("#DependencyResolver:002 "+item+" is not in config");
			return config;
		},
		_getList:function(items)
		{
			let deps=[...items];
			let uses=[];
			for(let item of items)
			{
				let config = this.getConfig(item)
				deps.push(...config.deps);
				uses.push(...config.uses);
			}
			deps.push(...uses);
			return SC.uniquify(deps);
		},
		resolve:function(keys,strict)
		{
			let list=this._getList([].concat(keys));
			let cycleRegister=SC.register(1,Set);
			let cursor=0;

			let checkDependencies=function(item)
			{
				let index=list.indexOf(item);
				if(index==-1)
				{
					list.splice(cursor,0,item);
					return false;
				}
				if(index>cursor)
				{
					SC.remove(list,item);
					list.splice(cursor,0,item);
					return false;
				}
				return true;
			};
			let checkCycle=function(parent,child,noThrow)
			{
				let childSet=cycleRegister[child];
				for(let ancestor of cycleRegister[parent])
				{
					if(ancestor===child)
					{
						let cycle=Array.from(cycleRegister[parent]).slice(childSet.size);
						cycle.push(parent);
						let error=new Error("#DependencyResolver:003 cyclic dependency ["+cycle.join(" <-> ")+"]");
						if(!noThrow||strict) throw error;
						µ.logger.error(error);
						return false;
					}
					childSet.add(ancestor);
				}
				childSet.add(parent);
				return true;
			};
			let counter=0;
			resolveLoop: while(cursor<list.length)
			{
				if(counter++>100) throw "cycle guard";
				let item=list[cursor];
				for(let depItem of this.getConfig(item).deps)
				{
					checkCycle(item,depItem);

					if(!checkDependencies(depItem))
					{
						continue resolveLoop;
					}

					for(let useItem of this.getConfig(depItem).uses)
					{
						if(checkCycle(depItem,useItem,true)&&!checkDependencies(useItem))
						{
							continue resolveLoop;
						}
					}
				}
				for (let useItem of this.getConfig(item).uses)
				{
					if(list.indexOf(useItem)==-1) list.push(useItem);
				}
				cursor++;
			}
			return list;
		},
        clone:function(prefix)
        {
            return new µ.DependencyResolver(this.config,prefix);
        }
	});
	SMOD("DependencyResolver",µ.DependencyResolver);
	SMOD("DepRes",µ.DependencyResolver);

})(Morgas,Morgas.setModule,Morgas.getModule,Morgas.hasModule,Morgas.shortcut);