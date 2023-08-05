(function(µ,SMOD,GMOD,HMOD,SC){
	
	let CommandPackage=GMOD("CommandPackage");
	
	SC=SC({
		File:"File",
		util:"File/util",
		FileCmd:"CommandPackage/file",
		DateFormat:"date/format",
		metricUnit:"metricUnit",
		Orchestrator:"Orchestrator"
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
				}).on("error",reject);
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
					let options={
						delay:0,
						bulk:1,
						ignoreErrors:false
					};

					let [range,filename,optionString]= source.match(/\s*((?:\S|\s(?!--|$))+)(?:\s--(.+))?/);
					if(optionString)
					{
						for (let optionEntry of optionString.split(/\s--/))
						{
							let [range, key, value] = optionEntry.match(/(\S+)(?:\s+|\s*=\s*)(.+)\s*/);
							switch (key)
							{
								case "delay":
								{
									let delay = parseInt(value, 10);
									if (delay) options.delay = delay;
									break;
								}
								case "bulk":
								{
									let bulk = parseInt(value, 10);
									if (bulk) options.bulk = bulk;
									break;
								}
								case "ignoreErrors":
								{
									options.ignoreErrors = value!=="false";
									break;
								}
							}
						}
					}

					return this.downloadList(filename,options)
					.catch(µ.constantFunctions.pass)
					.then(result=>
					{
						this.out(result);
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
		download:async function(url,filename,lineIndex)
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
						await this.out("as "+filename);
					}
				}
				if(!filename)
				{
					filename=PATH.basename(URL.parse(url).pathname);
				}
				target=new SC.File(this.getCWD()).changePath(filename);
				await SC.util.findUnusedName(target);
			}
			await SC.util.enshureDir(target.getDir());
			let writeStream=await target.writeStream();
			let date=new Date(0);
			let startTime=Date.now();
			let size=0;
			let timer=setInterval(()=>
			{
				let duration=Date.now()-startTime;
				date.setTime(duration);
				let message=SC.DateFormat(date,SC.DateFormat.time,true);
				if(filesize) message+=" "+(size*100/filesize).toFixed(2)+"%";
				let speed=SC.metricUnit.to(size*1000/duration,{base:"B/S",factor:1024});
				message+="\t"+speed;
				this.out(lineIndex,message);
			},500);

			return new Promise(function(resolve,reject)
			{
				let errorHandle=e=>
				{
					clearInterval(timer);
					reject(e)
				};
				response.on("error",errorHandle)
				.on("end",()=>
				{
					clearInterval(timer);
					let duration=Date.now()-startTime;
					date.setTime(duration);
					let speed=SC.metricUnit.to(size*1000/duration,{base:"B/S",factor:1024});
					let message=SC.DateFormat(date,SC.DateFormat.time,true)+" complete  "+speed+"          ";
					resolve(message);
				});

				response.pipe(writeStream);
				response.on("data",function(data)
				{
					size+=data.length;
				});
				writeStream.on("error",errorHandle);
			});
		},
		downloadList:async function(source,{delay=0,bulk=1,ignoreErrors=false}={})
		{
			this.resume();
			let startTime=Date.now();
			source=new SC.File(this.getCWD()).changePath(source);
			let list=JSON.parse(await source.read());
			let orchestrator=new SC.Orchestrator({maxRunning:bulk,delay});
			let stop=false;
			let stopFn=()=>
			{
				if(!stop)
				{
					orchestrator.removePending("stopped");
					stop = true;
					this.out(this.commander.lineIndex+2,"stopping");
				}
			};
			this.commander.rl.on("SIGINT",stopFn);

			let lineIndex=this.commander.lineIndex;
			await Promise.allSettled(list.map((entry,i)=>
			{
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
				let index=lineIndex=lineIndex+=2;
				return orchestrator.add(async ()=>
				{
					await this.out(index-1,`${i+1}/${list.length}	${url}	${filename||""}`);
					return this.download(url,filename,index).then(async (result)=>
					{
						await this.out(index,result);
					},
					error=>
					{
						if(error!=="stopped")this.out(index,"error",error.message);
						if(!ignoreErrors) stopFn();
					});
				}).catch(error=>
				{
					if(error!=="stopped")this.out(index,error);
					if(!ignoreErrors) stopFn();
				});
			}));
			return getTimeString(new Date(Date.now()-startTime))+(stop?" stopped":" all complete");
		},
		progressOutput:function(message)
		{
			this.commander.rl.output.cursorTo(0);
			this.commander.rl.write(message);
			this.commander.rl.clearLine(1);
			this.commander.rl.output.moveCursor(0,-1);
		},
		getFileCmd:function()
		{
			return this.commander.getCommandPackage(SC.FileCmd.prototype.name);
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