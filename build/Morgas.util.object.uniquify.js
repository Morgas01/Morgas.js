(function(e,t){var n=e.util=e.util||{},i=n.object||{};i.uniquify=function(e,t){var n;if(t){n=new Map;for(var i=0;e.length>i;i++){var r=e[i];t&&(r=t(e[i])),n.set(r,e[i])}}else n=new Set(e);for(var s=[],a=n.values(),o=a.next();!o.done;o=a.next())s.push(o.value);return s},t("uniquify",i.uniquify)})(Morgas,Morgas.setModule,Morgas.getModule);