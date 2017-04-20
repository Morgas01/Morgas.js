(function(µ,SMOD,GMOD,HMOD,SC){

	var util=µ.util=µ.util||{};
	var uObj=util.object=util.object||{};

	/**
	 *
	 * @param {Number} (stageCount=2)
	 * @param {Function} (lastType=Object())
	 */
	var register=uObj.register=function(stageCount,lastType=Object)
	{
		stageCount=stageCount>1?stageCount:1;
		var createProxy=function(stageCount)
		{
			return new Proxy({},{
				get:function(storage,key,receiver)
				{
					if(key==="toJSON") return undefined;
					if(!(key in storage))
					{
						if (stageCount<=1)
						{
							storage[key]=new lastType();
						}
						else
						{
							storage[key]=createProxy(stageCount-1);
						}
					}
					return storage[key];
				},
				set:µ.constantFunctions.f
			});
		};
		return createProxy(stageCount);
	};

	SMOD("register",register);

})(Morgas,Morgas.setModule,Morgas.getModule,Morgas.hasModule,Morgas.shortcut);