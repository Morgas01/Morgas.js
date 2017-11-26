(function(µ,SMOD,GMOD,HMOD,SC){
	
	let COM=GMOD("Commander");
	
	SC=SC({
		File:"File",
		util:"File.util",
		Patch:"Patch",
		FileCmd:"CommandPackage.file"
	});

	let URL=require("url");
	let PATH=require("path");

	let fileNameCompleter=function(fh,line)
	{
		let addition=PATH.join(line+"dirt","..");
		if(addition!==".")
		{
			line=line.substr(addition.length+1).toLowerCase();
			return fh.ls(addition).then(r=>r.filter(function(a){return a.toLowerCase().indexOf(line)==0}).map(function(a){return PATH.join(addition,a)}));
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

	let download=µ.Class(COM.CommandPackage,
	{
		patch:function()
		{
			this.mega();
			let fileCmd=this.getFileCmd();
			if(fileCmd)
			{
				let completer=function(line)
				{
					return fileNameCompleter(fileCmd.fh,line);
				}
				this.commands.download.completer=completer;
				this.commands.downloadList.completer=completer;
			}
		},
		commands: {
			download:function(line)
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
			downloadList:function(source)
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
			}
		},
		download:async function(url,filename)
		{
			let target;

			if(filename)
			{
				target=new SC.File(filename);
				try
				{
					target.exists();
					return target.getName()+" exists";
				}
				catch(e){}
			}

			let protocol=require(URL.parse(url).protocol.slice(0,-1)||"http");
			return await new Promise((resolve,reject)=>
			{
				protocol.get(url,(response)=>
				{
					let filesize=null;
					if("content-length" in response.headers) filesize=response.headers["content-length"];

					let p;
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
						target=new SC.File(filename);
						p=SC.util.findUnusedName(target);
					}
					else
					{
						p=Promise.resolve();
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
					response.on("error",reject)
					.on("end",()=>
					{
						clearInterval(timer);
						date.setTime(Date.now()-startTime);
						let message=getTimeString(date);
						resolve(getTimeString(date)+" complete");
					});
					p.then(()=>target.writeStream())
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
			});
		},
		downloadList:async function(source)
		{
			let startTime=Date.now();
			source=new SC.File(this.getCWD()).changePath(source);
			let list=JSON.parse(await source.read());
			for(let i=0;i<list.length;i++)
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
			return getTimeString(new Date(Date.now()-startTime))+" all complete";
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
			let patches=SC.Patch.getPatches(this.instance,SC.FileCmd);
			if(patches.length>0) return patches[0];
			return null;
		},
		getCWD:function()
		{
			let fileCmd=this.getFileCmd();
			if(fileCmd) return fileCmd.getAbsolutePath();
			return process.cwd();
		}
	});
	SMOD("CommandPackage.download",download);
	
})(Morgas,Morgas.setModule,Morgas.getModule,Morgas.hasModule,Morgas.shortcut);