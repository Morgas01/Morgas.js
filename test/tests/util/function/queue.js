QUnit.module("util.function.queue",function()
{
	let createTask=function(assert)
	{
		let id=0;
		return function(name=id++,time=0)
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
		let queue=µ.util.function.queue(createTask(assert),{limit:1});

		await Promise.all([queue(),queue()]);

		assert.verifySteps(["start 0","end 0","start 1","end 1"]);
	});
	QUnit.test("multi",async function(assert)
	{
		let queue=µ.util.function.queue(createTask(assert));

		await Promise.all([queue(),queue()]);

		assert.verifySteps(["start 0","start 1","end 0","end 1"]);
	});
	QUnit.test("over limit",async function(assert)
	{
		let queue=µ.util.function.queue(createTask(assert),{limit:2});

		await Promise.all([queue(),queue("slow",200),queue("2"),queue("3")]);

		assert.verifySteps(["start 0","start slow","end 0","start 2","end 2","start 3","end 3","end slow"]);
	});
	QUnit.test("change limit",async function(assert)
	{
		let queue=µ.util.function.queue(createTask(assert),{limit:2});

		await Promise.all([queue().then(()=>{queue.setLimit(3)}),queue("slow",200),queue("2"),queue("3")]);

		assert.verifySteps(["start 0","start slow","end 0","start 2","start 3","end 2","end 3","end slow"]);
	});

});