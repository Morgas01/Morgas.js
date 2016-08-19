(function(µ,SMOD,GMOD,HMOD,SC){

	SC=SC({

	});


	var CONFIG=µ.Config=µ.Class({
		init:null,
		get:null,
		set:null,// (key,value)=>{} // (value)=>
		setDefault:function(def)
		{
			if(def!=null) this.default=def;
			else this.default=null;
		},
		reset:null,
		toDescription:null
	});
	CONFIG.parse=function(desc)
	{
		if(typeof desc=="string") return new FIELD({type:desc});
		else if (Array.isArray(desc)) return new ARRAY({model:desc});
		switch(desc.type)
		{
			case "object":
			case undefined:
				var defaults=desc.default;
				if("model" in desc) desc=desc.model;
				return new OBJECT(desc,defaults);
				break;
			case "map":
				return new MAP(desc);
				break;
			case "array":
				return new ARRAY(desc);
			case "string":
			case "boolean":
			case "number":
			case "select":
				return new FIELD(desc);
		}
	}
	SMOD("Config",CONFIG);

	var FIELD=CONFIG.Field=µ.Class(CONFIG,{
		init:function(param)
		{
			this.type=param.type;
			this.setDefault(param.default);
			this.pattern=param.pattern||null;
			this.validate=param.validate||null;

			if(this.type=="select")
			{
				this.values=param.values;
				this.muliple=param.multiple||false;
			}
			this.reset();
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
			return this;
		}
	});
	FIELD.TYPES=["string","boolean","number","select"];

	var CONTAINER=CONFIG.Container=µ.Class(CONFIG,{
		init:null,
		setAll:null,
		[Symbol.iterator]:null,
		get:function(key)
		{
			if(arguments.length>0)
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
			if(!Array.isArray(key))key=[key];
			for(var entry of this)
			{
				if(entry[0]==key[0])return entry[1].set(key.slice(1),value);
			}
			return false;
		}
	});

	var OBJECT=CONTAINER.Object=µ.Class(CONTAINER,{
		init:function(configs,defaults)
		{
			this.configs=new Map();
			this.setDefault(defaults);
			if(configs)
			{
				this.addAll(configs);
			}
			this[Symbol.iterator]=this.configs.entries.bind(this.configs);
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
		},
		setAll:function(configs)
		{
			for(var key in configs)
			{
				this.set(key,configs[key]);
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
		init:function(param)
		{
			this.model=param.model;
			this.setDefault(param.default);
			this.configs=[];
			this[Symbol.iterator]=this.configs.entries.bind(this.configs);
			this.reset();
		},
		pushAll:function(configs)
		{
			return configs.map(config=>this.push(config));
		},
		push:function(config)
		{
			var value=CONFIG.parse(this.model);
			if(arguments.length==0||value.set(config))
			{
				this.configs.push(value);
				return value;
			}
			return false;
		},
		setAll:function(values)
		{
			for(var index=0;index<values.length;index++)
			{
				this.set(index,values[index]);
			}
		},
		reset:function()
		{
			this.configs.length=0;
			if(this.default)
			{
				var _model=Object.create(this.model);
				_model.default=undefined;
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
		init:function(param)
		{
			this.model=param.model;
			this.setDefault(param.default);
			this.configs=new Map();
			this[Symbol.iterator]=this.configs.entries.bind(this.configs);
			this.reset();
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
			if(key!==undefined&&(!config||value.set(config)))
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
		setAll:function(values)
		{
			for(var key in configs)
			{
				this.set(key,configs[key]);
			}
		},
		reset:function()
		{
			this.configs.clear();
			if(this.default)
			{
				var _model=Object.create(this.model);
				_model.default=undefined;
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
		toDescription:function()
		{
			return {
				type:"map",
				model:this.model,
				default:this.default
			};
		}
	});

})(Morgas,Morgas.setModule,Morgas.getModule,Morgas.hasModule,Morgas.shortcut);
