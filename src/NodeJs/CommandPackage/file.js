(function(µ,SMOD,GMOD,HMOD,SC){
	
	let CommandPackage=GMOD("CommandPackage");
	
	SC=SC({
		FH:"FileHelper",
		rs:"rescope"
	});

	let FS=require("fs");
	let PATH=require("path");

	let fileNameKeywords=["all","empty","noCRC","selected"];

	let fileNameCompleter=function(line)
	{
		let addition=PATH.join(line+"dirt","..");
		if(addition!==".")
		{
			line=line.substr(addition.length+1).toLowerCase();
			return this.fh.ls(addition).then(r=>r.filter(function(a){return a.toLowerCase().indexOf(line)==0}).map(function(a){return PATH.join(addition,a)}));
		}
		else
		{
			line=line.toLowerCase();
			return this.fh.ls().then(r=>fileNameKeywords.concat(r).filter(function(a){return a.toLowerCase().indexOf(line)==0}));
		}
	};
	let selectedFileNameCompleter=function(line)
	{
		return fileNameKeywords.concat(this.fh.selected).filter(function(a){return a.indexOf(line)==0});
	};
	let pathCompleter=async function(line)
	{
		let parsedPath=PATH.parse(line);
		let addition=parsedPath.dir;
		line=parsedPath.base;
		let fileNames=await this.fh.ls(addition);
		let dirNames=[]
		await Promise.all(fileNames.map(async a=>
		{
			if(a.indexOf(line)!=0) return false;
			try
			{
				if((await this.fh.file.clone().changePath(addition,a).stat()).isDirectory())
				{
					dirNames.push(a);
				}
			}
			catch (e)
			{
				µ.logger.error(a,e);
				return false;
			}
		}))

		return dirNames.map(a=>PATH.join(addition,a)+PATH.sep);
	};
	
	let FileCommands=CommandPackage.file=µ.Class(CommandPackage,
	{
		name:"file",
		constructor:function()
		{
			this.mega();
			SC.rs.all(this,["progressOutput"]);
			this.fh=new SC.FH();
		},
		_setCommander(commander)
		{
			this.mega(commander);
			this.commander.prompt=this.getAbsolutePath()+">>";
		},
		commands: {
			ls:function(addition){return this.fh.ls(addition).then(o=>o.join("\n"))},
			cd:CommandPackage.createCommand(
				function(dir)
				{
					return this.fh.changeDirectory(dir)
					.then(()=>{this.commander.prompt=this.getAbsolutePath()+">>"})
				},
				pathCompleter
			),
			select:CommandPackage.createCommand(
				function(pattern){return this.fh.select(pattern).then(o=>o.join("\n"))},
				fileNameCompleter
			),
			selectAdd:CommandPackage.createCommand(
				function(pattern){return this.fh.selectAdd(pattern).then(o=>o.join("\n"))},
				fileNameCompleter
			),
			deselect:CommandPackage.createCommand(
				function(pattern){return this.fh.deselect(pattern).then(o=>o.join("\n"))},
				selectedFileNameCompleter
			),
			selected:function(){this.out(this.fh.selected.join("\n"));},
			rename:function(line){
				let match=line.match(/(?:(\/.*\/[gimy]*)|"(.*)")\s+"(.*)"/);
				if(!match)
				{
					this.out('rename pattern replacement\n\tpattern:\t\/regex\/ or "string"\n\treplacement:\t"string"');
				}
				else
				{
					return this.fh.rename(match[1]||match[2],match[3]).then(r=>r.map(a=>a.join("\t=>\t")).join("\n"));
				}
			},
			calcCRC:function()
			{
				return this.fh.calcCRC(this.progressOutput).then(o=>o.map(r=>r.join("\t")).join("\n"))
			},
			checkCRC:function()
			{
				return this.fh.checkCRC(a=>this.out((a[2]==null?"NONE\t\t":a[1]==false?"DIFFERENT\t"+a[2]:"OK\t\t")+"\t"+a[0]),this.progressOutput).then(o=>"");
			},
			appendCRC:function()
			{
				return this.fh.appendCRC(a=>this.out(a.join("\t=>\t")),this.progressOutput).then(o=>"");
			},
			"delete":CommandPackage.createCommand(
				function(pattern){return this.fh["delete"]().then(o=>o.map(r=>r.join("\t")).join("\n"))},
				fileNameCompleter,
			),
			moveToDir:CommandPackage.createCommand(
				function(dir){return this.fh.moveToDir(dir).then(o=>o.join("\n"))},
				pathCompleter
			),
			copyToDir:CommandPackage.createCommand(
				function(dir){return this.fh.copyToDir(dir).then(o=>o.join("\n"))},
				pathCompleter
			),
			cleanNames:function()
			{
				return this.fh.cleanNames().then(r=>r.map(a=>a.join("\t=>\t")).join("\n"));
			},
			mergeParts:function(pattern){return this.fh.mergeParts(this.out).then(r=>r.map(a=>a.join("\t=>\t")).join("\n"));}
		},
		getAbsolutePath:function()
		{
			return this.fh.getAbsolutePath();
		},
		progressOutput:function(value,max)
		{
			this.instance.rl.output.cursorTo(0);
			this.instance.rl.write((value*100/max).toFixed(2)+"%");
			this.instance.rl.clearLine(1);
			this.instance.rl.output.moveCursor(0,-1);
		},
		fileNameCompleter:fileNameCompleter,
		selectedFileNameCompleter:selectedFileNameCompleter,
		pathCompleter:pathCompleter
	});
	SMOD("CommandPackage/file",FileCommands);
	module.exports=FileCommands;
	
})(Morgas,Morgas.setModule,Morgas.getModule,Morgas.hasModule,Morgas.shortcut);