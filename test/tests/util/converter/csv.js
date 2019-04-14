QUnit.module("util.converter.csv",function()
{

	let csvSymbols=µ.util.converter.csv.symbols;

	QUnit.module("csv",{
		before:function()
		{
			this.data='field1,field2,field3,\n1,2,3\n\n4,5,6,7,8\n9,"""special"", \ncharacters",10';
		}
	},function()
	{
		QUnit.test("to json",function(assert)
		{
			var expected={
				columns:["field1","field2","field3"],
				data:[
					{
						[csvSymbols.line]:"1,2,3",
						[csvSymbols.overflowCells]:[],
						field1:"1",
						field2:"2",
						field3:"3"
					},
					{
						[csvSymbols.line]:"4,5,6,7,8",
						[csvSymbols.overflowCells]:["7","8"],
						field1:"4",
						field2:"5",
						field3:"6"
					},
					{
						[csvSymbols.line]:'9,"""special"", \ncharacters",10',
						[csvSymbols.overflowCells]:[],
						field1:"9",
						field2:'"special", \ncharacters',
						field3:"10"
					},
				]
			};
			let result=µ.util.converter.csv.from(this.data);
			assert.deepEqual(result,expected,"csv");
			for(let i=0;i<expected.data.length;i++)
			{
				assert.deepEqual(result.data[i][csvSymbols.line],expected.data[i][csvSymbols.line],"line");
				assert.deepEqual(result.data[i][csvSymbols.overflowCells],expected.data[i][csvSymbols.overflowCells],"overflowCells");
			}
		});
	});
	QUnit.module("tsv",{
		before:function()
		{
			this.data='1\t2\t3\n\n4\t5\t6\t7\t8\n9\t"""special""\t\ncharacters"\t10';
		}
	},function()
	{
		QUnit.test("to json",function(assert)
		{
			let expected={
				columns:["field1","field2","field3"],
				data:[
					{
 						[csvSymbols.line]:"1\t2\t3",
 						[csvSymbols.overflowCells]:[],
						field1:"1",
						field2:"2",
						field3:"3"
					},
					{
 						[csvSymbols.line]:"4\t5\t6\t7\t8",
 						[csvSymbols.overflowCells]:["7","8"],
						field1:"4",
						field2:"5",
						field3:"6"
					},
					{
 						[csvSymbols.line]:'9\t"""special""\t\ncharacters"\t10',
 						[csvSymbols.overflowCells]:[],
						field1:"9",
						field2:'"special"\t\ncharacters',
						field3:"10"
					},
				]
			};
			let result=µ.util.converter.csv.from(this.data,expected.columns,"\t");
			assert.deepEqual(result,expected,"tsv");
			for(let i=0;i<expected.data.length;i++)
			{
				assert.deepEqual(result.data[i][csvSymbols.line],expected.data[i][csvSymbols.line],"line");
				assert.deepEqual(result.data[i][csvSymbols.overflowCells],expected.data[i][csvSymbols.overflowCells],"overflowCells");
			}
		});
	});
});