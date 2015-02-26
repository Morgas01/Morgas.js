(function(µ,SMOD,GMOD,HMOD){
	
	µ.util=µ.util||{};

	var SC=GMOD("shortcut")({
		det:"Detached"
	});

	REQ=µ.util.Request=function Request_init(param,scope)
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
		return new SC.det([function()
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
					signal.complete(req);
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
		},scope]);
	};
	SMOD("Request",REQ);

	REQ.json=function Request_Json(param,scope)
	{
		if(typeof param ==="string")//TODO ||Array.isArray(param))
		{
			param={url:param};
		}
		param.responseType="json";
		var det=REQ(param);
		var jDet=det.then(function(r){return r.response},true);
		jDet.fn.push(scope);
		return jDet;
	};
	SMOD("Request.json",REQ.json);
})(Morgas,Morgas.setModule,Morgas.getModule);