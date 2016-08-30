(function(µ,SMOD,GMOD,HMOD,SC){
	
	µ.NodeJs=µ.NodeJs||{};
	
	var PATCH=GMOD("Patch");
	var readline = require('readline');
	
	SC=SC({
		prom:"Promise"
	});
	
	var COM=µ.NodeJs.Commander=µ.Class({
		init:function(commandPackages)
		{
			commandPackages=commandPackages||[];
			commandPackages.unshift("exit");
			
			this.commands={};
			this.prompt=">";
			this.rl = readline.createInterface({
				input: process.stdin,
				output: process.stdout,
				completer:(line,cb)=>
				{
					if(line.length===0)cb(null,[Object.keys(this.commands).sort(),line]);
					else
					{
						var rtn=[];
						var match=line.match(/((\S+)\s+)(.*)/);
						if(!match)
						{
							rtn=Object.keys(this.commands).filter(function(a){return a.indexOf(line)==0})
							.map(function(a){return a+" ";}).sort();
						}
						else if ([match[2]] in this.commands&&"completer" in this.commands[match[2]])
						{
							var cmd=this.commands[match[2]];
							rtn=cmd.completer.call(cmd.scope,match[3])//.map(function(a){return match[1]+a});
							line=match[3];
						}
						if(SC.prom.isThenable(rtn))
						{
							rtn.then(result=>[result,line],function(e)
							{
								µ.logger.error(e);
								return [[],line];
							}).then(r=>cb(null,r));
						}
						else cb(null,[rtn,line]);
					}
				}
			});
			var closed=false;
			this.rl.on("line",line=>
			{
				var match=line.match(/(\S+)\s*(.*)/);
				if(match&&match[1] in this.commands)
				{
					var cmd=this.commands[match[1]];
					try
					{
						cmd.call(cmd.scope,match[2]);
					}
					catch (e)
					{
						µ.logger.error(e.message);
						µ.logger.error(e.stack);
					}
					if(!closed){this.rl.setPrompt(this.prompt);this.rl.prompt()};
				}
				else
				{
					//TODO
					var cmd=match&&match[1]||line;
					µ.logger.log("unknown command "+cmd);
					if(!closed){this.rl.setPrompt(this.prompt);this.rl.prompt()};
				}
			})
			.on("close",function(){closed=true})
			.on("pause",function(){closed=true})
			.on("resume",function(){closed=false});
			
			for(var i=0;i<commandPackages.length;i++)
			{
				if(HMOD("CommandPackage."+commandPackages[i]))
				{
					var pack=GMOD("CommandPackage."+commandPackages[i]);
					new pack(this);
				}
			}
			if(!closed){this.rl.setPrompt(this.prompt);this.rl.prompt()};
		},
		subCommander:function(name,commander)
		{
			//TODO
		}
	});
	COM.Packages={};
	SMOD("Commander",COM);
	
	COM.CommandPackage=µ.Class(PATCH,{
		//patchID:"CommandPackageName",		//abstract CommandPackage
		commands:{},
		patch:function()
		{
			for(var c in this.commands)
			{
				this.commands[c].scope=this;
				if(c in this.instance.commands) µ.logger.warn("command name "+c+" is already used");
				else this.instance.commands[c]=this.commands[c];
			}
		},
		out:function(msg)
		{
			/* TODO
			this.instance.rl.write(msg+"\n");
			this.instance.rl.prompt();
			*/
			console.log(msg);
		},
		pause:function()
		{
			this.instance.rl.pause();
		},
		resume:function()
		{
			this.instance.rl.resume();
			this.instance.rl.setPrompt(this.instance.prompt);
			this.instance.rl.prompt()
		}
	});
	SMOD("CommandPackage",COM.CommandPackage);
	
	var EXIT=µ.Class(COM.CommandPackage,
	{
		patchID:"exit",
		commands:{
			exit:function(line)
			{
				this.instance.rl.close();
			}
		}
	});
	SMOD("CommandPackage.exit",EXIT);
	
})(Morgas,Morgas.setModule,Morgas.getModule,Morgas.hasModule,Morgas.shortcut);