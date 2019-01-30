(function(µ,SMOD,GMOD,HMOD,SC){

	let CommandPackage=GMOD("CommandPackage");

	SC=SC({});

	let EXIT=µ.Class(CommandPackage,
	{
		name:"exit",
		commands:{
			exit:function(line)
			{
				this.commander.close();
			}
		}
	});
	SMOD("CommandPackage/exit",EXIT);
	module.exports=EXIT;


})(Morgas,Morgas.setModule,Morgas.getModule,Morgas.hasModule,Morgas.shortcut);