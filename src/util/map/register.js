(function(µ,SMOD,GMOD,HMOD,SC){

	let util=µ.util=µ.util||{};
	let uMap=util.map=util.map||{};

	//SC=SC({});

	let mapGetCall=Map.prototype.get.call.bind(Map.prototype.get);

	/**
	 *
	 * @param {Number} (stageCount=1) - count of generated stages
	 * @param {Function} (mapType=Map())
	 * @param {Function} (defaultValue=()=>new mapType())
	 */
	let register=uMap.register=function(stageCount,mapType=Map,defaultValue=()=>new mapType())
	{
		stageCount=stageCount>1?stageCount:1;
		let createMap=function(stageCount,keys=[])
		{
			let map=new mapType();
			map.set=µ.constantFunctions.f;
			map.get=function(key)
			{
				if(!this.has(key))
				{
					if (stageCount<=1)
					{
						if(defaultValue)mapType.prototype.set.call(this,key,defaultValue(keys.concat(key)));
					}
					else
					{
						mapType.prototype.set.call(this,key,createMap(stageCount-1,keys.concat(key)));
					}
				}
				return mapType.prototype.get.call(this,key);
			};
			return map;
		};
		return createMap(stageCount);
	};

	SMOD("mapRegister",register);

})(Morgas,Morgas.setModule,Morgas.getModule,Morgas.hasModule,Morgas.shortcut);