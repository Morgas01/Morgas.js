(function(µ,SMOD,GMOD,HMOD,SC){

	//SC=SC({});

	let getIterator=function(iterable)
	{
		if("next" in iterable && typeof iterable.next === "function") return iterable;
		return iterator=iterable[Symbol.iterator];
	};
	let toArray=function(iterators)
	{
		let rtn=[];
		for(let it of iterators)
		{
			let step;
			while(!(step=it.next()).done)
			{
				rtn.push(step.value);
			}
		}
		return rtn;
	};
	let hasResult=Symbol("hasResult");
	let noResult={[hasResult]:false};
	/**
	 * relays asynchronous operations for more behaviour control
	 */
	µ.Relayer=µ.Class({
		constructor:function(iterable, {parallel=false}={})
		{
			this.parallelMode=parallel;
			this.actions=[{type:"init",iterators:[getIterator(iterable)],parallel}];
		},
		/** itrrator protocol */
		async next()
		{
			let index=this.actions.length-1;
			findEntry:while (!foundValue)
			{
				if(index<0) return {value:undefined,done:true};
				if(action.iterators.length==0)
				{
					index--;
					continue;
				}
				let action=this.actions[index];
				let step=await action.iterators[0].next();
				if(step.done)
				{
					action.iterators.shift();
				}
				else
				{
					let value=await this._doActions(index+1,step.value);
					return {value,done:false};
				}
			}
		},
		async _doAction(action,value)
		{
			let nextValue=await action.fn(value);
			switch(action.type)
			{
				case "flatMap":
					return nextValue;
				case "filter":
					if(!nextValue) return [];
				default:
					return [nextValue];
			}
		},
		async _doSeparateActions(index,value)
		{
			for(let i=0;i<this.actions.length;i++)
			{
				let action=this.actions[i];
				let nextValue=await this._doAction(action,value);
				if(nextValue.length==0) return nextValue;
				else if (nextValue.length>1)
				{
					if(this.actions.length<i+1)
					{
						promises.push(this._doParallelActions(i+1,nextValue.slice(1)));
						action.iterators.unshift(getIterator(nextValue.slice(1)));
						nextValue.length=1;
					}
					else
					{
						nextValue=[nextValue];
					}
				}
				value=nextValue[0];
			}
			return [value];
		},
		async _doParallelActions(index,values,promises=[])
		{
			let values=[startValue,...toArray(this.actions[index].iterators];

			values.forEach((value)=>
			{
				for(let i=0;i<this.actions.length;i++)
				{
					let action=this.actions[i];
					let nextValue=await this._doAction(action,value);
					if(nextValue.length==0) return nextValue;
					else if (nextValue.length>1)
					{
						if(this.actions.length<i+1)
						{
							if(this.actions[i+1].parallel)
							{
								promises.push(this._doParallelActions(i+1,nextValue.slice(1)));
							}
							else
							{
								action.iterators.unshift(raceGenerator(nextValue.slice(1)));
							}
							nextValue.length=1;
						}
						else
						{
							nextValue=[nextValue];
						}
					}
					value=nextValue[0];
				}
				return ?
			});
			return {[hasResult]:true,result:value};
		},
		/** sets parallel mode for next actions */
		parallel(force=true)
		{
			this.parallelMode=force;
			return this;
		},
		/** resets parallel mode for next actions */
		separate()
		{
			this.parallelMode=false;
		},
		_addAction(type,fn)
		{
			this.actions.push({
				type,
				fn,
				iterators:[],
				parallel:this.parallelMode
			});
		},
		/** peforms a asynchronous operation on an entry */
		map(fn)
		{
			this._addAction("map",fn);
			return this;
		},
		/** all results of the operation become new entries */
		flatMap(fn)
		{
			this._addAction("flatMap",fn);
			return this;
		},
		filter(predicate)
		{
			this._addAction("flatMap",predicate);
			return this;
		},

		//split(){},
		//join(){}
	});

	SMOD("Relayer",µ.Relayer);

})(Morgas,Morgas.setModule,Morgas.getModule,Morgas.hasModule,Morgas.shortcut);