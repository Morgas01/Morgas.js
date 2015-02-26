(function(){
	module("Listeners");
	
	
	test("Listeners",function(assert)
	{
		var foo=new (µ.getModule("Listeners"))();
		
		foo.createListener("event");
		var result=[];
		foo.addListener("event:once",result,function(e){
			this.push("once "+e.value);
		});
		foo.addListener("event:last",result,function(e){
			this.push("last "+e.value);
		});
		foo.addListener("event",result,function(e){
			this.push("normal "+e.value);
		});
		foo.addListener("event:first",result,function(e){
			this.push("first "+e.value);
		});
		
		foo.fire("event",{value:1});
		foo.fire("event",{value:2});
		foo.setDisabled("event",true);
		foo.fire("event",{value:3});
		foo.setDisabled("event",false);
		foo.removeListener("event",result,"all");
		foo.addListener("event",result,function(e){
			this.push(e.value);
		});
		foo.fire("event",{value:"cleared"});
		deepEqual(result,["first 1","normal 1","last 1","once 1","first 2","normal 2","last 2","cleared"],"scope and order");
		
		foo.createListener(".state");
		result=[];
		foo.addListener(".state",result,function(e){
			this.push("before");
		});
		foo.setState(".state");
		foo.addListener(".state",result,function(e){
			this.push("after");
		});
		deepEqual(result,["before","after"],"state");
	});
})();