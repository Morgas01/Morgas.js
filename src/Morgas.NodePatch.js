(function(µ,SMOD,GMOD){

    var Patch=GMOD("Patch");
	var SC=GMOD("shortcut")({
		p:"proxy",
        d:"debug"
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
            	SC.d([child," is not a Node"]);
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
                            SC.d(["rejected remove child ",child," from old parent ",childPatch.parent],SC.d.LEVEL.INFO);
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
                        SC.d(["rejected to set parent",this.instance," of child ",child],SC.d.LEVEL.INFO);
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
	                        SC.d(["rejected remove child ",child," from parent ",this.instance],SC.d.LEVEL.INFO);
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
            	SC.d([parent," is not a Node"]);
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
                            SC.d(["rejected remove child ",child," from old parent ",childPatch.parent],SC.d.LEVEL.INFO);
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
							SC.d(["rejected to add child ",this.instance," to parent ",parent],SC.d.LEVEL.INFO);
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
						{//I won't let go of parent
							this.parent=oldParent;
							SC.d(["rejected to remove child ",this.instance," from parent ",this.parent],SC.d.LEVEL.INFO);
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
                get:function()
                {
                    return node[symbol];
                },
                set:function(arg)
                {
                    node[symbol]=arg;
                }
            })
        }
        else
        {
            node.instance[alias]=node[symbol];
        }
    };
	
	SMOD("NodePatch",NODE);
})(Morgas,Morgas.setModule,Morgas.getModule);