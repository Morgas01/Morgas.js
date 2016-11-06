(function(µ,SMOD,GMOD,HMOD,SC){
	var DBObj=GMOD("DBObj"),
	FIELD=GMOD("DBField"),
	REL=GMOD("DBRel");
	var testObject=µ.Class(DBObj,{
		objectType:"testObject",
		init:function(param)
		{
			param=param||{};
			
			this.mega(param);
			
			this.addField("testInt",	FIELD.TYPES.INT		,param.testInt		);
			this.addField("testDouble",	FIELD.TYPES.DOUBLE	,param.testDouble	);
			this.addField("testBool",	FIELD.TYPES.BOOL	,param.testBool		);
			this.addField("testString",	FIELD.TYPES.STRING	,param.testString	);
			this.addField("testJSON",	FIELD.TYPES.JSON	,param.testJSON		);
//			this.addField("testBlob",	FIELD.TYPES.BLOB	,param.testBlob		);
			this.addField("testDate",	FIELD.TYPES.DATE	,param.testDate 	);

			this.addField("testParent_ID",FIELD.TYPES.INT);

			this.addRelation("parentRel",	testObject,	REL.TYPES.PARENT,	"childRel",	"testParent_ID");
			this.addRelation("childRel",	testObject,	REL.TYPES.CHILD,	"parentRel"	);
			this.addRelation("friendRel",	testObject,	REL.TYPES.FRIEND,	"friendRel"	);
		}
	});
	window.DBTest=function(dbConn,extra)
	{
		sessionStorage.clear(); //clear to ensure execution order

		var obj1=new testObject({
			testInt:10,
			testDouble:1.1,
			testBool:true,
			testString:"testString",
			testJSON:{test:"json",success:true,score:10},
			testDate:new Date()
		}),
		obj2=new testObject({
			testInt:20,
			testString:"testString",
			testBool:true
		}),
		obj3=new testObject({
			testInt:30,
			testString:"testString2",
			testBool:true
		});
		
		obj1.addChild("childRel",obj2);
		obj2.addFriend("friendRel",obj3);

		//tests

		QUnit.test("save single",function(assert)
		{
			console.log("save single");
			return dbConn.save(obj1).then(function()
			{
				assert.notEqual(obj1.getID(),undefined,"ID generated");
			});
		});
		QUnit.test("save multiple",function(assert)
		{
			console.log("save multiple");
			obj1.setValueOf("testDouble",1.2);
			return dbConn.save([obj1,obj2,obj3])
			.then(function()
			{
				assert.notEqual(obj2.getID(),undefined,"ID generated");
				assert.notEqual(obj1.getID(),undefined,"ID generated");
				assert.notEqual(obj3.getID(),undefined,"ID generated");
			});
		});
		QUnit.test("save friendships",function(assert)
		{
			console.log("save friendships");
			return dbConn.saveFriendships(obj2,"friendRel")
			.then(function()
			{
				assert.ok(true);
			});
		});
		QUnit.test("load single via int",function(assert)
		{
			console.log("load single via int");
			return dbConn.load(testObject,{testInt:10}).then(function(result)
			{
				assert.deepEqual(result[0]&&result[0].toJSON(),obj1.toJSON(),"load single via int");
				assert.equal(result.length,1,"result count");
			});
		});
		QUnit.test("load multiple via string",function(assert)
		{
			console.log("load multiple via string");
			return dbConn.load(testObject,{testString:"testString"}).then(function(result)
			{
				assert.deepEqual(result[0]&&result[0].toJSON(),obj1.toJSON(),"load multiple via string (1)");
				assert.deepEqual(result[1]&&result[1].toJSON(),obj2.toJSON(),"load multiple via string (2)");
				assert.equal(result.length,2,"result count");
			});
		});
		QUnit.test("load relations",function(assert)
		{
			console.log("load relations");
			var o1,o2;
			return dbConn.loadFriends(obj3,"friendRel",{testInt:20})
			.then(function(result)
			{
				o2=result[0];
				assert.deepEqual(obj2.toJSON(),o2.toJSON(),"load firend");
				return dbConn.loadParent(o2,"parentRel");
			},µ.logger.error)
			.then(function(result)
			{
				o1=result;
				assert.deepEqual(obj1.toJSON(),o1.toJSON(),"load parent");
			},µ.logger.error)
		});
		QUnit.test("deleteFriendships",function(assert)
		{
			console.log("deleteFriendships");
			return dbConn.deleteFriendships(obj2,"friendRel")
			.then(function()
			{
				return dbConn.loadFriends(obj3,"friendRel",{testInt:20});
			},µ.logger.error)
			.then(function(result)
			{
				assert.strictEqual(result.length,0,"firendship deleted");
			},µ.logger.error);
		});
		QUnit.test("delete",function(assert)
		{
			console.log("delete");
			return dbConn["delete"](testObject,obj1)
			.then(function()
			{
				return dbConn.load(testObject,{testInt:10});
			},µ.logger.error)
			.then(function(result)
			{
				assert.strictEqual(result.length,0,"deleted Object");
				return dbConn["delete"](testObject,{testBool:true});
			},µ.logger.error)
			.then(function()
			{
				return dbConn.load(testObject,{testBool:true});
			},µ.logger.error)
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