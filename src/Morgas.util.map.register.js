(function(µ,SMOD,GMOD,HMOD,SC){

	let util=µ.util=µ.util||{};
	let uMap=util.map=util.map||{};

	//SC=SC({});

	let mapGetCall=Map.prototype.get.call.bind(Map.prototype.get);

	/**
	 *
	 * @param {Number} (stageCount=1) - count of generated stages
	 * @param {Function} (lastType=WeakMap())
	 * @param {Function} (mapType=WeakMap())
	 */
	let register=uMap.register=function(stageCount,lastType=WeakMap,mapType=WeakMap)
	{
		stageCount=stageCount>1?stageCount:1;
		let createMap=function(stageCount)
		{
			let map=new mapType();
			map.get=function(key)
			{
				if(!this.has(key))
				{
					let value;
					if (stageCount<=1)
					{
						value=new lastType();
					}
					else
					{
						value=createMap(stageCount-1);
					}
					this.set(key,value);
				}
				return mapGetCall(this,key);
			};
			return map;
		};
		return createMap(stageCount);
	};

	SMOD("mapRegister",register);

})(Morgas,Morgas.setModule,Morgas.getModule,Morgas.hasModule,Morgas.shortcut);