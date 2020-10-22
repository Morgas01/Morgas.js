require("../Morgas.NodeJs");
require("../../Worker/BaseWorker");

let path=require("path");

let SC=µ.shortcut({
	es:"errorSerializer"
});

// necessities
worker._send=function(payload)
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
worker._loadMorgas=function(){};// TODO always loaded

//override and improve
worker.error=function(error)
{
	worker._send({
		type:MESSAGE_TYPES.ERROR,
		error:SC.es(error)
	});
};


worker.require=function(scripts)
{
	return scripts.map(s=>require(s));
};


process.on("message",function(message)
{
	worker.handleMessage(message);
});