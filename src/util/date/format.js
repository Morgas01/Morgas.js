(function(µ,SMOD,GMOD,HMOD,SC){

	let util=µ.util=µ.util||{};
	let uDate=util.date=util.date||{};

	//SC=SC({});

	let leftPad=function(string,minLength,char="0")
	{
		string=""+string;
		if(string.length>=minLength) return string;
		return char.repeat(minLength-string.length)+string;
	};

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
	uDate.format=function(date,format)
	{
		return format.replace(/([YMDhmstz])/g,function(match, group)
		{
			switch(group)
			{
				case "Y":
					return date.getFullYear();
                case "M":
                	return leftPad(date.getMonth()+1,2);
                case "D":
                	return leftPad(date.getDate(),2);
                case "h":
                	return leftPad(date.getHours(),2);
                case "m":
                	return leftPad(date.getMinutes(),2);
                case "s":
                	return leftPad(date.getSeconds(),2);
                case "t":
                	return leftPad(date.getMilliseconds(),2);
                case "z":
                	return date.getTimezoneOffset()/60;
			}
		});
	};
	uDate.format.time="h:m:s";
	uDate.format.exactTime="h:m:s.t";
	uDate.format.date="D.M.Y";

	SMOD("date/format",uDate.format);

})(Morgas,Morgas.setModule,Morgas.getModule,Morgas.hasModule,Morgas.shortcut);