(function(e,t){var n=e.util=e.util||{},i=n.crc32=function(e){for(var t=-1,n=0;e.length>n;n++)t=t>>>8^i.get(255&(t^e.charCodeAt(n)));return(-1^t)>>>0};i.table={},i.get=function(e){if(null==i.table.n){for(var t=e,n=0;8>n;n++)t=1&t?3988292384^t>>>1:t>>>1;i.table[e]=t}return i.table[e]},t("util.crc32",n.crc32)})(Morgas,Morgas.setModule,Morgas.getModule);