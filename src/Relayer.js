(function(µ,SMOD,GMOD,HMOD,SC){

	//SC=SC({});
	
	let getAsyncIterator=async function*(iterable)
	{
		yield* iterable;
	};

	/**
	 * relays asynchronous operations for a reversion of control
	 * Instead of calculating every entry and iterating over results
	 * on every iteration the value will be calculated on demand.
	 *
	 * Relayer is also an asyncIterator.
	 *
	 * @param {Iterable} (iterable=[])
	 */
	µ.Relayer=µ.Class({
		constructor:function(iterable=[])
		{
			this.inputIterator=µ.Relayer.refillableIterator(iterable);
			this.actionIterator=this.inputIterator;
		},
		/** iterator protocol */
		async next()
		{
			return this.actionIterator.next();
		},
		[Symbol.asyncIterator]()
		{
			return this;
		},
		/** peforms a asynchronous operation on an entry */
		map(fn)
		{
			this.actionIterator=µ.Relayer.actions.map(this.actionIterator,fn);
			return this;
		},
		/** all results of the operation become new entries */
		flatMap(fn)
		{
			this.actionIterator=µ.Relayer.actions.flatMap(this.actionIterator,fn);
			return this;
		},
		filter(fn)
		{
			this.actionIterator=µ.Relayer.actions.filter(this.actionIterator,fn);
			return this;
		},
		refill(...data)
		{
			this.inputIterator.refill(...data);
			return this;
		}
	});

	µ.Relayer.actions={
		map(iterator,fn)
		{
			return {
				async next()
				{
					let input=await iterator.next();
					if(input.done) return input;
					return {value:await fn(input.value),done:false};
				}
			};
		},
		filter(iterator,fn)
		{
			return {
				async next()
				{
					while(true)
					{
						let input=await iterator.next();
						if(input.done||fn(input.value)) return input;
					}
				}
			}
		},
		flatMap(iterator,fn)
		{
			let resultIterator=null;
			return {
				async next()
				{
					while(true)
					{
						if(!resultIterator)
						{
							let input=await iterator.next();
							if(input.done) return input;
							resultIterator=getAsyncIterator(await fn(input.value));
						}
						let result=await resultIterator.next();
						if(result.done)
						{
							resultIterator=null;
						}
						else
						{
							return result;
						}
					}
				}
			}
		}
	};

	µ.Relayer.refillableIterator=function(input=[])
	{
		input=Array.from(input); //dereference and normalize parameter
		return {
			next()
			{
				if(input.length<=0) return {value:undefined,done:true};
				return {value:input.shift(),done:false};
			},
			refill:input.push.bind(input)
		};
	}

	SMOD("Relayer",µ.Relayer);

})(Morgas,Morgas.setModule,Morgas.getModule,Morgas.hasModule,Morgas.shortcut);