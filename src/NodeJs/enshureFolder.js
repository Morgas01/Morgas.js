var fs=require("fs");
var path=require("path");
var joinPath=path.join.apply.bind(path.join,path);

module.exports=function(folderpath)
{
	var parts=folderpath.split(/[/\\]/);
	var i=parts.length+1;
	while(i>1&&!fs.existsSync(joinPath(parts.slice(0,i-1)))) i--;
	for(;i<=parts.length;i++) fs.mkdirSync(joinPath(parts.slice(0,i)));
};