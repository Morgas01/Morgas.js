(function(µ,SMOD,GMOD,HMOD,SC){

	var util=µ.util=µ.util||{};
	var obj=util.object=util.object||{};
	
	SC=SC({
		PROM:"Promise",
		It:"Iterator"
	});
	
	var wait;

	if(typeof requestAnimationFrame == "undefined")
	{// assume NodeJs
		wait=process.nextTick
	}
	else wait=requestAnimationFrame;
	/** iterateAsync
	 * Async iterate but puts a timeout between the iteration steps if duration exceeds stepTime
	 * and waits for promises to finish
	 * 
	 * returns: µ.Promise
	 */
	obj.iterateAsync=function(any,func,isObject,scope,stepTime)
	{
		var time,rtn=[];
		if(!stepTime)
		{
			stepTime=obj.iterateAsync.stepTime;
		}
		return new SC.PROM(function(signal)
		{
			var it=SC.It(any,isObject);
			var goStep=function iterateStep()
			{
				if(it!=null)
				{
					try
					{
						var step;
						time=Date.now();
						while(time+stepTime>Date.now()&&!(step=it.next()).done)
						{
							var result=func.call(scope,step.value[0],step.value[1]);
							if(SC.PROM.isThenable(result))
							{
								return result.then(function(result)
								{
									rtn.push(result);
									goStep();
								},signal.reject);
							}
							else rtn.push(result);
						}
						if(step.done)
						{
							return signal.resolve(rtn);
						}
						else wait(goStep);
					}
					catch (e)
					{
						signal.reject(e);
					}
				}
			};
			signal.onAbort(function(){it=null});
			wait(goStep);
		},{scope:scope});
	};
	obj.iterateAsync.stepTime=50;
	
	SMOD("iterateAsync",obj.iterateAsync);
	
})(Morgas,Morgas.setModule,Morgas.getModule,Morgas.hasModule,Morgas.shortcut);