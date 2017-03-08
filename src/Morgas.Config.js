(function(µ,SMOD,GMOD,HMOD,SC){

	SC=SC({

	});


	var CONFIG=µ.Config=µ.Class({
		init:null,
		get:null,
		set:null,// (key,value)=>{} // (value)=>{}
		setDefault:function(def)
		{
			if(def!=null) this.default=def;
			else this.default=null;
		},
		reset:null,
		toJSON:null,
		toDescription:null
	});
	CONFIG.parse=function(desc,value)
	{
		if(typeof desc=="string") return new FIELD({type:desc},value);
		else if (Array.isArray(desc)) return new ARRAY({model:desc[0]},value);
		switch(desc.type)
		{
			case "object":
			case undefined:
				var defaults=desc.default;
				if("model" in desc) desc=desc.model;
				return new OBJECT(desc,defaults,value);
				break;
			case "map":
				return new MAP(desc,value);
				break;
			case "array":
				return new ARRAY(desc,value);
			case "string":
			case "boolean":
			case "number":
			case "select":
				return new FIELD(desc,value);
		}
	}
	SMOD("Config",CONFIG);

	var FIELD=CONFIG.Field=µ.Class(CONFIG,{
		init:function(param,value)
		{
			this.type=param.type;
			this.setDefault(param.default);
			this.pattern=null;
			if(typeof param.pattern == "string")
			{
				var match=param.pattern.match(/^\/(.+)\/(.*)$/);
				if(match) this.pattern=new RegExp(match[1],match[2])
				else this.pattern=new RegExp(param.pattern);
				this.pattern.toJSON=RegExp.prototype.toString;
			}
			else if (param.pattern) this.pattern=param.pattern;
			this.validate=param.validate||null;
			this.value=null;

			switch(this.type)
			{
				case "select":
					this.values=param.values;
					this.multiple=param.multiple||false;
					break;
				case "number":
					this.min=param.min;
					this.step=param.step;
					this.max=param.max;
			}

			if(value!==undefined) this.set(value);
			else this.reset();
		},
		get:function()
		{
			return this.value;
		},
		set:function(value)
		{
			if(arguments.length==2) value=arguments[1];

			if(this.isValid(value))
			{
				this.value=value
			}
			else
			{
				return false;
			}
			return true;
		},
		isValid:function(value)
		{
			return (this.type=="select"
				&& (
					this.multiple
					&& Array.isArray(value)
					&& value.every(v=>this.values.indexOf(v)!=-1) //All select values are valid
					||
					this.values.indexOf(value)!=-1 //select value is valid
				)
			)
			||
			(
				typeof value==this.type
				&& (!this.pattern || this.pattern.test(value))
				&& (!this.validate|| this.validate(value,this.value)) // type, pattern and validator ok
				&& (this.type!="number"||(
					(this.min==null||value>=this.min)
					&& (this.max==null||value<=this.max)
					&& (this.step==null||value%this.step==0)
					)
				)
			);
		},
		reset:function()
		{
			this.value=null;
			this.set(this.default);
		},
		toJSON:function()
		{
			return this.get();
		},
		toDescription:function()
		{
			var rtn={
				type:this.type,
				pattern:this.pattern,
				validate:this.validate,
				default:this.default
			};
			switch(this.type)
			{
				case "select":
					rtn.values=this.values;
					rtn.multiple=this.multiple;
					break;
				case "number":
					rtn.min=this.min;
					rtn.step=this.step;
					rtn.max=this.max;
			}
			return rtn;
		}
	});
	FIELD.TYPES=["string","boolean","number","select"];

	var CONTAINER=CONFIG.Container=µ.Class(CONFIG,{
		init:null,
		setAll:null,
		[Symbol.iterator]:null,
		get:function(key)
		{
			if(key!=null)
			{
				if(!Array.isArray(key))key=[key];
				for(var entry of this)
				{
					if(entry[0]==key[0])
					{
						if (key.length==1) return entry[1];
						else return entry[1].get(key.slice(1));
					}
				}
				return undefined;
			}
			return this.toJSON();
		},
		set:function(key,value)
		{
			if(arguments.length==1&&typeof key=="object")
			{
				this.setAll(key,true);
				return true;
			}
			if(!Array.isArray(key))key=[key];
			for(var entry of this)
			{
				if(entry[0]==key[0])return entry[1].set(key.slice(1),value);
			}
			return false;
		}
	});

	var OBJECT=CONTAINER.Object=µ.Class(CONTAINER,{
		init:function(configs,defaults,value)
		{
			this.configs=new Map();
			this.setDefault(defaults);
			if(configs)
			{
				this.addAll(configs);
			}
			this[Symbol.iterator]=this.configs.entries.bind(this.configs);

			if(value!==undefined) this.setAll(value,true);
		},
		addAll:function(configs)
		{
			var rtn={};
			for(var key in configs)
			{
				rtn[key]=this.add(key,configs[key]);
			}
			return rtn;
		},
		add:function(key,config)
		{
			if(!(config instanceof CONFIG))config=CONFIG.parse(config);
			if(config)
			{
				if(this.configs.has(key))
				{
					µ.logger.warn(new µ.Warning(String.raw`overwriting config in Object under key ${key}`,{
						old:this.configs.get(key),
						new:config
					}));
				}
				if(this.default && key in this.default) config.setDefault(this.default[key]);
				this.configs.set(key,config);
				return config;
			}
			return false;
		},
		remove:function(key)
		{
			if(key instanceof CONFIG)
			{
				for(var entry of this.configs.entries)
				{
					if(entry[1]==key)
					{
						key=entry[0];
						break;
					}
				}
			}
			var rtn=this.configs.get(key);
			this.configs.delete(key);
			return rtn;
		},
		setAll:function(configs,create)
		{
			for(var key in configs)
			{
				if(this.configs.has(key))
				{
					if(this.configs.get(key) instanceof CONTAINER)
					{
						this.configs.get(key).setAll(configs[key],create);
					}
					else this.set(key,configs[key]);
				}
			}
		},
		reset:function()
		{
			for(var config of this.configs.values())
			{
				config.reset();
			}
		},
		toJSON:function()
		{
			var rtn={};
			for(var key of this.configs.keys())
			{
				rtn[key]=this.configs.get(key).toJSON();
			}
			return rtn;
		},
		toDescription:function()
		{
			var rtn={
				type:"object",
				model:{},
				default:this.default
			};
			for(var key of this.configs.keys())
			{
				rtn.model[key]=this.configs.get(key).toDescription();
			}
			return rtn;
		}
	});

	var ARRAY=CONTAINER.Array=µ.Class(CONTAINER,{
		init:function(param,value)
		{
			this.model=param.model;
			this.setDefault(param.default);
			this.configs=[];
			this[Symbol.iterator]=this.configs.entries.bind(this.configs);
			Object.defineProperty(this,"length",{
				configurable:false,
				enumerable:true,
				get:()=>this.configs.length
			});

			if(value!==undefined) this.setAll(value,true);
			else this.reset();
		},
		pushAll:function(configs)
		{
			return configs.map(config=>this.push(config));
		},
		push:function(config)
		{
			var model;
			if(this.default&&this.default.length>this.configs.length)
			{
				if(typeof this.model=="string") model={type:this.model};
				else model=Object.create(this.model);
				model.default=this.default[this.configs.length];
			}
			else model=this.model;
			var value=CONFIG.parse(model);
			if(value&&(config===undefined||value.set(config)))
			{
				this.configs.push(value);
				return value;
			}
			return false;
		},
		splice:function(index)
		{
			if(index instanceof CONFIG)
			{
				index=this.configs.indexOf(index);
			}
			return this.configs.splice(index,1)[0];
		},
		setAll:function(values,create)
		{
			if(create&&this.configs.length>values.length) this.configs.length=values.length
			for(var index=0;index<values.length;index++)
			{
				if(create&&this.configs.length<=index) this.push(values[index]);
				else this.set(index,values[index]);
			}
		},
		reset:function()
		{
			this.configs.length=0;
			if(this.default)
			{
				var _model;
				if(typeof this.model=="string"||!("default" in this.model))_model=this.model;
				else
				{
					_model=Object.create(this.model);
					_model.default=undefined;
				}
				while (this.configs.length<this.default.length)
				{
					this.configs.push(CONFIG.parse(_model));
				}
				for(var i=0;i<this.configs.length;i++)
				{
					this.configs[i].setDefault(this.default[i]);
					this.configs[i].reset();
				}
			}
		},
		toJSON:function()
		{
			return this.configs.map(f=>f.toJSON());
		},
		toDescription:function()
		{
			return {
				type:"array",
				model:this.model,
				default:this.default
			};
		}
	});

	var MAP=CONTAINER.Map=µ.Class(CONTAINER,{
		init:function(param,value)
		{
			this.model=param.model;
			this.setDefault(param.default);
			this.configs=new Map();
			this[Symbol.iterator]=this.configs.entries.bind(this.configs);

			if(value!==undefined) this.setAll(value,true);
			else this.reset();
		},
		addAll:function(configs)
		{
			var rtn={};
			for(var key in configs)
			{
				rtn[key]=this.add(key,configs[key]);
			}
			return rtn;
		},
		add:function(key,config)
		{
			var value=CONFIG.parse(this.model);
			if(value&&key!==undefined&&(!config||value.set(config)))
			{
				if(this.configs.has(key))
				{
					µ.logger.warn(new µ.Warning(String.raw`overwriting config in Object under key ${key}`,{
						old:this.configs.get(key),
						new:value
					}));
				}
				this.configs.set(key,value);
				return value;
			}
			return false;
		},
		remove:function(key)
		{
			if(key instanceof CONFIG)
			{
				for(var entry of this.configs.entries)
				{
					if(entry[1]==key)
					{
						key=entry[0];
						break;
					}
				}
			}
			var rtn=this.configs.get(key);
			this.configs.delete(key);
			return rtn;
		},
		setAll:function(values,create)
		{
			if(create)
			{
				for(var key of this.configs.keys())
				{
					if(!(key in values))
					{
						this.configs.delete(key);
					}
				}
			}
			for(var key in values)
			{
				if(create&&!this.configs.has(key)) this.add(key,values[key]);
				else this.set(key,values[key]);
			}
		},
		reset:function()
		{
			this.configs.clear();
			if(this.default)
			{
				var _model;
				if(typeof this.model=="string"||!("default" in this.model))_model=this.model;
				else
				{
					var _model=Object.create(this.model);
					_model.default=undefined;
				}
				for(var key in this.default)
				{
					var config=CONFIG.parse(_model);
					this.configs.set(key,config);
					config.setDefault(this.default[key]);
					config.reset();
				}
			}
		},
		toJSON:function()
		{
			var rtn={};
			for(var key of this.configs.keys())
			{
				rtn[key]=this.configs.get(key).toJSON();
			}
			return rtn;
		},
		toDescription	:function()
		{
			return {
				type:"map",
				model:this.model,
				default:this.default
			};
		}
	});

})(Morgas,Morgas.setModule,Morgas.getModule,Morgas.hasModule,Morgas.shortcut);
