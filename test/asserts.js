(function(){
	module("asserts");
	
	let propEqual2=function(value,expected)
	{
		if(typeof expected=="object")
		{
			if(expected instanceof Array)
			{
				for(let i=0;i<expected.length;i++)
				{
					if(!propEqual2(value[i], expected[i]))
					{
						return false;
					}
				}
			}
			else
			{
				for(let i in expected)
				{
					if(!propEqual2(value[i], expected[i]))
					{
						return false;
					}
				}
			}
			return true;
		}
		else
		{
			return value===expected;
		}
	};
	let crop=function(value,expected)
	{
		if(value==null)
		{
			return value;
		}
		if(typeof expected=="object")
		{
			let rtn;
			if(expected instanceof Array)
			{
				rtn=[];
				for(let i=0;i<expected.length;i++)
				{
					rtn.push(crop(value[i],expected[i]))
				}
			}
			else
			{
				rtn={};
				for(let i in expected)
				{
					rtn[i]=crop(value[i],expected[i]);
				}
			}
			return rtn;
		}
		else
		{
			return value;
		}
	};
	QUnit.extend(QUnit.assert,
	{
		propEqual2:function( value, expected, message )
		{
			QUnit.push(propEqual2(value, expected), crop(value,expected), expected, message);
		},
		notPropEqual2:function( value, expected, message )
		{
			QUnit.push(!propEqual2(value, expected), crop(value,expected), expected, message);
		}
	});
	test( "PropEqual2",function( assert ) {
		assert.propEqual2({arr:[1,"2"],sub:{"3":4,"5":"6"}},{arr:[1,"2"],sub:{"3":4,"5":"6"}},"full");
		assert.propEqual2({arr:[1,"2"],sub:{"3":4,"5":"6"}},{arr:[1],sub:{"3":4}},"part");
		assert.notPropEqual2({arr:[1],sub:{"3":4}},{arr:[1,"2"],sub:{"3":4,"5":"6"}},"missing");
	});
})();