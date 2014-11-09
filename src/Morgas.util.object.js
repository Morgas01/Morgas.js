(function(µ,SMOD,GMOD){
	 /**
	 * Depends on	: Morgas
	 * Uses			: 
	 *
	 * Array & Object helper
	 *
	 */
	var util=µ.util=µ.util||{};
	
	//shortcut
	var SC=GMOD("shortcut")({
		DET:"Detached"
	});
	
	var that=util.object={};
	/** goPath
	 * Goes the {path} from {obj} checking all but last step for existance.
	 * 
	 * goPath(obj,"path.to.target") == obj.path.to.target
	 */
	that.goPath=function(obj,path)
	{
		var todo=path;
		if(typeof todo=="string")
			todo=todo.split(".");
		
		while(todo.length>0&&obj!=null)
		{
			obj=obj[todo.shift()];
		}
		return obj;
	};
	
	/** createIterator
	 * Creates an iterator for {any} in {backward} order.
	 * {isObject} declares {any} as a Map or Array. 
	 */
	that.createIterator=function* (any,backward,isObject)
	{
		if(any.length>0&&!isObject)
		{
			for(var i=(backward?any.length-1:0);i>=0&&i<any.length;i+=(backward?-1:1))
			{
				yield {value:any[i],key:i,isObject:false};
			}
		}
		else
		{
			var k=Object.keys(any);
			if(backward)
			{
				k.revert();
			}
			for(var i=0;i<k.length;i++)
			{
				yield {value:any[k[i]],key:k[i],isObject:true};
			}
		}
	};
	/** iterate
	 * Iterates over {any} calling {func} with {scope} in {backward} order.
	 * {isObject} declares {any} as an Object with a length property.
	 * 
	 * returns Array of {func} results
	 */
	that.iterate=function(any,func,backward,isObject,scope)
	{
		var rtn=[];
		if(!scope)
		{
			scope=window;
		}
		if(any.length>0&&!isObject)
		{
			for(var i=(backward?any.length-1:0);i>=0&&i<any.length;i+=(backward?-1:1))
			{
				rtn.push(func.call(scope,any[i],i,false));
			}
		}
		else
		{
			var k=Object.keys(any);
			if(backward)
			{
				k.revert();
			}
			for(var i=0;i<k.length;i++)
			{
				rtn.push(func.call(scope,any[k[i]],k[i],true));
			}
		}
		return rtn;
	};
	/** iterateAsync
	 * As iterate but puts a timeout between the iteration steps
	 * 
	 * returns: µ.Detached
	 */
	that.iterateAsync=function(any,func,backward,isObject,scope,chunk)
	{
		if(!scope)
		{
			scope=window;
		}
		if(!chunk)
		{
			chunk=that.iterateAsync.chunk;
		}
		return new SC.DET(function()
		{
			var signal=this;
			var it=new that.createIterator(any,backward,isObject);
			var interval=setInterval(function iterateStep()
			{
				try
				{
					var step=it.next();
					for(var i=0;i<chunk&&!step.done;i++,step=it.next())
					{
						func.call(scope,step.value,step.key);
					}
					if(step.done)
					{
						signal.complete();
						clearInterval(interval);
					}
				}
				catch (e)
				{
					signal.error(e);
				}
			},0)
		});
	};
	that.iterateAsync.chunk=1E4;
	
	/** find
	 * Iterates over {source}.
	 * Returns an Array of {pattern} matching values 
	 */
	that.find=function(source,pattern,onlyValues)
	{
		var rtn=[];
		that.iterate(source,function(value,index)
		{
			if(that.equals(value,pattern))
			rtn.push(onlyValues?value:{value:value,index:index});
		});
		return rtn;
	};
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
	that.equals=function(obj,pattern)
	{
		if(obj===pattern)
			return true;
		if(obj===undefined||obj===null)
			return false;
		if(pattern instanceof RegExp)
			return pattern.test(obj);
		if(typeof pattern==="function")
		{
			if(typeof obj==="function")
				return false;
			else
				return pattern(obj);
		}
		if(typeof pattern==="object")
		{
			if(typeof obj!=="object"&&Array.isArray(pattern))
				return pattern.indexOf(obj)!==-1;

			for(var i in pattern)
			{
				if(!that.equals(obj[i],pattern[i]))
					return false;
			}
			return true;
		}
		return false;
	};
	
	/** uniquify
	 * Creates a copy of {arr} without duplicates.
	 * Values will be converted into strings via {fn}(value)
	 * or value+"" to create an ID.
	 */
	that.uniquify=function(arr,fn)
	{
		var values={};
		for(var i=0;i<arr.length;i++)
		{
			var id=arr[i];
			if(fn)
			{
				id=fn(id);
			}
			values[id]=arr[i];
		}
		if(fn)
		{
			var rtn=[];
			for(var i in values)
			{
				rtn.push(values[i]);
			}
			return rtn;
		}
		else
		{
			return Object.keys(values);
		}
	};
	
	/**
	 * set input values from object
	 * path in object is defined by data-path attribute
	 * key in object is defined by data-field attribute
	 * @param inputs[] input Nodes
	 * @param {object} source
	 */
	that.setInputValues=function(inputs,source)
	{
		for(var i=0;i<inputs.length;i++)
		{
			var path=(inputs[i].dataset.path||"")+inputs[i].dataset.field;
			var value=that.goPath(source, path);
			if(inputs[i].type==="checkbox")
			{
				inputs[i].checked=!!value;
			}
			else
			{
				inputs[i].value=value;
			}
		}
	};

	/**
	 * collect input values into object
	 * path in object is defined by data-path attribute
	 * key in object is defined by data-field attribute
	 * @param inputs[] input Nodes
	 * @param {object} target
	 */
	that.getInputValues=function(inputs,target)
	{
		for(var i=0;i<inputs.length;i++)
		{
			var t=target;
			if(inputs[i].dataset.path)
			{
				t=that.goPath(t, inputs[i].dataset.path);
			}
			if(t!==null)
			{
				if(inputs[i].type==="checkbox")
				{
					t[inputs[i].dataset.field]=inputs[i].checked;
				}
				else
				{
					t[inputs[i].dataset.field]=inputs[i].value;
				}
			}
		}
	};
	
	SMOD("goPath",that.goPath);
	SMOD("Iterator",that.Iterator);
	SMOD("iterate",that.iterate);
	SMOD("iterateAsync",that.iterateAsync);
	SMOD("find",that.find);
	SMOD("equals",that.equals);
	SMOD("uniquify",that.uniquify);
	SMOD("setInputValues",that.setInputValues);
	SMOD("getInputValues",that.getInputValues);
	
})(Morgas,Morgas.setModule,Morgas.getModule);