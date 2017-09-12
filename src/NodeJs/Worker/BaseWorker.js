require("../Morgas.NodeJs");
require("../../Worker/BaseWorker");

let path=require("path");

let SC=µ.shortcut({
	es:"errorSerializer"
});

// necessities
worker.send=function(payload)
{
	process.send(payload);
};
worker.stop=function()
{
	process.exit(0);
};
worker.importScripts=function(scripts)
{
	for(let script of scripts) require(path.resolve(process.cwd(),script));
};

//override and improve
worker.error=function(error)
{
	worker.send({error:SC.es(error)});
};


worker.require=function(scripts)
{
	return scripts.map(s=>require(s));
};


process.on("message",function(message)
{
	worker.handleMessage(message);
});