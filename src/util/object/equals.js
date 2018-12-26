(function(µ,SMOD,GMOD,HMOD,SC){

	let util=µ.util=µ.util||{};
	let uObj=util.object=util.object||{};

	//SC=SC({});

	/**
	 * @param {Any} obj
	 * @param {Any} pattern
	 * @Returns {Boolean}
	 *
	 * @summary Matches {obj} against {pattern}.
	 * @description
	 *	check order:
	 *
	 * 1. match strictly (===) and check NaN
	 * 2 of pattern is null (or undefined): false
	 * 3. if Pattern is a RegExp: pattern.test(obj)
	 * 3.1 if object is instance of RegExp match string representation
	 * 4. if Pattern is a Function and obj isn't: pattern(obj)
	 * 5. if pattern is an Array: check if it includes obj then check every sub pattern
	 * 6. if obj is null: false
	 * 7. if obj has a .equals Function: obj.equals(pattern)
	 * 8. if pattern is an Object: recurse for every key in pattern
	 *
	 */
	uObj.equals=function(obj,pattern)
	{
		if(obj===pattern||(Number.isNaN(obj)&&Number.isNaN(pattern)))
		{
			return true;
		}
		if(pattern==null) return false;
		if(pattern instanceof RegExp)
		{
			if( typeof obj==="string") return pattern.test(obj);
			else if(obj instanceof RegExp) return obj.toString()==pattern.toString();
			return false;
		}
		if(typeof pattern==="function")
		{
			if(typeof obj==="function") return false;
			else return pattern(obj);
		}
		if(Array.isArray(pattern))
		{
			if(pattern.includes(obj))
			{
				return true;
			}
			return pattern.findIndex(p=>uObj.equals(obj,p))!=-1;
		}
		if(obj==null) return false;
		if(typeof obj.equals==="function")
        {
            return obj.equals(pattern);
        }
		if(typeof pattern==="object")
		{
			for(let i in pattern)
			{
				if(!uObj.equals(obj[i],pattern[i]))
					return false;
			}
			return true;
		}
		return false;
	};
	/**
	 * creates a test for equals to pattern
	 * @param pattern
	 * @returns {Function}
	 */
	uObj.equals.test=function(pattern)
	{
		return function(obj)
		{
			return uObj.equals(obj,pattern);
		}
	};

	// logic
	uObj.equals["Number.NaN"]=()=>Number.NaN;
	uObj.equals["Number.NEGATIVE_INFINITY"]=()=>Number.NEGATIVE_INFINITY;
	uObj.equals["Number.POSITIVE_INFINITY"]=()=>Number.POSITIVE_INFINITY;
	uObj.equals.unset=function()
	{
		let unset=function unset(value)
		{
			return value==null;
		};
		unset.toString=unset.toJSON=()=>"[unset]";
		return unset;
	};
	uObj.equals.not=function(pattern)
	{
		let not=function not(value)
		{
			return !uObj.equals(value,pattern);
		};
		not.toString=not.toJSON=()=>"[not]"+uObj.equals.patternToString(pattern);
		return not;
	};
	uObj.equals.greater=function(pattern)
	{
		let greater=function greater(value)
		{
			return value>pattern;
		};
		greater.toString=greater.toJSON=()=>"[greater]"+uObj.equals.patternToString(pattern);
		return greater;
	};
	uObj.equals.greaterEqual=function(pattern)
	{
		let greaterEqual=function greaterEqual(value)
		{
			return value>=pattern;
		};
		greaterEqual.toString=greaterEqual.toJSON=()=>"[greaterEqual]"+uObj.equals.patternToString(pattern);
		return greaterEqual;
	};
	uObj.equals.less=function(pattern)
	{
		let less=function less(value)
		{
			return value<pattern;
		};
		less.toString=less.toJSON=()=>"[less]"+uObj.equals.patternToString(pattern);
		return less;
	};
	uObj.equals.lessEqual=function(pattern)
	{
		let lessEqual=function lessEqual(value)
		{
			return value<=pattern;
		};
		lessEqual.toString=lessEqual.toJSON=()=>"[lessEqual]"+uObj.equals.patternToString(pattern);
		return lessEqual;
	};
	uObj.equals.between=function(min,max)
	{
		let pattern;
		if(Array.isArray(min))
		{
			pattern=min;
			min=pattern[0];
			max=pattern[1];
		}
		else pattern=[min,max];
		let between=function between(value)
		{
			return min<value&&value<max;
		};
		between.toString=between.toJSON=()=>"[between]"+uObj.equals.patternToString(pattern);
		return between;
	};
	uObj.equals.betweenInclude=function(min,max)
	{
		let pattern;
		if(Array.isArray(min))
		{
			pattern=min;
			min=pattern[0];
			max=pattern[1];
		}
		else pattern=[min,max];
		let betweenInclude=function betweenInclude(value)
		{
			return min<=value&&value<=max;
		};
		betweenInclude.toString=betweenInclude.toJSON=()=>"[betweenInclude]"+uObj.equals.patternToString(pattern);
		return betweenInclude;
	};
	uObj.equals.containsOrdered=function(iterablePattern)
	{
		let length=iterablePattern.size||iterablePattern.length||0;

		let containsOrdered=function containsOrdered(value)
		{
			if(!value||!(Symbol.iterator in value)) return false;
			let valueLength=value.size||value.length||0;
			if(valueLength!=length) return false;
			let iterator=value[Symbol.iterator]();
			for(let pattern of iterablePattern)
			{
				let {done,value:entry}=iterator.next();
				if(done||!uObj.equals(entry,pattern)) return false;
			}
			return true;
		};
		containsOrdered.toString=containsOrdered.toJSON=()=>"[containsOrdered]"+uObj.equals.patternToString(iterablePattern);
		return containsOrdered;
	};

	let patternToJSON=function(pattern)
	{
		if (pattern==null) return pattern;
		else if(Number.isNaN(pattern)) return "[Number.NaN]";
		else if (pattern===Number.NEGATIVE_INFINITY) return "[Number.NEGATIVE_INFINITY]";
		else if (pattern===Number.POSITIVE_INFINITY) return "[Number.POSITIVE_INFINITY]";
		else if (Array.isArray(pattern)) return pattern.map(patternToJSON);
		else
		{
			switch(typeof pattern)
			{
				case "function":
					return pattern.toString();
				case "object":
					let rtn={};
					for(let key in pattern) rtn[key]=patternToJSON(pattern[key]);
					return rtn;
				default:
					return pattern;
			}
		}
	};

	uObj.equals.patternToString=function(pattern)
	{
		return JSON.stringify(patternToJSON(pattern,function(key,value)
		{
			if(value instanceof RegExp) return value.toString();
			if(value instanceof Set) return Array.from(value);
			return value;
		}));
	}
	let parseRegex=/^\[([^\]]+)\](.*)/;
	let patternFromJSON=function(pattern)
	{
		if(typeof pattern==="string")
		{
			let match=pattern.match(parseRegex);
			if(match)
			{
				let fn=match[1],value=match[2];
				if(value!=="")
				{
					value=JSON.parse(value);
					if(parseRegex.test(value)) value=patternFromJSON(value);
				}
				if(fn in uObj.equals) return uObj.equals[fn](value);
				else throw new SyntaxError("unknown equals function: "+fn);
			}
		}
		else if (typeof pattern==="object")
		{
			if(pattern===null) return null;
			else if (Array.isArray(pattern)) return pattern.map(patternFromJSON);
			else
			{
				let rtn={};
				for(let key in pattern) rtn[key]=patternFromJSON(pattern[key]);
				return rtn;
			}
		}
		return pattern;
	};
	uObj.equals.stringToPattern=function(patternString)
	{
		return patternFromJSON(JSON.parse(patternString));
	};

	SMOD("equals",uObj.equals);
	
})(Morgas,Morgas.setModule,Morgas.getModule);