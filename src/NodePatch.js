(function(µ,SMOD,GMOD,HMOD,SC){

    let Patch=GMOD("Patch");

	//SC=SC({});

	let NODE=µ.NodePatch=µ.Class(Patch,{
		[Patch.symbols.multiple]:true,
		composeKeys:["parent","children","addChild","removeChild","setParent","remove","contains"],
		patch:function(name,composeKeys=NODE.prototype.composeKeys)
		{
			this.name=name;
			this.parent=null;
			this.children=[];

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
			let index=this.children.indexOf(child);
			if(index!==-1) return true;
			let childNode=this._getNode(child);
            if(this.check("addChild",child,args))
			{
				this.children.push(child);
				if(!childNode.setParent(this.instance,...args))
				{
					this.children.splice(index,1);
					return false;
				}
				return true;
			}
			return false;
		},
		removeChild:function(child,...args)
		{
			let index=this.children.indexOf(child);
			if(index===-1) return true;
			let childNode=this._getNode(child);
            if(this.check("removeChild",child,args))
			{
				this.children.splice(index,1);
				if(!childNode.setParent(null,...args))
				{
					this.children.push(child);
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

		/**
		 * check if item is related to this instance
		 * @param {Object} item - NodePatched object
		 * @returns {Number} 0 = not related, 1 = instance contains item, -1 = item contains instance
		 */
		contains(item)
		{
			let inst=this.instance;

			let it=item;
			let me=inst;
			while (item!=null&&me!=null)
			{
				if(it===inst) return 1;
				else if (me===item) return -1;
				it=this._getNode(it).parent;
				me=this._getNode(me).parent;
			}

			return 0;
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

	NODE.traverse=function(root,func,{childrenGetter,filter,initial}={})
	{
		childrenGetter=NODE.normalizeChildrenGetter(childrenGetter);
		let todo=[{
			node:root,
			parent:null,
			parentResult:initial,
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
				let i=0;
				for(let child of children)
				{
					let childEntry={
						node:child,
						parent:entry.node,
						parentResult:entry.siblingResults[entry.siblingResults.length-1],
						siblingResults:childSiblings,
						index:i,
						depth:entry.depth+1
					};
					if(!filter||filter(childEntry.node,childEntry.parent,childEntry.parentResult,childEntry))
					todo.push(childEntry);
					i++;
				}
			}
		}
		return todo[0].siblingResults[0];
	};

	NODE.traverseTo=function(root,path,{
		childrenGetter,
		separator=".",
		key,
		identifier=function(node,pathPart,index)
		{
			if(key) return node[key]==pathPart;
			return index==pathPart;
		}
	}={})
	{
		childrenGetter=NODE.normalizeChildrenGetter(childrenGetter);
		if(typeof path=="string") path=path.split(separator);
		for(let pathPart of path)
		{
			let children=Array.from(childrenGetter(root));
			root=children.find((node,index)=>identifier(node,pathPart,index));
			if(!root) return null;
		}
		return root;
	};

	SMOD("NodePatch",NODE);
})(Morgas,Morgas.setModule,Morgas.getModule,Morgas.hasModule,Morgas.shortcut);
