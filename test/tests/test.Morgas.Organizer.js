(function(µ,GMOD){
	module("Organizer");
	
	let ORG=GMOD("Organizer");
	
	test("numbers",function()
	{
		let org=new ORG()
		.filter("ASC",undefined,ORG.sort)
		.filter("DESC",undefined,function(a,b){return ORG.sort(b,a)})
		.filter("filter",function(val){return val>4})
		.filter("filter sorted",function(val){return val<=4},ORG.sort);

		org.add([6,2,9,8,1]);
		org.add({a:7,b:5,c:4,d:0,e:3});

		deepEqual(org.getFilter("ASC"),[0,1,2,3,4,5,6,7,8,9],"asc");
		deepEqual(org.getFilter("DESC"),[9,8,7,6,5,4,3,2,1,0],"desc");
		deepEqual(org.getFilter("filter"),[6,9,8,7,5],"filter");
		deepEqual(org.getFilter("filter sorted"),[0,1,2,3,4],"filter sorted");
	});
	
	test("strings",function()
	{
		let org=new ORG()
		.filter("ASC",undefined,ORG.sort)
		.filter("DESC",undefined,function(a,b){return ORG.sort(b,a)})
		.filter("filter",function(val){return /[aiu]/.test(val)})
		.filter("filter sorted",function(val){return val.length!=4},function(a,b){return Math.sign(a.length-b.length)});

		org.add(["We","hunt","them","experiment","on","them"]);
		org.add({a:"and",f:"then",h:"we",p:"kill",x:"them"});

		deepEqual(org.getFilter("ASC"),["We","and","experiment","hunt","kill","on","them","them","them","then","we"],"asc");
		deepEqual(org.getFilter("DESC"),["we","then","them","them","them","on","kill","hunt","experiment","and","We"],"desc");
		deepEqual(org.getFilter("filter"),["hunt","experiment","and","kill"],"filter");
		deepEqual(org.getFilter("filter sorted"),["We","on","we","and","experiment"],"filter sorted");
	});
	
	test("object",function()
	{
		let org=new ORG()
		.filter("filter sorted",{group:/^h\w+g$/,active:true},"data.value")
		.map("id map","id")
		.group("animal group","group");
		
		let data=[
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
		
		org.add(data);

		deepEqual(org.getFilter("filter sorted"),[data[4],data[3]],"filter sorted");
		deepEqual(org.getMap("id map"),{0:data[0],1:data[1],2:data[2],3:data[3],4:data[4]},"map");
		deepEqual(org.getGroup("animal group"),{rabbit:[data[0],data[1]],hedgehog:[data[2],data[3],data[4]]},"group");
	});
})(Morgas,Morgas.getModule);