(function(µ,SMOD,GMOD,HMOD,SC){
	
	var COM=GMOD("Commander");
	
	SC=SC({
		FH:"FileHelper",
		rs:"rescope"
	});

	var FS=require("fs");
	var PATH=require("path");
	
	var callAsync=function(cmd)
	{
		return function()
		{
			this.pause();
			cmd.apply(this,arguments)
			.catch(µ.constantFunctions.pass)
			.then(result=>
			{
				this.out(result);
				this.resume();
			});
		};
	};
	var fileNameCompleter=function(line)
	{
		var addition=PATH.join(line+"dirt","..");
		if(addition!==".")
		{
			line=line.substr(addition.length+1).toLowerCase();
			return this.fh.ls(addition).then(r=>r.filter(function(a){return a.toLowerCase().indexOf(line)==0}).map(function(a){return PATH.join(addition,a)}));
		}
		else
		{
			line=line.toLowerCase();
			return this.fh.ls().then(r=>["all","empty","noCRC","selected"].concat(r).filter(function(a){return a.toLowerCase().indexOf(line)==0}));
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
		var root=this.fh.file.filePath;
		return this.fh.ls(addition).then(r=>r
			.filter(a=>a.indexOf(line)==0&&FS.statSync(PATH.resolve(root,addition,a)).isDirectory())
			.map(a=>PATH.join(addition,a)+PATH.sep)
		);
	};
	
	var FILE=µ.Class(COM.CommandPackage,
	{
		patchID:"file",
		patch:function()
		{
			this.mega();
			SC.rs.all(this,["progressOutput"]);
			this.fh=new SC.FH();
			this.instance.prompt=this.fh.file.filePath+">>";
		},
		commands: {
			ls:callAsync(function(addition){return this.fh.ls(addition).then(o=>o.join("\n"))}),
			cd:(function()
			{
				var cmd=callAsync(function(dir)
				{
					return this.fh.changeDirectory(dir)
					.then(()=>{this.instance.prompt=this.fh.file.filePath+">>";})
				});
				cmd.completer=pathCompleter;
				return cmd;
			})(),
			select:(function()
			{
				var cmd=callAsync(function(pattern){return this.fh.select(pattern).then(o=>o.join("\n"))});
				cmd.completer=fileNameCompleter;
				return cmd;
			})(),
			selectAdd:(function()
			{
				var cmd=callAsync(function(pattern){return this.fh.selectAdd(pattern).then(o=>o.join("\n"))});
				cmd.completer=fileNameCompleter;
				return cmd;
			})(),
			deselect:(function()
			{
				var cmd=callAsync(function(pattern){return this.fh.deselect(pattern).then(o=>o.join("\n"))});
				cmd.completer=selectedFileNameCompleter;
				return cmd;
			})(),
			selected:function(){this.out(this.fh.selected.join("\n"));},
			rename:function(line){
				var match=line.match(/(?:(\/.*\/[gimy]*)|"(.*)")\s+"(.*)"/);
				if(!match)this.out('rename pattern replacement\n\tpattern:\t\/regex\/ or "string"\n\treplacement:\t"string"');
				else callAsync(function()
				{
					return this.fh.rename(match[1]||match[2],match[3]).then(r=>r.map(a=>a.join("\t=>\t")).join("\n"));
				}).call(this);
			},
			calcCRC:callAsync(function()
			{
				return this.fh.calcCRC(this.progressOutput).then(o=>o.map(r=>r.join("\t")).join("\n"))
			}),
			checkCRC:callAsync(function()
			{
				return this.fh.checkCRC(a=>this.out((a[2]==null?"NONE\t\t":a[1]==false?"DIFFERENT\t"+a[2]:"OK\t\t")+"\t"+a[0]),this.progressOutput).then(o=>"");
			}),
			appendCRC:callAsync(function()
			{
				return this.fh.appendCRC(a=>this.out(a.join("\t=>\t")),this.progressOutput).then(o=>"");
			}),
			"delete":(function()
			{
				var cmd=callAsync(function(pattern){return this.fh["delete"]().then(o=>o.map(r=>r.join("\t")).join("\n"))});
				cmd.completer=fileNameCompleter;
				return cmd;
			})(),
			moveToDir:(function()
			{
				var cmd=callAsync(function(dir){return this.fh.moveToDir(dir).then(o=>o.join("\n"))});
				cmd.completer=pathCompleter;
				return cmd;
			})(),
			
			cleanNames:callAsync(function()
			{
				return this.fh.cleanNames().then(r=>r.map(a=>a.join("\t=>\t")).join("\n"));
			}),
			mergeParts:callAsync(function(pattern){return this.fh.mergeParts(this.out).then(r=>r.map(a=>a.join("\t=>\t")).join("\n"));})
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