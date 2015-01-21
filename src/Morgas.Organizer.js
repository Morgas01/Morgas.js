(function(µ,SMOD,GMOD){
	 /**
	 * Depends on	: Morgas
	 * Uses			: util.object
	 *
	 * Organizer to reindex and group arrays
	 *
	 */
	var SC=GMOD("shortcut")({
		it:"iterate",
		eq:"equals",
		path:"goPath"
	});
	 
	var ORG=µ.Organizer=µ.Class({
		init:function(values)
		{
			this.values=[];
			this.filters={};
			this.maps={};
			this.groups={};
			
			if(values)
				this.add(values);
		},
		add:function(values,groupName,groupKey)
		{
			if(groupName&&groupKey)
			{
				this.group(groupName);
				this.groups[groupName].values[groupKey]=[]
			}
			SC.it(values,function(value)
			{
				var index=this.values.length;
				this.values.push(value);
				for(var m in this.maps)
				{
					this._map(this.maps[m],index);
				}
				for(var f in this.filters)
				{
					this._filter(this.filters[f],index);
				}
				for(var g in this.groups)
				{
					this._group(this.groups[g],index);
				}
				
				if(groupName&&groupKey)
				{
					this.groups[groupName].values[groupKey].push(index);
				}
			},false,false,this);
			return this;
		},
		remove:function(value)
		{
			var valuesIndex=this.values.indexOf(value);
			if(valuesIndex!==-1)
			{
				for(var i in this.filters)
				{
					var index=this.filters[i].values.indexOf(valuesIndex);
					if(index!==-1)
					{
						this.filters[i].values.splice(index,1);
					}
				}
				for(var i in this.maps)
				{
					var map=this.maps[i].values;
					var keys=Object.keys(map);
					for(var i=0;i<keys.length;i++)
					{
						if(map[keys[i]]===value)
						{
							delete map[keys[i]];
							break;
						}
					}
				}
				for(var i in this.groups)
				{
					var group=this.groups[i].values;
					var keys=Object.keys(group);
					for(var i=0;i<keys.length;i++)
					{
						var index=group[keys[i]].indexOf(valuesIndex);
						if(index!==-1)
						{
							group[keys[i]].splice(index,1);
							break;
						}
					}
				}
				delete this.values[valuesIndex];
			}
			return this;
		},
		_removeType:function(type,name)
		{
			delete this[type][name];
		},
		clear:function()
		{
			for(var i in this.filters)
			{
				this.filters[i].values.length=0;
			}
			for(var i in this.maps)
			{
				this.maps[i].values={};
			}
			for(var i in this.groups)
			{
				this.groups[i].values={};
			}
			this.values.length=0;
			return this;
		},
		
		map:function(mapName,fn)
		{
			if(typeof fn==="string")
				fn=ORG._pathWrapper(fn);
			this.maps[mapName]={fn:fn,values:{}};
			for(var i=0;i<this.values.length;i++)
			{
				this._map(this.maps[mapName],i);
			}
			return this;
		},
		_map:function(map,index)
		{
			var key=""+map.fn(this.values[index]);
			map.values[key]=index;
		},
		getMap:function(mapName)
		{
			var rtn={};
			if(this.maps[mapName]!=null)
			{
				SC.it(this.maps[mapName].values,function(index,gIndex)
				{
					rtn[gIndex]=this.values[index];
				},false,true,this);
			}
			return rtn;
		},
		hasMap:function(mapName)
		{
			return !!this.maps[mapName];
		},
		hasMapKey:function(mapName,key)
		{
			return this.maps[mapName]&&key in this.maps[mapName].values;
		},
		getMapValue:function(mapName,key)
		{
			if(this.hasMapKey(mapName,key))
				return this.values[this.maps[mapName].values[key]];
			return undefined;
		},
		getMapKeys:function(mapName)
		{
			if(this.hasMap(mapName))
				return Object.keys(this.maps[mapName].values);
			return [];
		},
		removeMap:function(mapName)
		{
			this._removeType("maps",mapName);
			return this;
		},
		
		filter:function(filterName,filterFn,sortFn)
		{
			switch(typeof filterFn)
			{
				case "string":
					filterFn=ORG._pathWrapper(filterFn);
					break;
				case "object":
					filterFn=ORG.filterPattern(filterFn);
					break;
			}
			if(typeof sortFn==="string")
				sortFn=ORG.pathSort(sortFn);
			this.filters[filterName]={filterFn:filterFn,sortFn:sortFn,values:[]};
			for(var i=0;i<this.values.length;i++)
			{
				this._filter(this.filters[filterName],i);
			}
			return this;
		},
		_filter:function(filter,index)
		{
			if(!filter.filterFn||filter.filterFn(this.values[index]))
			{
				if(!filter.sortFn)
				{
					filter.values.push(index);
				}
				else
				{
					var i=ORG.getOrderIndex(this.values[index],this.values,filter.sortFn,filter.values);
					filter.values.splice(i,0,index);
				}
			}
		},
		hasFilter:function(filterName)
		{
			return !!this.filters[filterName];
		},
		getFilter:function(filterName)
		{
			var rtn=[];
			if(this.filters[filterName]!=null)
			{
				SC.it(this.filters[filterName].values,function(index,gIndex)
				{
					rtn[gIndex]=this.values[index];
				},false,false,this);
			}
			return rtn;
		},
		getFilterValue:function(filterName,index)
		{
			if(this.filters[filterName]&&this.filters[filterName].values[index])
				return this.values[this.filters[filterName].values[index]];
			return undefined;
		},
		getFilterLength:function(filterName)
		{
			if(this.filters[filterName])
				return this.filters[filterName].values.length;
			return 0;
		},
		removeFilter:function(filterName)
		{
			this._removeType("filters",filterName);
			return this;
		},
		
		group:function(groupName,groupFn)
		{
			if(typeof groupFn==="string")
				groupFn=ORG._pathWrapper(groupFn);
			this.groups[groupName]={values:{},fn:groupFn};
			if(groupFn)
			{
				for(var i=0;i<this.values.length;i++)
				{
					this._group(this.groups[groupName],i);
				}
			}
			return this;
		},
		_group:function(group,index)
		{
			if(group.fn)
			{
				var gKey=group.fn(this.values[index]);
				group.values[gKey]=group.values[gKey]||[];
				group.values[gKey].push(index);
			}
		},
		hasGroup:function(groupName)
		{
			return !!this.groups[groupName];
		},
		getGroup:function(groupName)
		{
			var rtn={};
			if(this.hasGroup(groupName))
			{
				for(var gKey in this.groups[groupName].values)
				{
					rtn[gKey]=this.getGroupValue(groupName,gKey);
				}
			}
			return rtn;
		},
		getGroupValue:function(groupName,key)
		{
			var rtn=[];
			if(this.hasGroup(groupName)&&this.groups[groupName].values[key])
			{
				var groupValues=this.groups[groupName].values[key];
				for(var i=0;i<groupValues.length;i++)
				{
					rtn.push(this.values[groupValues[i]]);
				}
			}
			return rtn;
		},
		hasGroupKey:function(groupName,key)
		{
			return this.hasGroup(groupName)&&key in this.groups[groupName].values;
		},
		getGroupKeys:function(groupName)
		{
			if(this.hasGroup(groupName))
				return Object.keys(this.groups[groupName].values);
			return [];
		},
		removeGroup:function(groupName)
		{
			this._removeType("groups",groupName);
			return this;
		},
		
		destroy:function()
		{
			this.values=this.filters=this.maps=this.groups=null;
			this.add=this.filter=this.map=this.group=µ.constantFunctions.ndef
		}
	});
	ORG._pathWrapper=function(path)
	{
		return function(obj)
		{
			return SC.path(obj,path);
		}
	};
	ORG.sort=function(obj,obj2,DESC)
	{
		return (DESC?-1:1)*(obj>obj2)?1:(obj<obj2)?-1:0;
	};
	ORG.pathSort=function(path,DESC)
	{
		path=path.split(",");
		return function(obj,obj2)
		{
			var rtn=0;
			for(var i=0;i<path.length&&rtn===0;i++)
			{
				rtn=ORG.sort(SC.path(obj,path[i]),SC.path(obj2,path[i]),DESC)
			}
			return rtn;
		}
	};
	ORG.filterPattern=function(pattern)
	{
		return function(obj)
		{
			return SC.eq(obj,pattern);
		}
	};
	
	/**
	 * get index of the {item} in the {source} or {order} defined by {sort}
	 * 
	 * item		any
	 * source	[any]
	 * sort		function		// param: item, source[?]  returns 1,0,-1 whether item is higher,equal,lower than source[?]
	 * order	[source index]	// optional
	 *
	 * returns	number
	 */
	ORG.getOrderIndex=function(item,source,sort,order)
	{
		//start in the middle
		var length=(order?order:source).length;
		var jump=Math.ceil(length/2);
		var i=jump;
		var lastJump=null;
		while(jump/*!=0||NaN||null*/&&i>0&&i<=length&&!(jump===1&&lastJump===-1))
		{
			lastJump=jump;
			var compare=order?source[order[i-1]] : source[i-1];
			//jump half the size in direction of this sort			(if equals jump 1 to conserv the order)
			jump=Math.ceil(Math.abs(jump)/2)*Math.sign(sort(item,compare)) ||1;
			i+=jump;
		}
		i=Math.min(Math.max(i-1,0),length);
		return i
	};
	/**
	 * create an Array of ordered indexes of {source} using {sort}
	 *
	 * source	[any]
	 * sort		function		// param: item, source[?]  returns 1,0,-1 whether item is higher,equal,lower than source[?]
	 *
	 * return [number]
	 */
	ORG.getSortedOrder=function(source,sort)
	{
		var order=[];
		SC.it(source,function(item,index)
		{
			var orderIndex=ORG.getOrderIndex(item,source,sort,order);
			order.splice(orderIndex,0,index);
		});
		return order;
	};
	
	SMOD("Organizer",ORG);
	
})(Morgas,Morgas.setModule,Morgas.getModule);