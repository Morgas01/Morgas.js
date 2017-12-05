µ.util.request.json("../src/Morgas.Dependencies.json")
.then(function(mDeps)
{
	let resolver=new µ.DependencyResolver();
	resolver.addConfig(mDeps);
    let html='';
	let keys=Object.keys(mDeps);
	keys.sort(function(a,b)
	{
		a=a.slice(0,-3);
		b=b.slice(0,-3);//remove ".js"
		if((a.indexOf("/")!==-1) != (b.indexOf("/")!==-1)) return false; //sort subfolders last
		else return a>b;
	});
    for(let k=0;k<keys.length;k++)
    {
        html+='<label><input type="checkbox" value="'+keys[k]+'">'+keys[k]+'</label>';
    }

	let selections=document.getElementById("selections");
	let prefix=document.getElementById("prefix");
	let result=document.getElementById("result");
	selections.innerHTML=html;

	let update=function()
    {
    	Array.forEach(selections.querySelectorAll(':indeterminate'), function(v){v.indeterminate=false});
        let values=Array.map(selections.querySelectorAll('[type="checkbox"]:checked'),function(val){return val.value});
        if(values)
        {
            let resolved=resolver.resolve(values);
        	resolved.unshift("Morgas.js");
            for(let i=0;i<resolved.length;i++)
        	{
            	let checkbox=document.querySelector('[type="checkbox"][value="'+resolved[i]+'"]:not(:checked)');
            	if(checkbox)checkbox.indeterminate=true;
        	}
			result.value=resolved.map(v=>`<script defer src="${prefix.value+v}"></script>`).join("\n");
        }
        else
        {
			result.value="";
        }
    };
	window.addEventListener("change",update);
	window.addEventListener("input",update);
},
function(error)
{
	console.error(error);
	alert("network error");
});