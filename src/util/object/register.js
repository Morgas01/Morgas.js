(function(µ,SMOD,GMOD,HMOD,SC){

	let util=µ.util=µ.util||{};
	let uObj=util.object=util.object||{};

	//SC=SC({});

	/**
	 *
	 * @param {Number} (stageCount=1) - count of generated stages
	 * @param {Function} (lastType=Object())
	 * @param {Function} (defaultValue=Function returning empty Object]
	 */
	let register=uObj.register=function(stageCount,defaultValue=()=>({}))
	{
		stageCount=stageCount>1?stageCount:1;
		let createProxy=function(stageCount,keys=[])
		{
			return new Proxy({},{
				get:function(storage,key,receiver)
				{
					if(key==="toJSON") return undefined; // called by JSON.stringify
					if(!(key in storage))
					{
						if (stageCount<=1)
						{
							if(defaultValue) storage[key]=defaultValue(keys.concat(key));
						}
						else
						{
							storage[key]=createProxy(stageCount-1,keys.concat(key));
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