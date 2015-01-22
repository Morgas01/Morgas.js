(function(µ,SMOD,GMOD){

    let util=µ.util=µ.util||{};
    let uCon=util.converter||{};

    let lineEXP=/[\r\n]+/, cellEXP=/;"(([^"]|"")+)"|;([^;]*)/g, cleanUpEXP=/"(")/g, getCells=function(line)
    {
        let matches,
            cells=[];

        line=";"+line;
        cellEXP.lastIndex=0;
        while(matches=cellEXP.exec(line))
        {
            cells.push((matches[1]||matches[3]).replace(cleanUpEXP,"$1"));
        }
        return cells;
    };

    uCon.csvToObject=function(csv)
    {
        let lines = csv.split(lineEXP), keys = getCells(lines.shift()), rtn = [];
        if (lines[lines.length - 1] === "") {
            lines.length--;
        }
        if (keys[keys.length - 1] === "") {
            keys.length--;
        }
        rtn.keys=keys;
        for (let i = 0; i < lines.length; i++) {
            let cells = getCells(lines[i]);
            if (cells[cells.length - 1] === "") {
                cells.length--;
            }
            let obj = {_line:lines[i],_overflowCells:cells.slice(keys.length)};
            for (let k = 0; k < keys.length; k++) {
                obj[keys[k]] = cells[k];
            }
            rtn.push(obj);
        }
        return rtn;
    };
    SMOD("csvToObject",uCon.csvToObject);

})(Morgas,Morgas.setModule,Morgas.getModule);