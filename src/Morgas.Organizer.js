(function(µ,SMOD,GMOD,HMOD,SC){

	var SA=GMOD("SortedArray");

	SC=SC({
		it:"iterate",
		eq:"equals",
		goPath:"goPath",
		proxy:"proxy"
	});
	 
	var ORG=µ.Organizer=µ.Class(SA,{
		init:function(values)
		{

			this.filters=new Map();
			SC.proxy(this.filters,{
				"has":"hasFilter",
				"get":"getFilter"
			},this);

			this.maps=new Map();
			SC.proxy(this.maps,{
				"has":"hasMap",
				"delete":"removeMap"
			},this);

			this.groups=new Map();
			SC.proxy(this.groups,{
				"has":"hasGroup"
			},this);

			this.mega(values);
			
		},
		getSort:SA.prototype.get,
		getIndexSort:SA.prototype.getIndexes,
		filter:function(filterName,filterFn)
		{
			switch(typeof filterFn)
			{
				case "string":
					filterFn=SC.goPath.guide(filterFn);
					break;
				case "object":
					filterFn=SC.eq.test(filterFn);
					break;
			}
			var child=new ORG();
			child.library=this.library||this.values;
			child._filterFn=filterFn;
			if(this.hasFilter(filterName))this.removeFilter(filterName);
			this.filters.set(filterName,child);
			for(var i=0;i<this.values.length;i++)
			{
				this._filter(child,i);
			}
			return this;
		},
		_filter:function(child,index)
		{
			var item=this.values[index];
			if(this.library){
				index=item;
				item=this.library[index];
			}
			if(child._filterFn(item)) child.add([index]);
		},
		removeFilter:function(filterName)
		{
			if(this.hasFilter(filterName))
			{
				this.filters.get(filterName).destroy();
				this.filters.delete(filterName);
			}
		},

		map:function(mapName,mapFn)
		{
			if(typeof mapFn==="string")
				mapFn=SC.goPath.guide(mapFn);
			var map={mapFn:mapFn,values:{}};
			if(this.hasMap(mapName))this.removeMap(mapName);
			this.maps.set(mapName,map);
			for(var i=0;i<this.values.length;i++)
			{
				this._map(map,i);
			}
			return this;
		},
		_map:function(map,index)
		{
			var item=this.values[index];
			if(this.library){
				index=item;
				item=this.library[index];
			}
			var key=""+map.mapFn(item);
			map.values[key]=index;
		},
		getIndexMap:function(mapName)
		{
			if(this.hasMap(mapName))return this.maps.get(mapName).values;
			return null;
		},
		getMap:function(mapName)
		{
			if(this.hasMap(mapName))
			{
				var rtn={};
				SC.it(this.getIndexMap(mapName),(index,gIndex)=>
				{
					if(this.library) rtn[gIndex]=this.library[index];
					else rtn[gIndex]=this.values[index];
				},false,true,this);
				return rtn;
			}
			else return null;
		},
		
		group:function(groupName,groupFn)
		{
			if(typeof groupFn==="string")
				groupFn=SC.goPath.guide(groupFn);
			var group={values:{},groupFn:groupFn};
			if(this.hasGroup(groupName))this.removeGroup(groupName);
			this.groups.set(groupName,group);
			for(var i=0;i<this.values.length;i++)
			{
				this._group(group,i);
			}
			return this;
		},
		_group:function(group,index)
		{
			var item=this.values[index];
			if(this.library){
				index=item;
				item=this.library[index];
			}
			var gKeys=[].concat(group.groupFn(item));
			for(gKey of gKeys)
			{
				if(!(gKey in group.values))
				{
					var child=new ORG();
					child.library=this.library||this.values;
					group.values[gKey]=child;
				}
				group.values[gKey].add([index]);
			}
		},
		getGroup:function(groupName)
		{
			if(this.hasGroup(groupName))
			{
				return this.groups.get(groupName).values;
			}
			else return undefined;
		},
		getGroupPart:function(groupName,partName)
		{
			if(this.hasGroup(groupName))
			{
				return this.getGroup(groupName)[partName];
			}
			else return undefined;
		},
		getGroupValues:function(groupName)
		{
			if(this.hasGroup(groupName))
			{
				var _g=this.getGroup(groupName);
				var rtn={};
				for(var i in _g)rtn[i]=_g[i].getValues();
				return rtn;
			}
			else return undefined;
		},
		removeGroup:function(groupName)
		{
			if(this.hasGroup(groupName))
			{
				var gs=this.getGroup(groupName);
				for(var g in gs)
				{
					gs[g].destroy();
				}
				this.groups.delete(groupName);
			}
			return this;
		},
		add:function(values)
		{
			var indexes=this.mega(values);
			if(indexes)
			{
				this._add(indexes);
				return indexes;
			}
			return null;
		},
		_add:function(indexes)
		{
			SC.it(indexes,index=>
			{
				SC.it(this.filters,child=>this._filter(child,index));
				SC.it(this.maps,map=>this._map(map,index));
				SC.it(this.groups,group=>this._group(group,index));
			});
		},
		remove:function(values)
		{
			var indexes=this.mega(values);
			if(indexes)
			{
				this._remove(indexes);
				return indexes;
			}
			return this;
		},
		_remove:function(indexes)
		{
			SC.it(this.filters,child=>child.remove(indexes));
			SC.it(this.maps,map=>{
				for(var m in map.values)
				{
					if(indexes.indexOf(map.values[m])!==-1) delete map.values[m];
				}
			});
			SC.it(this.groups,group=>{
				for(var g in group.values)
				{
					group.values[g].remove(indexes);
				}
			});
		},
		update:function(values)
		{
			var indexes=this.mega(values);
			if(indexes)
			{
				this._remove(indexes);
				this._add(indexes);
			}
		},
		clear:function()
		{
			SC.it(this.filters,child=>child.clear());
			this.maps.clear();
			SC.it(this.groups,group=>{
				for(var g in group.values)
				{
					group.values[g].clear();
				}
			});
			this.values.length=0;
			return this;
		},
		
		destroy:function()
		{
			SC.it(this.filters,child=>child.destroy());
			this.filters.clear();
			this.maps.clear();
			SC.it(this.groups,group=>{
				for(var g in group.values)
				{
					group.values[g].destroy();
				}
			});
			this.groups.clear();

			this.mega();
		}
	});
	ORG.sortSimple=SA.simple;
	ORG.sortGetter=SA.simpleGetter;
	/*
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
	*/
	
	SMOD("Organizer",ORG);
	
})(Morgas,Morgas.setModule,Morgas.getModule,Morgas.hasModule,Morgas.shortcut);