(function(e,t){var n=e.util=e.util||{},i=n.object||{};i.goPath=function(e,t,n){var i=t;for("string"==typeof i&&(i=i.split("."));i.length>0&&e;)!n||i[0]in e||(e[i[0]]={}),e=e[i.shift()];return i.length>0?void 0:e},t("goPath",i.goPath)})(Morgas,Morgas.setModule,Morgas.getModule);