(function(µ,SMOD,GMOD,HMOD,SC){
	
	SC=SC({
		encase:"encase"
	});

	/**
	 * Holds values and sorted arrays of their indexes.
	 * If values are already indexes use library.
	 *
	 * @param {any} (values=null) - values or indexes of library
	 * @param {Object} (library=null} - map of index to real values
	 */
	let SA=µ.SortedArray=µ.Class({
		constructor:function(values,library)
		{
			this.sorts=new Map();
			this.values=[];
			this.values.freeIndexes=[];
			this.library=library;

			if(values)this.addAll(values);
		},
		add:function(values)
		{
			return SC.encase(values)
			.map(value=>
			{
				let index=this.values.freeIndexes.shift();
				if(index===undefined)index=this.values.length;
				this.values[index]=value;
				for (let sort of this.sorts.values())
				{
					this._addToSort(sort,value,index);
				};
				return index;
			});
		},
		/** @deprecated */
		addAll(values)
		{
			return this.add(values)
		},
		hasSort:function(sortName){return this.sorts.has(sortName)},
		sort:function(sortName,sortFn)
		{
			let sort=this.sorts.get(sortName);
			if(sort)
			{
				sort.indexes.length=0;
				sort.fn=sortFn;
			}
			else
			{
				sort={indexes:[],fn:sortFn};
			}
			this.sorts.set(sortName,sort);
			this.values.forEach((item,index)=>this._addToSort(sort,item,index));
			return this;
		},
		_addToSort:function(sort,value,index)
		{
			let orderIndex;
			let source=this.values;
			if(this.library)
			{
				index=value;
				value=this.library[index];
				source=this.library;
			}
			orderIndex=SA.getOrderIndex(value,source,sort.fn,sort.indexes);
			sort.indexes.splice(orderIndex,0,index);
		},
		remove:function(values)
		{
			values=SC.encase(values);
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
							let orderIndex=sort.indexes.indexOf(index);
							if (orderIndex!==-1) sort.indexes.splice(orderIndex,1);
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
			values=SC.encase(values);
			if(values.length==0)
			{//all
				values=this.values.slice();
				this.clear();
				return this.add(values);
			}

			let indexes=[];
			for(let value of values)
			{
				let index=this.values.indexOf(value);
				if(index!==-1) indexes.push(index);
			}
			for(let sort of this.sorts.values())
			{
				for(let index of indexes)
				{
					if(this.library)index=this.values[index];
					let orderIndex=sort.indexes.indexOf(index);
					if(orderIndex!==-1)
					{
						sort.indexes.splice(orderIndex,1);
					}
				}
				for(let index of indexes)
				{
					this._addToSort(sort,this.values[index],index);
				}
			}
			return indexes;

		},
		getIndexes:function(sortName)
		{
			if (!this.sorts.has(sortName))return null;
			else return this.sorts.get(sortName).indexes.slice();
		},
		get:function(sortName)
		{
			let sort=this.sorts.get(sortName)
			if (!sort)return null;
			else if (this.library) return sort.indexes.map(i=>this.library[i]);
			else return sort.indexes.map(i=>this.values[i]);
		},
		/**
		 * returns an Array of values without empty entries.
		 * uses libary if there is one
		 * @returns {any[]}
		 */
		getValues:function()
		{
			let rtn=[];
			for(let index in this.values)
			{
				if(index!=="freeIndexes")
				{
					if(this.library) rtn.push(this.library[this.values[index]]);
					else rtn.push(this.values[index]);
				}
			}
			return rtn;
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
			for(let sort of this.sorts.values()) sort.indexes.length=0;
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
	 * @summary Get index of the {item} in the {source}(actual values) or {order}(ordered indexes) defined by {sort}
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
		return DESC ? SA.naturalOrder.DESC : SA.naturalOrder.ASC;
	};
		SA.naturalOrder.ASC=(a,b)=>(a>b) ? 1 : (a<b) ? -1 : 0;
	SA.naturalOrder.DESC=(a,b)=>(a>b) ? -1 : (a<b) ? 1 : 0;

	/**
	 * sort the values returned by getter simply by using > or < 
	 * @param {function} getter
	 * @param {boolean} DESC
	 */
	SA.orderBy=function(getter,DESC)
	{
		let sort=SA.naturalOrder(DESC)
		return function(_a,_b)
		{
			let a=getter(_a),b=getter(_b);
			return sort(a,b);
		};
	};
	
	SMOD("SortedArray",SA);
})(Morgas,Morgas.setModule,Morgas.getModule,Morgas.hasModule,Morgas.shortcut);