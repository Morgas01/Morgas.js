(function(µ,SMOD,GMOD,HMOD,SC){
	
	let util=µ.util=µ.util||{};
	let uFn=util.function=util.function||{};

	//SC=SC({});
	
	/** group
	 * groups function calls together to prevent clogging.
	 * every call to a grouped function starts/resets the delay timer to gather additional calls.
	 *
	 * @param {Function} fn
	 * @param {Number} (delay=50) - time to group calls in ms
	 * @param {Number} (maxDelay=delay*3) - max time to group calls in ms
	 */
	uFn.group=function(fn,delay=50,maxDelay=delay*3)
	{
		let timer=null;
		let maxTimer=null;
		let callArgs=[];

		let doCall=function groupedCall()
		{
			fn(callArgs);
			callArgs=[];

			clearTimeout(timer);
			timer=null;
			clearTimeout(maxTimer);
			maxTimer=null
		}

		return function grouped()
		{
			callArgs.push({scope:this,arguments});
			clearTimeout(timer);
			timer=setTimeout(doCall,delay);
			if(maxTimer===null&&maxDelay)
			{
				maxTimer=setTimeout(doCall,maxDelay);
			}
		}
	}
	SMOD("group",uFn.group);
	
})(Morgas,Morgas.setModule,Morgas.getModule,Morgas.hasModule,Morgas.shortcut);