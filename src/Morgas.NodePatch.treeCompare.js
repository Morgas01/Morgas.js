(function(µ,SMOD,GMOD,HMOD,SC){
	
	var NODEPATCH=GMOD("NodePatch");
	
	SC=SC({
		Patch:"Patch"
	});
	
	/**
	 * 
	 * @param {Object} old Object with NodePatch
	 * @param {Object} fresh Object with NodePatch
	 * @param {String|Function} id Key of id field or getter function
	 * @param {function} compare compare function
	 * 
	 */
	NODEPATCH.treeCompare=function(old,fresh,id,compare)
	{
		var idFn;
		if((typeof id == "function")) idFn=id;
		else idFn=n=>n[id];
		
		var rtn={
			created:[],
			changed:[],
			deleted:[]
		};
		var todo=[{old:old,fresh:fresh}];
		while(todo.length>0)
		{
			var entry=todo.shift();
			
			if(!compare(entry.old,entry.fresh)) rtn.changed.push(entry);
			
			var freshChildren=getChildren(entry.fresh).slice();
			for(var oldChild of getChildren(entry.old))
			{
				var oldId=idFn(oldChild);
				var index=freshChildren.findIndex(function(freshChild)
				{
					return oldId==idFn(freshChild);
				});
				if(index==-1) rtn.deleted.push({old:oldChild,freshParent:fresh});
				else
				{
					var freshChild=freshChildren.splice(index,1)[0];
					todo.push({old:oldChild,fresh:freshChild});
				}
			}
			rtn.created=rtn.created.concat(freshChildren.map(function(fresh)
			{
				return {fresh:fresh,oldParent:old};
			}));	
		}
		return rtn;
	};
	
	var getChildren=function(obj)
	{
		var node=SC.Patch.getPatch(obj,NODEPATCH);
		if(!node)return [];
		return node.children;
	};
	
	SMOD("NodePatch.treeCompare",NODEPATCH.treeCompare);
	
})(Morgas,Morgas.setModule,Morgas.getModule,Morgas.hasModule,Morgas.shortcut);