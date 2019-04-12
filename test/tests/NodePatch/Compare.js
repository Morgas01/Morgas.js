QUnit.module("NodePatch.Compare",function()
{
	let getTree=function()
	{
		return {
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
	};

	QUnit.test("compare",function(assert)
	{
		let oldTree=getTree();
		let newTree=getTree();

		oldTree.value=2;
		newTree.value=3;

		newTree.children[0].name="child3";
		oldTree.children[1].children[0].value=4;
		newTree.children[1].children[0].value=5;

		let compare=new µ.NodePatch.Compare.create(newTree,oldTree,n=>n.name,(a,b)=>a.value==b.value);

		assert.ok(compare.isChanged(),"root changed");
		assert.strictEqual(compare.getMissing().length,1,"missing count");
		assert.strictEqual(compare.getMissing()[0].oldNode,oldTree.children[0],"missing node");
		assert.strictEqual(compare.getNew().length,1,"new count");
		assert.strictEqual(compare.getNew()[0].newNode,newTree.children[0],"new node");

		assert.strictEqual(compare.getUnchanged().length,1,"unchanged count");
		let unchanged=compare.getUnchanged()[0];
		assert.strictEqual(unchanged.newNode,newTree.children[1],"unchanged new node");
		assert.strictEqual(unchanged.oldNode,oldTree.children[1],"unchanged old node");

		assert.ok(unchanged.hasChanges(),"unchanged child changed");
	});
});
