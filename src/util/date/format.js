(function(µ,SMOD,GMOD,HMOD,SC){

	let util=µ.util=µ.util||{};
	let uDate=util.date=util.date||{};

	//SC=SC({});
	/**
	 * Y = year
	 * M = month
	 * D = day
	 * h = hour
	 * m = minute
	 * s = second
	 * t = millisecond
	 * z = time zone
	 * @param {Date} date
	 * @param {String} format
	 */
	uDate.format=(date,format)
	{
		return format.replace(/([YMDhmstz])/g,function(match, group)
		{
			switch(group)
			{
				case "Y":
					return date.getFullYear();
                case "M":
                	return date.getMonth();
                case "D":
                	return date.getDate();
                case "h":
                	return date.getHours();
                case "m":
                	return date.getMinutes();
                case "s":
                	return date.getSeconds();
                case "t":
                	return date.getMilliseconds();
                case "z":
                	return date.getTimezoneOffset()/60;
			}
		})
		return date.getUTCFullYear()+","+date.getUTCMonth()+","+date.getUTCDate()+","+date.getUTCHours()+","+date.getUTCMinutes()+","+date.getUTCSeconds()+","+date.getUTCMilliseconds()
	};

	SMOD("date/format",uDate.format);

})(Morgas,Morgas.setModule,Morgas.getModule,Morgas.hasModule,Morgas.shortcut);