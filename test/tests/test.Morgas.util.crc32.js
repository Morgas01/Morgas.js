(function(µ,GMOD){

	module("util.crc32");
	
	var crc32=GMOD("util.crc32");
	
	test("123456789",function()
	{
		strictEqual(crc32("123456789"),0xCBF43926);
	});
	
})(Morgas,Morgas.getModule);