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
		var p;
		asyncTest("save single",function()
		{
			p=dbConn.save(obj1);
			p.then(function()
			{
				notEqual(obj1.getID(),undefined,"ID generated");
				start();
			},µ.logger.error);
		});
		asyncTest("save multiple",function()
		{
			p=p.then(function()
			{
				obj1.setValueOf("testDouble",1.2);
				return dbConn.save([obj1,obj2,obj3]);
			},µ.logger.error);
			p.then(function()
			{
				notEqual(obj1.getID(),undefined,"ID generated");
				notEqual(obj2.getID(),undefined,"ID generated");
				notEqual(obj3.getID(),undefined,"ID generated");
				start();
			},µ.logger.error);
		});
		asyncTest("save friendships",function()
		{
			p=p.then(function()
			{
				return dbConn.saveFriendships(obj2,"friendRel");
			},µ.logger.error);
			p.then(function()
			{
				ok(true);
				start();
			},µ.logger.error);
		});
		asyncTest("load single via int",function()
		{
			p=p.then(function()
			{
				return dbConn.load(testObject,{testInt:10}).then(function(result)
				{
					deepEqual(result[0]&&result[0].toJSON(),obj1.toJSON(),"load single via int");
					equal(result.length,1,"result count");
					this.complete();

					start();
				},µ.logger.error)
			},µ.logger.error);
		});
		asyncTest("load multiple via string",function()
		{
			p=p.then(function()
			{
				return dbConn.load(testObject,{testString:"testString"}).then(function(result)
				{
					deepEqual(result[0]&&result[0].toJSON(),obj1.toJSON(),"load multiple via string (1)");
					deepEqual(result[1]&&result[1].toJSON(),obj2.toJSON(),"load multiple via string (2)");
					equal(result.length,2,"result count");
					this.complete();
					start();
				},µ.logger.error)
			},µ.logger.error);
		});
		asyncTest("load relations",function()
		{
			p=p.then(function()
			{
				var o1,o2;
				return dbConn.loadFriends(obj3,"friendRel",{testInt:20})
				.then(function(result)
				{
					o2=result[0];
					deepEqual(obj2.toJSON(),o2.toJSON(),"load firend");
					return dbConn.loadParent(o2,"parentRel");
				},µ.logger.error)
				.then(function(result)
				{
					o1=result;
					deepEqual(obj1.toJSON(),o1.toJSON(),"load parent");
					this.complete();
					start();
				},µ.logger.error)
			},µ.logger.error);
		});
		asyncTest("deleteFriendships",function()
		{
			p=p.then(function()
			{
				return dbConn.deleteFriendships(obj2,"friendRel")
				.then(function()
				{
					return dbConn.loadFriends(obj3,"friendRel",{testInt:20});
				},µ.logger.error)
				.then(function(result)
				{
					strictEqual(result.length,0,"firendship deleted");
					this.complete();
					start();
				},µ.logger.error)
			},µ.logger.error);
		});
		asyncTest("delete",function()
		{
			p=p.then(function()
			{
				return dbConn["delete"](testObject,obj1)
				.then(function()
				{
					return dbConn.load(testObject,{testInt:10});
				},µ.logger.error)
				.then(function(result)
				{
					strictEqual(result.length,0,"deleted Object");
					return dbConn["delete"](testObject,{testBool:true});
				},µ.logger.error)
				.then(function()
				{
					return dbConn.load(testObject,{testBool:true});
				},µ.logger.error)
				.then(function(result)
				{
					strictEqual(result.length,0,"deleted pattern");
					this.complete();
					start();
				},µ.logger.error)
			},µ.logger.error);
		});
		if(extra)
		{
			p=p.then(extra,µ.logger.error)
		}
	};
})(Morgas,Morgas.setModule,Morgas.getModule,Morgas.hasModule,Morgas.shortcut);