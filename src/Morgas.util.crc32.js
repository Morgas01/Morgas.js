(function(µ,SMOD,GMOD,HMOD,SC){
	
	let util=µ.util=µ.util||{};

	//SC=SC({});

	let table=new Map();
	let getPolynomial=function(n)
	{
	   if(!table.hasOwnProperty(n))
	   {
		   let c=n;
		   for(let k=0;k<8;k++)
		   {
			   c=((c&1)?(0xEDB88320^(c>>>1)):(c>>>1));
		   }
		   return table[n]=c;
	   }
	   return table[n];
	};

	let CRC32=util.crc32=function(data,crcPart)
	{
		let isString=typeof data==="string";
		let crc=crcPart!=null ? ((crcPart^-1)<<0) : 0^(-1);
		for (let i=0,l=data.length;i<l;i++)
		{
			let b=isString ? data.charCodeAt(i) : data[i];
			crc=(crc>>>8)^getPolynomial((crc^b)&0xFF);
		}
		return (crc^(-1))>>>0;
	};
	CRC32.format=function(crc)
	{
		return "00000000"+crc.toString(16).toUpperCase().slice(-8);
	};

	CRC32.Builder=function(crcPart)
	{
		this.crcPart=crcPart!=null ? crcPart : 0;
	};
	CRC32.Builder.prototype.add=function(data)
	{
		this.crcPart=CRC32(data,this.crcPart);
		return this;
	};
	CRC32.Builder.prototype.get=function(){return this.crcPart;};
	CRC32.Builder.prototype.getFormatted=function()
	{
		return CRC32.format(this.crcPart);
	};

	SMOD("util.crc32",CRC32);

})(Morgas,Morgas.setModule,Morgas.getModule,Morgas.hasModule,Morgas.shortcut);