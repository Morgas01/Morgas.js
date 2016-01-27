(function(µ,SMOD,GMOD,HMOD,SC){
	
	var COM=GMOD("Commander");
	
	SC=SC({
		FH:"FileHelper",
		rs:"rescope"
	});

	var FS=require("fs");
	var PATH=require("path");
	
	var fileNameCompleter=function(line)
	{
		var addition=PATH.join(line+"dirt","..");
		if(addition!==".")
		{
			line=line.substr(addition.length+1).toLowerCase();
			return this.fh.ls(addition).filter(function(a){return a.toLowerCase().indexOf(line)==0}).map(function(a){return PATH.join(addition,a)});
		}
		else
		{
			line=line.toLowerCase();
			return ["all","empty","noCRC","selected"].concat(this.fh.ls()).filter(function(a){return a.toLowerCase().indexOf(line)==0});
		}
	};
	var selectedFileNameCompleter=function(line)
	{
		return ["all","empty","noCRC","selected"].concat(this.fh.selected).filter(function(a){return a.indexOf(line)==0});
	};
	var pathCompleter=function(line)
	{
		var addition=PATH.join(line+"dirt","..");
		if(addition!==".")line=line.substr(addition.length+1);
		else addition="";
		var root=this.fh.dir;
		return this.fh.ls(addition).filter(function(a)
		{
			return a.indexOf(line)==0&&FS.statSync(PATH.resolve(root,addition,a)).isDirectory();
		}).map(function(a){return PATH.join(addition,a)+PATH.sep});
	};
	
	var FILE=µ.Class(COM.CommandPackage,
	{
		patchID:"file",
		patch:function()
		{
			this.mega();
			SC.rs.all(this,["progressOutput"]);
			this.fh=new SC.FH();
			this.instance.prompt=this.fh.dir+">>";
		},
		commands: {
			dir:function(){this.out(this.fh.dir)},
			ls:function(){
				this.out(this.fh.ls().join("\n"));
			},
			cd:(function()
			{
				var cmd=function(pattern)
				{
					this.fh.changeDir(pattern);
					this.instance.prompt=this.fh.dir+">>";
				};
				cmd.completer=pathCompleter;
				return cmd;
			})(),
			select:(function()
			{
				var cmd=function(pattern){this.out(this.fh.select(pattern).join("\n"))};
				cmd.completer=fileNameCompleter;
				return cmd;
			})(),
			selectAdd:(function()
			{
				var cmd=function(pattern){this.out(this.fh.selectAdd(pattern).join("\n"))};
				cmd.completer=fileNameCompleter;
				return cmd;
			})(),
			deselect:(function()
			{
				var cmd=function(pattern){this.out(this.fh.deselect(pattern).join("\n"))};
				cmd.completer=fileNameCompleter;
				return cmd;
			})(),
			selected:function(){this.out(this.fh.selected.join("\n"));},
			rename:function(line){
				var match=line.match(/(?:(\/.*\/[gimy]*)|"(.*)")\s+"(.*)"/);
				if(!match)this.out('rename pattern replacement\n\tpattern:\t\/regex\/ or "string"\n\treplacement:\t"string"');
				else this.out(this.fh.rename(match[1]||match[2],match[3]).map(function(a){return a.join("\t=>\t");}).join("\n"));
			},
			calcCRC:(function()
			{
				var cmd=function(filenName)
				{
					this.pause();
					this.fh.calcCRC(filenName,this.progressOutput).always((result)=>
					{
						this.out(result);
						this.resume()
					});
				};
				cmd.completer=fileNameCompleter
				return cmd;
			})(),
			checkCRC:function(){
				this.pause()
				this.fh.checkCRC(a=>this.out((a[2]==null?"NONE\t\t":a[2]==false?"DIFFERENT\t"+a[1]:"OK\t\t")+"\t"+a[0]),this.progressOutput)
				.always(()=>this.resume());
			},
			appendCRC:function()
			{
				this.pause()
				this.fh.appendCRC(a=>this.out(a.join("\t=>\t")),this.progressOutput).always(()=>this.resume());
			},
			"delete":(function()
			{
				var cmd=function(pattern){this.out(this.fh["delete"](pattern).join("\n"))};
				cmd.completer=fileNameCompleter;
				return cmd;
			})(),
			moveToDir:(function()
			{
				var cmd=function(dir){this.fh.moveToDir(dir)};
				cmd.completer=pathCompleter;
				return cmd;
			})(),
			
			cleanNames:function(){this.out(this.fh.cleanNames().join("\n"))},
			mergeParts:function(){this.out(this.fh.mergeParts().join("\n"))}
		},
		progressOutput:function(value,max)
		{
			this.instance.rl.output.cursorTo(0);
			this.instance.rl.write((value*100/max).toFixed(2)+"%");
			this.instance.rl.clearLine(1);
			this.instance.rl.output.moveCursor(0,-1);
		}
	});
	SMOD("CommandPackage.file",FILE);
	
})(Morgas,Morgas.setModule,Morgas.getModule,Morgas.hasModule,Morgas.shortcut);