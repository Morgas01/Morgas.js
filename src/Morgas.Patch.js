(function(µ,SMOD,GMOD,HMOD,SC)
{

	SC=SC({
		remove:"array.remove",
		rescope:"rescope"
	});

	/**Patch Class
	 * Adds functionality to an instance
	 * 
	 * Patches should not interfere with instances attributes unless specified.
	 * To set attributes on an instance a Patch should use the .proxyToInstance() method.
	 *
	 * A Patch must define a .patch() that doubles as a constructor.
	 *
	 */

	var patchMap=new WeakMap();
	var instanceMap=new WeakMap();

	var Patch=µ.Patch=µ.Class({
		[µ.Class.symbols.onExtend](sub)
		{
			//force .patch() method
			if (!("patch" in sub.prototype )) throw new SyntaxError(`#Patch:001 ${(n=>n?n+" ":"")(sub.constructor.name)}has no patch method`);
		},
		constructor:function Patch(instance,...param)
		{
			this.composedInstanceKeys={};
			if(!patchMap.has(instance))
			{
				patchMap.set(instance,[]);
			}
			else if(!this[Patch.symbols.multiple]&&Patch.getPatches(instance,this.constructor).length>0)
			{
				throw new Error("#Patch:002 instance has already this Patch");
			}
			patchMap.get(instance).push(this);
			instanceMap.set(this,instance);

			Object.defineProperty(this,"instance",{get:()=>instanceMap.get(this)});

			this.patch(...param);
		},
		composeKeys:[],
		composeInstance(keys)
		{
			if(!Array.isArray(keys)) keys=Object.entries(keys);

			keys.forEach(entry=>
			{
				let key,targetKey;

				if(Array.isArray(entry)) ([key,targetKey]=entry);
				else key=targetKey=entry;

				if(this.composeKeys.indexOf(key)==-1) return; //continue

				this.composedInstanceKeys[targetKey]=this.instance[targetKey];

				if(typeof this[key]==="function")
				{
					this.instance[targetKey]=SC.rescope(this[key],this);
				}
				else
				{
					Object.defineProperty(this.instance,targetKey,{
						configurable:true,
						enumerable:true,
						get:()=>this[key],
						set:value=>{this[key]=value}
					});
				}
			});
		},
		destroy()
		{
			for(let key in this.composedInstanceKeys)
			{
				this.instance.key=this.composedInstanceKeys[key];
			}

			SC.remove(patchMap.get(this.instance),this);
			instanceMap.delete(this);
			this.mega();
		}
	});
	Patch.getPatches=function(instance,clazz)
	{
		if(!patchMap.has(instance)) return [];
		let patches=patchMap.get(instance);
		if(clazz) return patches.filter(p=>p instanceof clazz);
		return patches.slice();
	};
	Patch.symbols={
		"multiple":Symbol("multiple")
	};

	SMOD("Patch",Patch);
	
})(Morgas,Morgas.setModule,Morgas.getModule,Morgas.hasModule,Morgas.shortcut);