(function(µ,SMOD,GMOD){

	var util=µ.util=µ.util||{};
	var obj=util.object||{};
	
	var SC=GMOD("shortcut")({
		DET:"Detached",
		It:"Iterator"
	});
	/** iterateAsync
	 * As iterate but puts a timeout between the iteration steps
	 * 
	 * returns: µ.Detached
	 */
	obj.iterateAsync=function(any,func,backward,isObject,scope,chunk)
	{
		if(!scope)
		{
			scope=window;
		}
		if(!chunk)
		{
			chunk=obj.iterateAsync.chunk;
		}
		return new SC.DET(function()
		{
			var signal=this;
			var it=SC.It(any,backward,isObject);
			var interval=setInterval(function iterateStep()
			{
				try
				{
					var step=it.next();
					for(var i=0;i<chunk&&!step.done;i++,step=it.next())
					{
						func.call(scope,step.value,step.key);
					}
					if(step.done)
					{
						signal.complete();
						clearInterval(interval);
					}
				}
				catch (e)
				{
					signal.error(e);
				}
			},0)
		});
	};
	obj.iterateAsync.chunk=1E4;
	
	SMOD("iterateAsync",obj.iterateAsync);
	
})(Morgas,Morgas.setModule,Morgas.getModule);