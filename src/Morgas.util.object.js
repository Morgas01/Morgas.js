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
			return index;
		},
		hasNext:function()
		{
			return this.keys!=null ? this.keys.length>0 : (this.backward ? this.index>=0 : this.index<this.source.length);
		},
		next:function()
		{
			if(this.keys!=null)
			{
				this.index=this.keys.shift();
			}
			else
			{
				this.index+=(this.backward ? -1 : 1);
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
			this.source=this.backward=this.keys=this.index=null;
			this.getIndex=this.next=µ.constantFunctions.ndef();
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
	that.iterateAsync=function(any,func,backward,isObject,scope)
	{
		if(!scope)
		{
			scope=window;
		}
		return new µ.Detached(function()
		{
			var it=new that.Iterator(any,backward,isObject);
			if(!it.hasNext())
			{
				this.complete();
			}
			else
			{
				setTimeout(function iterateStep()
				{
					func.call(scope,it.next());
					if(!it.hasNext())
					{
						this.complete();
					}
					else
					{
						setTimeout(iterateStep, 0);
					}
				},0)
			}
		});
	};
	/** iterateDetached
	 * As iterate but deferres the call of {func} with µ.Detached.
	 * May not be called in iterated order.
	 *
	 * If a Thenable (typeof rtn.then =="function") is returned 
	 * the next iteration waits for it to finish.
	 *
	 * throw an error to break the iteration.
	 *
	 * returns: µ.Detached
	 */
	that.iterateDetached=function(any,func,backward,isObject,scope)
	{
		var wait=[];
		that.iterate(any,function(obj,index)
		{
			var _scope=this;
			wait.push(new µ.Detached(function()
			{
				var rtn=func.call(_scope,obj,index);
				if(rtn&&typeof rtn.then =="function")
					return rtn;
				this.complete();
			}));
		},backward,isObject,scope);
		return new µ.Detached(wait);
	};
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
	 * Matches strictly (===) exept for null and RegExp.
	 * While null value is weakly matched (==) RegExp try to 
	 * strictly match an then returns .test()
	 *
	 * Match is performed recursively.
	 *
	 */
	that.equals=function(obj,pattern)
	{
		if(obj==null)
			return false;
		if(obj===pattern)
			return true;
		if(pattern instanceof RegExp)
			return pattern.test(obj);
		if(typeof pattern=="object")
		{
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