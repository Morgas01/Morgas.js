(function(µ,SMOD,GMOD,HMOD,SC){

	var util=µ.util=µ.util||{};
	var uObj=util.object=util.object||{};

	/** equals
	 * Matches {obj} against {pattern}.
	 * Returns: Boolean
	 *
	 * Matches strictly (===) and RegExp, function, Array, and Object.
	 * 
	 * RegExp: try to match strictly match and
	 * then return pattern.test(obj)
	 * 
	 * function: try to match strictly match and
	 * then if obj is not a function test it with
	 * the pattern function and return its result
	 *
	 * Array: try to match strictly match and
	 * then return pattern.indexOf(obj)!==-1
	 *
	 * Object: recurse.
	 *
	 */
	uObj.equals=function(obj,pattern)
	{
		if(obj===pattern||(Number.isNaN(obj)&&Number.isNaN(pattern)))
			return true;
		if(pattern instanceof RegExp)
		{
			if( typeof obj==="string") return pattern.test(obj);
			else if(pattern instanceof RegExp) return obj.toString()==pattern.toString();
		}
		if(typeof pattern==="function")
		{
			if(typeof obj==="function")
				return false;
			else
				return pattern(obj);
		}
		if(obj==null) return false;
		if(typeof obj.equals==="function")
        {
            return obj.equals(pattern);
        }
		if(typeof pattern==="object")
		{
			if(pattern==null) return false;
            if(typeof obj!=="object"&&Array.isArray(pattern))
            {
				return pattern.indexOf(obj)!==-1;
            }
			for(var i in pattern)
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
		var unset=function unset(value)
		{
			return value==null;
		};
		unset.toString=unset.toJSON=()=>"[unset]";
		return unset;
	};
	uObj.equals.not=function(pattern)
	{
		var not=function not(value)
		{
			return !uObj.equals(value,pattern);
		};
		not.toString=not.toJSON=()=>"[not]"+uObj.equals.patternToString(pattern);
		return not;
	};
	uObj.equals.greater=function(pattern)
	{
		var greater=function greater(value)
		{
			return value>pattern;
		};
		greater.toString=greater.toJSON=()=>"[greater]"+uObj.equals.patternToString(pattern);
		return greater;
	};
	uObj.equals.greaterEqual=function(pattern)
	{
		var greaterEqual=function greaterEqual(value)
		{
			return value>=pattern;
		};
		greaterEqual.toString=greaterEqual.toJSON=()=>"[greaterEqual]"+uObj.equals.patternToString(pattern);
		return greaterEqual;
	};
	uObj.equals.less=function(pattern)
	{
		var less=function less(value)
		{
			return value<pattern;
		};
		less.toString=less.toJSON=()=>"[less]"+uObj.equals.patternToString(pattern);
		return less;
	};
	uObj.equals.lessEqual=function(pattern)
	{
		var lessEqual=function lessEqual(value)
		{
			return value<=pattern;
		};
		lessEqual.toString=lessEqual.toJSON=()=>"[lessEqual]"+uObj.equals.patternToString(pattern);
		return lessEqual;
	};
	uObj.equals.between=function(min,max)
	{
		var pattern;
		if(Array.isArray(min))
		{
			pattern=min;
			min=pattern[0];
			max=pattern[1];
		}
		else pattern=[min,max];
		var between=function between(value)
		{
			return min<value&&value<max;
		};
		between.toString=between.toJSON=()=>"[between]"+uObj.equals.patternToString(pattern);
		return between;
	};
	uObj.equals.betweenInclude=function(min,max)
	{
		var pattern;
		if(Array.isArray(min))
		{
			pattern=min;
			min=pattern[0];
			max=pattern[1];
		}
		else pattern=[min,max];
		var betweenInclude=function betweenInclude(value)
		{
			return min<=value&&value<=max;
		};
		betweenInclude.toString=betweenInclude.toJSON=()=>"[betweenInclude]"+uObj.equals.patternToString(pattern);
		return betweenInclude;
	};

	var patternToJSON=function(pattern)
	{
		if (pattern==null) return pattern;
		else if(Number.isNaN(pattern)) return "[Number.NaN]";
		else if (pattern===Number.NEGATIVE_INFINITY) return "[Number.NEGATIVE_INFINITY]";
		else if (pattern===Number.POSITIVE_INFINITY) return "[Number.POSITIVE_INFINITY]";
		else if (Array.isArray(pattern)) return Array.prototype.map.call(pattern,patternToJSON);
		else
		{
			switch(typeof pattern)
			{
				case "function":
					return pattern.toString();
				case "object":
					var rtn={};
					for(var key in pattern) rtn[key]=patternToJSON(pattern[key]);
					return rtn;
				default:
					return pattern;
			}
		}
	};

	uObj.equals.patternToString=function(pattern)
	{
		return JSON.stringify(patternToJSON(pattern));
	}
	var parseRegex=/^\[([^\]]+)\](.*)/;
	var patternFromJSON=function(pattern)
	{
		if(typeof pattern==="string")
		{
			var match=pattern.match(parseRegex);
			if(match)
			{
				var fn=match[1],value=match[2];
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
				var rtn={};
				for(var key in pattern) rtn[key]=patternFromJSON(pattern[key]);
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