(function(µ,SMOD,GMOD,HMOD,SC){
	module("NodePatch.treeCompare");
	SC=SC({
		node:"NodePatch",
		compare:"NodePatch.treeCompare"
	});
	var parse=function(obj)
	{
		return JSON.parse(JSON.stringify(obj,function(key,value)
		{
			if(key=="parent"||key=="patches") return undefined;
			return value;
		}));
	}
	test("treeCompare",function()
	{
		var oldParent=new SC.node.Basic();
		oldParent.name="parent";
		oldParent.size=1.6;
		oldParent.age=40;
		
		var oldChild1=new SC.node.Basic();
		oldChild1.name="child 1";
		oldChild1.size=1.7;
		oldChild1.age=22;
		
		var oldGrandchild=new SC.node.Basic();
		oldGrandchild.name="grandchild";
		oldGrandchild.size=0.5;
		oldGrandchild.age=3;
		
		var oldChild2=new SC.node.Basic();
		oldChild2.name="child 2";
		oldChild2.size=1.75;
		oldChild2.age=20;
		
		oldParent.addChild(oldChild1);
		oldParent.addChild(oldChild2);
		oldChild1.addChild(oldGrandchild);
		
		freshParent=new SC.node.Basic();
		freshParent.name="parent";
		freshParent.size=1.6;
		freshParent.age=40;
		
		freshChild1=new SC.node.Basic();
		freshChild1.name="child 1";
		freshChild1.size=1.7;
		freshChild1.age=23;
		
		freshGrandchild=new SC.node.Basic();
		freshGrandchild.name="grandchild";
		freshGrandchild.size=0.8;
		freshGrandchild.age=3;
		
		freshChild2=new SC.node.Basic();
		freshChild2.name="child 3";
		freshChild2.size=1.75;
		freshChild2.age=20;
		
		freshParent.addChild(freshChild1);
		freshParent.addChild(freshChild2);
		freshChild1.addChild(freshGrandchild);
		
		var changes=SC.compare(oldParent,freshParent,"name",function(old,fresh)
		{
			return old.size==fresh.size&&old.age==fresh.age;
		});
		
		propEqual(parse(changes),parse({
			created:[{fresh:freshChild2,oldParent:oldParent}],
			changed:[{old:oldChild1,fresh:freshChild1},{old:oldGrandchild,fresh:freshGrandchild}],
			deleted:[{old:oldChild2,freshParent:freshParent}]
		}));
		
	});

})(Morgas,Morgas.setModule,Morgas.getModule,Morgas.hasModule,Morgas.shortcut);