(function(µ,SMOD,GMOD,HMOD,SC){

	µ.NodeJs=µ.NodeJs||{};

	var FS=require("fs");
	var PATH=require("path");
	
	var regexLike=/^\/((?:[^\/]||\\\/)+)\/([gimy]*)$/;
	var convertRegex=function(pattern)
	{
		if(pattern instanceof RegExp || !regexLike.test(pattern)) return pattern;
		else
		{
			var match=pattern.match(regexLike);
			return new RegExp(match[1],match[2]);
		}
	}
	
	var FH=µ.NodeJs.FileHelper=µ.Class({
		extractChecksum:/[\[\(]([0-9A-Z]{8})[\)\]]\..{3,4}$/,
		init:function(dir)
		{
			this.dir=PATH.resolve(dir||"./");
			this.selected=[];
		},
		ls:function(addition)
		{
			if(addition)return FS.readdirSync(PATH.resolve(this.dir,addition));
			return FS.readdirSync(this.dir);
		},
		changeDir:function(dir)
		{
			this.selected.length=0;
			this.dir=PATH.resolve(this.dir,dir);
		},
		_getFiles:function(pattern,files)
		{
			pattern=convertRegex(pattern);
			if(pattern instanceof RegExp)
			{
				return (files||this.ls()).filter(function(a){return pattern.test(a)});
			}
			else if (!pattern) return [];
			else if(pattern==="all")
			{
				return files||this.ls();
			}
			else if(pattern==="empty")
			{
				var dir=this.dir;
				return (files||this.ls()).filter(function(a)
				{
					var s=FS.statSync(PATH.resolve(dir,a))
					return s&&s.size==0&&s.isFile()
				});
			}
			else if (pattern==="noCRC")
			{
				var hasCRC=this.extractChecksum;
				return (files||this.ls()).filter(function(a){return !a.match(hasCRC)});
			}
			else if (pattern==="selected")
			{
				return this.selected
			}
			else
			{
				pattern=pattern.toLowerCase()
				return (files||this.ls()).filter(function(a){return a.toLowerCase().indexOf(pattern)!==-1});
			}
		},
		isEmpty:function(fileName)
		{
			var size=FS.statSync(PATH.resolve(this.dir,fileName)).size;
			console.log("size:"+size);
			return size==0;
		},
		select:function(pattern)
		{
			return this.selected=this._getFiles(pattern);
		},
		selectAdd:function(pattern)
		{
			return this.selected=this.selected.concat(this._getFiles(pattern));
		},
		deselect:function(pattern)
		{
			var l=this._getFiles(pattern,this.selected);
			return this.selected=this.selected.filter(function(a){return l.indexOf(a)==-1});
		},
		rename:function(pattern,replacement)
		{
			pattern=convertRegex(pattern)
			var rtn=[];
			for(var i=0;i<this.selected.length;i++)
			{
				var file=this.selected[i].replace(pattern,replacement)
				if(file!==this.selected[i])
				{
					rtn.push([this.selected[i],file]);
					FS.renameSync(PATH.resolve(this.dir,this.selected[i]),PATH.resolve(this.dir,file));
					
					this.selected[i]=file;
				}
			}
			return rtn;
		},
		calcCRC:function(filename)
		{
			var csm=GMOD("util.crc32")(FS.readFileSync(PATH.resolve(this.dir,filename))).toString(16).toUpperCase();
			cms=("00000000"+csm).slice(-8);//fillup missing 0s
			return cms;
		},
		checkCRC:function(cb)
		{
			rtn=[];
			for(var i=0;i<this.selected.length;i++)
			{
				var fileName=this.selected[i];
				var match=fileName.match(this.extractChecksum);
				if(match)
				{
					var csm=this.calcCRC(fileName);
					rtn.push([fileName,csm,csm===match[1]]);
					if(cb)cb(rtn[rtn.length-1]);
				}
				else rtn.push([fileName,null,null]);
			}
			return rtn;
		},
		appendCRC:function()
		{
			rtn=[];
			for(var i=0;i<this.selected.length;i++)
			{
				var fileName=this.selected[i];
				var match=fileName.match(this.extractChecksum);
				if(!match)
				{
					var crc=this.calcCRC(fileName);
					var fext=PATH.extname(fileName);
					var newFileName=fileName.slice(0,-fext.length)+"["+crc+"]"+fext;
					FS.renameSync(PATH.resolve(this.dir,this.selected[i]),PATH.resolve(this.dir,newFileName));
					this.selected[i]=newFileName;
					rtn.push(newFileName);
				}
			}
			return rtn;
		},
		"delete":function(pattern)
		{
			if(pattern)this.select(pattern);
			for(var i=0;i<this.selected.length;i++)
			{
				FS.unlinkSync(PATH.resolve(this.dir,this.selected[i]));
			}
			var deleted=this.selected;
			this.selected=[];
			return deleted;
		},
		moveToDir:function(dir)
		{
			var target=PATH.resolve(this.dir,dir);
			try
			{
				FS.mkdirSync(target);
			}
			catch(e)
			{
				if(e.code!=="EEXIST")throw e;
			}
			for(var i=0;i<this.selected.length;i++)
			{
				FS.renameSync(PATH.resolve(this.dir,this.selected[i]),PATH.resolve(target,this.selected[i]));
			}
			this.selected.length=0;
		},
		
		cleanNames:function()
		{
			var rtn=[];
			for(var i=0;i<this.selected.length;i++)
			{
				var file=this.selected[i];
				var entry=[file];
				
				file=file.replace(/_/g," ");
				file=file.replace(/\.(?![^\.]+$)/g," ");
				if(file.indexOf("%20")!==-1) file=decodeURIComponent(file);
				if(file.match(/\[\d\]\./))
				{
					var originalName=file.replace(/\[\d\]\./,".");
					if(this._getFiles(originalName).length>0)
					{

						if(this._getFiles("empty",[originalName]).length>0)
						{
							FS.unlinkSync(PATH.resolve(this.dir,originalName));
							file=originalName;
							entry.push(" - is dublicate but original was empty");
						}
						else if(this._getFiles("empty",[this.selected[i]]).length>0)
						{
							FS.unlinkSync(PATH.resolve(this.dir,this.selected[i]));
							entry.push(" - is dublicate and empty");
							entry.push(" - delete");
							rtn=rtn.concat(entry);
							continue;
						}
						else entry.push(" - is dublicate but original was found");
					}
					else file=originalName;
				}
				
				if(file!==this.selected[i])
				{
					entry.push(" - rename to : "+file);
					rtn=rtn.concat(entry);
					FS.renameSync(PATH.resolve(this.dir,this.selected[i]),PATH.resolve(this.dir,file));
					this.selected[i]=file;
				}
			}
			return rtn
		},
		mergeParts:function()
		{
			var rtn=[];
			var selectedParts=this.selected.filter(function(a){return a.match(/\.part$/)});
			while(selectedParts.length>0)
			{
				var selectedPart=selectedParts.shift();
				var match=selectedPart.match(/^(.+).(\d{5}).(.+).(part)$/);
				var parts=this._getFiles(match[1]);
				var fileName=match[1]+"."+match[3];
				for(var p=0;p<parts.length;p++)
				{
					FS.appendFileSync(PATH.resolve(this.dir,fileName),FS.readFileSync(PATH.resolve(this.dir,parts[p])));
					var index=selectedParts.indexOf(parts[p]);
					if(index!==-1) selectedParts.splice(index,1);
				}
				
				rtn.push(fileName);
			}
			return rtn;
		}
	});
	SMOD("FileHelper",FH);
	
})(Morgas,Morgas.setModule,Morgas.getModule,Morgas.hasModule,Morgas.shortcut);