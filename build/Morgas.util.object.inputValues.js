(function(e,t,n){var i=e.util=e.util||{},s=i.object||{},r=n("shortcut")({goPath:"goPath"});s.setInputValues=function(e,t){for(var n=0;e.length>n;n++){var i=(e[n].dataset.path?e[n].dataset.path+".":"")+e[n].name,s=r.goPath(t,i);void 0!==s&&("checkbox"===e[n].type?e[n].checked=!!s:e[n].value=s)}},s.getInputValues=function(e,t){for(var n=0;e.length>n;n++){var i=t;e[n].dataset.path&&(i=r.goPath(i,e[n].dataset.path)),null!==i&&e[n].name in i&&(i[e[n].name]="checkbox"===e[n].type?e[n].checked:e[n].value)}},t("setInputValues",s.setInputValues),t("getInputValues",s.getInputValues)})(Morgas,Morgas.setModule,Morgas.getModule);