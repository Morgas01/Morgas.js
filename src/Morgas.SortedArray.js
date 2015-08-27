(function(µ,SMOD,GMOD,HMOD,SC){
	
	SC=SC({
		it:"iterate"
	});
	
	var SA=µ.SortedArray=µ.Class(Array,{
		init:function(values)
		{
			this.sorts=new Map()
			this.values=[];
			this.add(values);
		},
		sort:function(sortName,sortFn)
		{
			var sort=[];
			this.sorts.set(sortName,sort);
			sort.sortFn=sortFn;
			return this.update(sortName)
		},
		add:function(values)
		{
			if(values!=null)
			{
				SC.it(values,item=>
				{
					var index=this.values.length;
					this.values.push(item);
					SC.it(this.sorts,sort=>
					{
						var orderIndex=SA.getOrderIndex(item,this.values,sort.sortFn,sort);
						sort.splice(orderIndex,0,index);
					});
				});
			}
			return this;
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
							if(orderIndex!==-1)sort.splice(orderIndex,1);
						});
						this.values.splice(index,1);
					}
				});
			}
			return this;
		},
		update:function(sortName)
		{
			if(!sortName||sortName==="all")
			{
				SC.it(this.sorts,(sort,sortName)=>this.update(sortName));
			}
			else if (this.sorts.has(sortName))
			{
				var sort=this.sorts.get(sortName);
				SA.getSortedOrder(this.values,sort.sortFn,sort);
			}
			return this;
		},
		get:function(sortName)
		{
			if (!this.sorts.has(sortName))return [];
			else return this.sorts.get(sortName).map(i=>this.values[i]);
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
	 * create an Array of ordered indexes of {source} using {sort}
	 *
	 * @param {any[]} source
	 * @param {function} sort	(item, source item ) returns 1,0,-1 whether item is higher,equal,lower than source item
	 * @param {number[]} (order=[]) array to fill
	 *
	 * @return {number[]}
	 */
	SA.getSortedOrder=function(source,sort,order)
	{
		order=order||[];
		order.length=0;
		SC.it(source,function(item,index)
		{
			var orderIndex=SA.getOrderIndex(item,source,sort,order);
			order.splice(orderIndex,0,index);
		});
		return order;
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