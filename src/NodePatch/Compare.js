(function(µ,SMOD,GMOD,HMOD,SC){

	let NodePatch=GMOD("NodePatch");

	//SC=SC({});

	/**
	 * @param {Any} root
	 * @param {Function} compare - (a,b)=>Boolish
	 * @param {String|Function} (childrenGetter)
	 */
	NodePatch.Compare=µ.Class(NodePatch.Basic,{
		constructor:function(newNode,oldNode,compare=µ.constantFunctions.t)
		{
			this.mega();

			this.newNode=newNode;
			this.oldNode=oldNode;
			this.compare=compare;
		},
		isNew:function(){return !this.oldNode},
		isMissing:function(){return !this.newNode},
		isCompareable:function(){return !this.isNew()&&!this.isMissing()},
		isChanged:function(){return this.isCompareable()&&!this.compare(this.newNode,this.oldNode)},
		isUnchanged:function(){return this.isCompareable()&&!this.isChanged()},
		getNew:function(){return Array.from(this.children).filter(c=>c.isNew())},
		getMissing:function(){return Array.from(this.children).filter(c=>c.isMissing())},
		getChanged:function(){return Array.from(this.children).filter(c=>c.isCompareable()&&c.isChanged())},
		getUnchanged:function(){return Array.from(this.children).filter(c=>c.isUnchanged())},

		hasChanges:function()
		{
			return !this.isCompareable()||this.isChanged()||Array.from(this.children).some(c=>c.hasChanges());
		}

	});

	NodePatch.Compare.create=function(newRoot,oldRoot,getId,compare,childrenGetter)
	{
		childrenGetter=NodePatch.normalizeChildrenGetter(childrenGetter);

		let rtn=new NodePatch.Compare(newRoot,oldRoot,compare);
		let todo=[rtn];

		while(todo.length>0)
		{
			let parentCompare=todo.shift();
			if(!parentCompare.isCompareable()) continue;

			let oldChildren=new Map();
			for(let child of childrenGetter(parentCompare.oldNode))
			{
				oldChildren.set(getId(child),child);
			}

			for (let child of childrenGetter(parentCompare.newNode))
			{
				let id=getId(child);
				let oldNode=oldChildren.get(id)
				let childCompare=new NodePatch.Compare(child,oldNode,compare);
				parentCompare.addChild(childCompare);
				if(oldNode)
				{
					todo.push(childCompare);
					oldChildren.delete(id);
				}
			}
			for (let child of oldChildren.values())
			{
				let childCompare=new NodePatch.Compare(null,child,compare);
				parentCompare.addChild(childCompare);
			}
		}
		return rtn;
	};

	SMOD("NodePatch.Compare",NodePatch.Compare);
	
})(Morgas,Morgas.setModule,Morgas.getModule,Morgas.hasModule,Morgas.shortcut);