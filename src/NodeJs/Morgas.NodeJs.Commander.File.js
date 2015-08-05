(function(µ,SMOD,GMOD,HMOD){
	
	var SC=GMOD("shortcut")({
		FH:"FileHelper"
	});

	var FS=require("fs");
	var PATH=require("path");
	
	var fileNameCompleter=function(line)
	{
		var addition=PATH.join(line+"dirt","..");
		if(addition!==".")
		{
			line=line.substr(addition.length+1);
			return this.fh.ls(addition).filter(function(a){return a.indexOf(line)==0}).map(function(a){return PATH.join(addition,a)});
		}
		else return ["empty","noCRC","selected"].concat(this.fh.ls()).filter(function(a){return a.indexOf(line)==0});
	};
	var selectedFileNameCompleter=function(line)
	{
		return ["empty","noCRC","selected"].concat(this.fh.selected).filter(function(a){return a.indexOf(line)==0});
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
	
	GMOD("ComPackFactory")("file",function()
	{
		this.mega();
		this.fh=new SC.FH();
		this.instance.prompt=this.fh.dir+">>";
	},{
		dir:function(){this.out(this.fh.dir)},
		ls:function(){
			this.out(this.fh.ls().join("\n"));
		},
		cd:(function()
		{
			var cmd=function(pattern){this.out(this.fh.changeDir(pattern).join("\n"))};
			cmd.completer=fileNameCompleter;
			return cmd;
		})(),
		select:(function()
		{
			var cmd=function(pattern){this.out(this.fh.select(pattern).join("\n"))};
			cmd.completer=fileNameCompleter;
			return cmd;
		})(),
		selected:function(){this.out(this.fh.selected.join("\n"));},
		deselect:(function()
		{
			var cmd=function(pattern){this.out(this.fh.deselect(pattern).join("\n"))};
			cmd.completer=fileNameCompleter;
			return cmd;
		})(),
		rename:function(line){
			var match=line.match(/(\/.*\/|".*")\s+(".*")/);
			if(!match)this.out('rename pattern replacement\n\tpattern:\t\/regex\/ or "string"\n\treplacement:\t"string"');
			else this.out(this.fh.rename(match[1],match[2]).map(function(a){return a.join("\t=>\t");}).join("\n"));
		},
		calcCRC:(function()
		{
			var cmd=function(filenName){this.out(this.fh.calcCRC(filenName));};
			cmd.completer=fileNameCompleter
			return cmd;
		})(),
		checkCRC:function(){
			this.out(this.fh.checkCRC().map(function(a){return (a[0]==null?"NONE":a[0]==false?"DIFFERENT":"OK")+"\t"+a[1];}).join("\n"));
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
		})()
	});
	
})(Morgas,Morgas.setModule,Morgas.getModule,Morgas.hasModule);