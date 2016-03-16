(function(µ,SMOD,GMOD,HMOD,SC){

	µ.NodeJs=µ.NodeJs||{};

	SC=SC({
		prom:"Promise"
	});
	
	var FS=require("fs");
	var PATH=require("path");
	
	var asyncCallback=function(signal)
	{
		return function(err,result)
		{
			if(err) signal.reject(err);
			else signal.resolve(result);
		};
	};
	var copyFile=function(source,target)
	{
		return source.readStream().then(function(r)
		{
			return target.writeStream().then(function(w)
			{
				return new SC.prom(function(signal)
				{
					r.on("error",signal.reject);
					w.on("error",signal.reject);
					w.on("end",signal.resolve);
					r.pipe(w);
				});
			});
		});
	};
	
	var FILE=µ.NodeJs.File=µ.Class({
		init:function(filePath)
		{
			this.filePath=filePath||".";
			SC.prom.pledgeAll(this,["realPath","stat","lstat","access","listFiles","mkdir","read","readStream","write","writeStream","rename","copy"]);
		},
		changePath:function(path)
		{
			this.filePath=PATH.resolve(this.filePath,path);
			return this;
		},
		getAbsolutePath:function()
		{
			return this.filePath=PATH.resolve(this.filePath)
		},
		realPath:function(signal)
		{
			FS.realpath(this.filePath,asyncCallback(signal))
		},
		stat:function(signal)
		{
			FS.stat(this.filePath,asyncCallback(signal));
		},
		lstat:function(signal)
		{
			FS.lstat(this.filePath,asyncCallback(signal));
		},
		access:function(signal,mode)
		{
			FS.access(this.filePath,mode,asyncCallback(signal));
		},
		exists:function()
		{
				return this.access(FS.F_OK);
		},
		listFiles:function(signal)
		{
			FS.readdir(this.filePath,asyncCallback(signal));
		},
		mkdir:function(signal,dir)
		{
			FS.mkdir(PATH.join(this.filePath,dir),asyncCallback(signal));
		},
		read:function(signal,options)
		{
			FS.readFile(this.filePath,options,asyncCallback(signal));
		},
		readStream:function(signal,options)
		{
			FS.createReadStream(this.filePath,options)
			.on("error",signal.reject)
			.on("open",function()
			{
				this.removeListener("error",signal.reject);
				signal.resolve(this);
			});
		},
		write:function(signal,data,options)
		{
			FS.writeFile(this.filePath,data,options,asyncCallback(signal));
		},
		writeStream:function(signal,options)
		{
			FS.createWriteStream(this.filePath,options)
			.on("error",function(err)
			{
				if(err.code==="ENOENT") signal.resolve(this);
				else signal.reject(err);
			})
			.on("open",function()
			{
				this.removeListener("error",signal.reject);
				signal.resolve(this);
			});
		},
		rename:function(signal,filename,overwrite)
		{
			var filePath=PATH.resolve(PATH.dirname(this.filePath),filename);
			var doRename=()=>FS.rename(this.filePath,filePath,(err,result)=>
			{
				if(err) signal.reject(err);
				else
				{
					this.filePath=filePath;
					signal.resolve(result);
				}
			});
			if(overwrite===true)
			{
				doRename();
			}
			else
			{
				new FILE(filePath).exists().reverse("FILE_EXISTS",doRename).catch(signal.reject);
			}
		},
		move:function(dir,overwrite)
		{
			if(dir instanceof FILE)dir=dir.filePath;
			var target=dir=PATH.join(dir,PATH.basename(this.filePath))
			console.log("move",this.filePath,target);
			return this.rename(target,overwrite);
		},
		remove:function()
		{
			return this.stat().then(function(stat)
			{
				if(stat.isDirectory())
				{
					return this.listFiles().then(function(files)
					{
						return Promise.all(files.map(f=>this.clone().changePath(f).remove()))
						.then(()=>new SC.prom(signal=>
						{
							FS.unlink(this.filePath,asyncCallback(signal))
						}));
					});
				}
				else return new SC.prom(signal=>
				{
					FS.unlink(this.filePath,asyncCallback(signal));
				});
			},µ.constantFunctions.ndef);
		},
		copy:function(signal,filename,overwrite)
		{
			var filePath=PATH.join(PATH.parse(this.filePath).dir,filename);
			if(overwrite===true) copyFile(this,new FILE(filePath)).then(signal.resolve,signal.reject);
			else new FILE(filePath).exists().reverse("FILE_EXISTS",function()
			{
				return copyFile(signal.scope,this);
			}).then(signal.resolve,signal.reject);
		},
		clone:function()
		{
			return new FILE(this.filePath);
		}
	});
	
	SMOD("File",FILE);
	
})(Morgas,Morgas.setModule,Morgas.getModule,Morgas.hasModule,Morgas.shortcut);