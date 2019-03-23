QUnit.module("Transmuter",function()
{
	let transmutations={
		1:{
			2:function f12(d)
			{
				d.version=2;
				d.b=d.a*2;
				d.a++;
				return d;
			},
			3:function f13(d)
			{
				d.version=3;
				d.c=d.a*3;
				d.a++;
				return d;
			}
		},
		2:{
			1:function f21(d)
			{
				d.version=1;
				d.a--;
				delete d.b;
				return d;
			},
			3:function f23(d)
			{
				d.version=3;
				d.c=(d.a-1)+d.b;
				delete d.b;
				return d;
			}
		},
		3:{
			4:function(d)
			{
				d.version=4;
				d.b=(d.a-1)*2;
				return d;
			}
		}
	};
	let transmuter=new µ.Transmuter({
		transmutations,
		currentVersion:3,
		versionDetector:d=>d.version
	});
	QUnit.test("getTransmutation",function(assert)
	{
		assert.strictEqual(transmuter.getTransmutation(1,3),transmutations[1][3],"existing upgrade");
		assert.strictEqual(transmuter.getTransmutation(2,1),transmutations[2][1],"existing downgrade");
		assert.strictEqual(transmuter.getTransmutation(1,5),undefined,"not existing");
	});
	QUnit.test("lookUp",function(assert)
	{
		assert.deepEqual(transmuter.lookUp("1","3"),["1","3"],"direct");
		assert.deepEqual(transmuter.lookUp("2","4"),["2","3","4"],"indirect");
		assert.deepEqual(transmuter.lookUp("1","4"),["1","3","4"],"short cut");
		assert.throws((()=>transmuter.lookUp(1,5)),/#Transmuter:003/,"no path");
	});
	QUnit.test("transmute",async function(assert)
	{
		assert.deepEqual(await transmuter.transmute(1,2,{version:1,a:2}),{version:2,a:3,b:4},"f12");
		assert.deepEqual(await transmuter.transmute(1,3,{version:1,a:2}),{version:3,a:3,c:6},"f13");
		assert.deepEqual(await transmuter.transmute(2,1,{version:2,a:3,b:4}),{version:1,a:2},"f21");
		assert.deepEqual(await transmuter.transmute(2,3,{version:2,a:3,b:4}),{version:3,a:3,c:6},"f23");
		assert.deepEqual(await transmuter.transmute(1,4,{version:1,a:2}),{version:4,a:3,b:4,c:6},"1=>4");
		assert.rejects(transmuter.transmute(1,5),/#Transmuter:003/,"no path");
	});
});