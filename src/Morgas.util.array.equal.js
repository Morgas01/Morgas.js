(function(µ,SMOD,GMOD,HMOD,SC){

	var util=µ.util=µ.util||{};
	var utilArray=util.array=util.array||{};

	//SC=SC({});

	/**
	 * Compares each value of the arrays for equality ( like a[n]===b[n] , where n>=0 && n<=length)
	 * Arrays of different length are not equal
	 *
	 * @param {Any[]} a
	 * @param {Any[]} b
	 */
	utilArray.equal=function(a,b)
	{
		if(!a!=!b) return false;
		if(!a) return true; // both null
		if(a.length!=b.length) return false;
		for (let i=0;i<a.length;i++)
		{
			if(a[i]!==b[i]) return false;
		}
		return true;
	};
	SMOD("array.equal",utilArray.equal);

})(Morgas,Morgas.setModule,Morgas.getModule,Morgas.hasModule,Morgas.shortcut);