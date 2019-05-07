QUnit.module("Relayer",function()
{
	QUnit.test("no action",async function(assert)
	{
		let relayer=new µ.Relayer([1,2]);

		let {value,done}=await relayer.next();
		assert.strictEqual(value,1,"first data");
		assert.notOk(done,"not done");

		({value,done}=await relayer.next());
		assert.strictEqual(value,2,"second data");
		assert.notOk(done,"not done");

		({value,done}=await relayer.next());
		assert.strictEqual(value,undefined,"third data");
		assert.ok(done,"done");
	});
	QUnit.test("map",async function(assert)
	{
		let relayer=new µ.Relayer([1,2]).map(a=>a*2);

		assert.strictEqual((await relayer.next()).value,2);
		assert.strictEqual((await relayer.next()).value,4);
		assert.ok((await relayer.next()).done);
	});
	QUnit.test("flatMap",async function(assert)
	{
		let relayer=new µ.Relayer([1,3]).flatMap(a=>[a,a*2]);

		assert.strictEqual((await relayer.next()).value,1);
		assert.strictEqual((await relayer.next()).value,2);
		assert.strictEqual((await relayer.next()).value,3);
		assert.strictEqual((await relayer.next()).value,6);
		assert.ok((await relayer.next()).done);
	});
	QUnit.test("filter",async function(assert)
	{
		let relayer=new µ.Relayer([1,2,3,4,5,6]).filter(a=>a%2);

		assert.strictEqual((await relayer.next()).value,1);
		assert.strictEqual((await relayer.next()).value,3);
		assert.strictEqual((await relayer.next()).value,5);
		assert.ok((await relayer.next()).done);
	});
	QUnit.test("not blocking",async function(assert)
	{
		let relayer=new µ.Relayer([200,100])
		.map(time=>{
			assert.step("start "+time);
			return new Promise(rs=>setTimeout(()=>rs(time),time));
		})
		.map(time=>{
			assert.step("end "+time)
		});

		await Promise.all([relayer.next(),relayer.next()]);

		assert.verifySteps(["start 200","start 100","end 100","end 200"]);
	});
	QUnit.test("refill",async function(assert)
	{
		let arr=[1];
		let relayer=new µ.Relayer(arr);
		arr.push(-2); //does not change relayer
		relayer.refill(2);

		assert.strictEqual((await relayer.next()).value,1,"normal value");
		assert.strictEqual((await relayer.next()).value,2,"pre refilled");
		assert.ok((await relayer.next()).done,"end 1");

		relayer.refill(3,4);
		assert.strictEqual((await relayer.next()).value,3,"refilled 1");
		assert.strictEqual((await relayer.next()).value,4,"refilled 2");
		assert.ok((await relayer.next()).done,"end 2");
	});
	QUnit.test("error handling",async function(assert)
	{
		let relayer=new µ.Relayer([true,false]).map(a=>{if(a)throw "error"}).map(d=>4);

		assert.strictEqual((await relayer.next().catch(e=>e)),"error","handled");
		assert.strictEqual((await relayer.next()).value,4,"next value");
		assert.ok((await relayer.next()).done,"end");
	});
	QUnit.test("async iterator",async function(assert)
	{
		let arr=["1","4","7","2","5","8"];
		let relayer=new µ.Relayer(arr);

		for await (let value of relayer)
		{
			assert.step(value);
		}

		assert.verifySteps(arr);
	});
	QUnit.test("cascade",async function(assert)
	{
		let arr=[1,2,3,4];
		let subRelayer=new µ.Relayer().map(a=>a*a);
		let relayer=new µ.Relayer(arr).flatMap(a=>{
			if(a%2==0) return subRelayer.refill(a);
			return [a,a+1];
		});

		for await (let value of relayer)
		{
			assert.step(""+value);
		}

		assert.verifySteps(["1","2","4","3","4","16"]);
	});
	QUnit.test("fibronacci",async function(assert)
	{
		let arr=[1,1];
		let lastValue=null
		let relayer=new µ.Relayer(arr).filter(a=>{
			if(!lastValue)
			{
				lastValue=a;
				return true;
			}
			let nextValue=lastValue+a;
			lastValue=a;
			relayer.refill(nextValue);
			return true;
		});

		for (let i=0;i<8;i++)
		{
			assert.step(""+(await relayer.next()).value);
		}

		assert.verifySteps(["1","1","2","3","5","8","13","21"]);
	});

});