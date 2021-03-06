(function(µ,SMOD,GMOD,HMOD,SC){
	
	µ.util=µ.util||{};

	SC=SC({
		Promise:"Promise"
	});
	
	let doRequest=function(signal,param)
	{
		if(param.urls.length==0) signal.reject(new µ.Warning("no Url"));
		else
		{
			let url=param.urls.shift();
			let req=new XMLHttpRequest();
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
					if(param.urls.length==0) signal.reject({status:req.status,response:req.response,url:url,xhr:req});
					else doRequest(signal,param);
				}
			};
			req.onerror=function(error)
			{
				if(param.urls.length==0) signal.reject({url:url,xhr:req,error:error,response:error.message});
				else doRequest(signal,param);
			};
			if(param.progress)
			{
				req.onprogress=param.progress;
			}
			signal.addAbort(function(){
				param.urls.length=0;
				req.abort();
			});
			req.send(param.data);
		}
	};
	let parseParam=function(param)
	{

		let urls;
		if(typeof param ==="string")
		{
			urls=[param];
		}
		else if (Array.isArray(param))
		{
			urls=param.slice();
		}
		else
		{
			urls=param.urls||[].concat(param.url);
		}
		
		param={
			method:param.method||(param.data?"POST":"GET"),
			user:param.user,//||undefined
			password:param.password,//||undefined
			responseType:param.responseType||"",
			withCredentials:param.withCredentials===true,
			contentType:param.contentType,//||undefined
			data:param.data,//||undefined
			urls:urls
		};
		return param;
	};
	/**
	 * 
	 * @param {string|string[]|requestParam} param
	 * @param {any} scope
	 * @returns {Morgas.Promise}
	 */
	let REQ=µ.util.request=function Request_init(param,scope)
	{
		param=parseParam(param);
		return new SC.Promise(doRequest,{args:param,scope:scope});
	};
	SMOD("request",REQ);

	/**
	 * use: Request(...).catch(Request.allowedStatuses([201,204])).then(...)
	 *
	 */
	REQ.allowedStatuses=function(statuses=[])
	{
		return function(error)
		{
			if(statuses.includes(error.status))
			{
				return error.response;
			}
			return Promise.reject(error);
		};
	};

	REQ.json=function Request_Json(param,scope)
	{

		param=parseParam(param);
		param.responseType="json";
		return REQ(param,scope);
	};
	SMOD("request.json",REQ.json);
})(Morgas,Morgas.setModule,Morgas.getModule,Morgas.hasModule,Morgas.shortcut);