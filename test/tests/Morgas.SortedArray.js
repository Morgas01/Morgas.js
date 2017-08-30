QUnit.module("SortedArray",function()
{
	
	QUnit.test("numbers",function(assert)
	{
		var sArr=new µ.SortedArray()
		.sort("ASC",µ.SortedArray.naturalOrder(false))
		.sort("DESC",µ.SortedArray.naturalOrder(true));

		sArr.add([6,2,9,3,1]);
		sArr.add(new Set([7,5,4,0,8]));

		assert.deepEqual(sArr.get("ASC"),[0,1,2,3,4,5,6,7,8,9],"asc");
		assert.deepEqual(sArr.get("DESC"),[9,8,7,6,5,4,3,2,1,0],"desc");
		sArr.remove([0,2,4,6,8]);
		assert.deepEqual(sArr.get("ASC"),[1,3,5,7,9],"asc deleted");
		assert.deepEqual(sArr.get("DESC"),[9,7,5,3,1],"desc deleted");
		sArr.clear();
		assert.deepEqual(sArr.get("ASC"),[],"clear");
	});
	
	QUnit.test("strings",function(assert)
	{
		var sArr=new µ.SortedArray()
		.sort("ASC",µ.SortedArray.naturalOrder(false))
		.sort("DESC",µ.SortedArray.naturalOrder(true));

		sArr.add(["s","o","r","t","e","d"]);
		sArr.add(new Map([
			["a","a"],
			["f","r"],
			["h","r"],
			["p","a"],
			["x","y"]
		]).values());

		assert.deepEqual(sArr.get("ASC"),["a","a","d","e","o","r","r","r","s","t","y"],"asc");
		assert.deepEqual(sArr.get("DESC"),["y","t","s","r","r","r","o","e","d","a","a"],"desc");
	});
	
	QUnit.test("object",function(assert)
	{
		var guide=µ.util.object.goPath.guide(["data","value"]);
		var sArr=new µ.SortedArray()
		.sort("ASC",µ.SortedArray.orderBy(guide,false))
		.sort("DESC",µ.SortedArray.orderBy(guide,true));
		
		var data=[
			{
				id:0,
				group:"rabbit",
				data:{value:31},
				active:false
			},
			{
				id:1,
				group:"rabbit",
				data:{value:47},
				active:true
			},
			{
				id:2,
				group:"hedgehog",
				data:{value:11},
				active:false
			},
			{
				id:3,
				group:"hedgehog",
				data:{value:19},
				active:true
			},
			{
				id:4,
				group:"hedgehog",
				data:{value:3},
				active:true
			}
		 ];
		
		sArr.add(data);

		assert.deepEqual(sArr.get("ASC"),[data[4],data[2],data[3],data[0],data[1]],"asc");
		assert.deepEqual(sArr.get("DESC"),[data[1],data[0],data[3],data[2],data[4]],"desc");
		data[2].data.value=28;
		data[0].data.value=15;
		sArr.update([data[0],data[2]]);
		assert.deepEqual(sArr.get("ASC"),[data[4],data[0],data[3],data[2],data[1]],"asc updated");
		assert.deepEqual(sArr.get("DESC"),[data[1],data[2],data[3],data[0],data[4]],"desc updated");
	});

	QUnit.test("library",function(assert)
	{
		var library={
			first:1,
			second:2,
			third:3,
			fourth:4,
			fifth:5,
			sixth:6
		};

		var sArr=new µ.SortedArray(["fifth","second","third","sixth","first","nothing"],library)
			.sort("ASC",µ.SortedArray.naturalOrder(false))
			.sort("DESC",µ.SortedArray.naturalOrder(true));

		assert.deepEqual(sArr.get("ASC"),[1,2,3,5,6,undefined],"asc");
		assert.deepEqual(sArr.get("DESC"),[6,5,3,2,1,undefined],"desc");
		library.nothing=0;
		library.first=7;
		sArr.update(["first","nothing"]);
		assert.deepEqual(sArr.get("ASC"),[0,2,3,5,6,7],"asc");
		assert.deepEqual(sArr.get("DESC"),[7,6,5,3,2,0],"desc");
		sArr.remove(["nothing"]);
		assert.deepEqual(sArr.get("ASC"),[2,3,5,6,7],"asc");
		assert.deepEqual(sArr.get("DESC"),[7,6,5,3,2],"desc");
	});
});