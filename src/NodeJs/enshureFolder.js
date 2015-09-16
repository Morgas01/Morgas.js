var fs=require("fs");
var path=require("path");
var joinPath=path.join.apply.bind(path.join,path);

module.exports=function(folderpath)
{
	console.log(folderpath);
	var parts=folderpath.split(/[/\\]/);
	var i=parts.length+1;
	console.log(joinPath(parts.slice(0,i-1)),fs.existsSync(joinPath(parts.slice(0,i-1))));
	while(i>1&&!fs.existsSync(joinPath(parts.slice(0,i-1))))
	{
		i--;
		console.log(joinPath(parts.slice(0,i-1)),fs.existsSync(joinPath(parts.slice(0,i-1))));
	}
	for(;i<=parts.length;i++) fs.mkdirSync(joinPath(parts.slice(0,i)));
};