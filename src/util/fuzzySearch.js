(function(µ,SMOD,GMOD,HMOD,SC){

	let util=µ.util=µ.util||{};
	
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
	let FUZZ=util.fuzzySearch=function fuzzySearch(term,data,{
		threshold=0.1,
		scorers
	}={})
	{
		if(!scorers) scorers=[FUZZ.scoreFunctions.misc.query(term)];
		else scorers=[].concat(scorers);

		let rtn=[];
		for(let index=0;index<data.length;index++)
		{
			let entry=data[index];
			let score=FUZZ.score(entry,scorers);
			if(score<threshold) continue;

			rtn.push({
				data:entry,
				index:index,
				score:score
			});

		}
		rtn.sort(FUZZ.sortResults);
		return rtn;
	};
	FUZZ.scoreFunctions={
		string:{
			complete:function(term)
			{
				let regex=new RegExp(term,"igm");
				return function(data)
				{
					let matches=data.match(regex);
					if (!matches) return 0;
					return matches.length*term.length/data.length;
				};
			},
			wordOrder:function(words)
			{
				words=words.map(s=>s.toLowerCase());
				let regex=new RegExp(words.join("|"),"ig");
				return function(data)
				{
					let wordIndex=words.length-1;
					let count=0;
					let found=null;
					regex.lastIndex=0;
					while(count<words.length&&(found=regex.exec(data)))
					{
						let foundIndex=words.indexOf(found[0].toLowerCase());
						if(foundIndex==(wordIndex+1)%words.length)
						{
							count++;
						}
						wordIndex=foundIndex;
					}
					return count/words.length;
				};
			},
			words:function(words)
			{
				words=words.map(s=>s.toLowerCase());
				let regex=new RegExp(words.join("|"),"ig");
				return function(data)
				{
					regex.lastIndex=0;
					let toFind=words.slice();
					let found=null;
					while(toFind.length>0&&(found=regex.exec(data)))
					{
						let foundIndex=toFind.indexOf(found[0].toLowerCase());
						if (foundIndex!=-1) toFind.splice(foundIndex,1);
					}
					return 1-toFind.length/words.length;
				};
			},
		},
		object:{
			property:function(key,scorers)
			{
				return function(data)
				{
					if(data&&key in data) return FUZZ.score(data[key],scorers);
					return 0;
				}
			}
		},
		misc:{
			query:function(term)
			{
				term=term.trim();
				let words=term.split(/\s+/);
				let scorers=[
					FUZZ.scoreFunctions.string.complete(term),
					FUZZ.scoreFunctions.string.wordOrder(words),
					FUZZ.scoreFunctions.string.words(words)
				];

				let camelCaseWords=term.match(/(:?\b[a-z]|[A-Z])[a-z]*/g);
				if(camelCaseWords)
				{
					scorers.push(FUZZ.scoreFunctions.string.wordOrder(camelCaseWords));
					scorers.push(FUZZ.scoreFunctions.string.words(camelCaseWords));
				}
				return function(data)
				{
					return FUZZ.score(data,scorers);
				};
			},
			cache:function(scorers)
			{
				let cache=new WeakMap();
				return function(data)
				{
					if(!cache.has(data)) cache.set(data,FUZZ.score(data,scorers));
					return cache.get(data);
				};
			}
		}
	};
	FUZZ.score=function(data,scorers)
	{
		// shortcut for arrays with only 1 entry
		if(scorers.length==1) return scorers[0](data);

		let score=0;
		let totalWeight=0;
		for(let scorer of scorers)
		{
			let fn,weight;
			if(typeof scorer=="function")
			{
				fn=scorer;
				weight=1;
			}
			else
			{
				fn=scorer.fn;
				weight=scorer.weight||1;
			}
			score+=fn(data)*weight;
			totalWeight+=weight;
		}
		return score/totalWeight;
	};
	FUZZ.sortResults=function({score:score1},{score:score2})
	{
		return FUZZ.sortScore(score1,score2);
	};
	FUZZ.sortScore=function(score1,score2)
	{
		return score2-score1;
	};

	SMOD("fuzzySearch",FUZZ);
	
})(Morgas,Morgas.setModule,Morgas.getModule,Morgas.hasModule,Morgas.shortcut);