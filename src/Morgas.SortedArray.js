(function(µ,SMOD,GMOD,HMOD,SC){
	
	SC=SC({
		it:"iterate"
	});
	/**
	 * holds values an sorted arrays of their indexes.
	 * If values are already indexes use libary
	 *
	 * @param {any} (values=null)
	 * @param {object} (library=null}
	 */
	var SA=µ.SortedArray=µ.Class(Array,{
		init:function(values,library)
		{
			this.sorts=new Map();
			this.values=[];
			this.values.freeIndexes=[];
			this.library=library;
			this.add(values);
		},
		sort:function(sortName,sortFn)
		{
			var sort=[];
			this.sorts.set(sortName,sort);
			sort.sortFn=sortFn;
			SC.it(this.values,(item,index)=>this._addToSort(sort,item,index));
			return this;
		},
		add:function(values)
		{
			if(values!=null)
			{
				SC.it(values,item=>
				{
					var index=this.values.freeIndexes.shift();
					if(index===undefined)index=this.values.length;
					this.values[index]=item;
					SC.it(this.sorts,sort=>
					{
						this._addToSort(sort,item,index);
					});
				});
			}
			return this;
		},
		_addToSort:function(sort,item,index)
		{
			if(!this.library)
			{
				var orderIndex=SA.getOrderIndex(item,this.values,sort.sortFn,sort);
				sort.splice(orderIndex,0,index);
			}
			else
			{
				var orderIndex=SA.getOrderIndex(this.library[item],this.library,sort.sortFn,sort);
				sort.splice(orderIndex,0,item);
			}
		},
		remove:function(values)
		{
			if(values!=null)
			{
				SC.it(values,item=>
				{
					var index=this.values.indexOf(item);
					if(index!==-1)
					{
						SC.it(this.sorts,sort=>
						{
							var orderIndex=sort.indexOf(index);
							if (orderIndex!==-1) sort.splice(orderIndex,1);
						});
						delete this.values[index];
						this.values.freeIndexes.push(index);
					}
				});
			}
			return this;
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
				var indexes=[];
				SC.it(values,(item)=>
				{
					var index=this.values.indexOf(item);//only search index if not iterating over this.values
					if(index!==-1)indexes.push(index);
				});
				SC.it(this.sorts,sort=>
				{
					for(var index of indexes)
					{
						var orderIndex=sort.indexOf(index);
						if(orderIndex!==-1)
						{
							sort.splice(orderIndex,1);
						}
					}
					for(var index of indexes)
					{
						this._addToSort(sort,this.values[index],index);
					}
				});
			}
			return this;
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
		clear:function()
		{
			this.values.length=this.values.freeIndexes.length=0;
			SC.it(this.sorts,sort=>sort.length=0);
			return this;
		}
	});

	
	/**
	 * get index of the {item} in the {source} or {order} defined by {sort}
	 * 
	 * @param {any} item		
	 * @param {any[]} source
	 * @param {function} sort	(item, source item ) returns 1,0,-1 whether item is higher,equal,lower than source item
	 * @param {number[]} order	Array of sorted indexes of source
	 *
	 * @returns	number
	 */
	SA.getOrderIndex=function(item,source,sort,order)
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
	 * sort simply by using > or < 
	 * @param {boolean} DESC
	 */
	SA.simple=function(DESC)
	{
		return function(a,b){return (DESC?-1:1)*( (a>b) ? 1 : (a<b) ? -1 : 0)};
	};

	/**
	 * sort the values returned by getter simply by using > or < 
	 * @param {function} getter
	 * @param {boolean} DESC
	 */
	SA.simpleGetter=function(getter,DESC)
	{
		return function(_a,_b)
		{
			var a=getter(_a),b=getter(_b);
			return (DESC?-1:1)*( (a>b) ? 1 : (a<b) ? -1 : 0);
		};
	};
	
	SMOD("SorrtedArray",SA);
})(Morgas,Morgas.setModule,Morgas.getModule,Morgas.hasModule,Morgas.shortcut);