(function(µ,SMOD,GMOD,HMOD,SC){
	
	µ.NodeJs=µ.NodeJs||{};

	let readline = require('readline');
	let UTIL = require('util');

	SC=SC({
		Promise:"Promise",
		register:"register",
		es:"errorSerializer"
	});
	
	let COM=µ.NodeJs.Commander=µ.Class({
		constructor:function({
			commandModules=["CommandPackage/exit"],
			commandPackages=[],
			prompt=">",
			input=process.stdin,
			output=process.stdout
		})
		{
			this.packages=new Map();
			this.commandRegister=SC.register(1,()=>[]);

			this.prompt=prompt;
			this.isClosed=false;
			this.isPaused=false;
			this.rl = readline.createInterface({
				input: input,
				output: output,
				completer:this.completeLine.bind(this)
			});
			this.rl.on("line",this.onLine.bind(this))
			.on("close",()=>this.isClosed=true)
			.on("pause",()=>this.isPaused=true)
			.on("resume",()=>this.isPaused=false);
			
			this.addCommandPackage(...commandPackages);
			this.loadCommandModule(...commandModules);

			this.resume();
		},
		completeLine(line,callback)
		{
			let rtn=[];
			if(line.length===0)rtn=Object.keys(this.commandRegister).map(a=>a+" ").sort();
			else
			{
				let match=line.match(/((\S+)\s+)(.*)/);
				if(!match)
				{
					rtn=Object.keys(this.commandRegister).filter(function(a){return a.indexOf(line)==0})
					.map(a=>a+" ");
				}
				else
				{
					let commandName=match[2];
					let argumentString=match[3];
					let packages=this.commandRegister[commandName];
					if(packages.length>1)
					{
						this.out(`command ${commandName} is not unique:`,packages.map(p=>p+":"+commandName).sort());
					}
					else
					{
						let package=this.packages.get(packages[0]);
						try
						{
							rtn=package.completeCommand(commandName,argumentString);
							line=argumentString;
						}
						catch (e)
						{
							µ.logger.error(SC.es(e));
						}
					}
				}
			}
			Promise.resolve(rtn).then(result=>[result,line],function(e)
			{
				µ.logger.error(SC.es(e));
				return [[],line];
			})
			.then(r=>callback(null,r));
		},
		onLine(line)
		{
			let match=line.match(/(\S+)\s*(.*)/);
			if(match&&match[1] in this.commandRegister)
			{
				let commandName=match[1];
				let argumentString=match[2];
				//TODO explicit package notation:  "package:command args"
				let packages=this.commandRegister[commandName];
				if(packages.length>1)
				{
					this.out(`command ${commandName} is not unique:`,packages.map(p=>p+":"+commandName).sort());
					return;
				}
				let package=this.packages.get(packages[0]);
				this.pause();
				new SC.Promise(package.executeCommand,{scope:package,args:[commandName,argumentString],simple:true})
				.catch(e=>
				{
					µ.logger.error(SC.es(e));
				})
				.then(result=>
				{
					if(result!=null) this.out(result);
					this.resume();
				});
			}
			else
			{
				//TODO
				let cmd=match&&match[1]||line;
				this.out("unknown command "+cmd);
				if(!(this.isClosed&&!this.isPaused)){this.rl.setPrompt(this.prompt);this.rl.prompt()};
			}
		},
		loadCommandModule(...modules)
		{
			for(let module of modules)
			{
				if(HMOD(module))
				{
					let commandPackage=GMOD(module);
					this.addCommandPackage(new commandPackage());
				}
				else
				{
					µ.logger.error(`could not load CommandModule ${module}`);
				}
			}
		},
		addCommandPackage(...packages)
		{
			for(let package of packages)
			{
				if(this.packages.has(package.name))
				{
					µ.logger.warn("#Commander:001 "+package.name+" already ind this commander");
					continue
				}
				this.packages.set(package.name,package);
				package._setCommander(this);

				for(let command of package.getCommands())
				{
					if(command.includes(":"))
					{
						µ.logger.error(`#Commander:002 commmand "${command}" contains invalid character ":"`);
					}
					this.commandRegister[command].push(package.name);
				}
			}
		},
		getCommandPackage(name)
		{
			return this.packages.get(name);
		},
		setPrompt(prompt=this.prompt)
		{
			this.prompt=prompt
			if(!this.isClosed&&!this.isPaused)this.rl.setPrompt(this.prompt);
		},
		out(...msg)
		{
			/* TODO
			this.rl.write(UTIL.inspect(msg,{
				compact:false,
				colors:true,
				depth:5,
			})+"\n");
			this.rl.prompt();
			/*/
			console.log(...msg);
			//*/
		},
		pause()
		{
			this.rl.pause();
		},
		resume:function()
		{
			if(!this.isClosed)
			{
				this.rl.resume();
				this.rl.setPrompt(this.prompt);
				this.rl.prompt()
			}
		},
		close()
		{
			this.rl.close();
		}
	});
	COM.Packages={};
	SMOD("Commander",COM);
	
})(Morgas,Morgas.setModule,Morgas.getModule,Morgas.hasModule,Morgas.shortcut);