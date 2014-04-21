(function(µ){
	/**
	 * Depends on	: Morgas
	 * Uses			: Detached
	 *
	 * Request Class
	*/
	
	µ.util=µ.util||{};
	
	REQ=µ.util.Request=function Request_init(url)
	{
		var req=new XMLHttpRequest();
		req.open("GET",url,true);
		
		var det=new µ.Detached();
		req.onload=function()
		{
			if (req.status == 200)
			{
				det.signal().complete(req);
			}
			else
			{
				det.signal().error(req.statusText);
			}
		};
		req.onerror=function()
		{
			det.signal().error("Network Error");
		};
		req.send();
		
		return det;
	}
})(Morgas);