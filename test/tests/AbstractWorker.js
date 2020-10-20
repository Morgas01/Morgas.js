QUnit.module("AbstractWorker",function()
{
	QUnit.test("dummy",function(assert)
	{
		assert.expect(3);

		let DummyWorker=µ.Class(µ.AbstractWorker,{
			constructor:function()
			{
				this.mega();
				this._onMessage({request:"init",data:"initData"});
			},
			_send:function(payload)
			{
				assert.deepEqual(payload,{request:0,method:"foo",args:[1,2,3]});
				this._onMessage({request:0,data:[4,5,6]});
			},
			_start:function()
			{
				assert.ok(true,"start");
			}
		});

		return new DummyWorker().ready.then(function(initData)
		{
			assert.strictEqual(initData,"initData","init data");
			this.request("foo",[1,2,3])
		});
	});

});