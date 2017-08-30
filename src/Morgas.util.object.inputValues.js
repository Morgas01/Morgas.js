(function(µ,SMOD,GMOD,HMOD,SC){

	let util=µ.util=µ.util||{};
	let obj=util.object=util.object||{};
	
	SC=SC({
		goPath:"goPath"
	});

	let getPath=function(input)
	{
		let path="";
		if(input.dataset.path)
		{
			path=input.dataset.path;
			if(!input.name.startsWith("["))
			{
				path+=".";
			}
		}
		path+=input.name;
		return path;
	}
	
	/**
	 * set input values from object
	 * path in object is defined by data-path attribute
	 * key in object is defined by data-field attribute
	 * @param inputs[] input Nodes
	 * @param {object} source
	 */
	obj.setInputValues=function(inputs,source)
	{
		for(let input of inputs)
		{
			let path=getPath(input);
			let value=SC.goPath(source, path);
			if(value!==undefined)
			{
				if(input.type==="checkbox")
				{
					input.checked=!!value;
				}
				if(input.tagName==="SELECT"&&input.multiple&&Array.isArray(value))
				{
					for(let option of input.options)
					{
						option.selected=value.includes(option.value)
					}
				}
				else
				{
					input.value=value;
				}
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
	obj.getInputValues=function(inputs,target,create)
	{
		if(!target)
		{
			target={};
			create=true;
		}
		for(let input of inputs)
		{
			let t=target;
			if(input.dataset.path)
			{
				t=SC.goPath(t, input.dataset.path,create,(create?{}:undefined));
			}
			if(t&&(input.name in t||create))
			{
				let value;
				if(input.type==="checkbox")
				{
					value=input.checked;
				}
				else if(input.tagName==="SELECT"&&input.multiple)
				{
					value=[];
					for(let option of input.selectedOptions)
					{
						value.push(option.value);
					}
				}
				else
				{
					value=input.valueAsDate||input.valueAsNumber||input.value;
				}
				t[input.name]=value;
			}
		}
		return target;
	};
	
	SMOD("setInputValues",obj.setInputValues);
	SMOD("getInputValues",obj.getInputValues);
	
})(Morgas,Morgas.setModule,Morgas.getModule,Morgas.hasModule,Morgas.shortcut);