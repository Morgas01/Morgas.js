QUnit.module("Orchestrator",function()
{
	let createTask=function(assert)
	{
		let id=0;
		return function(name=id++,time=10)
		{
			assert.step("start "+name);
			return new Promise((resolve)=>
			{
				setTimeout(()=>
				{
					assert.step("end "+name);
					resolve();
				},time);
			});
		};
	};
	QUnit.test("single",async function(assert)
	{
		let task=createTask(assert);
		let orchestrator=new µ.Orchestrator();

		await Promise.all([orchestrator.add(task),orchestrator.add(task)]);

		assert.verifySteps(["start 0","end 0","start 1","end 1"]);
	});
	QUnit.test("multi",async function(assert)
	{
		let task=createTask(assert);
		let orchestrator=new µ.Orchestrator({maxRunning:2});

		await Promise.all([orchestrator.add(task),orchestrator.add(task)]);

		assert.verifySteps(["start 0","start 1","end 0","end 1"]);
	});
	QUnit.test("over limit",async function(assert)
	{
		let task=createTask(assert);
		let orchestrator=new µ.Orchestrator({maxRunning:2});

		await Promise.all([orchestrator.add(task),orchestrator.add(task,null,["slow",200]),orchestrator.add(task,null,["2"]),orchestrator.add(task,null,["3"])]);

		assert.verifySteps(["start 0","start slow","end 0","start 2","end 2","start 3","end 3","end slow"]);
	});
	QUnit.test("change limit",async function(assert)
	{
		let task=createTask(assert);
		let orchestrator=new µ.Orchestrator({maxRunning:2});

		await Promise.all([orchestrator.add(task).then(()=>{orchestrator.setMaxRunning(3)}),orchestrator.add(task,null,["slow",200]),orchestrator.add(task,null,["2"]),orchestrator.add(task,null,["3"])]);

		assert.verifySteps(["start 0","start slow","end 0","start 2","start 3","end 2","end 3","end slow"]);
	});

	QUnit.test("delay",async function(assert)
	{
		let task=createTask(assert);
		let orchestrator=new µ.Orchestrator({delay:100});

		let start=Date.now();
		await Promise.all([orchestrator.add(task),orchestrator.add(task)]);
		let end=Date.now();

		assert.verifySteps(["start 0","end 0","start 1","end 1"]);
		let duration = end-start;
		assert.ok(duration>110&&duration<160,"duration: "+duration);
	});

});