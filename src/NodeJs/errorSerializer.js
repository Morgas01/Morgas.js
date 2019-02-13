(function(µ,SMOD,GMOD,HMOD,SC){

	µ.NodeJs=µ.NodeJs||{};


	module.exports=µ.NodeJs.errorSerializer=function(error)
	{
		if(error instanceof Error)
			return {
				name:error.name,
				message:error.message,
				stack:error.stack,
				toString()
				{
					return JSON.stringify(this,null,"\t");
				}
			};
		return error
	};

})(Morgas,Morgas.setModule,Morgas.getModule,Morgas.hasModule,Morgas.shortcut);
