(function(t,e){var n=function(t){return void 0!==this.getPatch(t)},o=function(t){return this.patches[t.patchID||t.prototype.patchID]},c=function(){this.patch(this._patchParam,!1),delete this._patchParam},s=t.Patch=t.Class({init:function(t,e,s){null==t.patches&&(t.patches={},t.hasPatch=n,t.getPatch=o),t.hasPatch(this)||(this.instance=t,t.patches[this.patchID]=this,"function"==typeof this.instance.addListener?(this._patchParam=e,this.instance.addListener(".created:once",this,c),s&&this.patchNow()):this.patch(e,!0))},patchNow:function(){this.instance.patches[this.patchID]===this&&"function"==typeof this.instance.removeListener&&this.instance.removeListener(".created",this)&&this.patch(this._patchParam,!1)},patch:function(){},superPatch:function(t){t.prototype.patch.apply(this,[].slice.call(arguments,1))},superPatchApply:function(t,e){this.superPatch.apply(this,[t].concat([].slice.call(e)))}});e("Patch",s),s.hasPatch=function(t,e){return t.hasPatch?t.hasPatch(e):!1},s.getPatch=function(t,e){return t&&t.getPatch?t.getPatch(e):null}})(Morgas,Morgas.setModule,Morgas.getModule);