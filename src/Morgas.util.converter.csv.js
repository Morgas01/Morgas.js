(function(µ,SMOD,GMOD,HMOD,SC){

    let util=µ.util=µ.util||{};
    let uCon=util.converter=util.converter||{};

	//SC=SC({});

	uCon.csv={
		symbols:{
			line:Symbol("csv.line"),
			overflowCells:Symbol("csv.overflowCells")
		},
		to:function(){
			//TODO
			throw "todo";
		},
		defaultSeperator:",",
		from:function(csvData,columnNames,seperator)
		{
			csvData+="";
			
			seperator=seperator||uCon.csv.defaultSeperator;
			let cellEXP=new RegExp('(?:"((?:[^"]|"")*)"|([^"\r\n'+seperator+']*))'+seperator+'?','g'), cleanUpEXP=/"(")/g;

			let rtn={
				data:[],
				columns:columnNames||[]
			};
			
			let item={
				[uCon.csv.symbols.line]:"",
				[uCon.csv.symbols.overflowCells]:[]
			};
			let cellIndex=0,isFirstLine=!columnNames,match=null;
			while((match=cellEXP.exec(csvData))!==null)
			{
				if(match[0]==="")
				{//line end
					while(csvData[cellEXP.lastIndex]==="\r"||csvData[cellEXP.lastIndex]==="\n") cellEXP.lastIndex++;
					if(isFirstLine) isFirstLine=false;
					else
					{
						for(;cellIndex<rtn.columns.length;cellIndex++)item[rtn.columns[cellIndex]]=null;
						rtn.data.push(item);
						//item for next line
						item={
							[uCon.csv.symbols.line]:"",
							[uCon.csv.symbols.overflowCells]:[]
						}
						cellIndex=0;
					}
					if(cellEXP.lastIndex>=csvData.length) break;
				}
				else
				{//next cell
					let value=null;
					if(match[1]) value=match[1].replace(cleanUpEXP,"$1");
					else value=match[2];
					if(isFirstLine)
					{
						rtn.columns.push(value);
					}
					else
					{
						item[uCon.csv.symbols.line]+=match[0];
						if(cellIndex<rtn.columns.length)
						{
							item[rtn.columns[cellIndex]]=value;
						}
						else item[uCon.csv.symbols.overflowCells].push(value);

						cellIndex++;
					}
				}
			}
			return rtn;
		}
	};
    SMOD("CSV",uCon.csv);

})(Morgas,Morgas.setModule,Morgas.getModule,Morgas.hasModule,Morgas.shortcut);