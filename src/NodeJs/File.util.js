(function(µ,SMOD,GMOD,HMOD,SC){

	var File=GMOD("File");

	SC=SC({
		crc:"util.crc32",
		prom:"Promise"
	});

	var PATH=require("path");

	var UTIL=File.util={
		findUnusedName:SC.prom.pledge(function(signal,file)
		{
			file=File.stringToFile(file);
			file.exists().then(function()
			{
				var pathInfo=PATH.parse(file.filePath);
				var counter=1;

				var find=function()
				{
					return file.changePath(PATH.format({
						dir:pathInfo.dir,
						base:pathInfo.name+"["+(counter++)+"]"+pathInfo.ext
					})).exists().then(function()
					{
						return find();
					},function()
					{
						signal.resolve(file.filePath);
					});
				};
				find();
			},function()
			{
				signal.resolve(file.filePath);
			});
		}),
		rotateFile:SC.prom.pledge(function(signal,file,count)
		{
			if(!count) count=3;
			file=File.filetoString(file);
			var rot=function(prevFile,number)
			{
				return new File(file+"."+number).exists().then(function()
				{
					if(number+1>=count) return Promise.reject();
					return rot(this,number+1);
				}).always(function()
				{
					return prevFile.rename(file+"."+(number),true);
				});
			};
			new File(file).exists().then(function()
			{
				return rot(this,0);
			})
			.then(signal.resolve,signal.reject);
		}),
		getRotatedFile:SC.prom.pledge(function(signal,file,validator)
		{
			//TODO
		}),
		enshureDir:function(dir)
		{
			dir=File.stringToFile(dir);
			return dir.exists().catch(function()
			{
				var parentDir=PATH.dirname(dir.getAbsolutePath());
				if(dir.getAbsolutePath()===parentDir)
				{
					signal.reject(new RangeError("no existing dir found"));
				}
				else return UTIL.enshureDir(parentDir).then(function()
				{
					return dir.mkdir(".");
				})
			});
		},
		calcCRC:function(file,progress)
		{
			file=File.stringToFile(file);
			return file.stat().then(stat=>
				file.readStream().then(stream=>
					new SC.prom(signal=>
					{
						var dataRead=0;
						var builder=new SC.crc.Builder();
						stream.on("data",function(data)
						{
							builder.add(data);
							dataRead+=data.length;
							if(progress)progress(dataRead,stat.size);
						});
						stream.on("end",function()
						{
							signal.resolve(("00000000"+builder.get().toString(16).toUpperCase()).slice(-8));
						});
						stream.on("error",signal.reject);
					})
				)
			);
		}
	}

	SMOD("File.util",UTIL);

})(Morgas,Morgas.setModule,Morgas.getModule,Morgas.hasModule,Morgas.shortcut);
