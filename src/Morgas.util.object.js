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
	var DET=GMOD("Detached");
	
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
	
	/** iterator
	 * Iterates stepwise over {any} in {backward} order.
	 * {isObject} declares {any} as an Object with a length property. 
	 */
	that.Iterator=µ.Class({
		init:function(any,backward,isObject)
		{
			this.source=any;
			this.backward=backward;
			
			this.index=undefined;
			this.keys=null;
			if(any.length==null||isObject)
			{
				this.keys=Object.keys(any);
				if(this.backward)
					this.keys.reverse();
			}
		},
		value:function()
		{
			if(this.index!==undefined)
			{
				return this.source[this.index];
			}
			return undefined;
		},
		getIndex:function()
		{
			return this.index;
		},
		hasNext:function()
		{
			if(this.keys!=null)
			{
				return this.keys.length>0;
			}
			else
			{
				if(this.index===undefined&&this.source.length>0)
				{
					return true;
				}
				else if (this.backward&&this.index>=0)
				{
					return true
				}
				else if(this.index<this.source.length)
				{
					return true;
				}
				else
				{
					return false;
				}
			}
		},
		next:function()
		{
			if(this.keys!=null)
			{
				this.index=this.keys.shift();
			}
			else
			{
				if(this.index===undefined)
				{
					this.index=(this.backward ? this.source.length-1 : 0);
				}
				else
				{
					this.index+=(this.backward ? -1 : 1);
				}
			}
			
			var rtn=this.value();
			
			if(!this.hasNext())
			{
				this.destroy();
			}
			
			return rtn;
		},
		destroy:function()
		{
			this.source=this.backward=this.keys=null;
			this.next=µ.constantFunctions.ndef;
			this.hasNext=µ.constantFunctions.f;
		}
	});
	/** iterate
	 * Iterates over {any} calling {func} with {scope} in {backward} order.
	 * {isObject} declares {any} as an Object with a length property.
	 */
	that.iterate=function(any,func,backward,isObject,scope)
	{
		if(!scope)
		{
			scope=window;
		}
		if(any.length>0&&!isObject)
		{
			for(var i=(backward?any.length-1:0);i>=0&&i<any.length;i+=(backward?-1:1))
			{
				func.call(scope,any[i],i);
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
				func.call(scope,any[k[i]],k[i]);
			}
		}
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
		return new DET(function()
		{
			var signal=this;
			var it=new that.Iterator(any,backward,isObject);
			if(!it.hasNext())
			{
				signal.complete();
			}
			else
			{
				var interval=setInterval(function iterateStep()
				{
					try
					{
						for(var i=0;i<chunk&&it.hasNext();i++)
						{
							func.call(scope,it.next(),it.getIndex());
						}
						if(!it.hasNext())
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
			}
		});
	};
	that.iterateAsync.chunk=1E4;
	
	/** find
	 * Iterates over {source}.
	 * Returns an Array of {pattern} matching values 
	 */
	that.find=function(source,pattern)
	{
		var rtn=[];
		that.iterate(source,function(value,index)
		{
			if(that.equals(value,pattern))
			rtn.push({value:value,index:index});
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
		if(!obj)
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
	
	SMOD("goPath",that.goPath);
	SMOD("Iterator",that.Iterator);
	SMOD("iterate",that.iterate);
	SMOD("iterateAsync",that.iterateAsync);
	SMOD("iterateDetached",that.iterateDetached);
	SMOD("find",that.find);
	SMOD("equals",that.equals);
	SMOD("uniquify",that.uniquify);
	
})(Morgas,Morgas.setModule,Morgas.getModule);