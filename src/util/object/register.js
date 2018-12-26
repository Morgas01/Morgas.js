(function(µ,SMOD,GMOD,HMOD,SC){

	let util=µ.util=µ.util||{};
	let uObj=util.object=util.object||{};

	//SC=SC({});

	/**
	 *
	 * @param {Number} (stageCount=1) - count of generated stages
	 * @param {Function} (lastType=Object())
	 */
	let register=uObj.register=function(stageCount,lastType=Object)
	{
		stageCount=stageCount>1?stageCount:1;
		let createProxy=function(stageCount)
		{
			return new Proxy({},{
				get:function(storage,key,receiver)
				{
					if(key==="toJSON") return undefined; // called by JSON.stringify
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