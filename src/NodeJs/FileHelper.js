(function(µ,SMOD,GMOD,HMOD,SC){

	µ.NodeJs=µ.NodeJs||{};

	var FS=require("fs");
	var PATH=require("path");
	
	SC=SC({
		prom:"Promise",
		itAs:"iterateAsync",
		File:"File",
		util:"File.util",
		crc:"util.crc32",
		uni:"uniquify"
	});
	
	var regexLike=/^\/((?:[^\/]||\\\/)+)\/([gimy]*)$/;
	var extractChecksum=/.*[\[\(]([0-9a-fA-F]{8})[\)\]]/;
	var splitFiles=/^(.+).(\d{5}).(.+).(part)$/;
	var convertRegex=function(pattern)
	{
		if(pattern instanceof RegExp || !regexLike.test(pattern)) return pattern;
		else
		{
			var match=pattern.match(regexLike);
			return new RegExp(match[1],match[2]);
		}
	};
	
	var asyncCallback=function(signal)
	{
		return function(err,result)
		{
			if(err) signal.reject(err);
			else signal.resolve(result);
		};
	};

	var calcCRC=function(file,progress)
	{
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
	
	var FH=µ.NodeJs.FileHelper=µ.Class({
		init:function(dir)
		{
			this.file=new SC.File(dir||"./");
			this.file.getAbsolutePath(); //implicit set absolute path
			this.selected=[];
			SC.prom.pledgeAll(this,["_getFiles"]);
		},
		ls:function(addition)
		{
			var listFile=this.file;
			if(addition) listFile=this.file.clone().changePath(addition);
			
			return listFile.listFiles();
		},
		changeDirectory:function(dir)
		{
			var oldDir=this.file.getAbsolutePath();
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
				var doFilter=function(files)
				{
					if(pattern==="all")					return files;
					else if(pattern==="noCRC")			return files.filter((a)=>!a.match(extractChecksum));
					else if(pattern instanceof RegExp)	return files.filter(function(a){return pattern.test(a)});
					else if(pattern==="empty")
					{
						var dir=this.dir;
						return SC.prom.always(files.map(f=>this.isEmpty(f)).then(function()
						{
							var rtn=[];
							for(var i=0;i<arguments.length;i++)
							{
								if(arguments[i]) rtn.push(files[i]);
							}
							return rtn;
						}));
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
			var rtn=[];
			return new SC.itAs(this.selected,(i,f)=>
			{
				var r=f.replace(pattern,replacement);
				return this.file.clone().changePath(f).rename(r)
				.then(()=> [f,r],e=>[f,f,e]);
			},null,this)
			.then(function(args)
			{
				this.selected=args.map(f=>f[1]);
				return args;
			});
		},
		calcCRC:function(progress)
		{
			return SC.itAs(this.selected,function(index,filename)
			{
				var calcFile=this.file.clone().changePath(filename);
				return calcCRC(calcFile,progress).then(crc=>[filename,crc],e=>[filename,e]);
			},null,this);
		},
		checkCRC:function(cb,progress)
		{
			return SC.itAs(this.selected,function(index,filename)
			{
				var match=filename.match(extractChecksum);
				if(!match)
				{
					var result=[filename,null,null];
					if(cb) cb(result);
					return result;
				}
				return calcCRC(this.file.clone().changePath(filename),progress)
				.then(crc=>
				{
					var result=[filename,crc===match[1].toUpperCase(),crc];
					if(cb)cb(result);
					return result;
				},µ.constantFunctions.pass);
			},null,this);
		},
		appendCRC:function(cb,progress)
		{
			return SC.itAs(this.selected,function(index,filename)
			{
				var result;
				var match=filename.match(extractChecksum);
				if(match)
				{
					result=[filename, filename,"no change"];
					if(cb)cb(result);
					return result;
				}
				var appendFile=this.file.clone().changePath(filename);
				return calcCRC(appendFile,progress)
				.then(crc=>
				{
					var rn=PATH.parse(filename);
					rn=rn.name+"["+crc+"]"+rn.ext;
					return appendFile.rename(rn).then(function()
					{
						result=[filename,rn,"added"];
						if(cb)cb(result);
						return result;
					});
				}).catch(function(error)
				{
					var result=[filename,filename,error]
					if(cb)cb(result);
					return result;
				});
			},null,this)
			.then(function(args)
			{
				this.selected=args.map(f=>f[1]);
				return args;
			});
		},
		//TODO
		"delete":function()
		{
			var promise=SC.itAs(this.selected.slice(),(index,filename)=>this.file.clone().changePath(filename).remove()
				.then(()=>[filename],e=>
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
			var target=this.file.clone().changePath(dir)
			return SC.util.enshureDir(target)
			.then(()=>
			{
				var p= SC.itAs(this.selected.slice(),(index,filename)=>
					this.file.clone().changePath(filename).move(target).then(function(){return this.filePath})
				);
				this.selected.length=0;
				return p;
			});
		},
		//TODO
		cleanNames:function()
		{
			return SC.itAs(this.selected,(index,filename)=>
			{
				var name=filename;
		    	if((name.indexOf("%20")!==-1&&name.indexOf(" ")===-1)||(name.indexOf("%5B")!==-1&&name.indexOf("[")===-1))
		    		name=decodeURIComponent(name);
		    	name=name.replace(/_/g," ");
		    	name=name.replace(/([\d\.]+)(?=[\.\d])|\.(?![^\.]+$)/g,($0,$1)=>$1||" "); //keep dots between numbers and last one
		    	if(name===filename)
		    	{
		    		return [filename,name];
		    	}
		    	else
		    	{
		    		return this.file.clone().changePath(filename).rename(name).then(()=>[filename,name],e=>[filename,filename,e]);
		    	}
			})
			.then(args=>
			{
				this.selected=args.map(f=>f[1]);
				return args;
			});
		},
		mergeParts:function(cb)
		{
			var selectedParts=SC.uni(this.selected.map(a=>a.match(splitFiles)).filter(µ.constantFunctions.pass),p=>p[1]);
			if(selectedParts.length>0)
			{
				return this._getFiles(splitFiles).then(allParts=>
				{
					return SC.itAs(selectedParts,(i,part)=>
					{
						var affectedParts=allParts.sort().filter(p=>p.indexOf(part[1])==0);
						return SC.itAs(affectedParts,(i,aPart)=>
							this.file.clone().changePath(aPart).readStream({encoding:"binary"})
							.then(stream=>{return{name:aPart,stream:stream}})
						,null,this)
						.then(function(args)
						{
							var target=part[1]+"."+part[3];
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
							SC.itAs(data.read,(i,read)=>
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
					},this);
				});
			}
			return SC.prom.resolve([]);
		}
	});
	SMOD("FileHelper",FH);
	
})(Morgas,Morgas.setModule,Morgas.getModule,Morgas.hasModule,Morgas.shortcut);