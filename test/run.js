require("..")//morgas
QUnit=require("qunit");
QUnit.dump.multiline=false;
require("qunit-tap")(QUnit,console.log);

require("./settings");

let srcDir="../src/",
testDir="./tests/";

testSettings.tests.forEach(function(test)
{
	if(test.nodeJs)
	{
		require(srcDir+test.path);
		require(testDir+test.path);
	}
});

QUnit.test("globals",function(assert)
{
	assert.deepEqual(testSettings.checkGlobals(),[],"added globals");
});

QUnit.load();