(function(µ,SMOD,GMOD,HMOD,SC){
	var DBObj=GMOD("DBObj"),
	FIELD=GMOD("DBField"),
	REL=GMOD("DBRel");
	var testObject=µ.Class(DBObj,{
		objectType:"testObject",
		constructor:function(param={})
		{
			this.mega(param);
			
			this.addField("testInt",	FIELD.TYPES.INT		,param.testInt		);
			this.addField("testDouble",	FIELD.TYPES.DOUBLE	,param.testDouble	);
			this.addField("testBool",	FIELD.TYPES.BOOL	,param.testBool		);
			this.addField("testString",	FIELD.TYPES.STRING	,param.testString	);
			this.addField("testJSON",	FIELD.TYPES.JSON	,param.testJSON		);
//			this.addField("testBlob",	FIELD.TYPES.BLOB	,param.testBlob		);
			this.addField("testDate",	FIELD.TYPES.DATE	,param.testDate 	);

			this.addRelation("parentRel",	testObject,	REL.TYPES.PARENT,	"childRel",	"testParent_ID");
			this.addRelation("childRel",	testObject,	REL.TYPES.CHILD,	"parentRel"	);
			this.addRelation("friendRel",	testObject,	REL.TYPES.FRIEND,	"friendRel"	);
		}
	});
	window.DBTest=function(dbConn,extra)
	{
		sessionStorage.clear(); //clear to ensure execution order

		var parent=new testObject({
			testInt:10,
			testDouble:1.1,
			testBool:true,
			testString:"testString",
			testJSON:{test:"json",success:true,score:10},
			testDate:new Date()
		}),
		child=new testObject({
			testInt:20,
			testString:"testString",
			testBool:true
		}),
		friend=new testObject({
			testInt:30,
			testString:"testString2",
			testBool:true
		});
		
		parent.addChild("childRel",child);
		child.addFriend("friendRel",friend);

		//tests

		QUnit.test("save single",function(assert)
		{
			return dbConn.save(parent).then(function()
			{
				assert.notEqual(parent.ID,undefined,"ID generated");
			});
		});
		QUnit.test("save multiple",function(assert)
		{
			parent.setValueOf("testDouble",1.2);
			return dbConn.save([parent,child,friend])
			.then(function()
			{
				assert.notEqual(child.ID,undefined,"ID generated");
				assert.notEqual(parent.ID,undefined,"ID generated");
				assert.notEqual(friend.ID,undefined,"ID generated");
			});
		});
		QUnit.test("save friendships",function(assert)
		{
			return dbConn.saveFriendships(child,"friendRel")
			.then(function()
			{
				assert.ok(true);
			});
		});
		QUnit.test("load single via int",function(assert)
		{
			return dbConn.load(testObject,{testInt:10}).then(function(result)
			{
				assert.deepEqual(result[0]&&result[0].toJSON(),parent.toJSON(),"load single via int");
				assert.equal(result.length,1,"result count");
			});
		});
		QUnit.test("load multiple via string",function(assert)
		{
			return dbConn.load(testObject,{testString:"testString"}).then(function(result)
			{
				assert.deepEqual(result[0]&&result[0].toJSON(),parent.toJSON(),"load multiple via string (1)");
				assert.deepEqual(result[1]&&result[1].toJSON(),child.toJSON(),"load multiple via string (2)");
				assert.equal(result.length,2,"result count");
			});
		});
		QUnit.test("load parent",function(assert)
		{
			return dbConn.loadParent(child,"parentRel")
			.then(function(result)
			{
				assert.deepEqual(parent.toJSON(),result.toJSON(),"load parent");
			});
		});
		QUnit.test("load children",function(assert)
		{
			return dbConn.loadChildren(parent,"childRel")
			.then(function(result)
			{
				result=result[0];
				assert.deepEqual(child.toJSON(),result.toJSON(),"load friend");
			});
		});
		QUnit.test("load friends",function(assert)
		{
			return dbConn.loadFriends(child,"friendRel")
			.then(function(result)
			{
				result=result[0];
				assert.deepEqual(friend.toJSON(),result.toJSON(),"load friend");
			});
		});
		QUnit.test("deleteFriendships",function(assert)
		{
			return dbConn.deleteFriendships(child,"friendRel")
			.then(function()
			{
				return dbConn.loadFriends(friend,"friendRel",{testInt:20});
			})
			.then(function(result)
			{
				assert.strictEqual(result.length,0,"firendship deleted");
			});
		});
		QUnit.test("delete",function(assert)
		{
			return dbConn["delete"](testObject,parent)
			.then(function()
			{
				return dbConn.load(testObject,{testInt:10});
			})
			.then(function(result)
			{
				assert.strictEqual(result.length,0,"deleted Object");
				return dbConn["delete"](testObject,{testBool:true});
			})
			.then(function()
			{
				return dbConn.load(testObject,{testBool:true});
			})
			.then(function(result)
			{
				assert.strictEqual(result.length,0,"deleted pattern");
			});
		});
		if(extra)
		{
			extra(dbConn);
		}
	};
})(Morgas,Morgas.setModule,Morgas.getModule,Morgas.hasModule,Morgas.shortcut);