(function(µ,SMOD,GMOD){

    let util=µ.util=µ.util||{};

    let queryRegExp=/[\?&]([^=&]+)(=(([^&]|\\&)*))?/g;
    util.queryParam={};

    (function parseQueryParam(queryString){
        let matches;
        while(matches=queryRegExp.exec(queryString))
        {
            util.queryParam[matches[1]]=matches[3];
        }
    })(decodeURI(window.location.search));

    SMOD("queryParam",util.queryParam);

})(Morgas,Morgas.setModule,Morgas.getModule);