(function(µ,SMOD,GMOD,HMOD){

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
		extractChecksum:/\[([0-9A-Z]{8})\]\..{3,4}$/,
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
			else if(pattern==="empty")
			{
				//TODO
			}
			else if (pattern==="noCRC")
			{
				//TODO
			}
			else if (pattern==="selected")
			{
				return this.selected
			}
			else return (files||this.ls()).filter(function(a){return a.indexOf(pattern)==0});
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
			return GMOD("util.crc32")(FS.readFileSync(PATH.resolve(this.dir,filename))).toString(16).toUpperCase();
		},
		checkCRC:function()
		{
			rtn=[];
			for(var i=0;i<this.selected.length;i++)
			{
				var fileName=this.selected[i];
				var match=fileName.match(this.extractChecksum);
				if(match)
				{
					rtn.push[fileName,this.calcCRC(fileName)===match[1]];
				}
				else rtn.push[fileName,null];
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
		}
	});
	SMOD("FileHelper",FH);
	
})(Morgas,Morgas.setModule,Morgas.getModule,Morgas.hasModule);