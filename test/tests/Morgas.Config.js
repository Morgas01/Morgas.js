QUnit.module("Config",function()
{

	QUnit.test("field",function(assert)
	{
		var stringField=new µ.Config.Field({type:"string",pattern:/^[A-Z]+$/});
		var numberField=new µ.Config.Field({type:"number",default:3,validate:n=>n>0});
		var selectField=new µ.Config.Field({type:"select",values:["s1","s2","s3"],default:"s4"});
		var booleanField=new µ.Config.Field({type:"boolean"});
		var rangeField=new µ.Config.Field({type:"number",min:2,step:2,max:4});


		assert.strictEqual(stringField.get(),null,"initial null value");
		assert.strictEqual(numberField.get(),3,"default value");
		assert.strictEqual(selectField.get(),null,"invalid default value");


		assert.notOk(stringField.set("test"),"reject invalid string value");
		assert.strictEqual(stringField.get(),null,"string value not set");
		assert.ok(stringField.set("TEST"),"accept valid string value");
		assert.strictEqual(stringField.get(),"TEST","string value set");

		assert.notOk(numberField.set(-2),"reject invalid number value");
		assert.strictEqual(numberField.get(),3,"number value not set");
		assert.ok(numberField.set(5),"accept valid number value");
		assert.strictEqual(numberField.get(),5,"number value set");

		assert.notOk(selectField.set("test"),"reject invalid select value");
		assert.strictEqual(selectField.get(),null,"select value not set");
		assert.ok(selectField.set("s2"),"accept valid select value");
		assert.strictEqual(selectField.get(),"s2","select value set");
		assert.notOk(selectField.set(["s1","s3"]),"reject select values when not multiple");
		selectField.multiple=true;
		assert.ok(selectField.set(["s1","s3"]),"accept valid select values");
		assert.deepEqual(selectField.get(),["s1","s3"],"select values set");
		assert.ok(selectField.set("s2"),"accept valid select value");
		assert.strictEqual(selectField.get(),"s2","select value set");

		assert.notOk(booleanField.set(1),"reject invalid boolean value");
		assert.strictEqual(booleanField.get(),null,"boolean value not set");
		assert.ok(booleanField.set(true),"accept valid boolean value");
		assert.strictEqual(booleanField.get(),true,"boolean value set");

		assert.notOk(rangeField.set(0),"reject invalid number value (min)");
		assert.notOk(rangeField.set(1),"reject invalid number value (min/step)");
		assert.notOk(rangeField.set(3),"reject invalid number value (step)");
		assert.notOk(rangeField.set(5),"reject invalid number value (step/max)");
		assert.notOk(rangeField.set(6),"reject invalid number value (max)");
		assert.ok(rangeField.set(2),"accept valid number value");
		assert.strictEqual(rangeField.get(),2,"boolean value set");
		assert.ok(rangeField.set(4),"accept valid number value");
		assert.strictEqual(rangeField.get(),4,"boolean value set");
	});

	QUnit.test("object",function(assert)
	{
		var obj=new µ.Config.Container.Object({
			value:{
				type:"boolean",
				default:false
			}
		});

		assert.deepEqual(obj.get(),{
			value:false
		},"init");
		assert.notOk(obj.set("value","test"),"reject invalid value");
		assert.notOk(obj.set("foo","bar"),"reject invalid field");
		assert.ok(obj.set("value",true),"set value");

		obj.add("foo",new µ.Config.Field({
			type:"string",
			default:"bar"
		}));
		assert.deepEqual(obj.get(),{
			value:true,
			foo:"bar"
		},"add field");
	});

	QUnit.test("array",function(assert)
	{
		var arr=new µ.Config.Container.Array({
			model:{
				type:"number",
				default:1
			},
			default:["test",2]
		});

		assert.deepEqual(arr.get(),[null,2],"init with invalid default");
		assert.notOk(arr.set(0,"foobar"),"reject invalid value");
		assert.notOk(arr.set(2,3),"reject invalid field");
		assert.ok(arr.set(0,1),"set value");
		assert.ok(arr.push(3),"push value");
		assert.deepEqual(arr.get(),[1,2,3],"check");
	});

	QUnit.test("map",function(assert)
	{
		var map=new µ.Config.Container.Map({
			model:{
				type:"number",
				default:1
			},
			default:{
				one:"one",
				two:2
			}
		});

		assert.deepEqual(map.get(),{
			one:null,
			two:2
		},"init with invalid default");
		assert.notOk(map.set("two","two"),"reject invalid value")
		assert.notOk(map.set("three",3),"reject invalid field")
		assert.ok(map.set("one",1),"set Value");
		assert.ok(map.add("three",3),"add value");
		assert.deepEqual(map.get(),{
			one:1,
			two:2,
			three:3
		},"check")
	});

	QUnit.test("parse",function(assert)
	{
		var desc={
			type:"object",
			model:{
				map:{
					type:"map",
					model:{
						type:"array",
						model:{
							type:"number",
							default:1
						},
						default:[2]
					},
					default:{
						foo:[3]
					}
				}
			},
			default:null
		};
		var values={
			map:{
				foobar:[123]
			}
		};

		var parsed=µ.Config.parse(desc);
		var map=parsed.get("map");
		var array=map.add("bar");
		var parsedField=parsed.get(["map","foo",0]);
		var arrayField=array.get(0);
		var fieldField=array.push();
		assert.deepEqual(parsed.toDescription(),desc,"parse and generate");
		assert.strictEqual(parsedField.get(),3,"map default");
		assert.strictEqual(arrayField.get(),2,"array default");
		assert.strictEqual(fieldField.get(),1,"field default");
		array.setAll([5,6]);
		assert.deepEqual(array.get(),[5,6],"setAll")
		array.setAll([7],true);
		assert.deepEqual(array.get(),[7],"setAll (overwrite)")
		parsed.set(values);
		assert.deepEqual(parsed.get(),values,"set container (overwrite)");
		parsed=µ.Config.parse(desc,values);
		assert.deepEqual(parsed.get(),values,"parse with values");
	});
});
