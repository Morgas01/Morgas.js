(function(e,t){var n=e.util=e.util||{},i=n.object||{};i.equals=function(e,t){if(e===t)return!0;if(void 0===e||null===e)return!1;if(t instanceof RegExp)return t.test(e);if("function"==typeof t)return"function"==typeof e?!1:t(e);if("function"==typeof e.equals)return e.equals(t);if("object"==typeof t){if("object"!=typeof e&&Array.isArray(t))return-1!==t.indexOf(e);for(var n in t)if(!i.equals(e[n],t[n]))return!1;return!0}return!1},t("equals",i.equals)})(Morgas,Morgas.setModule,Morgas.getModule);