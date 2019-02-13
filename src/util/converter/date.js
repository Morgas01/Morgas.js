(function(µ,SMOD,GMOD,HMOD,SC){

	let util=µ.util=µ.util||{};
    let uCon=util.converter=util.converter||{};

	//SC=SC({});

	uCon.date={
		to(date)
		{
			return date.getUTCFullYear()+","+date.getUTCMonth()+","+date.getUTCDate()+","+date.getUTCHours()+","+date.getUTCMinutes()+","+date.getUTCSeconds()+","+date.getUTCMilliseconds()
		},
		from(dateString)
		{
			return new Date(Date.UTC.apply(Date,jsonObj.split(",")));
		}
	};

	SMOD("converter/date",uCon.date);

})(Morgas,Morgas.setModule,Morgas.getModule,Morgas.hasModule,Morgas.shortcut);