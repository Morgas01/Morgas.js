(function(µ,SMOD,GMOD,HMOD,SC){

    let Patch=GMOD("Patch");

	//SC=SC({});

	let NODE=µ.NodePatch=µ.Class(Patch,{
		[Patch.symbols.multiple]:true,
		composeKeys:["parent","children","addChild","removeChild","setParent","remove","isChildOf","hasChild"],
		patch:function(name,composeKeys=NODE.prototype.composeKeys)
		{
			this.name=name;
			this.parent=null;
			this.children=new Set();

            this.composeInstance(composeKeys);
		},
		_getNode:function(obj)
		{
			let nodes=Patch.getPatches(obj,NODE);
			for(let node of nodes)
			{
				if(node.name===this.name) return node;
			}
			throw new Error("#NodePatch:001 target has no NodePatch"+(this.name?` (${this.name}})`:""));
		},
		check:function(key,target,args)
		{
			let checkFn=this.composedInstanceKeys[key];
			if(checkFn)
			{
				return checkFn.call(this.instance,target,...args);
			}
			return true;
		},
		addChild:function(child,...args)
		{
			if(this.children.has(child)) return true;
			let childNode=this._getNode(child);
            if(this.check("addChild",child,args))
			{
				this.children.add(child);
				if(!childNode.setParent(this.instance,...args))
				{
					this.children.delete(child);
					return false;
				}
				return true;
			}
			return false;
		},
		removeChild:function(child,...args)
		{
			if(!this.children.has(child)) return true;
			let childNode=this._getNode(child);
            if(this.check("removeChild",child,args))
			{
				this.children.delete(child);
				if(!childNode.setParent(null,...args))
				{
					this.children.add(child);
					return false;
				}
				return true;
			}
			return false;
		},
		setParent:function(parent,...args)
		{
			if(this.parent===parent) return true;
			if(this.check("setParent",parent,args))
			{
				let oldParent=this.parent;
				this.parent=parent;
				let oldRemoved=true;
				if(oldParent)
				{
					let oldParentNode=this._getNode(oldParent);
					oldParentNode.removeChild(this.instance,...args);
				}
				let newAdded=true;
				if(oldRemoved&&parent)
				{
					let parentNode=this._getNode(parent);
					newAdded=parentNode.addChild(this.instance,...args);
				}
				if(!oldRemoved||!newAdded)
				{
					this.parent=oldParent;
					return false;
				}
				return true;
			}
			return false;
		},
		remove:function(...args)
		{
			return this.setParent(null,...args);
		},
		destroy:function()
		{
			this.remove();
			for(let child of this.children)
			{
				this.removeChild(child);
			}
			this.mega();
		}
	});

	NODE.Basic=µ.Class({
		constructor:function(name,aliasMap)
		{
			new NODE(this,name,aliasMap);
		},
		destroy()
		{
			for(let child of this.children)
			{
				if(typeof child.destroy==="function")child.destroy();
			}
			this.mega();
		}
	});

	NODE.normalizeChildrenGetter=function(childrenGetter)
	{
		if(!childrenGetter) childrenGetter="children";
		if(typeof childrenGetter == "string") return c=>c[childrenGetter];
		return childrenGetter;
	};

	NODE.traverse=function(root,func,childrenGetter)
	{
		childrenGetter=NODE.normalizeChildrenGetter(childrenGetter);
		let todo=[{
			node:root,
			parent:null,
			parentResult:null,
			siblingResults:[],
			index:null,
			depth:0
		}];
		for(let entry of todo)
		{
			entry.siblingResults.push(func(entry.node,entry.parent,entry.parentResult,entry));
			let children=[];
			children=childrenGetter(entry.node);
			if(children)
			{
				let childSiblings=[];
				for(let i=0;i<children.length;i++)
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
		childrenGetter=NODE.normalizeChildrenGetter(childrenGetter);
		if(typeof path=="string") path=path.split(".");
		for(let key of path)
		{
			root=childrenGetter(root)[key];
			if(!root) return null;
		}
		return root;
	};

	SMOD("NodePatch",NODE);
})(Morgas,Morgas.setModule,Morgas.getModule,Morgas.hasModule,Morgas.shortcut);
