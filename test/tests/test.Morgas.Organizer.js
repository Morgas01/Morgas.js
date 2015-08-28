(function(µ,SMOD,GMOD,HMOD,SC){
	module("Organizer");
	
	var ORG=GMOD("Organizer");
	
	test("numbers",function()
	{
		var org=new ORG()
		.sort("ASC",ORG.sortSimple(false))
		.sort("DESC",ORG.sortSimple(true))
		.filter("filter",function(val){return val>4});

		org.add([6,2,9,8,1]);
		org.add({a:7,b:5,c:4,d:0,e:3});

		deepEqual(org.getSort("ASC"),[0,1,2,3,4,5,6,7,8,9],"asc");
		deepEqual(org.getSort("DESC"),[9,8,7,6,5,4,3,2,1,0],"desc");
		deepEqual(org.getFilter("filter").getValues(),[6,9,8,7,5],"filter");
	});
	
	test("strings",function()
	{
		var org=new ORG()
		.filter("filter",function(val){return /[aiu]/.test(val)})

		org.add(["We","hunt","them","experiment","on","them"]);
		org.add({a:"and",f:"then",h:"we",p:"kill",x:"them"});

		deepEqual(org.getFilter("filter").getValues(),["hunt","experiment","and","kill"],"filter");
	});
	
	test("object",function()
	{
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
				group:["hedgehog","rabbit"],
				data:{value:3},
				active:true
			}
		 ];
		
		var org=new ORG(data)
		.filter("filter",{group:/^h\w+g$/,active:true})
		.map("id map","id")
		.group("animal group","group");
		
		var child=org.getGroupPart("animal group","hedgehog")
		.filter("active",{active:true}).getFilter("active").sort("sorted",ORG.sortGetter(a=>a.data.value,false));

		deepEqual(org.getFilter("filter").getValues(),[data[3]],"filter");
		deepEqual(org.getMap("id map"),{0:data[0],1:data[1],2:data[2],3:data[3],4:data[4]},"map");
		deepEqual(org.getGroupValues("animal group"),{rabbit:[data[0],data[1],data[4]],hedgehog:[data[2],data[3],data[4]]},"group");
		deepEqual(child.getSort("sorted"),[data[4],data[3]],"group");
	});
})(Morgas,Morgas.setModule,Morgas.getModule,Morgas.hasModule,Morgas.shortcut);