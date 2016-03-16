(function(µ,SMOD,GMOD,HMOD,SC){

	var File=GMOD("File");

	SC=SC({
		prom:"Promise"
	});
	
	var PATH=require("path");
	
	var UTIL=File.util={
		findUnusedName:SC.prom.pledge(function(signal,file)
		{
			if(!(file instanceof File)) file=new File(file);
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
			if(--count<0)
			{
				signal.resolve();
			}
			else
			{
				if(file instanceof File) file=file.filePath;
				
				var check=new File();
				var rotate=function()
				{
					if(count===0)
					{
						check.changePath(file).exists().then(function()
						{
							return this.rename(file+".0",true);
						},µ.constantFunctions.pass)
						.then(signal.resolve,signal.reject);
					}
					else
					{
						check.changePath(file+"."+(--count)).exists().then(function()
						{
							return this.rename(file+"."+(count+1),true);
						},µ.constantFunctions.pass)
						.then(rotate,signal.reject);
					}
				};
				rotate();
			}
		}),
		enshureDir:function(dir)
		{
			if(!(dir instanceof File)) dir=new File(dir);
			return dir.exists().catch(function()
			{
				var parentDir=PATH.dirname(dir.filePath);
				if(dir.filePath===parentDir)
				{
					signal.reject(new RangeError("no existing dir found"));
				}
				else return UTIL.enshureDir(parentDir).then(function()
				{
					return dir.mkdir(".");
				})
			});
		}
	}
	
	SMOD("File.util",UTIL);
	
})(Morgas,Morgas.setModule,Morgas.getModule,Morgas.hasModule,Morgas.shortcut);