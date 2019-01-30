(function(µ,SMOD,GMOD,HMOD,SC){
	
	let CommandPackage=GMOD("CommandPackage");
	
	SC=SC({
		File:"File",
		util:"File/util",
		FileCmd:"CommandPackage/file"
	});

	let URL=require("url");
	let PATH=require("path");

	let fileNameCompleter=function(fh,line)
	{
		let addition=PATH.join(line+"dirt","..");
		if(addition!==".")
		{
			line=line.substr(addition.length+1).toLowerCase();
			return fh.ls(addition).then(r=>r.filter(a=>a.toLowerCase().indexOf(line)==0).map(a=>PATH.join(addition,a)));
		}
		else
		{
			line=line.toLowerCase();
			return fh.ls().then(r=>r.filter(function(a){return a.toLowerCase().indexOf(line)==0}));
		}
	};

	let getTimeString=function(date)
	{
		return ("0"+date.getUTCHours()).slice(-2)+":"+("0"+date.getUTCMinutes()).slice(-2)+":"+("0"+date.getUTCSeconds()).slice(-2);
	};

	let makeRequest=function(url)
	{
		return new Promise(function(resolve,reject)
		{
			(function request(url)
			{
				let options=URL.parse(url);
				let protocol=require(options.protocol.slice(0,-1)||"http");
				options.rejectUnauthorized=false;
				protocol.get(options,response=>
				{
					switch(response.statusCode)
					{
						case 200:
							resolve(response);
							break;
						case 301:
						case 302:
						case 303:
						case 307:
						case 308:
							request(response.headers.location);
							break;
						default:
							reject("status :"+response.statusCode);
					}
				});
			})(url);
		});
	}

	let download=µ.Class(CommandPackage,
	{
		name:"download",
		commands: {
			download:CommandPackage.createCommand(
				function(line)
				{
					let match=line.match(/(\S+)(?:\s+(\S.+))?/);
					if(!match)this.out('download URL <filename>');
					else
					{

						this.pause();
						this.download(match[1],match[2])
						.catch(µ.constantFunctions.pass)
						.then(result=>
						{
							this.out(result);
							this.resume();
						});
					}
				},
				function(line)
				{

					let fileCmd=this.getFileCmd();
					if(!fileCmd) return [];
					return fileNameCompleter(fileCmd.fh,line);
				}
			),
			downloadList:CommandPackage.createCommand(
				function(source)
				{
					this.pause();
					(async ()=>
					{
						return this.downloadList(source);
					})()
					.catch(µ.constantFunctions.pass)
					.then(result=>
					{
						this.out(result);
						this.resume();
					});
				},
				function(line)
				{

					let fileCmd=this.getFileCmd();
					if(!fileCmd) return [];
					return fileNameCompleter(fileCmd.fh,line);
				}
			)
		},
		download:async function(url,filename)
		{
			let target;

			if(filename)
			{
				target=new SC.File(this.getCWD()).changePath(filename);
				try
				{
					await target.exists();
					return target.getName()+" exists";
				}
				catch(e){}
			}

			let response = await makeRequest(url);

			let filesize=null;
			if("content-length" in response.headers) filesize=response.headers["content-length"];

			if(!target)
			{
				if("content-disposition" in response.headers)
				{
					let match=response.headers["content-disposition"].match(/filename="(.+)"/);
					if(match)
					{
						filename=match[1];
						this.out("as "+filename);
					}
				}
				if(!filename)
				{
					filename=PATH.basename(URL.parse(url).pathname);
				}
				target=new SC.File(this.getCWD()).changePath(filename);
				await SC.util.findUnusedName(target);
			}
			let date=new Date(0);
			let startTime=Date.now();
			let size=0;
			let timer=setInterval(()=>
			{
				date.setTime(Date.now()-startTime);
				let message=getTimeString(date);
				if(filesize) message+=" "+(size*100/filesize).toFixed(2)+"%";
				this.progressOutput(message);
			},250);

			return await new Promise(function(resolve,reject)
			{
				response.on("error",reject)
				.on("end",()=>
				{
					clearInterval(timer);
					date.setTime(Date.now()-startTime);
					let message=getTimeString(date);
					resolve(getTimeString(date)+" complete");
				});
				target.writeStream()
				.then(function(dest)
				{
					response.pipe(dest);
					response.on("data",function(data)
					{
						size+=data.length;
					});
					dest.on("error",reject);
				},reject);
			});
		},
		downloadList:async function(source)
		{
			let startTime=Date.now();
			source=new SC.File(this.getCWD()).changePath(source);
			let list=JSON.parse(await source.read());
			let stop=false;
			let stopFn=()=>stop=true;
			this.instance.rl.on("SIGINT",stopFn);
			for(let i=0;!stop&&i<list.length;i++)
			{
				let entry=list[i];
				let url=null;
				let filename=null;
				if(Array.isArray(entry))
				{
					url=entry[0];
					filename=entry[1];
				}
				else
				{
					url=entry;
				}
				this.out(`${i+1}/${list.length}	${url}	${filename||""}`);
				this.out(await this.download(url,filename));
			}
			this.instance.rl.removeListener("SIGINT",stopFn);
			return getTimeString(new Date(Date.now()-startTime))+(stop?" stopped":" all complete");
		},
		progressOutput:function(message)
		{
			this.instance.rl.output.cursorTo(0);
			this.instance.rl.write(message);
			this.instance.rl.clearLine(1);
			this.instance.rl.output.moveCursor(0,-1);
		},
		getFileCmd:function()
		{
			return this.commander.getPackage(SC.FileCmd.name);
		},
		getCWD:function()
		{
			let fileCmd=this.getFileCmd();
			if(fileCmd) return fileCmd.getAbsolutePath();
			return process.cwd();
		}
	});
	SMOD("CommandPackage/download",download);
	module.exports=download;
	
})(Morgas,Morgas.setModule,Morgas.getModule,Morgas.hasModule,Morgas.shortcut);