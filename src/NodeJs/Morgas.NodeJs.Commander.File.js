(function(µ,SMOD,GMOD,HMOD){
	
	var SC=GMOD("shortcut")({
		FH:"FileHelper"
	});
	
	GMOD("ComPackFactory")("file",function()
	{
		this.mega();
		this.fh=new SC.FH();
	},{
		ls:function(){
			this.out(this.fh.ls().join("\n"));
		},
		select:function(pattern){
			this.out(this.fh.select(pattern).join("\n"));
		},
		selected:(function()
		{
			var cmd=function(){this.out(this.fh.selected.join("\n"));};
			cmd.completer=function(line){return ["empty","noCRC"].filter(function(a){return a.indexOf(line)!=0;});};
			return cmd;
		})(),
		deselect:function(pattern){
			this.out(this.fh.deselect(pattern).join("\n"));
		},
		rename:function(line){
			var match=line.match(/(\/.*\/|".*")\s+(".*")/);
			if(!match)this.out('rename pattern replacement\n\tpattern:\/regex\/ or "string"\n\treplacement:"string"');
			else this.out(this.fh.rename(match[1],match[2]).map(function(a){return a.join("\t=>\t");}).join("\n"));
		},
		calcCRC:(function()
		{
			var cmd=function(filenName){this.out(this.fh.calcCRC(filenName));};
			cmd.completer=function(line)
			{
				return this.fh.ls().filter(function(a){return a.indexOf(line)==0})
			};
			return cmd;
		})(),
		checkCRC:function(){
			this.out(this.fh.checkCRC().map(function(a){return (a[0]==null?"NONE":a[0]==false?"DIFFERENT":"OK")+"\t"+a[1];}).join("\n"));
		},
		"delete":function(){
			this.out(this.fh.ls().join("\n"));
		},
	});
	
})(Morgas,Morgas.setModule,Morgas.getModule,Morgas.hasModule);