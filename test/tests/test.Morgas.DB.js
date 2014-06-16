(function(µ,GMOD){
	var DBObj=GMOD("DBObj"),
	FIELD=GMOD("DBField"),
	REL=GMOD("DBRel");
	var testObject=µ.Class(DBObj,{
		objectType:"testObject",
		init:function(param)
		{
			param=param||{};
			
			this.superInit(DBObj,param);
			
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
		}),
		obj3=new testObject({
			testInt:30,
			testString:"testString2",
		});
		
		obj1.addChild("childRel",obj2);
		obj2.addFriend("friendRel",obj3);
		var p;
		asyncTest("save single",function()
		{
			p=dbConn.save(obj1);
			p.then(function()
			{
				ok(true);
				start();
			},µ.debug);
		});
		asyncTest("save multiple",function()
		{
			p=p.then(function()
			{
				obj1.setValueOf("testDouble",1.2);
				return dbConn.save([obj1,obj2,obj3]);
			},µ.debug);
			p.then(function()
			{
				ok(true);
				start();
			},µ.debug);
		});
		asyncTest("save friends",function()
		{
			p=p.then(function()
			{
				return dbConn.saveFriends(obj2,"friendRel");
			},µ.debug);
			p.then(function()
			{
				ok(true);
				start();
			},µ.debug);
		});
		asyncTest("load single via int",function()
		{
			p=p.then(function()
			{
				return dbConn.load(testObject,{testInt:10}).then(function(result)
				{
					deepEqual(obj1.toJSON(),result[0].toJSON(),"load single via int");
					this.complete();
				},µ.debug)
			},µ.debug);
			p.then(function()
			{
				ok(true);
				start();
			},µ.debug);
		});
		asyncTest("load multiple via string",function()
		{
			p=p.then(function()
			{
				return dbConn.load(testObject,{testString:"testString"}).then(function(result)
				{
					deepEqual(obj1.toJSON(),result[0].toJSON(),"load multiple via string (1)");
					deepEqual(obj2.toJSON(),result[1].toJSON(),"load multiple via string (2)");
					this.complete();
				},µ.debug)
			},µ.debug);
			p.then(function()
			{
				ok(true);
				start();
			},µ.debug);
		});
		asyncTest("load relations",function()
		{
			p=p.then(function()
			{
				var o1,o2,o3
				return dbConn.load(testObject,{testString:"testString2"}).then(function(result)
				{
					o3=result[0];
					deepEqual(obj3.toJSON(),o3.toJSON(),"load single via string");
					return dbConn.loadFriends(o3,"friendRel",{testInt:20});
				},µ.debug)
				.then(function(result)
				{
					o2=result[0];
					deepEqual(obj2.toJSON(),o2.toJSON(),"load firend");
					return dbConn.loadParent(o2,"parentRel");
				},µ.debug)
				.then(function(result)
				{
					o1=result;
					deepEqual(obj1.toJSON(),o1.toJSON(),"load parent");
					this.complete();
				},µ.debug)
			},µ.debug);
			p.then(function()
			{
				ok(true);
				start();
			},µ.debug);
		});
		if(extra)
		{
			p=p.then(extra,µ.debug)
		}
	};
})(Morgas,Morgas.getModule);