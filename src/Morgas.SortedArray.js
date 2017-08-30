(function(µ,SMOD,GMOD,HMOD,SC){
	
	//SC=SC({});

	/**
	 * holds values an sorted arrays of their indexes.
	 * If values are already indexes use libary
	 *
	 * @param {any} (values=null)
	 * @param {object} (library=null}
	 */
	let SA=µ.SortedArray=µ.Class({
		constructor:function(values,library)
		{
			this.sorts=new Map();
			this.values=[];
			this.values.freeIndexes=[];
			this.library=library;
			this.add(values);
		},
		hasSort:function(sortName){return this.sorts.has(sortName)},
		sort:function(sortName,sortFn)
		{
			let sort=[];
			this.sorts.set(sortName,sort);
			sort.sortFn=sortFn;
			this.values.forEach((item,index)=>this._addToSort(sort,item,index));
			return this;
		},
		add:function(values)
		{
			if(values!=null)
			{
				let indexes=[];
				for(let item of values)
				{
					let index=this.values.freeIndexes.shift();
					if(index===undefined)index=this.values.length;
					this.values[index]=item;
					indexes.push(index);
					for (let sort of this.sorts.values())
					{
						this._addToSort(sort,item,index);
					};
				};
				return indexes;
			}
			return null;
		},
		_addToSort:function(sort,item,index)
		{
			if(!this.library)
			{
				let orderIndex=SA.getOrderIndex(item,this.values,sort.sortFn,sort);
				sort.splice(orderIndex,0,index);
			}
			else
			{
				let orderIndex=SA.getOrderIndex(this.library[item],this.library,sort.sortFn,sort);
				sort.splice(orderIndex,0,item);
			}
		},
		remove:function(values)
		{
			if(values==null) return null;
			let indexes=[];
			for (let item of values)
			{
				let valueIndex=this.values.indexOf(item);
				if (valueIndex!==-1)
				{
					let index=(this.library ? item : valueIndex);
					if(index!=null)
					{
						for(let sort of this.sorts.values())
						{
							let orderIndex=sort.indexOf(index);
							if (orderIndex!==-1) sort.splice(orderIndex,1);
						}
						if(valueIndex===this.values.length-1)this.values.length--;
						else
						{
							delete this.values[valueIndex];
							this.values.freeIndexes.push(valueIndex);
						}
						indexes.push(index);
					}
				}
			}
			return indexes;
		},
		update:function(values)
		{
			if(!values)
			{//all
				values=this.values.slice();
				this.clear();
				return this.add(values);
			}
			else
			{
				let indexes=[];
				for(let item of this.values)
				{
					let index=this.values.indexOf(item);
					if(index!==-1)indexes.push(index);
				}
				for(let sort of this.sorts.values())
				{
					for(let index of indexes)
					{
						if(this.library)index=this.values[index];
						let orderIndex=sort.indexOf(index);
						if(orderIndex!==-1)
						{
							sort.splice(orderIndex,1);
						}
					}
					for(let index of indexes)
					{
						this._addToSort(sort,this.values[index],index);
					}
				}
				return indexes;
			}

		},
		getIndexes:function(sortName)
		{
			if (!this.sorts.has(sortName))return null;
			else return this.sorts.get(sortName).slice();
		},
		get:function(sortName)
		{
			if (!this.sorts.has(sortName))return null;
			else if (this.library) return this.sorts.get(sortName).map(i=>this.library[i]);
			else return this.sorts.get(sortName).map(i=>this.values[i]);
		},
		/**
		 * returns an Array of values without empty entries.
		 * uses libary if there is one
		 * @returns {any[]}
		 */
		getValues:function()
		{
			if(this.library) return this.values.map(i=>this.library[i]);
			return this.values.slice();
		},
		/**
		 * returns value for the library index.
		 * returns undefined if no library is defined.
		 * @param {number} libaryIndex
		 * @returns {any}
		 */
		getValue:function(libaryIndex)
		{
			if(this.library)return this.library[libaryIndex];
			return undefined;
		},
		clear:function()
		{
			this.values.length=this.values.freeIndexes.length=0;
			for(let sort of this.sorts.values()) sort.length=0;
			return this;
		},
		destroy:function()
		{
			this.values.length=this.values.freeIndexes.length=0;
			this.sorts.clear();
			this.mega();
		}
	});

	
	/**
	 * @summary Get index of the {item} in the {source} or {order} defined by {sort}
	 * @description Finds the index of {item} in {source}.
	 * The order is defined by the sort function (like Array.sort()).
	 * If {Source} is not sorted, you must supply {order} as an Array of indexes in the right order.
	 *
	 *
	 * @param {any} item - item to find the index of
	 * @param {any[]} source - original array. must be sorted if order is not supplied!
	 * @param {function} sort	(item, source item ) returns 1,0,-1 whether item is higher,equal,lower than source item
	 * @param {number[]} (order) - Array of sorted indexes of source. Defaults to an array with 0..source.length-1
	 *
	 * @returns	{number}
	 */
	SA.getOrderIndex=function(item,source,sort,order=[...Array(source.length).keys()])
	{
		//start in the middle
		let length=order.length;
		let jump=Math.ceil(length/2);
		let i=jump;
		let lastJump=null;
		while(jump/*!=0||NaN||null*/&&i>0&&i<=length&&!(jump===1&&lastJump===-1))
		{
			lastJump=jump;
			let compare=source[order[i-1]];
			//jump half the size in direction of this sort			(if equals jump 1 to conserv the order)
			jump=Math.ceil(Math.abs(jump)/2)*Math.sign(sort(item,compare)) ||1;
			i+=jump;
			if((i<1||i>length)&&Math.abs(jump)>1)i=Math.max(1,Math.min(length,i));
		}
		i=Math.min(Math.max(i-1,0),length);
		return i
	};
	
	/**
	 * sort simply by using > or < 
	 * @param {boolean} DESC
	 */
	SA.naturalOrder=function(DESC)
	{
		return function(a,b){return (DESC?-1:1)*( (a>b) ? 1 : (a<b) ? -1 : 0)};
	};

	/**
	 * sort the values returned by getter simply by using > or < 
	 * @param {function} getter
	 * @param {boolean} DESC
	 */
	SA.orderBy=function(getter,DESC)
	{
		return function(_a,_b)
		{
			let a=getter(_a),b=getter(_b);
			return (DESC?-1:1)*( (a>b) ? 1 : (a<b) ? -1 : 0);
		};
	};
	
	SMOD("SortedArray",SA);
})(Morgas,Morgas.setModule,Morgas.getModule,Morgas.hasModule,Morgas.shortcut);