(function(µ,SMOD,GMOD,HMOD,SC){

	let util=µ.util=µ.util||{};
	let uFn=util.function=util.function||{};

	SC=SC({
		"Promise":"Promise"
	});

	/**
	 * limits parallel calls of fn
	 * @param {Function} fn
	 */
	uFn.queue=function(fn,{limit=3,scope}={})
	{
		let running=new Set();
		let queue=[];
		let start=function()
		{
			while(running.size<limit&&queue.length>0)
			{
				let entry=queue.shift();
				try
				{
					entry.openPromise.resolve(fn.apply(scope,entry.args));
				}
				catch(e)
				{
					entry.openPromise.reject(e);
				}
				running.add(entry);
				entry.openPromise.always(()=>
				{
					running.delete(entry);
					start();
				});
			}
		};
		let limited=async function(...args)
		{
			let openPromise=SC.Promise.open();
			queue.push({args,openPromise});
			start();
			return openPromise;
		};
		limited.setLimit=function(newLimit)
		{
			if(isNaN(+newLimit)) return;
			limit=Math.max(0,newLimit);
			start();
		};
		limited.getLimit=()=>limit;

		return limited;
	};

	SMOD("queue",uFn.queue);

})(Morgas,Morgas.setModule,Morgas.getModule,Morgas.hasModule,Morgas.shortcut);