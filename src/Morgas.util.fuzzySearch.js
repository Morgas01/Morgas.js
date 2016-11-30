(function(µ,SMOD,GMOD,HMOD,SC){

	var util=µ.util=µ.util||{};
	
	//SC=SC({});

	/**
	 * @typedef {object} fuzzySearchResult
	 * @property {String} data
	 * @property {Number} index - former index in array
	 * @property {Number[]} score
	 */
	/**
	 *
	 * @param {String} search
	 * @param {String[]} data
	 * @returns {fuzzySearchResult[]}
	 */
	 var FUZZ=util.fuzzySearch=function fuzzySearch(search,data)
	{
		var scorer=FUZZ.scoreFunction(search);
		return data.map(function(d,i)
		{
			return {
				data:d,
				index:i,
				score:scorer(d)
			};
		})
		.sort(function(a,b)
		{
			return FUZZ.sortScore(a.score,b.score);
		});
	};
	FUZZ.scoreFunction=function(search)
	{
		search=search.replace(/([.*+?^${}()|[\]\\])/g,"\\$1")
		var regexs=[
			new RegExp(search,"ig"), //whole string
			new RegExp(search.trim().split(/\s+/).join(".*"),"ig"), // all words in order
			new RegExp(search.replace(/[A-Z]/g,s=>s+"[a-z]*").trim().split(/\s+/).join(".*"),"ig"), // all camel case words in order
			new RegExp(search.trim().split(/\s+/).join("|"),"ig"), // words
			new RegExp(search.replace(/[A-Z]/g,s=>s+"[a-z]*").trim().split(/\s+/).join("|"),"ig"), // camel case words
		];

		return function(data)
		{
			var rtn=[];

			for (var r of regexs)
			{
				var score=0;
				while(r.exec(data))
				{
					score++;
				}
				rtn.push(score);
			}
			return rtn;
		};
	};
	FUZZ.sortScore=function(score1,score2)
	{
		var rtn=0;
		for(var i=0;i<score1.length&&rtn==0;i++) rtn=score2[i]-score1[i];
		return rtn;
	}

	SMOD("fuzzySearch",FUZZ);
	
})(Morgas,Morgas.setModule,Morgas.getModule,Morgas.hasModule,Morgas.shortcut);