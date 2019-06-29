(function(µ,SMOD,GMOD,HMOD,SC){

	let util=µ.util=µ.util||{};
    let uCon=util.converter=util.converter||{};

	//SC=SC({});

	/** converts Date instances into UTC string representation and vice versa */
	uCon.date={
		to(date)
		{
			return date.getUTCFullYear()+","+date.getUTCMonth()+","+date.getUTCDate()+","+date.getUTCHours()+","+date.getUTCMinutes()+","+date.getUTCSeconds()+","+date.getUTCMilliseconds()
		},
		from(dateString)
		{
			return new Date(Date.UTC.apply(Date,dateString.split(",")));
		}
	};

	SMOD("converter/date",uCon.date);

})(Morgas,Morgas.setModule,Morgas.getModule,Morgas.hasModule,Morgas.shortcut);