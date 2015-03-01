(function(e,t,n){var i=n("Patch"),s=n("shortcut")({p:"proxy",d:"debug"}),r=e.NodePatch=e.Class(i,{patchID:"NodePatch",patch:function(e){this.parent=null,this.children=[],e=e||{},this.aliasMap={};for(var t={},n=0;r.Aliases.length>n;n++){var i=r.Aliases[n];i in e&&(this.aliasMap[i]=e[i],void 0===this.instance[this.aliasMap[i]]&&(t[i]=this.aliasMap[i]))}s.p(a,t,this.instance);for(var n=0;r.Symbols.length>n;n++){var c=r.Symbols[n];c in e&&o(this,c,e[c])}},addChild:function(e,t){var n,i=a(e),r=this.children.indexOf(e);if(!i)return s.d([e," is not a Node"]),!1;if(-1===r){if(void 0!==t?this.children.splice(t,0,e):(t=this.children.length,this.children.push(e)),null!==i.parent&&i.parent!==this.instance)if(n=i.aliasMap.remove){if(!e[n]())return s.d(["rejected remove child ",e," from old parent ",i.parent],s.d.LEVEL.INFO),this.children.splice(t,1),!1}else i.remove();if(n=i.aliasMap.setParent){if(!e[n](this.instance))return s.d(["rejected to set parent",this.instance," of child ",e],s.d.LEVEL.INFO),this.children.splice(t,1),!1}else i.setParent(this.instance)}return!0},removeChild:function(e){var t=this.children.indexOf(e);if(-1!==t){this.children.splice(t,1);var n=a(e);if(n&&n.parent===this.instance){var i=n.aliasMap.remove;if(i){if(!e[i]())return s.d(["rejected remove child ",e," from parent ",this.instance],s.d.LEVEL.INFO),this.children.splice(t,0,e),!1}else n.remove()}}return!0},setParent:function(e){var t,n=a(e);if(!n)return s.d([e," is not a Node"]),!1;if(e&&this.parent!==e){if(null!==this.parent)if(t=childPatch.aliasMap.remove){if(!child[t]())return s.d(["rejected remove child ",child," from old parent ",childPatch.parent],s.d.LEVEL.INFO),this.children.splice(index,1),!1}else childPatch.remove();if(this.parent=e,t=n.aliasMap.addChild,-1===n.children.indexOf(this.instance))if(t){if(!this.parent[t](this.instance))return s.d(["rejected to add child ",this.instance," to parent ",e],s.d.LEVEL.INFO),this.parent=null,!1}else n.addChild(this.instance)}return!0},remove:function(){if(null!==this.parent){var e=this.parent,t=a(e);if(this.parent=null,-1!==t.children.indexOf(this.instance)){var n=t.aliasMap.removeChild;if(n){if(!e[n](this.instance))return this.parent=e,s.d(["rejected to remove child ",this.instance," from parent ",this.parent],s.d.LEVEL.INFO),!1}else t.removeChild(this.instance)}}return!0},hasChild:function(e){return-1!==this.children.indexOf(e)},isChildOf:function(e){return a(e),e&&e.hasChild(this.instance)}});r.Aliases=["addChild","removeChild","remove","setParent","hasChild"],r.Symbols=["parent","children"],r.BasicAliases={parent:"parent",children:"children",addChild:"addChild",removeChild:"removeChild",remove:"remove",setParent:"setParent",hasChild:"hasChild"},r.Basic=e.Class({init:function(e){e=e||{};for(var t={},n=0,i=Object.keys(r.BasicAliases);i.length>n;n++){var s=i[n],a=e[s];void 0===a&&(a=r.BasicAliases[s]),null!==a&&(t[s]=""+a)}new r(this,t)}});var a=function(e){return"string"==typeof e&&(e=this),e instanceof r?e:i.getPatch(e,r)},o=function(e,t,n){"function"!=typeof e[t]?Object.defineProperty(e.instance,n,{get:function(){return e[t]},set:function(n){e[t]=n}}):e.instance[n]=e[t]};t("NodePatch",r)})(Morgas,Morgas.setModule,Morgas.getModule);