QUnit.module("NodePatch",function()
{

	QUnit.test("connect",function(assert)
	{
		let parent=new µ.NodePatch.Basic(),
		child1=new µ.NodePatch.Basic(),
		child2=new µ.NodePatch.Basic();

		parent.addChild(child1);
		child2.setParent(parent);

		assert.ok(parent===child1.parent&&parent.children.has(child1),"child1 connected");
		assert.ok(parent===child2.parent&&parent.children.has(child2),"child2 connected");

		parent.removeChild(child1);
		child2.remove();

		assert.ok(parent!==child1.parent&&!parent.children.has(child1),"child1 removed");
		assert.ok(parent!==child2.parent&&!parent.children.has(child2),"child2 removed");

	});

	QUnit.test("names",function(assert)
	{
		let foo={};
		let fooPatch=new µ.NodePatch(foo,"foo",{addChild:"addFoo",children:"foos"});
		let fooBarPatch=new µ.NodePatch(foo,"bar",{addChild:"addBar",children:"bars"});
		let bar=new µ.NodePatch.Basic("bar");

		assert.throws(function()
		{
			foo.addFoo(bar);
		},
		function(error)
		{
			return error.message.startsWith("#NodePatch:001 ");
		},"false name");
		foo.addBar(bar);
		assert.ok(foo.bars.has(bar),"added bar");
		assert.notOk(foo.foos.has(bar),"not added foo");
		assert.equal(bar.parent,foo);
	});

	QUnit.test("alias",function(assert)
	{
		let parent=new µ.NodePatch.Basic(undefined,{addChild:"add",removeChild:"remove",remove:null,children:"children"}),
		child1=new µ.NodePatch(new µ.BaseClass(),undefined,{parent:"up"}).instance,
		child2=new µ.NodePatch({},undefined,{parent:"parent",setParent:"fuse",remove:"explode"}).instance;

		parent.add(child1);
		child2.fuse(parent);

		assert.ok(parent===child1.up&&parent.children.has(child1),"child1 connected");
		assert.ok(parent===child2.parent&&parent.children.has(child2),"child2 connected");

		parent.remove(child1);
		child2.explode();

		assert.ok(parent!==child1.up&&!parent.children.has(child1),"child1 removed");
		assert.ok(parent!==child2.parent&&!parent.children.has(child2),"child2 removed");

	});

	QUnit.test("alias predefined",function(assert)
	{
		let confirmNode= µ.Class({
			constructor:function()
			{
				new µ.NodePatch(this);
			},
			addChild:function(child,confirm)
			{
				return confirm;
			}
		});
		let confirmNode2= µ.Class({
			constructor:function()
			{
				new µ.NodePatch(this);
			},
			setParent:function(parent,confirm)
			{
				return confirm;
			}
		});

		let parent=new confirmNode(),
			child1=new confirmNode2(),
			child2=new µ.NodePatch.Basic();

		parent.addChild(child1,true);
		child2.setParent(parent);

		assert.ok(parent===child1.parent&&parent.children.has(child1),"child1 connected");
		assert.ok(parent!==child2.parent&&!parent.children.has(child2),"child2 not connected");
		parent.addChild(child2,true);
		assert.ok(parent==child2.parent&&parent.children.has(child2),"child2 connected");

		parent.removeChild(child1);
		child2.remove();

		assert.ok(parent===child1.parent&&parent.children.has(child1),"child1 not removed");
		child1.remove(true);
		assert.ok(parent!==child1.parent&&!parent.children.has(child1),"child1 removed");
		assert.ok(parent!==child2.parent&&!parent.children.has(child2),"child2 removed");

	});

	QUnit.test("change",function(assert)
	{
		let parent1=new µ.NodePatch.Basic(),
		parent2=new µ.NodePatch.Basic(),
		child=new µ.NodePatch.Basic();

		parent1.addChild(child);

		assert.ok(parent1===child.parent&&parent1.children.has(child),"parent1 connected");
		assert.ok(parent2!==child.parent&&!parent2.children.has(child),"parent2 not connected");

		parent2.addChild(child);

		assert.ok(parent1!==child.parent&&!parent1.children.has(child),"parent1 not connected");
		assert.ok(parent2===child.parent&&parent2.children.has(child),"parent2 connected");
	});

	QUnit.test("traverse",function(assert)
	{
		let root={
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
		let result=[];
		µ.NodePatch.traverse(root,node=>result.push(node.name));
		result.sort();
		assert.deepEqual(result,["child1","child2","grandchild","root"],"all traversed");
	});
});
