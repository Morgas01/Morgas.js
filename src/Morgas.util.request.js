(function(µ,SMOD,GMOD,HMOD){
	
	µ.util=µ.util||{};

	var SC=GMOD("shortcut")({
		det:"Detached"
	});

	REQ=µ.util.Request=function Request_init(param)
	{
		if(typeof param ==="string")
		{
			param={url:param};
		}
		param={
			url:param.url,
			method:param.data?"POST":"GET",
			async:true,
			user:param.user,//||undefined
			password:param.password,//||undefined
			responseType:param.responseType||"",
			upload:param.upload,//||undefined
			withCredentials:param.withCredentials===true,
			contentType:param.contentType,//||undefined
			data:param.data//||undefined
		};
		return new SC.det(function()
		{
			var signal=this;
			var req=new XMLHttpRequest();
			req.open(param.method,param.url,param.async,param.user,param.password);
			req.responseType=param.responseType;
			if(param.contentType)
			{
				req.setRequestHeader("contentType", value);
			}
			else if (param.data)
			{
				param.contentType="application/x-www-form-urlencoded;charset=UTF-8";
				if(param.data.consctuctor===Object)
				{//is plain object
					param.contentType="application/json;charset=UTF-8";
					param.data=JSON.stringify(data);
				}
				req.setRequestHeader("contentType", param.contentType);
			}
			if(param.upload)
			{
				req.upload=param.upload;
			}
			req.onload=function()
			{
				if (req.status == 200)
				{
					signal.complete(req.response);
				}
				else
				{
					// todo try next if(Array.isArray(param.url))
					signal.error(req.statusText);
				}
			};
			req.onerror=function()
			{
				// todo try next if(Array.isArray(param.url))
				signal.error("Network Error");
			};
			if(param.progress)
			{
				req.onprogress=param.progress;
			}
			req.send(param.data);
		});
	};
	SMOD("request",REQ);

	REQ.json=function Request_Json(param)
	{
		if(typeof param ==="string")
		{
			param={url:param};
		}
		param.responseType="json";
		return REQ(param);
	};
	SMOD("request.json",REQ.json);
})(Morgas,Morgas.setModule,Morgas.getModule);