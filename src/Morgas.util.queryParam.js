(function(µ,SMOD,GMOD){

    var util=µ.util=µ.util||{};

    var queryRegExp=/[\?&]([^=&]+)(=(([^&]|\\&)*))?/g;
    util.queryParam={};

    (function parseQueryParam(queryString){
        var matches;
        while(matches=queryRegExp.exec(queryString))
        {
            util.queryParam[matches[1]]=matches[3];
        }
    })(decodeURI(window.location.search));

    SMOD("queryParam",util.queryParam);

})(Morgas,Morgas.setModule,Morgas.getModule);