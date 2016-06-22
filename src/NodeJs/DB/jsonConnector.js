(function(µ,SMOD,GMOD,HMOD,SC){
	
	var fs=require("fs");
	var path=require("path");
	
	var OCON=GMOD("ObjectConnector");
	
	SC=SC({
		Promise:"Promise",
		File:"File",
		FileUtil:"File.util",
		rs:"rescope",
		itAs:"iterateAsync"
	});
	
	module.exports=µ.Class(OCON,{
		init:function(file,param)
		{
			param=param||{};
			this.mega(true);

			SC.rs.all(this,["flush"]);
			
			param=param||{};
			this.flushTimer=null;
			this.maxFlushTimer=null;
			this.flushTimeout=param.flushTimeout||1000;
			this.maxFlushTimeout=param.maxFlushTimeout||10000;
			this.fileRotation=param.fileRotation||0;
			this.prettyPrint=param.prettyPrint||false;
			this.file=SC.File.stringToFile(file);
			
			var folder=this.file.clone().changePath("..");
			this.open=SC.Promise.resolve(folder.exists()
			.then(function()
			{
				return folder.listFiles();
			}),this)
			.then(function(files)
			{
				var regex=new RegExp(String.raw`^${this.file.getName()}(\.([0-9]+))?$`);
				files=files.filter(s=>s.match(regex))
				.sort((a,b)=>
				{
					var aMatch=a.match(regex),bMatch=b.match(regex);
					a=parseInt(aMatch&&aMatch[2]||null,10);
					b=parseInt(bMatch&&bMatch[2]||null,10);
					return a>b;
				});
				if(files.length==0) return files;
				return SC.itAs(files,function(i,file)
				{
					return folder.clone().changePath(file).read({encoding:"utf8"}).then(JSON.parse)
					.then(d=>Promise.reject(d),
					e=>Promise.resolve({file:file,error:e}));
				},null,this)
				.then(e=>Promise.reject(e),
				function(results)
				{
					this.db.add(results.pop());
					return Promise.resolve(results)
				});
			});
		},
		save:function(signal,objs)
		{
			this.open.then(()=>
			{
				OCON.prototype.save.apply(this,arguments);
				this.startFlushStimer();
			}).catch(signal.reject)
		},
		load:function(signal,objClass,pattern,sort)
		{
			this.open.then(()=>
			{
				OCON.prototype.load.apply(this,arguments);
			}).catch(signal.reject)
		},
		"delete":function(signal,objClass,toDelete)
		{
			this.open.then(()=>
			{
				OCON.prototype.delete.apply(this,arguments);
				this.startFlushStimer();
			}).catch(signal.reject)
		},
		destroy:function()
		{
			this.flush();
			this.mega();
		},
		startFlushStimer:function()
		{
			if(this.flushTimer) clearTimeout(this.flushTimer);
			this.flushTimer=setTimeout(this.flush,this.flushTimeout);
			if(!this.maxFlushTimer) this.maxFlushTimer=setTimeout(this.flush,this.maxFlushTimeout);
		},
		flush:function()
		{
			if(this.flushTimer)
			{//has something to save
				var data=JSON.stringify(this.db.getValues(),null,(this.prettyPrint?"\t":""));
				var p;
				if(this.fileRotation>0) p=SC.FileUtil.rotateFile(this.file,this.fileRotation);
				else p=Promise.resolve();
				
				p.then(()=> this.file.write(data))
				.then(
					()=>µ.logger.debug("saved dbFile "+this.file.getAbsolutePath()),
					(err)=> µ.logger.error(new µ.Warning("failed to save dbFile "+this.file.getAbsolutePath(),err))
				)
				.then(()=>
				{
					clearTimeout(this.flushTimer);
					this.flushTimer=null;
					clearTimeout(this.maxFlushTimer);
					this.maxFlushTimer=null;
				});
			}
		}
	});
	
})(Morgas,Morgas.setModule,Morgas.getModule,Morgas.hasModule,Morgas.shortcut);