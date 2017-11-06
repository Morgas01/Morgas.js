(function(µ,SMOD,GMOD,HMOD,SC){

	//SC=SC({});

	let CONFIG=µ.Config=µ.Class({
		[µ.Class.symbols.abstract]:true,
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
				let defaults=desc.default;
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

	let FIELD=CONFIG.Field=µ.Class(CONFIG,{
		constructor:function(param,value)
		{
			this.type=param.type;
			this.setDefault(param.default);
			this.pattern=null;
			if(typeof param.pattern == "string")
			{
				let match=param.pattern.match(/^\/(.+)\/(.*)$/);
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
			let validity=this.isValid(value);
			if(validity===true) this.value=value;
			else return validity;
			return true;
		},
		/**
		 * checks value and returns a boolean or any error object from validate callback.
		 * if you want to use validation messages check if isValid(value)===true
		 * @param {*} value
		 * @returns {boolean|*}
		 */
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
				&& (this.type!="number"||(
					(this.min==null||value>=this.min)
					&& (this.max==null||value<=this.max)
					&& (this.step==null||value%this.step==0)
					)
				)
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
			let rtn={
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

	let CONTAINER=CONFIG.Container=µ.Class(CONFIG,{
		[µ.Class.symbols.abstract]:true,
		[Symbol.iterator]:function()
		{
			return this.configs.entries();
		},
		setAll:function(values,create){throw "abstract"},
		get:function(key){throw "abstract"},
		set:function(key,value)
		{
			if(arguments.length==1&&typeof key=="object")
			{
				this.setAll(key,true);
				return true;
			}
			if(!Array.isArray(key))key=[key];
			for(let entry of this)
			{
				if(entry[0]==key[0])return entry[1].set(key.slice(1),value);
			}
			return false;
		}
	});

	let OBJECT=CONTAINER.Object=µ.Class(CONTAINER,{
		constructor:function(configs,defaults,value)
		{
			this.configs=new Map();
			this.setDefault(defaults);
			if(configs)
			{
				this.addAll(configs);
			}

			if(value!==undefined) this.setAll(value,true);
		},
		addAll:function(configs)
		{
			let rtn={};
			for(let key in configs)
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
		get:function(key)
		{
			if(key==null) return this.toJSON();
			if(!Array.isArray(key)) return this.configs.get(key);
			if(key.length==0) return this;

			let config=this.configs.get(key[0]);
			if(config)
			{
				if(key.length==1) return config;
				return config.get(key.slice(1));
			}

			return undefined;
		},
		remove:function(key)
		{
			if(key instanceof CONFIG)
			{
				for(let entry of this.configs.entries)
				{
					if(entry[1]==key)
					{
						key=entry[0];
						break;
					}
				}
			}
			let rtn=this.configs.get(key);
			this.configs.delete(key);
			return rtn;
		},
		setAll:function(configs,create)
		{
			for(let key in configs)
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
			for(let config of this.configs.values())
			{
				config.reset();
			}
		},
		toJSON:function()
		{
			let rtn={};
			for(let key of this.configs.keys())
			{
				rtn[key]=this.configs.get(key).toJSON();
			}
			return rtn;
		},
		toDescription:function()
		{
			let rtn={
				type:"object",
				model:{},
				default:this.default
			};
			for(let key of this.configs.keys())
			{
				rtn.model[key]=this.configs.get(key).toDescription();
			}
			return rtn;
		}
	});

	let ARRAY=CONTAINER.Array=µ.Class(CONTAINER,{
		constructor:function(param,value)
		{
			this.model=param.model;
			this.setDefault(param.default);
			this.configs=[];
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
			let model;
			if(this.default&&this.default.length>this.configs.length)
			{
				if(typeof this.model=="string") model={type:this.model};
				else model=Object.create(this.model);
				model.default=this.default[this.configs.length];
			}
			else model=this.model;
			let value=CONFIG.parse(model);
			if(value&&(config===undefined||value.set(config)))
			{
				this.configs.push(value);
				return value;
			}
			return false;
		},
		get:function(key)
		{
			if(key==null) return this.toJSON();
			if(!Array.isArray(key))
			{
				if(key>=0&&key<this.configs.length) return this.configs[key];
				return undefined;
			}
			if(key.length==0) return this;
			if(key[0]>=0&&key[0]<this.configs.length)
			{
				let config=this.configs[key[0]];
				if(key.length==1) return config;
				return config.get(key.slice(1));
			}
			return undefined;
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
			for(let index=0;index<values.length;index++)
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
				let _model;
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
				for(let i=0;i<this.configs.length;i++)
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

	let MAP=CONTAINER.Map=µ.Class(CONTAINER,{
		constructor:function(param,value)
		{
			this.model=param.model;
			this.setDefault(param.default);
			this.configs=new Map();

			if(value!==undefined) this.setAll(value,true);
			else this.reset();
		},
		addAll:function(configs)
		{
			let rtn={};
			for(let key in configs)
			{
				rtn[key]=this.add(key,configs[key]);
			}
			return rtn;
		},
		add:function(key,config)
		{
			let value=CONFIG.parse(this.model);
			if(value&&key!==undefined&&(config===undefined||value.set(config)))
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
		get:function(key)
		{
			if(key==null) return this.toJSON();
			if(!Array.isArray(key)) return this.configs.get(key);
			if(key.length==0) return this;

			let config=this.configs.get(key[0])
			{
				if(key.length==1) return config;
				return config.get(key.slice(1));
			}

			return undefined;
		},
		remove:function(key)
		{
			if(key instanceof CONFIG)
			{
				for(let entry of this.configs.entries)
				{
					if(entry[1]==key)
					{
						key=entry[0];
						break;
					}
				}
			}
			let rtn=this.configs.get(key);
			this.configs.delete(key);
			return rtn;
		},
		setAll:function(values,create)
		{
			if(create)
			{
				for(let key of this.configs.keys())
				{
					if(!(key in values))
					{
						this.configs.delete(key);
					}
				}
			}
			for(let key in values)
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
				let _model;
				if(typeof this.model=="string"||!("default" in this.model))_model=this.model;
				else
				{
					_model=Object.create(this.model);
					_model.default=undefined;
				}
				for(let key in this.default)
				{
					let config=CONFIG.parse(_model);
					this.configs.set(key,config);
					config.setDefault(this.default[key]);
					config.reset();
				}
			}
		},
		toJSON:function()
		{
			let rtn={};
			for(let key of this.configs.keys())
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
		},
		keys:function()
		{
			return Array.from(this.configs.keys());
		}
	});

})(Morgas,Morgas.setModule,Morgas.getModule,Morgas.hasModule,Morgas.shortcut);
