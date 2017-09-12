var fs=require("fs");
var path=require("path");
var uglify=require("uglify-js");

var File=µ.getModule("File");
var FileUtils=µ.getModule("File.util");

module.exports=function minify(packageName,files,folder)
{
	folder=path.join(folder,packageName);
	return FileUtils.enshureDir(path.join(folder,".."))
	.then(function()
	{
		try
		{
			var minPackage=uglify.minify(files,{outSourceMap: packageName+".map"});
			fs.writeFileSync(folder,minPackage.code);
			fs.writeFileSync(folder+".map",minPackage.map);
		}
		catch (e)
		{
			console.log("could not minify",packageName,e.message);
			try
			{
				var code=files.map(function(f){return fs.readFileSync(f,{encode:"UTF-8"})}).join("\n");
				fs.writeFileSync(folder,code);
			}
			catch(e)
			{
				console.error("could not copy",packageName,e.message);
			}
		}
	});
};