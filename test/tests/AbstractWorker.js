QUnit.module("AbstractWorker",function()
{
	QUnit.test("dummy",function(assert)
	{
		assert.expect(3);


		let sendCounter=0;
		let DummyWorker=µ.Class(µ.AbstractWorker,{
			constructor:function()
			{
				this.mega();
			},
			_send:function(payload)
			{
				if(sendCounter++==0)
				{
					this._onMessage({type:µ.AbstractWorker.messageTypes.REQUEST,id:"init",data:payload.config});
				}
				else
				{
					assert.deepEqual(payload,{type:µ.AbstractWorker.messageTypes.REQUEST,id:"R0",method:"foo",args:[1,2,3]});
				}
			},
			_start:function()
			{
				assert.ok(true,"start");
				return {data:"initData"};
			}
		});

		let dummyWorker = new DummyWorker();
		return dummyWorker.ready.then(function(config)
		{
			assert.strictEqual(config.data,"initData","init data");
			dummyWorker.request("foo",[1,2,3])
		});
	});

});