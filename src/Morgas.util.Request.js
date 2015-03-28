(function(µ,SMOD,GMOD,HMOD){
	
	µ.util=µ.util||{};

	var SC=GMOD("shortcut")({
		debug:"debug",
		prom:"Promise"
	});
	var doRequest=function(signal,urls,param)
	{
		if(urls.length==0) signal.reject();
		else
		{
			var url=urls.shift();
			var req=new XMLHttpRequest();
			req.open(param.method,url,true,param.user,param.password);
			req.responseType=param.responseType;
			req.onload=function()
			{
				if (req.status == 200)
				{
					signal.resolve(req.response);
				}
				else
				{
					SC.debug({url:url,status:req.statusText})
					doRequest(signal,urls,param);
				}
			};
			req.onerror=function()
			{
				SC.debug({url:url,status:"Network Error"})
				doRequest(signal,urls,param);
			};
			if(param.progress)
			{
				req.onprogress=param.progress;
			}
			signal.onAbort(function(){
				urls.length=0;
				req.abort();
			});
			req.send(param.data);
		}
	}
	REQ=µ.util.Request=function Request_init(param,scope)
	{
		var urls;
		if(typeof param ==="string")
		{
			urls=[param];
		}
		else
		{
			urls=[].concat(param.url);
		}
		param={
			method:param.method||(param.data?"POST":"GET"),
			user:param.user,//||undefined
			password:param.password,//||undefined
			responseType:param.responseType||"",
			withCredentials:param.withCredentials===true,
			contentType:param.contentType,//||undefined
			data:param.data//||undefined
		};
		return new SC.prom(doRequest,[urls,param],scope);
	};
	SMOD("request",REQ);

	REQ.json=function Request_Json(param,scope)
	{
		if(typeof param ==="string")
		{
			param={url:param};
		}
		param.responseType="json";
		return REQ(param,scope);
	};
	SMOD("request.json",REQ.json);
})(Morgas,Morgas.setModule,Morgas.getModule);