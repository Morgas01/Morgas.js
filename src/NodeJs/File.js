(function(µ,SMOD,GMOD,HMOD,SC){

	µ.NodeJs=µ.NodeJs||{};

	SC=SC({
		prom:"Promise"
	});
	
	let FS=require("fs");
	let PATH=require("path");
	
	let asyncCallback=function(signal)
	{
		return function(err,result)
		{
			if(err) signal.reject(err);
			else signal.resolve(result);
		};
	};
	let copyFile=function(source,target)
	{
		return source.readStream().then(function(r)
		{
			return target.writeStream().then(function(w)
			{
				return new SC.prom(function(signal)
				{
					r.on("error",signal.reject);
					w.on("error",signal.reject);
					w.on("close",function()
					{
						signal.resolve(target);
					});
					r.pipe(w);
				});
			});
		});
	};
	
	let FILE=µ.NodeJs.File=µ.Class({
		constructor:function(filePath)
		{
			this.filePath=filePath||".";
			SC.prom.pledgeAll(this,["realPath","stat","lstat","access","listFiles","mkdir","read","readStream","write","writeStream","rename","copy"]);
		},
		getFileName:function()
		{
			return PATH.parse(this.filePath).name;
		},
		/** FileName+Ext **/
		getName:function()
		{
			return PATH.parse(this.filePath).base;
		},
		getDir:function()
		{
			return PATH.parse(this.filePath).dir;
		},
		getExt:function()
		{
			return PATH.parse(this.filePath).ext;
		},
		changePath:function(path)
		{
			if(path instanceof FILE) path=path.getAbsolutePath();
			this.filePath=PATH.resolve(this.filePath,path);
			return this;
		},
		getAbsolutePath:function()
		{
			return this.filePath=PATH.resolve(this.filePath);
		},
		realPath:function(signal)
		{
			FS.realpath(this.filePath,asyncCallback(signal));
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
		mkdir:function(signal,dir,mode)
		{
			FS.mkdir(PATH.join(this.filePath,dir),mode,asyncCallback(signal));
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
			.on("error",signal.reject)
			.on("open",function()
			{
				this.removeListener("error",signal.reject);
				signal.resolve(this);
			});
		},
		rename:function(signal,filename,overwrite)
		{
			let filePath=PATH.resolve(PATH.dirname(this.filePath),filename);
			let doRename=()=>FS.rename(this.filePath,filePath,(err,result)=>
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
			let target=PATH.join(FILE.fileToString(dir),PATH.basename(this.filePath));
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
			filename=FILE.fileToString(filename);
			let filePath=PATH.resolve(PATH.parse(this.filePath).dir,filename);
			if(overwrite===true) copyFile(this,new FILE(filePath)).then(signal.resolve,signal.reject);
			else new FILE(filePath).exists().reverse("FILE_EXISTS",function()
			{
				return copyFile(signal.scope,this);
			}).then(signal.resolve,signal.reject);
		},
		copyTo:function(dir,overwrite)
		{
			return this.copy(PATH.join(dir,PATH.basename(this.filePath)),overwrite);
		},
		clone:function()
		{
			return new FILE(this.filePath);
		},
		toString:function()
		{
			return "[FILE: "+this.filePath+"]";
		},
		equals:function(other)
		{
			return (other instanceof FILE) && other.getAbsolutePath()==this.getAbsolutePath();
		}
	});
	FILE.stringToFile=function(path)
	{
		if(path instanceof FILE) return path;
		return new FILE(path);
	};
	FILE.fileToString=function(file)
	{
		if(file instanceof FILE) return file.filePath;
		return file;
	};
	FILE.fileToAbsoluteString=function(file)
	{
		if(file instanceof FILE) return file.getAbsolutePath();
		return PATH.resolve(file);
	};
	
	SMOD("File",FILE);
	
})(Morgas,Morgas.setModule,Morgas.getModule,Morgas.hasModule,Morgas.shortcut);