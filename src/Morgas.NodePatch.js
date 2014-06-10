(function(µ,SMOD,GMOD){
	
	var SC=GMOD("shortcut")({
		rs:"rescope",
		Patch:"Patch"
	});
	
	var setAlias=function(node,target,alias)
	{
		if(typeof node[target]!=="function")
		{
			Object.defineProperty(node.instance,alias,{
				get:function()
				{
					return node[target];
				},
				set:function(arg)
				{
					node[target]=arg;
				}
			})
		}
		else
		{
			node.instance[alias]=node[target];
		}
	}
	
	var NODE=µ.NodePatch=µ.Class(SC.Patch,{
		patchID:"NodePatch",
		patch:function(aliasMap)
		{
			SC.rs.all(["addChild","removeChild","remove","setParent","hasChild"],this);

			this.parent=null;
			this.children=[];
			
			aliasMap=aliasMap||{};
			/*
			this.aliasMap={
				parent:aliasMap.parent||"parent",
				children:aliasMap.children||"children",
				addChild:aliasMap.addChild||"addChild",
				removeChild:aliasMap.removeChild||"removeChild",
				remove:aliasMap.remove||"remove",
				setParent:aliasMap.setParent||"setParent",
				hasChild:aliasMap.hasChild||"hasChild"
			};
			
			for(var i in this.aliasMap)
			{
				setAlias(this,i,this.aliasMap[i]);
			}*/
			this.aliasMap={};
			var aliasTargets=["parent","children","addChild","removeChild","remove","setParent","hasChild"];
			for (var i = 0; i < aliasTargets.length; i++)
			{
				var target=aliasTargets[i];
				var alias=aliasMap[aliasTargets[i]];
				if(alias)
				{
					setAlias(this,target,alias);
					this.aliasMap[target]=alias;
				}
			}
		},
		getAliasMap:function()
		{
			var rtn={},
			keys=Object.keys(this.aliasMap);
			for(var i=0;i<keys.length;i++)
			{
				rtn[i]=this.aliasMap[i];
			}
			return rtn;
		},addChild:function(child,index)
		{
			var childPatch=SC.Patch.getPatch(child,NODE);
			if(this.children.indexOf(child)===-1)
			{
				if(child.parent!==null&&child.parent!==this.instance)
				{
					childPatch.remove();
				}
				
				if(index!==undefined)
				{
					this.children.splice(index,0,child);
				}
				else
				{
					this.children.push(child);
				}
			}
			if(child.parent!==this.instance)
			{
				childPatch.setParent(this.instance);
			}
		},
		removeChild:function(child)
		{
			var index=this.children.indexOf(child);
			if(index!==-1)
			{
				var childPatch=SC.Patch.getPatch(child,NODE);
				this.children.splice(index, 1);
				childPatch.setParent(null);
				return true;
			}
			return false;
		},
		remove:function()
		{
			if(this.parent!==null)
			{
				var parentPatch=SC.Patch.getPatch(this.parent,NODE);
				return parentPatch.removeChild(this.instance);
			}
			return false;
		},
		setParent:function(parent)
		{
			if(this.parent!==parent)
			{
				if(this.parent!==null)
				{
					this.remove();
				}
				this.parent=parent||null;
			}
			if(this.parent)
			{
				var parentPatch=SC.Patch.getPatch(parent,NODE);
				if(parentPatch.children.indexOf(this.instance)===-1)
				{
					parentPatch.addChild(this.instance);
				}
			}
			
		},
		hasChild:function(child)
		{
			return this.children.indexOf(child)!==-1;
		}
	});
	NODE.BasicAliases={
		parent:"parent",
		children:"children",
		addChild:"addChild",
		removeChild:"removeChild",
		remove:"remove",
		setParent:"setParent",
		hasChild:"hasChild"
	}
	NODE.Basic=µ.Class({
		init:function(aliasMap)
		{
			aliasMap=aliasMap||{};
			var map={};
			for(var i=0,targets=Object.keys(NODE.BasicAliases),target=targets[i]; i<targets.length; target=targets[++i])
			{
				var alias=aliasMap[target];
				if(alias===undefined)
				{
					alias=NODE.BasicAliases[target];
				}
				if(alias!==null)
				{
					map[target]=""+alias;
				}
			}
			new NODE(this,map);
		}
	});
	
	var getNode=function(obj)
	{
		if(obj)
		{
			if(obj instanceof NODE)
			{
				return obj;
			}
			return SC.Patch.getPatch(obj,NODE);
		}
		return null;
	};
	
	SMOD("NodePatch",NODE);
})(Morgas,Morgas.setModule,Morgas.getModule);