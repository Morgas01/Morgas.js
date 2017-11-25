(function(µ,SMOD,GMOD,HMOD,SC){

	µ.NodeJs=µ.NodeJs||{};

	let FS=require("fs");
	let PATH=require("path");
	
	SC=SC({
		prom:"Promise",
		File:"File",
		util:"File.util",
		crc:"util.crc32",
		uni:"uniquify"
	});
	
	let regexLike=/^\/((?:[^\/]||\\\/)+)\/([gimy]*)$/;
	let extractChecksum=/.*[\[\(]([0-9a-fA-F]{8})[\)\]]/;
	let splitFiles=/^(.+).(\d{5}).(.+).(part)$/;
	let convertRegex=function(pattern)
	{
		if(pattern instanceof RegExp || !regexLike.test(pattern)) return pattern;
		else
		{
			let match=pattern.match(regexLike);
			return new RegExp(match[1],match[2]);
		}
	};
	
	let asyncCallback=function(signal)
	{
		return function(err,result)
		{
			if(err) signal.reject(err);
			else signal.resolve(result);
		};
	};
	
	let FH=µ.NodeJs.FileHelper=µ.Class({
		constructor:function(dir)
		{
			this.file=new SC.File(dir||"./");
			this.file.getAbsolutePath(); //implicit set absolute path
			this.selected=[];
			SC.prom.pledgeAll(this,["_getFiles"]);
		},
		getAbsolutePath:function()
		{
			return this.file.getAbsolutePath();
		},
		ls:function(addition)
		{
			let listFile=this.file;
			if(addition) listFile=this.file.clone().changePath(addition);
			
			return listFile.listFiles();
		},
		changeDirectory:function(dir)
		{
			let oldDir=this.file.getAbsolutePath();
			return this.file.changePath(dir).stat().then(stat=>
			{
				if(stat.isDirectory()) this.selected.length=0;
				else this.file.changePath(oldDir);
				return this;
			},
			e=>{
				this.file.changePath(oldDir);
				throw e;
			});
		},
		_getFiles:function(signal,pattern,files)
		{
			pattern=convertRegex(pattern);
			
			if (!pattern) return [];
			else if (pattern==="selected")
			{
				return this.selected;
			}
			else
			{
				let doFilter=function(files)
				{
					if(pattern==="all")					return files;
					else if(pattern==="noCRC")			return files.filter((a)=>!a.match(extractChecksum));
					else if(pattern instanceof RegExp)	return files.filter(function(a){return pattern.test(a)});
					else if(pattern==="empty")
					{
						let dir=this.dir;
						return Promise.all(files.map(f=>this.isEmpty(f).catch(()=>false)))
						.then(function(stats)
						{
							let rtn=[];
							for(let i=0;i<stats.length;i++)
							{
								if(stats[i]) rtn.push(files[i]);
							}
							return rtn;
						});
					}
					else
					{
						pattern=pattern.toLowerCase();
						return files.filter(function(a){return a.toLowerCase().indexOf(pattern)!==-1});
					}
				};
				
				if(files) signal.resolve(doFilter(files));
				else this.file.listFiles().then(doFilter).then(signal.resolve,signal.reject);
			}
		},
		isEmpty:function(fileName)
		{
			return this.File.clone().changePath(fileName).stat()
			.then(stat=> stat.size==0,µ.constantFunctions.t);
		},
		select:function(pattern)
		{
			return this._getFiles(pattern)
			.then(s=>this.selected=s);
		},
		selectAdd:function(pattern)
		{
			return this._getFiles(pattern)
			.then(s=>this.selected=this.selected.concat(s));
		},
		deselect:function(pattern)
		{
			return this._getFiles(pattern,this.selected)
			.then(d=>this.selected=this.selected.filter(function(a){return d.indexOf(a)==-1}));
		},
		rename:function(pattern,replacement,overwrite)
		{
			pattern=convertRegex(pattern)
			let rtn=[];
			return SC.prom.wrap(SC.prom.chain(this.selected,f=>
			{
				let r=f.replace(pattern,replacement);
				return this.file.clone().changePath(f).rename(r)
				.then(()=> [f,r],e=>[f,f,e]);
			}),this)
			.then(function(args)
			{
				this.selected=args.map(f=>f[1]);
				return args;
			});
		},
		calcCRC:function(progress)
		{
			return SC.prom.chain(this.selected,filename=>
			{
				let calcFile=this.file.clone().changePath(filename);
				return SC.util.calcCRC(calcFile,progress).then(crc=>[filename,crc],e=>[filename,e]);
			});
		},
		checkCRC:function(cb,progress)
		{
			return SC.prom.chain(this.selected,filename=>
			{
				let match=filename.match(extractChecksum);
				if(!match)
				{
					let result=[filename,null,null];
					if(cb) cb(result);
					return result;
				}
				return SC.util.calcCRC(this.file.clone().changePath(filename),progress)
				.then(crc=>
				{
					let result=[filename,crc===match[1].toUpperCase(),crc];
					if(cb)cb(result);
					return result;
				},µ.constantFunctions.pass);
			});
		},
		appendCRC:function(cb,progress)
		{
			return SC.prom.wrap(SC.prom.chain(this.selected,filename=>
			{
				let result;
				let match=filename.match(extractChecksum);
				if(match)
				{
					result=[filename, filename,"no change"];
					if(cb)cb(result);
					return result;
				}
				let appendFile=this.file.clone().changePath(filename);
				return SC.util.calcCRC(appendFile,progress)
				.then(crc=>
				{
					let rn=PATH.parse(filename);
					rn=rn.name+"["+crc+"]"+rn.ext;
					return appendFile.rename(rn).then(function()
					{
						result=[filename,rn,"added"];
						if(cb)cb(result);
						return result;
					});
				}).catch(function(error)
				{
					let result=[filename,filename,error]
					if(cb)cb(result);
					return result;
				});
			}),this)
			.then(function(args)
			{
				this.selected=args.map(f=>f[1]);
				return args;
			});
		},
		"delete":function()
		{
			let promise=SC.prom.chain(this.selected.slice(),filename=>this.file.clone()
				.changePath(filename)
				.remove()
				.then(()=>[filename],
				e=>
				{
					this.selected.push(filename);
					return [filename,e];
				})
			);
			this.selected.length=0;
			return promise;
		},
		moveToDir:function(dir)
		{
			let target=this.file.clone().changePath(dir)
			return SC.util.enshureDir(target)
			.then(()=>
			{
				let p= SC.prom.chain(this.selected.slice(),filename=>
					this.file.clone().changePath(filename).move(target).then(function(){return this.filePath})
				);
				this.selected.length=0;
				return p;
			});
		},
		//TODO fix dot between numbers
		cleanNames:function()
		{
			return SC.prom.wrap(SC.prom.chain(this.selected,filename=>
			{
				let name=filename;
		    	if((name.indexOf("%20")!==-1&&name.indexOf(" ")===-1)||(name.indexOf("%5B")!==-1&&name.indexOf("[")===-1))
		    		name=decodeURIComponent(name);
		    	name=name.replace(/_/g," ");
		    	name=name.replace(/(?:(\D)\.+|\.+(?=\D))(?=.*\.)/g,"$1 "); //keep dots between numbers and last one
		    	if(name===filename)
		    	{
		    		return [filename,name];
		    	}
		    	else
		    	{
		    		return this.file.clone().changePath(filename).rename(name).then(()=>[filename,name],e=>[filename,filename,e]);
		    	}
			}),this)
			.then(args=>
			{
				this.selected=args.map(f=>f[1]);
				return args;
			});
		},
		mergeParts:function(cb)
		{
			let selectedParts=SC.uni(this.selected.map(a=>a.match(splitFiles)).filter(µ.constantFunctions.pass),p=>p[1]);
			if(selectedParts.length>0)
			{
				return this._getFiles(splitFiles).then(allParts=>
				{
					return SC.prom.chain(selectedParts,part=>
					{
						let affectedParts=allParts.sort().filter(p=>p.indexOf(part[1])==0);
						return SC.prom.chain(affectedParts,aPart=>
							this.file.clone().changePath(aPart).readStream({encoding:"binary"})
							.then(stream=>{return{name:aPart,stream:stream}})
						,null,this)
						.then(function(args)
						{
							let target=part[1]+"."+part[3];
							return this.file.clone().changePath(target).writeStream({encoding:"binary"})
							.then(write=>
							{
								if(cb)cb(target+" :");
								return {
									name:target,
									read:args,
									write:write
								};
							});
						})
						.then(data=>
							SC.prom.chain(data.read,read=>
								new SC.prom(signal=>{

									if(cb)cb("\tstart\t"+read.name+"\t"+(i+1)+"/"+data.read.length);
									data.write.on("error",signal.reject);
									read.stream.on("error",signal.reject);
									read.stream.on("end",()=>
									{
										if(cb)cb("\tend\t"+read.name+"\t"+(i+1)+"/"+data.read.length);
										signal.resolve(read.name);
									});
									read.stream.pipe(data.write,{end:false});
								})
							)
							.then(()=>
								new SC.prom(signal =>
								{
									data.write.on("finish",()=>
									{
										signal.resolve([data.name,data.read.map(a=>a.name)]);
									});
									data.write.end();
								})
							)
						)
					});
				});
			}
			return SC.prom.resolve([]);
		}
	});
	FH.CRC_RegExp=extractChecksum;
	SMOD("FileHelper",FH);
	
})(Morgas,Morgas.setModule,Morgas.getModule,Morgas.hasModule,Morgas.shortcut);