var fs=require("fs");
var path=require("path");

module.exports=function(folderpath)
{
	var parts=folderpath.split(/[/\\]/);
	for(var i=1;i<=parts.length;i++)
	{
		var folder=parts.slice(0,i).join(path.sep);
		if(!fs.existsSync(folder))
		{
			fs.mkdirSync(folder);
		}
	}
};