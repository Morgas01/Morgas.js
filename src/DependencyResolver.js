(function(µ,SMOD,GMOD,HMOD,SC){

	//SC=SC({});

	let applyPrefix=function(arr=[],prefix)
	{
		return arr.map(function(a){return prefix+a});
	};

	/**
	 * holds configuration of dependencies and resolves them.
	 * A configuration consists of deps[] (direct dependencies) and uses[] (indirect dependencies).
	 * Indirect (or async) dependencies are (normaly) allowed to form cycles as they are not needed immediately (can cause problems!).
	 */
	µ.DependencyResolver=µ.Class({
		constructor:function(config,prefix)
		{
			this.config={};
			if(config)this.addConfig(config,prefix);
		},
		addConfig:function(obj,prefix="",overwrite)
		{
			let overwritten=[];
			if(typeof obj==="object")
			{
				let keys=Object.keys(obj);
				for(let l=keys.length,i=0;i<l;i++)
				{
					let k=keys[i];

					if(this.config[prefix+k]===undefined||overwrite)
					{
						if(this.config[prefix+k]!==undefined) overwritten.push(prefix+k);
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
			}
			else throw new TypeError("#DependencyResolver:001 DependencyResolver.addConfig: obj is not an object");
			return overwritten;
		},
		getConfig:function(item)
		{
			let config=this.config[item];
			if(!config) throw new ReferenceError("#DependencyResolver:002 "+item+" is not in config");
			return config;
		},
		resolve:function(list,allowUsesAsync=true)
		{
			if(typeof list==="string") list=[list];
			// all items to resolve
			let allList=new Set(list);
			let todo=Array.from(allList);
			let order=new Set();
			let fulfilledDeps=new Set();

			while (true)
			{
				for(let i=0;i<todo.length;i++)
				{
					let name=todo[i];
					let config=this.getConfig(name);
					if(config.deps.every(order.has,order)) fulfilledDeps.add(name);
					if(fulfilledDeps.has(name)&config.uses.every(order.has,order))
					{
						order.add(name);
						todo.splice(i,1);
						fulfilledDeps.delete(name);
						i=-1; //reset
					}
					else
					{
						for(let dependency of config.deps.concat(config.uses))
						{
							if(!allList.has(dependency))
							{
								allList.add(dependency);
								todo.push(dependency);
							}
						}
					}
				}
				if(todo.length!=0)
				{
					if(allowUsesAsync)
					{
						if(fulfilledDeps.size==0) throw new RangeError("#DependencyResolver:003 can not resolve ["+todo+"] (cyclic dependencies)")
						let wanted=[];
						for(let fulfilledName of fulfilledDeps.values())
						{
							let wantedCount=todo.reduce((count,name)=>
							{
								if(name===fulfilledName) return count;
								let config=this.getConfig(name);
								if(config.deps.includes(fulfilledName)||config.uses.includes(fulfilledName)) count++;
								return count;
							},0);
							wanted.push({count:wantedCount,name:fulfilledName});
						}
						let mostWanted=wanted.reduce((a,b)=>a.count>b.count?a:b).name;

						order.add(mostWanted);
						todo.splice(todo.indexOf(mostWanted),1);
						fulfilledDeps.delete(mostWanted);
						//try again
					}
					else
					{
						throw new RangeError("#DependencyResolver:004 can not resolve "+todo+" without async uses");
					}
				}
				else break;
			}
			return Array.from(order);
		},
        clone:function(prefix)
        {
            return new µ.DependencyResolver(this.config,prefix);
        }
	});
	SMOD("DependencyResolver",µ.DependencyResolver);
	SMOD("DepRes",µ.DependencyResolver);

})(Morgas,Morgas.setModule,Morgas.getModule,Morgas.hasModule,Morgas.shortcut);