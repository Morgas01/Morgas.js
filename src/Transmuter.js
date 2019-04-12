(function(µ,SMOD,GMOD,HMOD,SC){

	//SC=SC({});

	/**
	 * Transmutes data between versions
	 */
	let Transmuter=µ.Transmuter=µ.Class({
		/**
		 * {Object.<String,Object.<String,Function>>} (transmutations) - map of transmutes; mapping indicates {fromVersion:{toVersion:transmutation}}
		 * {Function} (versionDetector) - returns version of single argument
		 * {String} (currentVersion)
		 */
		constructor:function({transmutations={},versionDetector,currentVersion})
		{
			this.transmutations=transmutations;
			this.versionDetector=versionDetector;
			this.currentVersion=currentVersion;
		},
		addTransmutation(from,to,transmutation)
		{
			if(!this.transmutations[from])this.transmutations[from]={};
			this.transmutations[from][to]=transmutation;
		},
		getTransmutation(from,to)
		{
			if(!this.transmutations[from]) return undefined;
			return this.transmutations[from][to];
		},
		async transmute(from,to,data)
		{
			let transmutation=this.getTransmutation(from,to);
			if(transmutation)
			{
				return await transmutation.call(this,data);
			}
			let path=this.lookUp(from,to);
			for(let i=0;i<path.length-1;i++)
			{
				let from=path[i],to=path[i+1];
				let step=this.getTransmutation(from,to);
				data=await step.call(this,data);
				if(data==null) µ.logger.warn(`#Transmuter:001 data became ${data} in step ${from}=>${to}`);
			}
			return data;
		},
		lookUp(from,to)
		{
			if(!this.transmutations[from]) throw new RangeError("#Transmuter:002 no transmutations for version "+from);
			let todo=[[from]];
			let shortestPath=null;
			while(todo.length>0)
			{
				let path=todo.shift();
				let current=path[path.length-1];
				if(!this.transmutations[current]) continue;
				if(this.transmutations[current][to])
			 	{
			 		path.push(to);
			 		if(!shortestPath||shortestPath.length>path.length)
			 		{
			 			shortestPath=path;
			 		}
			 		continue;
			 	}
			 	for(let nextStep of Object.keys(this.transmutations[current]))
			 	{
			 		if(path.includes(nextStep)) continue; // do not cycle
			 		todo.push(path.concat(nextStep));
			 	}
			}
			if(!shortestPath) throw new RangeError("#Transmuter:003 no path between versions "+from+" and "+to);
			let transmutationSteps=[];
			return shortestPath;
		},
		async transmuteTo(to,data)
		{
			if(!this.versionDetector) throw new ReferenceError("#Transmuter:004 no versionDetector defined");
			let from=await this.versionDetector(data);
			return await this.transmute(from,to,data);
		},
		async transmuteFrom(from,data)
		{
			if(this.currentVersion==undefined) throw new ReferenceError("#Transmuter:005 no currentVersion defined");
			return await this.transmute(from,this.currentVersion,data);
		},
		async transmuteCurrent(from,data)
		{
			if(this.currentVersion==undefined) throw new ReferenceError("#Transmuter:006 no currentVersion defined");
			return await this.transmuteTo(this.currentVersion,data);
		}
	});

	SMOD("Transmuter",Transmuter);

})(Morgas,Morgas.setModule,Morgas.getModule,Morgas.hasModule,Morgas.shortcut);