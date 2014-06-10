(function(µ,GMOD){
	var DBObj=GMOD("DBObj"),
	FIELD=GMOD("DBField"),
	REL=GMOD("DBRel");
	var testObject=µ.Class(DBObj,{
		objectType:"testObject",
		init:function()
		{
			this.addField("testInt",	FIELD.TYPES.INT		,param.testInt		);
			this.addField("testDouble",	FIELD.TYPES.DOUBLE	,param.testDouble	);
			this.addField("testBool",	FIELD.TYPES.BOOL	,param.testBool		);
			this.addField("testString",	FIELD.TYPES.STRING	,param.testString	);
			this.addField("testJSON",	FIELD.TYPES.JSON	,param.testJSON		);
//			this.addField("testBlob",	FIELD.TYPES.BLOB	,param.testBlob		);
			this.addField("testDate",	FIELD.TYPES.DATE	,param.testDate 	);

			this.addField("testParent_ID",FIELD.TYPES.INT,param.testInt);

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
		
		var p=dbConn.save(obj1)
		.then(function()
		{
			return dbConn.save([obj2,obj3]);
		},µ.debug)
		.then(function()
		{
			return dbConn.saveFriends(obj2,"friendRel");
		},µ.debug)
		.then(function()
		{
			return dbConn.load(testObject,{testInt:10}).then(function(result)
			{
				deepEqual(obj1.toJSON(),result[0].toJSON(),"load single via int");
			},µ.debug)
		},µ.debug)
		.then(function()
		{
			return dbConn.load(testObject,{testString:"testString"}).then(function(result)
			{
				deepEqual(obj1.toJSON(),result[0].toJSON(),"load multiple via string (1)");
				deepEqual(obj2.toJSON(),result[1].toJSON(),"load multiple via string (2)");
			},µ.debug)
		},µ.debug)
		.then(function()
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
				o1=result[0];
				deepEqual(obj1.toJSON(),o1.toJSON(),"load parent");
			},µ.debug)
		},µ.debug);
		if(extra)
		{
			p=p.then(extra,µ.debug)
		}
		p.then(function()
		{
			start();
		},µ.debug)
	};
})(Morgas,Morgas.getModule);