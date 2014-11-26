(function(µ,GMOD,SMOD,HMOD){
	
	µ.util=µ.util||{};

	var SC=GMOD("shortcut")({
		det:"Detached"
	});

	REQ=µ.util.Request=function Request_init(url)
	{
		return new SC.det(function()
		{
			var signal=this;
			var req=new XMLHttpRequest();
			req.open("GET",url,true);

			req.onload=function()
			{
				if (req.status == 200)
				{
					signal.complete(req);
				}
				else
				{
					signal.error(req.statusText);
				}
			};
			req.onerror=function()
			{
				signal.error("Network Error");
			};
			req.send();
		});
	};
	SMOD("Request",REQ);

	REQ.json=function Request_Json(url)
	{
		var det=REQ(url);
		var jDet=det.then(JSON.parse,true);
		det.propagateError(jDet);
		return jDet;
	};
	SMOD("Request.json");
})(Morgas,Morgas.setModule,Morgas.getModule);