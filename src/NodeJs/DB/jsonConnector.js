(function(µ,SMOD,GMOD,HMOD,SC){

	var fs=require("fs");
	var path=require("path");

	var OCON=GMOD("ObjectConnector");

	SC=SC({
		Promise:"Promise",
		File:"File",
		FileUtil:"File/util",
		rs:"rescope"
	});

	module.exports=µ.Class(OCON,{
		constructor:function(file,param)
		{
			param=param||{};
			this.mega();

			SC.rs.all(this,["flush"]);

			param=param||{};
			this.flushTimer=null;
			this.maxFlushTimer=null;
			this.flushTimeout=param.flushTimeout||1000;
			this.maxFlushTimeout=param.maxFlushTimeout||10000;
			this.fileRotation=param.fileRotation||0;
			this.prettyPrint=param.prettyPrint||false;
			this.file=SC.File.stringToFile(file);

			this.open=new SC.Promise(SC.FileUtil.getRotatedFile(this.file,JSON.parse),{scope:this})
			.then(function(result)
			{
				this.db.addAll(result.data);
				delete result.data;
				return result;
			});
		},
		save:function(signal,objs)
		{
			this.open.always(()=>
			{
				OCON.prototype.save.apply(this,arguments);
				this.startFlushStimer();
			}).catch(signal.reject)
		},
		load:function(signal,objClass,pattern,sort)
		{
			this.open.always(()=>
			{
				OCON.prototype.load.apply(this,arguments);
			}).catch(signal.reject)
		},
		"delete":function(signal,objClass,toDelete)
		{
			this.open.always(()=>
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
				if(this.fileRotation>0)
				{
					p=SC.FileUtil.rotateFile(this.file,this.fileRotation);
					p.then(()=>µ.logger.info("rotated file"),err=> µ.logger.error(new µ.Warning("failed to rotate dbFile "+this.file.getAbsolutePath(),err)));
				}
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
