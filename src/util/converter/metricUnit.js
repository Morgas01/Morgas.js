(function(µ,SMOD,GMOD,HMOD,SC){

	let util=µ.util=µ.util||{};
    let uCon=util.converter=util.converter||{};

	//SC=SC({});

	let stages=["y","z","a","f","p","n","µ","m","","K","M","G","T","P","E","Z","Y"];

	let getRegex=function(base)
	{
		return new RegExp("([\\d.]+)\\s*(["+stages.join("")+"]?)"+base);
	};

	uCon.metricUnit={

		to:function(value,{
			base="",
			decimalPlaces=2,
			currentStage="",
			factor=1000
		}={})
		{
			if(value===0) return value.toFixed(decimalPlaces)+base;
			let index=stages.indexOf(currentStage);
			if(index===-1) return value.toFixed(decimalPlaces)+currentStage+base;
			while(value>factor&&index<stages.length)
			{
				value/=factor;
				index++;
			}
			while(value<1&&index>1)
			{
				value*=factor;
				index--;
			}
			return value.toFixed(decimalPlaces)+stages[index]+base;
		},
		from:function(string,{
			base="",
			toStage="",
			factor=1000,
		}={})
		{
			let match=string.match(getRegex(base));
			if(match)
			{
				let value=parseFloat(match[1]);
				if(Number.isNaN(value)) return NaN;
				let modifier=match[2];
				let index=stages.indexOf(modifier);
				if(index===-1) return NaN;
				let toIndex=stages.indexOf(toStage);
				if(toIndex===-1) return NaN;
				return value*(factor**(index-toIndex));
			}
			return NaN;
		}
	};

	SMOD("metricUnit",uCon.metricUnit);

})(Morgas,Morgas.setModule,Morgas.getModule,Morgas.hasModule,Morgas.shortcut);