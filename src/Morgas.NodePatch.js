(function(µ,SMOD,GMOD,HMOD,SC){

    var Patch=GMOD("Patch");
	SC=SC({
		p:"proxy"
	});

	var NODE=µ.NodePatch=µ.Class(Patch,{
		patchID:"NodePatch",
		patch:function(aliasMap)
		{

			this.parent=null;
			this.children=[];

			aliasMap=aliasMap||{};
            this.aliasMap={};
            var proxyMap={};
			for (var i=0;i<NODE.Aliases.length;i++)
			{
                var target=NODE.Aliases[i];
                if(target in aliasMap)
                {
                    this.aliasMap[target]=aliasMap[target];
                    if(this.instance[this.aliasMap[target]]===undefined)
                    {
                        proxyMap[target]=this.aliasMap[target];
                    }
                }
			}
            SC.p(getNode,proxyMap,this.instance);

			for (var i=0;i<NODE.Symbols.length;i++)
			{
                var symbol=NODE.Symbols[i];
                if(symbol in aliasMap)
                {
                    setSymbol(this,symbol,aliasMap[symbol])
                }
			}
		},
		addChild:function(child,index)
		{
			var childPatch=getNode(child),alias;
            var childIndex=this.children.indexOf(child);
            if(!childPatch)
            {//is not a Node
            	µ.logger.error(new TypeError(child+" is not a Node"));
            	return false;
            }
            else if(childIndex===-1)
			{//has not that child jet
				if(index!==undefined)
				{
					this.children.splice(index,0,child);
				}
				else
				{
                    index=this.children.length;
					this.children.push(child);
				}
				if(childPatch.parent!==null&&childPatch.parent!==this.instance)
				{//has other parent
					//remove other parent
                    alias=childPatch.aliasMap.remove;
                    if(alias)
                    {
                        if(!child[alias]())
                        {//won't let go of parent
                            µ.logger.info(new µ.Warning("rejected remove child from old parent",{child:child,parent:childPatch.parent}));
                            this.children.splice(index,1);
                            return false;
                        }
                    }
                    else
                    {
					    childPatch.remove();
                    }
				}
				//add to parent
				alias=childPatch.aliasMap.setParent;
                if(alias)
                {
                    if(!child[alias](this.instance))
                    {//won't attach to me
                        µ.logger.info(new µ.Warning("rejected to set parent of child",{child:child,parent:this.instance}));
                        this.children.splice(index,1);
                        return false;
                    }
                }
                else
                {
                    childPatch.setParent(this.instance);
                }
			}
			return true;
		},
		removeChild:function(child)
		{
			var index=this.children.indexOf(child);
			if(index!==-1)
			{//has child
				this.children.splice(index, 1);
				var childPatch=getNode(child);
				if(childPatch&&childPatch.parent===this.instance)
				{//is still parent of child
					var alias=childPatch.aliasMap.remove;
	                if(alias)
	                {
	                    if(!child[alias]())
	                    {//won't let go of me
                            µ.logger.info(new µ.Warning("rejected remove child from parent",{child:child,parent:this.instance}));
	                        this.children.splice(index,0,child);
	                        return false;
	                    }
	                }
	                else
	                {
					    childPatch.remove();
	                }
                }
			}
			return true;
		},
		setParent:function(parent)
		{
			var parentPatch=getNode(parent),alias;
			if(!parentPatch)
			{//is not a Node
            	µ.logger.error(new TypeError("parent is not a Node"));
            	return false;
			}
			if(parent&&this.parent!==parent)
			{
				if(this.parent!==null)
				{//has other parent
					//remove other parent
                    alias=childPatch.aliasMap.remove;
                    if(alias)
                    {
                        if(!child[alias]())
                        {//won't let go of parent
                            µ.logger.info(new µ.Warning("rejected remove child from old parent",{child:child,parent:childPatch.parent}));
                            this.children.splice(index,1);
                            return false;
                        }
                    }
                    else
                    {
					    childPatch.remove();
                    }
				}
				this.parent=parent;
				alias=parentPatch.aliasMap.addChild;
				if(parentPatch.children.indexOf(this.instance)===-1)
				{//not already called from addChild
					if(alias)
					{
						if(!this.parent[alias](this.instance))
						{//won't accept me
							µ.logger.info(new µ.Warning("rejected to add child to parent",{child:this.instance,parent:parent}));
							this.parent=null;
							return false;
						}
					}
					else
					{
						parentPatch.addChild(this.instance);
					}
				}
			}
            return true;

		},
		remove:function()
		{
			if(this.parent!==null)
			{
				var oldParent=this.parent;
				var oldParentPatch=getNode(oldParent);
				this.parent=null;
				if(oldParentPatch.children.indexOf(this.instance)!==-1)
				{//is still old parents child
					var alias=oldParentPatch.aliasMap.removeChild;
					if(alias)
					{
						if(!oldParent[alias](this.instance))
						{//I won't var go of parent
							this.parent=oldParent;
							µ.logger.info(new µ.Warning("rejected to remove child from parent",{child:this.instance,parent:this.parent}));
							return false;
						}
					}
					else
					{
						oldParentPatch.removeChild(this.instance);
					}
				}
			}
			return true;
		},
		hasChild:function(child)
		{
			return this.children.indexOf(child)!==-1;
		},
        isChildOf:function(parent)
        {
            var parentPatch=getNode(parent);
            return parent&&parent.hasChild(this.instance);
        },
		destroy:function()
		{
			this.remove();
			for(var c of this.children.slice())
			{
				this.removeChild(c);
			}
			for( var a in this.aliasMap)
			{
				delete this.instance[this.aliasMap[a]];
			}
			this.mega();
		}
	});
	NODE.Aliases=["addChild","removeChild","remove","setParent","hasChild"];
    NODE.Symbols=["parent","children"];
    NODE.BasicAliases={
        parent:"parent",
        children:"children",
        addChild:"addChild",
        removeChild:"removeChild",
        remove:"remove",
        setParent:"setParent",
        hasChild:"hasChild"
    };
	NODE.Basic=µ.Class({
		init:function(aliasMap)
		{
			aliasMap=aliasMap||{};
			var map={};
            for(var i=0,targets=Object.keys(NODE.BasicAliases);i<targets.length;i++)
			{
            	var target=targets[i];
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
		},
		destroy:function()
		{
			for(var c of this.children.slice())
			{
				if(typeof c.destroy==="function")c.destroy();
			}
			this.mega();
		}
	});

	var normalizeChildrenGetter=function(childrenGetter)
	{
		if(!childrenGetter) childrenGetter=NODE.BasicAliases.children;
		if(typeof childrenGetter == "string") return c=>c[childrenGetter];
		return childrenGetter;
	}

	NODE.traverse=function(root,func,childrenGetter)
	{
		childrenGetter=normalizeChildrenGetter(childrenGetter);
		var todo=[{
			node:root,
			parent:null,
			parentResult:null,
			siblingResults:[],
			index:null,
			depth:0
		}];
		for(var entry of todo)
		{
			entry.siblingResults.push(func(entry.node,entry.parent,entry.parentResult,entry));
			var children=[];
			var nodePatch=getNode(entry.node);
			if(nodePatch)
			{
				children.nodePatch.getChildren();
			}
			else
			{
				children=childrenGetter(entry.node);
			}
			if(children)
			{
				var childSiblings=[];
				for(var i=0;i<children.length;i++)
				{
					todo.push({
						node:children[i],
						parent:entry.node,
						parentResult:entry.siblingResults[entry.siblingResults.length-1],
						siblingResults:childSiblings,
						index:i,
						depth:entry.depth+1
					});
				}
			}
		}
		return todo[0].siblingResults[0];
	};

	NODE.traverseTo=function(root,path,childrenGetter)
	{
		childrenGetter=normalizeChildrenGetter(childrenGetter);
		if(typeof path=="string") path=path.split(".");
		for(var key of path)
		{
			root=childrenGetter(root)[key];
			if(!root) return null;
		}
		return root;
	};

	NODE.patchTree=function(root,childrenGetter,aliasMap)
	{
		return NODE.traverse(root,function(node,parent,parentNode)
		{
			var child=new NODE(node,aliasMap);
			if(parentNode)
			{
				parentNode.addChild(child);
			}
			return child;
		},childrenGetter);
	}

	var getNode=function(obj)
	{
        if(typeof obj==="string")
        {//used as proxy getter
            obj=this
        }
        if(obj instanceof NODE)
        {
            return obj;
        }
        else
        {
        	return Patch.getPatch(obj,NODE);
        }
	};
	//TODO replace with GMOD("shortcut") dynamic
    var setSymbol=function(node,symbol,alias)
    {
        if(typeof node[symbol]!=="function")
        {
            Object.defineProperty(node.instance,alias,{
            	configurable:true,
            	enumerable:true,
                get:function()
                {
                    return node[symbol];
                },
                set:function(arg)
                {
                    node[symbol]=arg;
                }
            });
        }
        else
        {
            node.instance[alias]=node[symbol];
        }
    };

    var getChildren=function(node,key)
	{
		if(node instanceof NODE) return getP
	}

	SMOD("NodePatch",NODE);
})(Morgas,Morgas.setModule,Morgas.getModule,Morgas.hasModule,Morgas.shortcut);
