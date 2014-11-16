(function(µ,SMOD,GMOD){
	
	var SC=GMOD("shortcut")({
		bind:"bind"
	});

	/**Patch Class
	 * Adds functionality to an instance
	 * 
	 * Patches add themself in a the "patches" map of the instance with their patchID
	 * The core patch adds the "patches" map and the functions "hasPatch" and "getPatch"
	 * 
	 * Normaly a Patch does not add functions direct to the instance but uses listeners
	 * 
	 * 
	 * To create a new patch do sth. like this
	 * 
	 * var myPatch=µ.Class(µ.patch,
	 * {
	 * 		patchID:"myPatchID",
	 * 		patch:function(param,noListeners)
	 * 		{
	 * 			this.superPatch(µ.patch);//call super.patch // in case of µ.Patch its not necessary 
	 * 			//your constructor after instance is created
	 * 		}
	 * }
	 * 
	 * The "patch" function is called on the create event (when the constructor of the instance is finished)
	 * If the instance has no listeners, "noListeners" is true and "patch" was called immediately
	 * 
	 * If you want to override the init function do it like this:
	 * 
	 * var myPatch=µ.Class(mySuperPatch,
	 * {
	 * 		patchID:"myPatchID",
	 * 		init:function(instance,param)
	 * 		{
	 * 			//call constructor of superclass
	 * 			this.superInit(mySuperPatch,instance,param);
	 * 			//or this.superInitApply(mySuperPatch,arguments);
	 * 
	 * 			if(this.instance!=null)
	 * 			{
	 * 				//your constructor
	 * 				//post patch:  this.instance.addListener("created",function(param,noListeners){}) 
	 * 			}
	 * 		},
	 * 		patch:function(param,noListeners)
	 * 		{
	 * 			this.superPatch(mySuperPatch,param,noListeners);
	 * 			//post constructor
	 * 		}
	 * }  
	 */
	PATCH=µ.Patch=µ.Class(
	{
		init:function Patchinit(instance,param)
		{
			if(instance.patches==null)
			{
				instance.patches={};
				instance.hasPatch=function(patch)
				{
					return this.getPatch(patch)!==undefined;
				};
				instance.getPatch=function(patch)
				{
					return this.patches[patch.patchID||patch.prototype.patchID];
				};
			}
			if(!instance.hasPatch(this))
			{
				this.instance=instance;
				instance.patches[this.patchID]=this;
				if(typeof instance.addListener==="function")//instanceof Listeners or has Listeners attached
				{
					this.instance.addListener(".created:once",this.patch,SC.bind(this.patch,this,param,false));
				}
				else
				{
					this.patch(param,true);
				}
			}
		},
		patch:function patch(param,noListeners){},
		superPatch:function superPatch(_class/*,arg1,arg2,...,argN*/)
		{
			_class.prototype.patch.apply(this,[].slice.call(arguments,1));
		},
		superPatchApply:function superPatchApply(_class,args)
		{
			this.superPatch.apply(this,[_class].concat([].slice.call(args)));
		}
	});
	SMOD("Patch",PATCH);
	PATCH.hasPatch=function(instance, patch)
	{
		if(instance.hasPatch)
			return instance.hasPatch(patch);
		return false;
	};
	PATCH.getPatch=function(instance, patch)
	{
		if(instance.getPatch)
			return instance.getPatch(patch);
		return null;
	};
	
})(Morgas,Morgas.setModule,Morgas.getModule);