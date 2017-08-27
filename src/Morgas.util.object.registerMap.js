(function(µ,SMOD,GMOD,HMOD,SC){

	let util=µ.util=µ.util||{};
	let uObj=util.object=util.object||{};

	let mapSet=Function.prototype.call.bind(Map.prototype.set);

	/**
	 *
	 * @param {Number} (stageCount=1) - count of generated stages
	 * @param {Function} (lastType=Object())
	 */
	let registerMap=uObj.registerMap=function(stageCount,lastType=Map)
	{
		stageCount=stageCount>1?stageCount:1;
		let createMap=function(stageCount)
		{
			let map=new Map();
			map.set=µ.constantFunctions.f;
			map.get=function(key)
			{
				if(!map.has(key))
				{
					if (stageCount<=1) mapSet(map,new lastType());
					else mapSet(map,createMap(stageCount-1));
				}
				return storage.get(key);
			};
		};
		return createMap(stageCount);
	};

	SMOD("registerMap",registerMap);

})(Morgas,Morgas.setModule,Morgas.getModule,Morgas.hasModule,Morgas.shortcut);