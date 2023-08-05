(function(µ,SMOD,GMOD,HMOD,SC){

	µ.NodeJs=µ.NodeJs||{};

	SC=SC({});


	let CommandPackage=µ.NodeJs.CommandPackage=µ.Class({
		[µ.Class.symbols.abstract]:true,
		[µ.Class.symbols.onExtend]:function(sub)
		{
			if (!("name" in sub.prototype )) throw new SyntaxError(`#CommandPackage:001 no name in prototype`);
		},
		constructor:function()
		{
			this.commander=null;
			this.commands=Object.assign({},this.commands);
		},
		_setCommander(commander) // called from commander
		{
			this.commander=commander;
		},
		commands:{},
		getCommands(){return Object.keys(this.commands)},
		completeCommand(name,line)
		{
			if(name in this.commands&&"completer" in this.commands[name])
			{
				return this.commands[name].completer.call(this,line);
			}
			return [];
		},
		executeCommand(name,argumentString)
		{
			let command=this.commands[name];
			let fn=null;
			if(typeof command==="function") fn=command;
			else fn=command.fn;
			return fn.call(this,argumentString);
		},
		out(...msg)
		{
			return this.commander.out(...msg);
		},
		pause()
		{
			this.commander.pause();
		},
		resume()
		{
			this.commander.resume();
		}
	});

	CommandPackage.createCommand=function(fn,completer)
	{
		return {fn,completer};
	}
	SMOD("CommandPackage",CommandPackage);

})(Morgas,Morgas.setModule,Morgas.getModule,Morgas.hasModule,Morgas.shortcut);