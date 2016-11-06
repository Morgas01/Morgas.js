(function(µ,SMOD,GMOD,HMOD,SC){
	QUnit.module("NodePatch");
	SC=SC({
		node:"NodePatch"
	});

	QUnit.test("connect",function(assert)
	{
		var parent=new SC.node.Basic(),
		child1=new SC.node.Basic(),
		child2=new SC.node.Basic();

		parent.addChild(child1);
		child2.setParent(parent);

		assert.ok(parent===child1.parent&&parent.hasChild(child1),"child1 connected");
		assert.ok(parent===child2.parent&&parent.hasChild(child2),"child2 connected");

		parent.removeChild(child1);
		child2.remove();

		assert.ok(parent!==child1.parent&&!parent.hasChild(child1),"child1 removed");
		assert.ok(parent!==child2.parent&&!parent.hasChild(child2),"child2 removed");

	});

	QUnit.test("alias",function(assert)
	{
		var parent=new SC.node.Basic({addChild:"add",removeChild:"remove",remove:null}),
		child1=new SC.node(new µ.BaseClass(),{parent:"up"}).instance,
		child2=new SC.node({},{parent:"parent",setParent:"fuse",remove:"explode"}).instance;

		parent.add(child1);
		child2.fuse(parent);

		assert.ok(parent===child1.up&&parent.hasChild(child1),"child1 connected");
		assert.ok(parent===child2.parent&&parent.hasChild(child2),"child2 connected");

		parent.remove(child1);
		child2.explode();

		assert.ok(parent!==child1.up&&!parent.hasChild(child1),"child1 removed");
		assert.ok(parent!==child2.parent&&!parent.hasChild(child2),"child2 removed");

	});

	QUnit.test("alias predefined",function(assert)
	{
		var confirmNode= µ.Class({
            init:function()
            {
                this.nodePatch=new SC.node(this,SC.node.BasicAliases);
            },
            addChild:function(child,confirm)
            {
                if(confirm)
                {
                    return this.nodePatch.addChild(child);
                }
                return false;
            }
        });
		var confirmNode2= µ.Class({
            init:function()
            {
                this.nodePatch=new SC.node(this,SC.node.BasicAliases);
            },
            remove:function(confirm)
            {
                if(confirm)
                {
                    return this.nodePatch.remove();
                }
                return false;
            }
        });

        var parent=new confirmNode(),
            child1=new confirmNode2(),
            child2=new SC.node.Basic();

        parent.addChild(child1,true);
        child2.setParent(parent);

        assert.ok(parent===child1.parent&&parent.hasChild(child1),"child1 connected");
        assert.ok(parent!==child2.parent&&!parent.hasChild(child2),"child2 not connected");
        parent.addChild(child2,true);
        assert.ok(parent==child2.parent&&parent.hasChild(child2),"child2 connected");

        parent.removeChild(child1);
        child2.remove();

        assert.ok(parent===child1.parent&&parent.hasChild(child1),"child1 not removed");
        child1.remove(true);
        assert.ok(parent!==child1.parent&&!parent.hasChild(child1),"child1 removed");
        assert.ok(parent!==child2.parent&&!parent.hasChild(child2),"child2 removed");

	});

	QUnit.test("change",function(assert)
	{
		var parent1=new SC.node.Basic(),
		parent2=new SC.node.Basic(),
		child=new SC.node.Basic();

		parent1.addChild(child);

		assert.ok(parent1===child.parent&&parent1.hasChild(child),"parent1 connected");
		assert.ok(parent2!==child.parent&&!parent2.hasChild(child),"parent2 not connected");

		parent2.addChild(child);

		assert.ok(parent1!==child.parent&&!parent1.hasChild(child),"parent1 not connected");
		assert.ok(parent2===child.parent&&parent2.hasChild(child),"parent2 connected");
	});

	QUnit.test("traverse",function(assert)
	{
		var root={
			name:"root",
			children:[
				{
					name:"child1"
					//no children
				},
				{
					name:"child2",
					children:[
						{
							name:"grandchild",
							children:[] //empty children
						}
					]
				}
			]
		};
		var result=[];
		SC.node.traverse(root,node=>result.push(node.name));
		result.sort();
		assert.deepEqual(result,["child1","child2","grandchild","root"],"all traversed");
	})

})(Morgas,Morgas.setModule,Morgas.getModule,Morgas.hasModule,Morgas.shortcut);
