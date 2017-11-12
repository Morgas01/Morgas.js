(function(µ,SMOD,GMOD,HMOD,SC){

	SC=SC({
		remove:"array.remove",
		uniquify:"uniquify",
		flatten:"flatten"
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
		resolve:function(list,allowUsesCycles=false)
		{
			let resolved=new Map();
			let todo=[].concat(list).map(s=>({
				name:s,
				from:[]
			}));

			for(let entry of todo)
			{
				let config=this.getConfig(entry.name);
				if(!resolved.has(entry.name))
				{
					resolved.set(entry.name,{
						name:entry.name,
						from:[]
					});
				}
				let item=resolved.get(entry.name);
				if(entry.from.length!=0)
				{
					item.from.push(entry.from);
				}

				for(let next of config.deps.concat(config.uses))
				{
					let index=entry.from.indexOf(next);
					if(index!=-1)//cycle detected
					{
						let cycle=entry.from.slice(index).concat(entry.name);
						resolved.get(next).from.push(entry.from.slice().concat(entry.name,next));
						if(allowUsesCycles&&(!config.deps.includes(next)||cycle.some(this._containsUses)))
						{
							continue;
						}
						throw new Error("#DependencyResolver:003 cyclic dependency ["+cycle.join(" <-> ")+"]");
					}
					else
					{
						todo.push({
							name:next,
							from:entry.from.concat(entry.name)
						});
					}
				}
			}

			for (let item of resolved.values()) item.from=SC.uniquify(item.from,a=>a.join(","));

			this._breakCycles(resolved);
			let resolvedArr=Array.from(resolved.values());
			return this._sort(resolvedArr);
		},
		_containsUses:function(dependPath)
		{
			return dependPath.some((key,index,array)=>
			{
				return index+1<array.length&&!this.getConfig(key).deps.includes(array[index+1]);
			});
		},
		_breakCycles:function(resolved)
		{
			for (let item of resolved.values())
			{
				for(let index=0;index<item.from.length;index++)
				{
					let path=item.from[index];
					if(path[path.length-1]!==item.name) continue;

					let cycle=path.slice(path.indexOf(item.name),-1);
					item.from.splice(index--,1);
					path=path.slice(0,path.length-1-cycle.length);

					let cycleParts=this._getCycleParts(cycle);
					if(cycleParts===null) continue

					for(let c=0;c<cycle.length;c++)
					{
						let name=cycle[c];
						let cyclePath=path.concat(cycle.slice(0,c));
						let replacePath=path.concat(cycleParts.get(name));
						let searchPath=cyclePath.join(",");
						let cycleItem=resolved.get(name);
						for(let i=0;i<cycleItem.from.length;i++)
						{
							if(cycleItem.from[i].join(",")===searchPath)
							{
								cycleItem.from[i]=replacePath;
								break;
							}
						}
					}
				}
			}
		},
		_getCycleParts:function(cycle)
		{
			let isUseDependent=(name,index,arr)=>
			{
				return index+1<arr.length&&!this.getConfig(name).deps.includes(arr[index+1]);
			};

			let useIndex=cycle.findIndex(isUseDependent);

			if(useIndex==-1) return null; //only use is already solved

			let sortedCycle=cycle.slice(useIndex+1).concat(cycle.slice(0,useIndex+1));

			let useIndexes=sortedCycle.reduce((arr,name,i)=>
			{
				if(isUseDependent(name,i,sortedCycle)) arr.push(i+1);
				return arr;
			},[0]);

			useIndexes.push(sortedCycle.length);

			let parts=new Map();
			useIndexes.reduceRight((to,from)=>
			{
				for(;from<to;to--)
				{
					parts.set(sortedCycle[to-1],sortedCycle.slice(from,to-1));
				}
				return from;
			});

			return parts;
		},
		_sort:function(resolvedArr)
		{
			let rtn=[];
			for(let item of resolvedArr)
			{
				let allFrom=SC.uniquify(SC.flatten(item.from));
				let firstIndex=Math.min(...allFrom.map(f=>rtn.indexOf(f)).filter(i=>i!=-1));

				if(firstIndex==Infinity)
				{
					let config=this.getConfig(item.name);
					let allDeps=config.deps.concat(item.uses);
					let lastIndex=Math.max(...allDeps.map(d=>rtn.lastIndexOf(d)),-1);

					if(lastIndex==-1) rtn.unshift(item.name);
					else rtn.splice(lastIndex+1,0,item.name);
				}
				else
			 	{
			 		rtn.splice(firstIndex,0,item.name);
			 	}
			}
			return rtn;
		},
        clone:function(prefix)
        {
            return new µ.DependencyResolver(this.config,prefix);
        }
	});
	SMOD("DependencyResolver",µ.DependencyResolver);
	SMOD("DepRes",µ.DependencyResolver);

})(Morgas,Morgas.setModule,Morgas.getModule,Morgas.hasModule,Morgas.shortcut);