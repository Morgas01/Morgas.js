(function(µ,SMOD,GMOD,HMOD,SC){

	//SC=SC({});

	/**
	 * relays asynchronous operations for more behaviour control
	 */
	µ.Relayer=µ.Class({
		constructor:function(iterable)
		{
			this.inputIterator=µ.Relayer.refillableIterator(iterable);
			this.actionIterator=this.inputIterator;
		},
		/** itrrator protocol */
		async next()
		{
			return this.actionIterator.next();
		},
		[Symbol.asyncIterator](){
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
		}

		//split(){},
		//join(){}
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
			let results=[];
			return {
				async next()
				{
					while(true)
					{
						if(results.length>0) return {value:results.shift(),done:false};
						let input=await iterator.next();
						if(input.done) return input;
						results.push(...await fn(input.value));
					}
				}
			}
		}
	};

	µ.Relayer.refillableIterator=function(input)
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