(function(µ,SMOD,GMOD,HMOD){

	µ.NodeJs=µ.NodeJs||{};

	var fs=require("fs");

	var calcCRC32=GMOD("util.crc32");
	
	var FH=µ.NodeJs.FileHelper=µ.Class({
		regexLike:/^\/((?:[^\/]||\\\/)+)\/([gimy]*)$/,
		extractChecksum:/\[([0-9A-Z]{8})\]\..{3,4}$/,
		init:function(dir)
		{
			this.dir=dir||"./";
			this.selected=[];
		},
		ls:function()
		{
			return fs.readdirSync(this.dir);
		},
		changeDir:function(change)
		{
			this.selected.length=0;
			//TODO
		},
		_getFiles:function(pattern,files)
		{
			var t=false;
			if(pattern instanceof RegExp || (t=this.regexLike.test(pattern)) )
			{
				if(t)
				{
					var match=pattern.match(this.regexLike);
					if(match)pattern=new RegExp(match[1],match[2]);
					else return [];
				}
				console.log(pattern);
				return (files||this.ls()).filter(function(a){return pattern.test(a)});
			}
			else if (!pattern) return [];
			else
			{
				if(pattern==="empty")
				{
					//TODO
				}
				else if (pattern==="noCRC")
				{
					//TODO
				}
				else return (files||this.ls()).filter(function(a){return a.indexOf(pattern)==0});
			}
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
			var rtn=[];
			for(var i=0;i<this.selected.length;i++)
			{
				var file=this.selected[i].replace(pattern,replacement)
				if(file!==this.selected[i])
				{
					rtn.push([this.selected[i],file]);
					fs.renameSync(this.dir+"/"+this.selected[i],this.dir+"/"+file);
					
					var fileIndex=this.files.indexOf(this.selected[i]);
					this.files[fileIndex]=this.selected[i]=file;
				}
			}
			return rtn;
		},
		calcCRC:function(filename)
		{
			return calcCRC32(fs.readFileSync(this.dir+filename)).toString(16).toUpperCase();
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
		"delete":function()
		{
			
		}
	});
	SMOD("FileHelper",FH);
	
})(Morgas,Morgas.setModule,Morgas.getModule,Morgas.hasModule);