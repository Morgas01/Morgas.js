(function(e,t){var n=e.util=e.util||{},i=/[\?&]([^=&]+)(=(([^&]|\\&)*))?/g;n.queryParam={},function(e){for(var t;t=i.exec(e);)n.queryParam[t[1]]=t[3]}(decodeURI(window.location.search)),t("queryParam",n.queryParam)})(Morgas,Morgas.setModule,Morgas.getModule);