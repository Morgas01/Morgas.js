(function(µ,SMOD,GMOD,HMOD){
	
	µ.NodeJs=µ.NodeJs||{};
	
	var PATCH=µ.Patch;
	var readline = require('readline');
	
	var COM=µ.NodeJs.Commander=µ.Class({
		init:function(commandPackages)
		{
			commandPackages=commandPackages||[];
			
			commandPackages.unshift("exit");
			
			var self=this;
			this.commands={};
			this.rl = readline.createInterface({
				input: process.stdin,
				output: process.stdout,
				completer:function(line)
				{
					if(line.length===0)return [Object.keys(self.commands).sort(),line];
					var rtn=[];
					var match=line.match(/(\S+)\s+(.*)/);
					if(!match)
					{
						rtn=Object.keys(self.commands).filter(function(a){return a.indexOf(line)==0}).sort();
					}
					else if ([match[1]] in self.commands&&"completer" in self[match[1]])
					{
						var cmd=self.commands[match[1]];
						rtn=cmd.completer.call(cmd.scope,match[2]);
					}
					
					return [rtn,line];
				}
			});
			this.rl.on("line",function(line)
			{
				var match=line.match(/(\S+)\s*(.*)/);
				if(match&&match[1] in self.commands)
				{
					var cmd=self.commands[match[1]];
					return cmd.call(cmd.scope,match[2]);
				}
			});
			
			for(var i=0;i<commandPackages.length;i++)
			{
				new COM.Packages[commandPackages[i]](this);
			}
			this.rl.prompt();
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
				if(c in this.instance.commands) console.warn("command name "+c+" is already used");
				else this.instance.commands[c]=this.commands[c];
			}
		}
	});
	SMOD("CommandPackage",COM.CommandPackage);
	
	COM.CommandPackageFactory=function(name,init,commands)
	{
		var c={
			patchID:name,
			commands:commands
		};
		if(init)c.patch=init;
		COM.Packages[name]=µ.Class(COM.CommandPackage,c);
	};
	SMOD("ComPackFactory",COM.CommandPackageFactory);
	
	COM.CommandPackageFactory("exit", null, {
		exit:function(line)
		{
			this.instance.rl.close();
		}
	});
})(Morgas,Morgas.setModule,Morgas.getModule,Morgas.hasModule);