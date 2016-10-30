(function(µ,SMOD,GMOD,HMOD,SC){

	µ.NodeJs=µ.NodeJs||{};
	var util=µ.NodeJs.util=µ.NodeJs.util||{};


	module.exports=function(options,args)
	{
		var rtn={};
		if(!args) args=process.argv.slice();
		next:for(var o in options)
		{
			var names=options[o].names||[o];
			for(var n=0;n<names.length;n++)
			{
				var index=args.indexOf(names[n]);
				if(index!==-1)
				{
					switch(options[o].type)
					{
						case "number":
							try
							{
								rtn[o]=parseFloat(args[index+1]);
								args.splice(index,2);
							} catch (e){µ.logger.warn(e)}
							break;
						case "boolean":
							rtn[o]=true;
							args.splice(index,1);
							break;
						case "json":
							try
							{
								rtn[o]=JSON.parse(args[index+1]);
								args.splice(index,2);
							} catch (e){µ.logger.warn(e)}
							break;
						default:
							rtn[o]=args[index+1]
							args.splice(index,2);
							break
					}
					continue next;
				}
			}
			rtn[o]=options[o].type!=="boolean"&&options[o].value;
		}
		return rtn;
	};


})(Morgas,Morgas.setModule,Morgas.getModule,Morgas.hasModule,Morgas.shortcut);
