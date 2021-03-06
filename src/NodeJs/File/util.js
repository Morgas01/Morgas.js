(function(µ,SMOD,GMOD,HMOD,SC){

	let File=GMOD("File");
	let CRYPTO=require("crypto");
	SC=SC({
		crc:"util.crc32",
		prom:"Promise"
	});

	let PATH=require("path");
	let FS=require("fs");

	let UTIL=File.util={
		findUnusedName:SC.prom.pledge(function(signal,file)
		{
			file=File.stringToFile(file);
			file.exists().then(function()
			{
				let pathInfo=PATH.parse(file.filePath);
				let counter=1;

				let find=function()
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
		rotateFile:function(file,count)
		{
			if(!count) count=3;
			file=File.fileToString(file);
			let rot=function(prevFile,number)
			{
				return new File(file+"."+number).exists().then(function()
				{
					if(number+1>=count) return Promise.reject();
					return rot(this,number+1);
				}).always(function()
				{
					return prevFile.rename(PATH.basename(file)+"."+number,true);
				});
			};
			return new File(file).exists().then(function()
			{
				return rot(this,0);
			},µ.constantFunctions.pass);
		},
		getRotatedFile:function(file,mapper)
		{
			file=File.stringToFile(file);
			let folder=file.clone().changePath("..");
			let regex=new RegExp(String.raw`^${file.getName()}(\.([0-9]+))?$`);
			let others=[];
			return folder.exists()
			.then(()=>folder.listFiles())
			.then(files=>files.filter(f=>regex.test(f))
				.sort((a,b)=>
				{
					let aMatch=a.match(regex),bMatch=b.match(regex);
					a=parseInt(aMatch&&aMatch[2]||-1,10);
					b=parseInt(bMatch&&bMatch[2]||-1,10);
					return a-b;
				})
			)
			.then(async function(fileNames)
			{
				let errors=[];
				for(let fileName of fileNames)
				{
					let file=folder.clone().changePath(fileName);
					try
					{
						let data=await mapper(await file.read());
						return {
							data:data,
							file:file,
							others:errors
						}
					}
					catch (error)
					{
						errors.push({error:error,file:this});
					}
				}
				throw errors;
			});
		},
		enshureDir:function(dir)
		{
			dir=File.stringToFile(dir);
			return dir.exists().catch(function()
			{
				let parentDir=PATH.dirname(dir.getAbsolutePath());
				if(dir.getAbsolutePath()===parentDir)
				{
					signal.reject(new RangeError("no existing dir found"));
				}
				else return UTIL.enshureDir(parentDir).then(function()
				{
					return dir.mkdir(".")
					.catch(function(error)
					{
						if(error.code === 'EEXIST') return;
						return Promise.reject(error);
					});
				})
			});
		},
		enshureDirSync:function(dir)
		{
			dir=File.stringToFile(dir).clone();
			let todo=[];
			while (!FS.existsSync(dir.getAbsolutePath()))
			{
				todo.push(dir.getAbsolutePath());
				dir=dir.changePath("..");
			}
			while (todo.length>0)
			{
				FS.mkdirSync(todo.pop())
			}
		},
		calcCRC:function(file,progress)
		{
			file=File.stringToFile(file);
			return file.stat().then(stat=>
				file.readStream().then(stream=>
					new SC.prom(signal=>
					{
						let dataRead=0;
						let builder=new SC.crc.Builder();
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
		},
		async calcHash(file,algorithm="md5",progress)
		{
			let stat=await file.stat();
			let stream=await file.readStream();
			return new Promise((resolve,reject)=>
			{
				let hash=CRYPTO.createHash(algorithm);
				let dataRead=0;

				stream.on('data', function (data) {
					hash.update(data, 'utf8');
					dataRead+=data.length;
					if(progress)progress(dataRead,stat.size);
				});
				stream.on('end', function () {
					resolve(hash.digest('hex'));
				});
				stream.on('error', reject);
			});
		}
	};

	SMOD("File/util",UTIL);

})(Morgas,Morgas.setModule,Morgas.getModule,Morgas.hasModule,Morgas.shortcut);
