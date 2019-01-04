(function(µ,SMOD,GMOD,HMOD,SC){

	QUnit.module("Patch",function()
	{
		QUnit.test("onExtend hook",function(assert)
		{
			assert.throws(()=>{µ.Class(µ.Patch,{})},
			function(error){return (error instanceof SyntaxError)&&error.message.startsWith("#Patch:001 ")},
			"missing patch function")
			µ.Class(µ.Patch,{patch(){}});
			assert.ok(true,"existing patch function");
		});

		QUnit.test("create",function(assert)
		{
			let testPatch=µ.Class(µ.Patch,{
				patch()
				{
					this.patchVar=1;
				}
			});
			let inst={};
			let patch=new testPatch(inst);

			assert.equal(patch.patchVar,1,"patch variable");
			assert.equal(patch.instance,inst,"patch instance");
			assert.deepEqual(µ.Patch.getPatches(inst),[patch],"Patch.getPatches()");
		});
		QUnit.test("composeInstance",function(assert)
		{
			let proxyPatch=µ.Class(µ.Patch,{
				patch(param)
				{
					this.bar="bar";
					this.composeInstance(param);
				},
				composeKeys:["foo","bar"],
				foo(){return "foobar"},
				foobar(){return "foobar"}
			});

			let inst,patch;
			inst={};
			patch=new proxyPatch(inst,["foo"]);
			assert.equal(inst.foo(),patch.foo(),"array");

			inst={};
			patch=new proxyPatch(inst,{bar:"bazz"});
			assert.equal(inst.bazz,patch.bar,"object");

			inst={};
			patch=new proxyPatch(inst,[["foo","bar"]]);
			assert.equal(inst.bar(),patch.foo(),"nested array");
			patch.destroy();
			assert.notOk("foo" in inst,"cleanup on patch.destroy()");

			inst={};
			patch=new proxyPatch(inst,["foobar"]);
			assert.notOk("foobar" in inst,"ignore key");

		});
	})

})(Morgas,Morgas.setModule,Morgas.getModule,Morgas.hasModule,Morgas.shortcut);