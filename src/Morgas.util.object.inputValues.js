(function(µ,SMOD,GMOD){

	let util=µ.util=µ.util||{};
	let obj=util.object||{};
	
	let SC=GMOD("shortcut")({
		goPath:"goPath"
	});
	
	/**
	 * set input values from object
	 * path in object is defined by data-path attribute
	 * key in object is defined by data-field attribute
	 * @param inputs[] input Nodes
	 * @param {object} source
	 */
	obj.setInputValues=function(inputs,source)
	{
		for(let i=0;i<inputs.length;i++)
		{
			let path=(inputs[i].dataset.path ? inputs[i].dataset.path+"." : "")+inputs[i].name;
			let value=SC.goPath(source, path);
			if(value!==undefined)
			{
				if(inputs[i].type==="checkbox")
				{
					inputs[i].checked=!!value;
				}
				else
				{
					inputs[i].value=value;
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
	obj.getInputValues=function(inputs,target)
	{
		for(let i=0;i<inputs.length;i++)
		{
			let t=target;
			if(inputs[i].dataset.path)
			{
				t=SC.goPath(t, inputs[i].dataset.path);
			}
			if(t!==null&&inputs[i].name in t)
			{
				if(inputs[i].type==="checkbox")
				{
					t[inputs[i].name]=inputs[i].checked;
				}
				else
				{
					t[inputs[i].name]=inputs[i].value;
				}
			}
		}
	};
	
	SMOD("setInputValues",obj.setInputValues);
	SMOD("getInputValues",obj.getInputValues);
	
})(Morgas,Morgas.setModule,Morgas.getModule);