(function(µ,SMOD,GMOD){
	 /**
	 * Depends on	: Morgas
	 * Uses			: 
	 *
	 * creates crc32 checksum
	 *
	 */
	var util=µ.util=µ.util||{};
	
	var that=util.crc32=function(str)
	{
	   var crc=0^(-1);
	   for (var i=0;i<str.length;i++)
	   {
		   crc=(crc>>>8)^that.get((crc^str.charCodeAt(i))&0xFF);
	   }
	   return (crc^(-1))>>>0;
	};
	that.table={};
	that.get=function(n)
	{
	   if(that.table.n==null)
	   {
		   var c=n;
		   for(var k=0;k<8;k++){
			   c=((c&1)?(0xEDB88320^(c>>>1)):(c>>>1));
		   }
		   that.table[n]=c;
	   }
	   return that.table[n];
	};
	SMOD("crc32",util.crc32);
})(Morgas,Morgas.setModule,Morgas.getModule);