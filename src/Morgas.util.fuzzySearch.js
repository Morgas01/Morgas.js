(function(µ,SMOD,GMOD,HMOD,SC){

	var util=µ.util=µ.util||{};
	
	//SC=SC({});

	/**
	 * @typedef {object} fuzzySearchResult
	 * @property {String} data
	 * @property {Number} index - former idex in array
	 * @property {Number[]} score
	 */
	/**
	 *
	 * @param {String} search
	 * @param {String[]} data
	 * @returns {fuzzySearchResult[]}
	 */
	util.fuzzySearch=function fuzzySearch(search,data)
	{
		var regexs=[
			new RegExp(search,"ig"), //whole string
			new RegExp(search.trim().split(/\s+/).join(".*"),"ig"), // all words in order
			new RegExp(search.replace(/[A-Z]/g,s=>s+"[a-z]*").trim().split(/\s+/).join(".*"),"ig"), // all camel case words in order
			new RegExp(search.trim().split(/\s+/).join("|"),"ig"), // words
			new RegExp(search.replace(/[A-Z]/g,s=>s+"[a-z]*").trim().split(/\s+/).join("|"),"ig"), // camel case words
		];

		return data.map(function(d,i)
		{
			var rtn={
				data:d,
				index:i,
				score:[]
			};
			for (var r of regexs)
			{
				var score=0;
				while(r.exec(d))
				{
					score++;
				}
				rtn.score.push(score);
			}
			return rtn;
		})
			.sort(function(a,b)
			{
				var rtn=0;
				for(var i=0;i<regexs.length&&rtn==0;i++) rtn=b.score[i]-a.score[i];
				return rtn;
			});
	};
	util.fuzzySearch.scoreFunction

	SMOD("fuzzySearch",util.fuzzySearch);
	
})(Morgas,Morgas.setModule,Morgas.getModule,Morgas.hasModule,Morgas.shortcut);