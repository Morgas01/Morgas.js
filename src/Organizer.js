(function(µ,SMOD,GMOD,HMOD,SC){

	let SortedArray=GMOD("SortedArray");

	SC=SC({
		eq:"equals",
		goPath:"goPath",
		proxy:"proxy",
		encase:"encase"
	});
	 
	let ORG=µ.Organizer=µ.Class(SortedArray,{
		constructor:function(values)
		{

			this.filters=new Map();
			SC.proxy(this.filters,{
				"has":"hasFilter",
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
		sort(sortName,sortFn)
		{
			if(typeof sortFn==="string") sortFn=ORG.orderBy(SC.goPath.guide(sortFn));
			return this.mega(sortName,sortFn);
		},
		getSort:SortedArray.prototype.get,
		getIndexSort:SortedArray.prototype.getIndexes,
		getIndexes()
		{
			return this.library ? this.values.slice() : this.values.map((a,i)=>i);
		},
		filter:function(filterName,filterFn,createFn)
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
			let filter=this.filters.get(filterName);
			if(!filter)
			{
				let child=new ORG();
				child.library=this.library||this.values;
				filter={
					child:child,
					fn:filterFn
				};
			}
			else
			{
				filter.fn=filterFn;
				filter.child.clear();
			}
			this.filters.set(filterName,filter);

			if(createFn) createFn(filter.child);

			for(let i=0;i<this.values.length;i++)
			{
				this._filter(filter,this.values[i],i);
			}
			return this;
		},
		_filter:function(filter,value,index)
		{
			if(this.library)
			{
				index=value;
				value=this.library[index];
			}
			if(filter.fn(value)) filter.child.add(index);
		},
		getFilter:function(filterName)
		{
			if(this.hasFilter(filterName))
			{
				return this.filters.get(filterName).child;
			}
			return null;
		},
		removeFilter:function(filterName)
		{
			if(this.hasFilter(filterName))
			{
				this.filters.get(filterName).child.destroy();
				this.filters.delete(filterName);
			}
		},
		map:function(mapName,mapFn)
		{
			if(typeof mapFn==="string") mapFn=SC.goPath.guide(mapFn);
			let map={mapFn:mapFn,values:{}};
			if(this.hasMap(mapName)) this.removeMap(mapName);
			this.maps.set(mapName,map);
			for(let i=0;i<this.values.length;i++)
			{
				this._map(map,this.values[i],i);
			}
			return this;
		},
		_map:function(map,value,index)
		{
			if(this.library){
				index=value;
				value=this.library[index];
			}
			let key=""+map.mapFn(value);
			map.values[key]=index;
		},
		getIndexMap:function(mapName)
		{
			if(this.hasMap(mapName))return Object.assign({},this.maps.get(mapName).values);
			return null;
		},
		getMap:function(mapName)
		{
			if(this.hasMap(mapName))
			{
				let rtn={};
				for(let [key,index] of Object.entries(this.maps.get(mapName).values))
				{
					if(this.library) rtn[key]=this.library[index];
					else rtn[key]=this.values[index];
				}
				return rtn;
			}
			else return null;
		},
		group:function(groupName,groupFn,createFn)
		{
			if(typeof groupFn==="string") groupFn=SC.goPath.guide(groupFn);
			let group={children:{},groupFn:groupFn,createFn:createFn};
			if(this.hasGroup(groupName))this.removeGroup(groupName);
			this.groups.set(groupName,group);
			for(let i=0;i<this.values.length;i++)
			{
				this._group(group,this.values[i],i);
			}
			return this;
		},
		_group:function(group,value,index)
		{
			if(this.library){
				index=value;
				value=this.library[index];
			}
			let gKeys=SC.encase(group.groupFn(value));
			for(let gKey of gKeys)
			{
				if(!(gKey in group.children))
				{
					let child=new ORG();
					child.library=this.library||this.values;
					if(group.createFn)group.createFn(child,gKey);
					group.children[gKey]=child;
				}
				group.children[gKey].add(index);
			}
		},
		getGroup:function(groupName)
		{
			if(this.hasGroup(groupName))
			{
				return Object.assign({},this.groups.get(groupName).children);
			}
			else return undefined;
		},
		getGroupParts:function(groupName)
		{
			if(this.hasGroup(groupName))
			{
				return Object.keys(this.groups.get(groupName).children);
			}
			else return undefined;
		},
		getGroupPart:function(groupName,partName)
		{
			if(this.hasGroup(groupName))
			{
				return this.groups.get(groupName).children[partName];
			}
			else return undefined;
		},
		getGroupValues:function(groupName)
		{
			if(this.hasGroup(groupName))
			{
				let _g=this.getGroup(groupName);
				let rtn={};
				for(let i in _g)rtn[i]=_g[i].getValues();
				return rtn;
			}
			else return undefined;
		},
		removeGroup:function(groupName)
		{
			if(this.hasGroup(groupName))
			{
				let gs=this.getGroup(groupName);
				for(let g in gs)
				{
					gs[g].destroy();
				}
				this.groups.delete(groupName);
			}
			return this;
		},
		add:function(value)
		{
			let index=this.mega(value);
			this._add(index);
			return index;
		},
		_add:function(index)
		{
			let value=this.values[index];
			for(let filter of this.filters.values()) this._filter(filter,value,index);
			for(let map of this.maps.values()) this._map(map,value,index);
			for(let group of this.groups.values()) this._group(group,value,index);
		},
		remove:function(values)
		{
			let indexes=this.mega(values);
			if(indexes)
			{
				this._remove(indexes);
				return indexes;
			}
			return indexes;
		},
		_remove:function(indexes)
		{
			for(let filter of this.filters.values()) filter.child.remove(indexes);
			for(let map of this.maps.values())
			{
				for(let m in map.values)
				{
					if(indexes.indexOf(map.values[m])!==-1) delete map.values[m];
				}
			}
			for(let group of this.groups.values())
			{
				for(let child of Object.values(group.children))
				{
					child.remove(indexes);
				}
			}
		},
		update:function(values)
		{
			let indexes=this.mega(values);
			if(indexes)
			{
				this._remove(indexes);
				for(let index of indexes) this._add(index);
			}
		},
		clear:function()
		{
			this.mega();
			for(let filter of this.filters.values()) filter.child.clear();
			for(let map of this.maps.values()) map.values={};
			for(let group of this.groups.values())
			{
				for(let child in Object.values(group.children))
				{
					child.clear();
				}
			}
			return this;
		},
		/**
		 * @param {Boolean} (some=false) - collect values that matches some filters ( false = every filter )
		 * @param {String} (sort) - name of sort
		 */
		combine:function(some,sort)
		{
			some=!!some;
			let indexes=this.hasSort(sort)?this.getIndexSort(sort):this.getIndexes();
			let inside=some?[]:indexes;
			let outside=some?indexes:[];
			let _doCombine=list=>
			{
				let i=inside,o=outside;
				if(some)i=outside,o=inside;

				i.forEach((value,index)=>
				{
					if((list.indexOf(value)!==-1)==some)// in list XOR collecting those in some lists
					{
						o[index]=value;
						delete i[index];
					}
				});
			};
			let rtn={
				getIndexes:outer=>(outer?outside:inside).filter(i=>i!=undefined),
				get:outer=>rtn.getIndexes(outer).map(i=>(this.library?this.library:this.values)[i]),
				filter:name=>
				{
					if(this.hasFilter(name))_doCombine(this.getFilter(name).values);
					return rtn;
				},
				group:(name,part)=>
				{
					part=this.getGroupPart(name,part);
					_doCombine(part?part.values:[]);
					return rtn;
				},
				combine:c=>
				{
					if(c._getOrigin()===this||c._getOrigin().library===this.library)
					{
						_doCombine(c.getIndexes());
					}
					return rtn;
				},
				_getOrigin:()=>this
			};
			return rtn;
		},
		destroy:function()
		{
			for (let filter of this.filters.values())
			{
				filter.child.destroy();
			}
			this.filters.clear();
			this.maps.clear();
			for (let group of this.groups.values())
			{
				for(let child of Object.values(group.children))
				{
					child.destroy();
				}
			}
			this.groups.clear();

			this.mega();
		}
	});
	ORG.naturalOrder=SortedArray.naturalOrder;
	ORG.orderBy=SortedArray.orderBy;
	
	/**
	 * sort by multiple attributes
	 * @param {string|string[]} paths array of paths to attributes for sorting
	 * @param {boolean} (DESC=false)
	 * @return function
	 */
	ORG.attributeSort=function(paths,DESC)
	{
		paths=SC.encase(paths);
		return function(obj,obj2)
		{
			let rtn=0,a,b;
			for(let i=0;i<paths.length&&rtn===0;i++)
			{
				a=SC.goPath(obj,paths[i]);
				b=SC.goPath(obj2,paths[i]);
				rtn=(DESC?-1:1)*( (a>b) ? 1 : (a<b) ? -1 : 0)
			}
			return rtn;
		}
	};
	
	SMOD("Organizer",ORG);
	
})(Morgas,Morgas.setModule,Morgas.getModule,Morgas.hasModule,Morgas.shortcut);