//Morgas.js
(function(e){Morgas={version:"0.3"},µ=Morgas,µ.revert=function(){return µ=e},µ.constantFunctions={ndef:function(){return void 0},nul:function(){return null},f:function(){return!1},t:function(){return!0},zero:function(){return 0},"boolean":function(e){return!!e}},function(){var e={};µ.setModule=function(t,n){return e[t]&&µ.debug("module "+t+" is overwritten",2),e[t]=n},µ.hasModule=function(t){return!!e[t]},µ.getModule=function(t){return e[t]||µ.debug("module "+t+" is not defined\n use µ.hasModule to check for existence",0),e[t]}}();var t=µ.setModule,n=µ.getModule,o=µ.hasModule;µ.debug=function(e,t){t||(t=0),µ.debug.verbose!==!1&&µ.debug.verbose>=t&&("function"==typeof e&&(e=e()),µ.debug.out(e,t))},t("debug",µ.debug),µ.debug.LEVEL={OFF:!1,ERROR:0,WARNING:1,INFO:2,DEBUG:3},µ.debug.verbose=µ.debug.LEVEL.WARNING,µ.getDebug=function(e){µ.debug.verbose=e},µ.setDebug=function(e){µ.debug.verbose=e},µ.debug.out=function(e,t){switch(t){case 0:console.error(e);break;case 1:console.warn(e);break;case 2:console.info(e);break;case 3:default:console.log(e)}},µ.shortcut=function(e,t,u,r){t||(t={});for(var i in e)(function(e,i){var s=void 0;Object.defineProperty(t,i,{configurable:!1,enumerable:!0,get:function(){return(null==s||r)&&("function"==typeof e?s=e(u):u&&o("goPath")?s=n("goPath")(u,e):o(e)?s=n(e):n("debug")("shortcut: could not evaluate "+e)),s}})})(e[i],i);return t},t("shortcut",µ.shortcut);var u=µ.Class=function(e,t){var u=function(){this.init.apply(this,arguments),o("Listeners")&&this instanceof n("Listeners")&&this.setState(".created")};"function"!=typeof e&&(t=e,e=r),e&&(u.prototype=Object.create(e.prototype),u.prototype.constructor=u);for(var i in t)u.prototype[i]=t[i];return u};t("Class",u);var r=µ.BaseClass=u({init:function(){},superInit:function(e){e.prototype.init.apply(this,[].slice.call(arguments,1))},superInitApply:function(e,t){this.superInit.apply(this,[e].concat([].slice.call(t)))}});t("Base",r)})(this.µ);
//Morgas.Patch.js
(function(t,e){var n=function(t){return void 0!==this.getPatch(t)},o=function(t){return this.patches[t.patchID||t.prototype.patchID]},c=function(){this.patch(this._patchParam,!1),delete this._patchParam},s=t.Patch=t.Class({init:function(t,e,s){null==t.patches&&(t.patches={},t.hasPatch=n,t.getPatch=o),t.hasPatch(this)||(this.instance=t,t.patches[this.patchID]=this,"function"==typeof this.instance.addListener?(this._patchParam=e,this.instance.addListener(".created:once",this,c),s&&this.patchNow()):this.patch(e,!0))},patchNow:function(){this.instance.patches[this.patchID]===this&&"function"==typeof this.instance.removeListener&&this.instance.removeListener(".created",this)&&this.patch(this._patchParam,!1)},patch:function(){},superPatch:function(t){t.prototype.patch.apply(this,[].slice.call(arguments,1))},superPatchApply:function(t,e){this.superPatch.apply(this,[t].concat([].slice.call(e)))}});e("Patch",s),s.hasPatch=function(t,e){return t.hasPatch?t.hasPatch(e):!1},s.getPatch=function(t,e){return t&&t.getPatch?t.getPatch(e):null}})(Morgas,Morgas.setModule,Morgas.getModule);
//Morgas.Listeners.js
(function(µ,SMOD,GMOD){
	
	/**Listener Class
	 * Holds Arrays of functions to fire or fire once when "fire" is called
	 * When fired and a listening function returns false firing is aborted
	 * When added a type can be passed:
	 * 		"first" function gets prepended
	 * 		"last" function gets appended (default)
	 * 		"once" function is removed after call 
	 * 			(will only be called when "normal" listeners haven't abort firing.
	 * 			cant abort other "once" listening functions)
	 *  
	 * Can be disabled
	*/
	var LISTENER=µ.Listener=µ.Class(
	{
		init:function ListenerInit()
		{
			this.listeners=new Map(); //TODO use WeakMap when its capable of iterations
			this.disabled=false;
		},
		addListener:function addListener(fn,scope,type)
		{
            var fnType=typeof fn;
			if(fnType==="function"||fnType==="string")
			{
                scope=scope||this;
                var entry=null;
                if(this.listeners.has(scope))
                {
                    entry=this.listeners.get(scope);
                    if(entry.first.has(fn)||entry.normal.has(fn)||entry.last.has(fn)||entry.once.has(fn))
                    {
                        return null;//already listens
                    }
                }
                else
                {
                    entry={first:new Set(),normal:new Set(),last:new Set(),once:new Set()};
                    this.listeners.set(scope,entry);
                }
				if(type)
				{
					type=type.toLowerCase();
				}
				switch(type)
				{
					case "first":
						entry.first.add(fn);
						break;
                    default:
                        entry.normal.add(fn);
                        break;
					case "last":
						entry.last.add(fn);
						break;
					case "once":
						entry.once.add(fn);
                        break;
				}
				return fn;
			}
			return null;//no function
		},
        addListeners:function addListeners(fns,scope,type)
        {
            fns=[].concat(fns);
            var rtn=[];
            for(var i=0;i<fns.length;i++)
            {
                rtn.push(this.addListener(fns[i],scope,type));
            }
            return rtn;
        },
		removeListener:function removeListener(fn,scope)
		{
            //TODO remove fn from all scopes
			var timesFound=0;
            var entry=this.listeners.get(scope);
            if(entry)
            {
                if(typeof fn=="string"&&fn.toLowerCase()=="all")
                {
                    timesFound=entry.first.size+entry.normal.size+entry.last.size+entry.once.size;
                    this.listeners.delete(scope);
                }
                else
                {
                    if(entry.first.delete(fn))
                    {
                        timesFound++;
                    }
                    if(entry.normal.delete(fn))
                    {
                        timesFound++;
                    }
                    if(entry.last.delete(fn))
                    {
                        timesFound++;
                    }
                    if(entry.once.delete(fn))
                    {
                        timesFound++;
                    }
                    if(entry.first.size===0&&entry.normal.size===0&&entry.last.size===0&&entry.once.size===0)
                    {
                        this.listeners.delete(scope);
                    }
                }
                return timesFound;
            }
            else if (typeof fn=="string"&&fn.toLowerCase()=="all"&&scope===undefined)
            {
            	this.listeners.clear();
            	return -1;//unknown count
            }
            return null;
		},
		removeListeners:function removeListeners(fns,scope)
		{
			fns=[].concat(fns);
			var rtn=[];
			if(fns.length==0)fns.push("all");
			for(var i=0;i<fns.length;i++)
			{
				rtn.push(this.removeListener(fns[i],scope));
			}
			return rtn;
		},
		fire:function fire(source,event)
		{
			event=event||{};
			event.source=source;
			if(!this.disabled)
			{
				var run=true;
                for(var [scope,entry] of this.listeners)
                {
                    var it=entry.first.values();
                    var step=undefined;
                    var value=undefined;
                    while(run&&(step=it.next(),value=step.value,!step.done))
                    {
                        if(typeof value==="string")
                        {
                            value=scope[value];
                        }
                        run=false!==value.call(scope,event);
                    }
                    it=entry.normal.values();
                    while(run&&(step=it.next(),value=step.value,!step.done))
                    {
                        if(typeof value==="string")
                        {
                            value=scope[value];
                        }
                        run=false!==value.call(scope,event);
                    }
                    it=entry.last.values();
                    while(run&&(step=it.next(),value=step.value,!step.done))
                    {
                        if(typeof value==="string")
                        {
                            value=scope[value];
                        }
                        run=false!==value.call(scope,event);
                    }
                    it=entry.once.values();
                    while((step=it.next(),value=step.value,!step.done))
                    {
                        if(typeof value==="string")
                        {
                            value=scope[value];
                        }
                        value.call(scope,event);
                    }
                    entry.once.clear();
                    if(entry.first.size===0&&entry.normal.size===0&&entry.last.size===0)
                    {
                        this.listeners["delete"](scope);
                    }
                }
				return run;
			}
			return null;
		},
		setDisabled:function setDisabled(bool){this.disabled=bool===true;},
		isDisabled:function isDisabled(){return this.disabled;}
	});
	SMOD("Listener",LISTENER);
	
	/** StateListener Class
	 * Listener that fires only when "setState" is called
	 * When state is set it fires added listening functions with last arguments immediately
	 * reset trough "resetState";
	 */
	var STATELISTENER=LISTENER.StateListener=µ.Class(LISTENER,
	{
		init:function StateListenerInit(param)
		{
			this.superInit(LISTENER);
			this.state=param.state===true;
			this.stateDisabled=false;
			this.lastEvent=null;
		},
		setDisabled:function setDisabled(bool){this.stateDisabled=bool===true;},
		isDisabled:function isDisabled(){return this.stateDisabled;},
		setState:function setState(source,event)
		{
            event=event||{};
            event.source=source;

			this.state=true;
			this.lastEvent=event;

			var rtn=false;
			if(!this.stateDisabled)
			{
				this.disabled=false;
				rtn=this.fire.apply(this,this.lastEvent);
				this.disabled=true
			}
			return rtn;
		},
		resetState:function resetState(){this.state=false;},
		getState:function getState(){return this.state},
		addListener:function addListener(fn,scope,type)
		{
			var doFire=this.state&&!this.stateDisabled;
			if(doFire)
			{
				fn.apply(scope,this.lastEvent);
			}
			if(!(doFire&&typeof type=="string"&&type.toLowerCase()=="once"))
			{
				return LISTENER.prototype.addListener.apply(this,arguments);
			}
			return null;
		}
	});
	SMOD("StateListener",STATELISTENER);
	
	/** Listeners Class
	 * Manages several Listener instances
	 * provides a "createListener" function:
	 * 		prefix "." indicates a StateListener
	 * 	when adding a listening function the type
	 * 	can be passed followed after the name separated by ":" 
	 */
	var LISTENERS=µ.Listeners=µ.Class(
	{
		rNames:/[\s|,]+/,
		rNameopt:":",
		init:function ListenersInit(dynamic)
		{
			this.listeners={};
			this.createListener(".created");
			this.dynamicListeners=dynamic===true;
		},
		createListener:function createListener(types)
		{
			var typeArr=types.split(this.rNames);
			var fnarr=[].slice.call(arguments,1);
			for(var i=0;i<typeArr.length;i++)
			{
				var name_type=typeArr[i].split(this.rNameopt);
				if(this.listeners[name_type[0]]==null)
				{
					if(name_type[0][0]=='.')
					{
						this.listeners[name_type[0]]=new STATELISTENER({});
					}
					else
					{
						this.listeners[name_type[0]]=new LISTENER({});	
					}
				}
			}
		},
		addListener:function addListener(types,scope/*,functions...*/)
		{
			if(this.dynamicListeners) this.createListener(types);
			var typeArr=types.split(this.rNames);
			var fnarr=[].slice.call(arguments,2);
			for(var i=0;i<typeArr.length;i++)
			{
				var name_type=typeArr[i].split(this.rNameopt);
				if(this.listeners[name_type[0]]!==undefined)
				{
					this.listeners[name_type[0]].addListeners(fnarr,scope,name_type[1]);
				}
			}
		},
		removeListener:function removeListener(names,scope/*,functions...*/)
		{
			var removeCount=0;
			if(names.toLowerCase()=="all")
			{
				for(var i in this.listeners)
				{
					removeCount+=this.listeners[i].removeListeners(names,scope);
				}
			}
			else
			{
				var nameArr=names.split(this.rNames);
				var fnarr=[].slice.call(arguments,2);
				for(var i=0;i<nameArr.length;i++)
				{
					var name=nameArr[i];
					if(this.listeners[name]!==undefined)
					{
						removeCount+=this.listeners[name].removeListeners(fnarr,scope);
					}
				}
			}
			return removeCount;
		},
		fire:function fire(name,event)
		{
			event=event||{};
			event.type=name;
			if(this.listeners[name])
			{
				return this.listeners[name].fire(this,event);
			}
			return undefined
		},
		setDisabled:function setDisabled(names,bool)
		{
			var nameArr=names.split(this.rNames);
			for(var i=0;i<nameArr.length;i++)
			{
				var lstnr=this.listeners[nameArr[i]];
				if(lstnr!=null)
					lstnr.setDisabled(bool);
			}
		},
		isDisabled:function isDisabled(names)
		{
			var rtn=true;
			var nameArr=names.split(this.rNames);
			for(var i=0;rtn&&i<nameArr.length;i++)
			{
				var lstnr=this.listeners[nameArr[i]];
				if(lstnr!=null)
					rtn&=lstnr.isDisabled();
			}
			return rtn;
		},
		setState:function setState(name,event)
		{
			event=event||{};
			event.type=name;
			var lstnr=this.listeners[name];
			if (lstnr&&lstnr instanceof STATELISTENER)
			{
				return lstnr.setState(this,event);
			}
			return undefined;
		},
		resetState:function resetState(names)
		{
			var nameArr=names.split(this.rNames);
			for(var i=0;i<nameArr.length;i++)
			{
				var lstnr=this.listeners[nameArr[i]];
				if(lstnr!=null&&lstnr instanceof STATELISTENER)
					lstnr.resetState();
			}
		},
		getState:function getState(names)
		{
			var rtn=true;
			var nameArr=names.split(this.rNames);
			for(var i=0;rtn&&i<nameArr.length;i++)
			{
				var lstnr=this.listeners[nameArr[i]];
				if(lstnr!=null&&lstnr instanceof STATELISTENER)
					rtn&=lstnr.getState();
			}
			return rtn
		},
		destroy:function()
		{
			this.removeListener("all");
		}
	});
	SMOD("Listeners",LISTENERS);
	LISTENERS.attachListeners=function attachListeners(instance)
	{
		for(var i in LISTENERS.prototype)
		{
			if (i!="init"&&i!="constructor"&&i!="superInit"&&i!="superInitApply")
				instance[i]=LISTENERS.prototype[i];
		}
		LISTENERS.prototype.init.call(instance);
		instance.setState(".created");
	};
	SMOD("attachListeners",LISTENERS.attachListeners);
	
})(Morgas,Morgas.setModule,Morgas.getModule);
//Morgas.util.function.bind.js
(function(t,e){var n=t.util=t.util||{},o=n.function||{};o.bind=Function.bind.call.bind(Function.bind),e("bind",o.bind)})(Morgas,Morgas.setModule,Morgas.getModule);
//Morgas.util.function.rescope.js
(function(t,e){var n=t.util=t.util||{},o=n.function||{};o.rescope=function(t,e){return function(){return t.apply(e,arguments)}},o.rescope.all=function(t,e){t=t||Object.keys(e);for(var n=0;t.length>n;n++)e[t[n]]=o.rescope(e[t[n]],e)},e("rescope",o.rescope)})(Morgas,Morgas.setModule,Morgas.getModule);
//Morgas.util.function.proxy.js
(function(t,e,n){var o=t.util=t.util||{},i=o["function"]||{},r=n("shortcut")({it:"iterate"});i.proxy=function(t,e,n){var o=!1,i=!1;switch(typeof t){case"string":o=!0;break;case"function":i=!0}r.it(e,function(e,r,u,c){var s=c?r:e,a=e,h=null;h=o?function(){return this[t][s].apply(this[t],arguments)}:i?function(){var e=t.call(this,s);return e[s].apply(e,arguments)}:function(){return t[s].apply(t,arguments)},n[a]=h})},e("proxy",i.proxy)})(Morgas,Morgas.setModule,Morgas.getModule);
//Morgas.DependencyResolver.js
(function(t,e){t.DependencyResolver=t.Class({init:function(t){this.config={},this.addConfig(t)},addConfig:function(e,n){if("object"==typeof e){for(var o=Object.keys(e),s=o.length,i=0;s>i;i++){var r=o[i];(void 0===this.config[r]||n)&&(this.config[r]="string"==typeof e[r]?{deps:[e[r]],uses:[]}:Array.isArray(e[r])?{deps:e[r].slice(),uses:[]}:e[r]!==!0?{deps:(e[r].deps||[]).slice(),uses:(e[r].uses||[]).slice()}:!0)}return!0}return t.debug("DependencyResolver.addConfig: obj is not an object",0),!1},resolve:function(e){var n=[],o=[].concat(e);for(e=[].concat(e);o.length>0;){var s=!0,i=this.config[o[0]];if(void 0===i)t.debug("DependencyResolver.resolve: "+o[0]+" is undefined",2);else if(i!==!0){for(var r=i.deps,c=0;i.uses.length>c;c++)-1===o.indexOf(i.uses[c])&&-1===n.indexOf(i.uses[c])&&(o.push(i.uses[c]),e.push(i.uses[c]));for(var c=0;r.length>c;c++){var u=r[c];if(-1===n.indexOf(u)){var a=o.indexOf(u);if(-1!==a){if(-1===e.indexOf(u))throw new TypeError("cyclic object Dependencies ["+o[0]+","+r[c]+"]");o.splice(a,1)}o=[].concat(u,o),s=!1;break}}}s&&n.push(o.shift())}return n},clone:function(e){var n=null;if(e){n={};var o=function(t){return e+t};for(var s in this.config)n[e+s]=this.config[s]===!0?!0:{deps:this.config[s].deps.map(o),uses:this.config[s].uses.map(o)}}return new t.DependencyResolver(n)}}),e("DepRes",t.DependencyResolver)})(Morgas,Morgas.setModule,Morgas.getModule);
//Morgas.NodePatch.js
(function(e,t,n){var i=n("Patch"),s=n("shortcut")({p:"proxy",d:"debug"}),r=e.NodePatch=e.Class(i,{patchID:"NodePatch",patch:function(e){this.parent=null,this.children=[],e=e||{},this.aliasMap={};for(var t={},n=0;r.Aliases.length>n;n++){var i=r.Aliases[n];i in e&&(this.aliasMap[i]=e[i],void 0===this.instance[this.aliasMap[i]]&&(t[i]=this.aliasMap[i]))}s.p(a,t,this.instance);for(var n=0;r.Symbols.length>n;n++){var c=r.Symbols[n];c in e&&o(this,c,e[c])}},addChild:function(e,t){var n,i=a(e),r=this.children.indexOf(e);if(!i)return s.d([e," is not a Node"]),!1;if(-1===r){if(void 0!==t?this.children.splice(t,0,e):(t=this.children.length,this.children.push(e)),null!==i.parent&&i.parent!==this.instance)if(n=i.aliasMap.remove){if(!e[n]())return s.d(["rejected remove child ",e," from old parent ",i.parent],s.d.LEVEL.INFO),this.children.splice(t,1),!1}else i.remove();if(n=i.aliasMap.setParent){if(!e[n](this.instance))return s.d(["rejected to set parent",this.instance," of child ",e],s.d.LEVEL.INFO),this.children.splice(t,1),!1}else i.setParent(this.instance)}return!0},removeChild:function(e){var t=this.children.indexOf(e);if(-1!==t){this.children.splice(t,1);var n=a(e);if(n&&n.parent===this.instance){var i=n.aliasMap.remove;if(i){if(!e[i]())return s.d(["rejected remove child ",e," from parent ",this.instance],s.d.LEVEL.INFO),this.children.splice(t,0,e),!1}else n.remove()}}return!0},setParent:function(e){var t,n=a(e);if(!n)return s.d([e," is not a Node"]),!1;if(e&&this.parent!==e){if(null!==this.parent)if(t=childPatch.aliasMap.remove){if(!child[t]())return s.d(["rejected remove child ",child," from old parent ",childPatch.parent],s.d.LEVEL.INFO),this.children.splice(index,1),!1}else childPatch.remove();if(this.parent=e,t=n.aliasMap.addChild,-1===n.children.indexOf(this.instance))if(t){if(!this.parent[t](this.instance))return s.d(["rejected to add child ",this.instance," to parent ",e],s.d.LEVEL.INFO),this.parent=null,!1}else n.addChild(this.instance)}return!0},remove:function(){if(null!==this.parent){var e=this.parent,t=a(e);if(this.parent=null,-1!==t.children.indexOf(this.instance)){var n=t.aliasMap.removeChild;if(n){if(!e[n](this.instance))return this.parent=e,s.d(["rejected to remove child ",this.instance," from parent ",this.parent],s.d.LEVEL.INFO),!1}else t.removeChild(this.instance)}}return!0},hasChild:function(e){return-1!==this.children.indexOf(e)},isChildOf:function(e){return a(e),e&&e.hasChild(this.instance)}});r.Aliases=["addChild","removeChild","remove","setParent","hasChild"],r.Symbols=["parent","children"],r.BasicAliases={parent:"parent",children:"children",addChild:"addChild",removeChild:"removeChild",remove:"remove",setParent:"setParent",hasChild:"hasChild"},r.Basic=e.Class({init:function(e){e=e||{};for(var t={},n=0,i=Object.keys(r.BasicAliases);i.length>n;n++){var s=i[n],a=e[s];void 0===a&&(a=r.BasicAliases[s]),null!==a&&(t[s]=""+a)}new r(this,t)}});var a=function(e){return"string"==typeof e&&(e=this),e instanceof r?e:i.getPatch(e,r)},o=function(e,t,n){"function"!=typeof e[t]?Object.defineProperty(e.instance,n,{get:function(){return e[t]},set:function(n){e[t]=n}}):e.instance[n]=e[t]};t("NodePatch",r)})(Morgas,Morgas.setModule,Morgas.getModule);
//Morgas.util.object.adopt.js
(function(e,t){var n=e.util=e.util||{},i=n.object||{};i.adopt=function(e,t,n){if(t)for(var i=Object.keys(n?t:e),s=0,r=i[s];i.length>s;r=i[++s])(n||r in t)&&(e[r]=t[r]);return e},t("adopt",i.adopt)})(Morgas,Morgas.setModule,Morgas.getModule);
//Morgas.util.object.goPath.js
(function(e,t){var n=e.util=e.util||{},i=n.object||{};i.goPath=function(e,t,n){var i=t;for("string"==typeof i&&(i=i.split("."));i.length>0&&e;)!n||i[0]in e||(e[i[0]]={}),e=e[i.shift()];return i.length>0?void 0:e},t("goPath",i.goPath)})(Morgas,Morgas.setModule,Morgas.getModule);
//Morgas.util.object.equals.js
(function(e,t){var n=e.util=e.util||{},i=n.object||{};i.equals=function(e,t){if(e===t)return!0;if(void 0===e||null===e)return!1;if(t instanceof RegExp)return t.test(e);if("function"==typeof t)return"function"==typeof e?!1:t(e);if("function"==typeof e.equals)return e.equals(t);if("object"==typeof t){if("object"!=typeof e&&Array.isArray(t))return-1!==t.indexOf(e);for(var n in t)if(!i.equals(e[n],t[n]))return!1;return!0}return!1},t("equals",i.equals)})(Morgas,Morgas.setModule,Morgas.getModule);
//Morgas.util.object.find.js
(function(e,t,n){var i=e.util=e.util||{},r=i.object||{},s=n("shortcut")({eq:"equals",it:"iterate"});r.find=function(e,t,n){var i=[];return s.it(e,function(e,r){s.eq(e,t)&&i.push(n?e:{value:e,index:r})}),i},t("find",r.find)})(Morgas,Morgas.setModule,Morgas.getModule);
//Morgas.util.object.inputValues.js
(function(e,t,n){var i=e.util=e.util||{},s=i.object||{},r=n("shortcut")({goPath:"goPath"});s.setInputValues=function(e,t){for(var n=0;e.length>n;n++){var i=(e[n].dataset.path?e[n].dataset.path+".":"")+e[n].name,s=r.goPath(t,i);void 0!==s&&("checkbox"===e[n].type?e[n].checked=!!s:e[n].value=s)}},s.getInputValues=function(e,t,n){for(var i=t||{},s=0;e.length>s;s++){var a=i;e[s].dataset.path&&(a=r.goPath(a,e[s].dataset.path,!t||n)),void 0!==a&&(e[s].name in a||!t||n)&&(a[e[s].name]="checkbox"===e[s].type?e[s].checked:e[s].value)}return i},t("setInputValues",s.setInputValues),t("getInputValues",s.getInputValues)})(Morgas,Morgas.setModule,Morgas.getModule);
//Morgas.util.object.iterate.js
(function(µ,SMOD,GMOD){

	var util=µ.util=µ.util||{};
	var obj=util.object||{};
	
	/** createIterator
	 * Creates an iterator for {any} in {backward} order.
	 * {isObject} declares {any} as a Map or Array. 
	 */
	//TODO iterator & Set & Map
	obj.createIterator=function* (any,backward,isObject)
	{
		if(any.length>=0&&!isObject)
		{
			for(var i=(backward?any.length-1:0);i>=0&&i<any.length;i+=(backward?-1:1))
			{
				yield [any[i],i];
			}
		}
		else if (typeof any.next==="function"||typeof any.entries==="function")
		{
			if(typeof any.entries==="function")
			{
				any=any.entries();
			}
			var step=null;
			while(step=any.next(),!step.done)
			{
				yield step.value.reverse();
			}
		}
		else
		{
			var k=Object.keys(any);
			if(backward)
			{
				k.revert();
			}
			for(var i=0;i<k.length;i++)
			{
				yield [any[k[i]],k[i]];
			}
		}
		
	};
	/** iterate
	 * Iterates over {any} calling {func} with {scope} in {backward} order.
	 * {isObject} declares {any} as an Object with a length property.
	 * 
	 * returns Array of {func} results
	 */
	//TODO iterator & Set & Map
	obj.iterate=function(any,func,backward,isObject,scope)
	{
		var rtn=[];
		if(!scope)
		{
			scope=window;
		}
		if(any.length>=0&&!isObject)
		{
			for(var i=(backward?any.length-1:0);i>=0&&i<any.length;i+=(backward?-1:1))
			{
				rtn.push(func.call(scope,any[i],i,i,false));
			}
		}
		else if (typeof any.next==="function"||typeof any.entries==="function")
		{
			if(typeof any.entries==="function")
			{
				any=any.entries();
			}
			var step=null,index=0;
			while(step=any.next(),!step.done)
			{
                isObject=step.value[1]!==step.value[0]&&step.value[0]!==index;
				rtn.push(func.call(scope,step.value[1],step.value[0],index,isObject));
                index++;
			}
		}
		else
		{
			var k=Object.keys(any);
			if(backward)
			{
				k.revert();
			}
			for(var i=0;i<k.length;i++)
			{
				rtn.push(func.call(scope,any[k[i]],k[i],i,true));
			}
		}
		return rtn;
	};
	SMOD("Iterator",obj.createIterator);
	SMOD("iterate",obj.iterate);
	
})(Morgas,Morgas.setModule,Morgas.getModule);
//Morgas.util.object.iterateAsync.js
(function(e,t,n){var i=e.util=e.util||{},r=i.object||{},s=n("shortcut")({DET:"Detached",It:"Iterator"});r.iterateAsync=function(e,t,n,i,a,o){return a||(a=window),o||(o=r.iterateAsync.chunk),new s.DET(function(){var r=this,c=s.It(e,n,i),u=setInterval(function(){try{for(var e=c.next(),n=0;o>n&&!e.done;n++,e=c.next())t.call(a,e.value,e.key);e.done&&(r.complete(),clearInterval(u))}catch(i){r.error(i)}},0)})},r.iterateAsync.chunk=1e4,t("iterateAsync",r.iterateAsync)})(Morgas,Morgas.setModule,Morgas.getModule);
//Morgas.util.object.uniquify.js
(function(e,t){var n=e.util=e.util||{},i=n.object||{};i.uniquify=function(e,t){var n;if(t){n=new Map;for(var i=0;e.length>i;i++){var r=e[i];t&&(r=t(e[i])),n.set(r,e[i])}}else n=new Set(e);for(var s=[],a=n.values(),o=a.next();!o.done;o=a.next())s.push(o.value);return s},t("uniquify",i.uniquify)})(Morgas,Morgas.setModule,Morgas.getModule);
//Morgas.util.download.js
(function(e,t){var n=e.util=e.util||{};n.download=function(e,t,i){e instanceof Blob&&(e=URL.createObjectURL(e)),t=t||"file",i=i||"",n.download.el.download=t,n.download.el.href=e.startsWith("data:")||e.startsWith("blob:")?e:"data:"+i+";base64,"+btoa(unescape(encodeURIComponent(e))),document.body.appendChild(n.download.el),n.download.el.click(),n.download.el.remove()},n.download.el=document.createElement("a"),t("download",n.download)})(Morgas,Morgas.setModule,Morgas.getModule);
//Morgas.util.crc32.js
(function(e,t){var n=e.util=e.util||{},i=n.crc32=function(e){for(var t=-1,n=0;e.length>n;n++)t=t>>>8^i.get(255&(t^e.charCodeAt(n)));return(-1^t)>>>0};i.table={},i.get=function(e){if(null==i.table.n){for(var t=e,n=0;8>n;n++)t=1&t?3988292384^t>>>1:t>>>1;i.table[e]=t}return i.table[e]},t("util.crc32",n.crc32)})(Morgas,Morgas.setModule,Morgas.getModule);
//Morgas.util.converter.csvToObject.js
(function(e,t){var n=e.util=e.util||{},i=n.converter||{},r=/[\r\n]+/,o=/;"(([^"]|"")+)"|;([^;]*)/g,a=/"(")/g,s=function(e){var t,n=[];for(e=";"+e,o.lastIndex=0;t=o.exec(e);)n.push((t[1]||t[3]).replace(a,"$1"));return n};i.csvToObject=function(e){var t=e.split(r),n=s(t.shift()),i=[];""===t[t.length-1]&&t.length--,""===n[n.length-1]&&n.length--,i.keys=n;for(var o=0;t.length>o;o++){var a=s(t[o]);""===a[a.length-1]&&a.length--;for(var c={_line:t[o],_overflowCells:a.slice(n.length)},u=0;n.length>u;u++)c[n[u]]=a[u];i.push(c)}return i},t("csvToObject",i.csvToObject)})(Morgas,Morgas.setModule,Morgas.getModule);
//Morgas.util.queryParam.js
(function(e,t){var n=e.util=e.util||{},i=/[\?&]([^=&]+)(=(([^&]|\\&)*))?/g;n.queryParam={},function(e){for(var t;t=i.exec(e);)n.queryParam[t[1]]=t[3]}(decodeURI(window.location.search)),t("queryParam",n.queryParam)})(Morgas,Morgas.setModule,Morgas.getModule);
//Morgas.util.Request.js
(function(e,t,n){e.util=e.util||{};var r=n("shortcut")({det:"Detached"});REQ=e.util.Request=function(e,t){return"string"==typeof e&&(e={url:e}),e={url:e.url,method:e.data?"POST":"GET",async:!0,user:e.user,password:e.password,responseType:e.responseType||"",upload:e.upload,withCredentials:e.withCredentials===!0,contentType:e.contentType,data:e.data},new r.det([function(){var t=this,n=new XMLHttpRequest;n.open(e.method,e.url,e.async,e.user,e.password),n.responseType=e.responseType,e.contentType?n.setRequestHeader("contentType",value):e.data&&(e.contentType="application/x-www-form-urlencoded;charset=UTF-8",e.data.consctuctor===Object&&(e.contentType="application/json;charset=UTF-8",e.data=JSON.stringify(data)),n.setRequestHeader("contentType",e.contentType)),e.upload&&(n.upload=e.upload),n.onload=function(){200==n.status?t.complete(n):t.error(n.statusText)},n.onerror=function(){t.error("Network Error")},e.progress&&(n.onprogress=e.progress),n.send(e.data)},t])},t("Request",REQ),REQ.json=function(e,t){"string"==typeof e&&(e={url:e}),e.responseType="json";var n=REQ(e),r=n.then(function(e){return e.response},!0);return r.fn.push(t),r},t("Request.json",REQ.json)})(Morgas,Morgas.setModule,Morgas.getModule);
//Morgas.Organizer.js
(function(t,e,n){var r=n("shortcut")({it:"iterate",eq:"equals",path:"goPath"}),s=t.Organizer=t.Class({init:function(t){this.values=[],this.filters={},this.maps={},this.groups={},t&&this.add(t)},add:function(t,e,n){return e&&n&&(this.group(e),this.groups[e].values[n]=[]),r.it(t,function(t){var r=this.values.length;this.values.push(t);for(var s in this.maps)this._map(this.maps[s],r);for(var i in this.filters)this._filter(this.filters[i],r);for(var a in this.groups)this._group(this.groups[a],r);e&&n&&this.groups[e].values[n].push(r)},!1,!1,this),this},remove:function(t){var e=this.values.indexOf(t);if(-1!==e){for(var n in this.filters){var r=this.filters[n].values.indexOf(e);-1!==r&&this.filters[n].values.splice(r,1)}for(var n in this.maps)for(var s=this.maps[n].values,i=Object.keys(s),n=0;i.length>n;n++)if(s[i[n]]===t){delete s[i[n]];break}for(var n in this.groups)for(var a=this.groups[n].values,i=Object.keys(a),n=0;i.length>n;n++){var r=a[i[n]].indexOf(e);if(-1!==r){a[i[n]].splice(r,1);break}}delete this.values[e]}return this},_removeType:function(t,e){delete this[t][e]},clear:function(){for(var t in this.filters)this.filters[t].values.length=0;for(var t in this.maps)this.maps[t].values={};for(var t in this.groups)this.groups[t].values={};return this.values.length=0,this},map:function(t,e){"string"==typeof e&&(e=s._pathWrapper(e)),this.maps[t]={fn:e,values:{}};for(var n=0;this.values.length>n;n++)this._map(this.maps[t],n);return this},_map:function(t,e){var n=""+t.fn(this.values[e]);t.values[n]=e},getMap:function(t){var e={};return null!=this.maps[t]&&r.it(this.maps[t].values,function(t,n){e[n]=this.values[t]},!1,!0,this),e},hasMap:function(t){return!!this.maps[t]},hasMapKey:function(t,e){return this.maps[t]&&e in this.maps[t].values},getMapValue:function(t,e){return this.hasMapKey(t,e)?this.values[this.maps[t].values[e]]:void 0},getMapKeys:function(t){return this.hasMap(t)?Object.keys(this.maps[t].values):[]},removeMap:function(t){return this._removeType("maps",t),this},filter:function(t,e,n){switch(typeof e){case"string":e=s._pathWrapper(e);break;case"object":e=s.filterPattern(e)}"string"==typeof n&&(n=s.pathSort(n)),this.filters[t]={filterFn:e,sortFn:n,values:[]};for(var r=0;this.values.length>r;r++)this._filter(this.filters[t],r);return this},_filter:function(t,e){if(!t.filterFn||t.filterFn(this.values[e]))if(t.sortFn){var n=s.getOrderIndex(this.values[e],this.values,t.sortFn,t.values);t.values.splice(n,0,e)}else t.values.push(e)},hasFilter:function(t){return!!this.filters[t]},getFilter:function(t){var e=[];return null!=this.filters[t]&&r.it(this.filters[t].values,function(t,n){e[n]=this.values[t]},!1,!1,this),e},getFilterValue:function(t,e){return this.filters[t]&&this.filters[t].values[e]?this.values[this.filters[t].values[e]]:void 0},getFilterLength:function(t){return this.filters[t]?this.filters[t].values.length:0},removeFilter:function(t){return this._removeType("filters",t),this},group:function(t,e){if("string"==typeof e&&(e=s._pathWrapper(e)),this.groups[t]={values:{},fn:e},e)for(var n=0;this.values.length>n;n++)this._group(this.groups[t],n);return this},_group:function(t,e){if(t.fn){var n=t.fn(this.values[e]);t.values[n]=t.values[n]||[],t.values[n].push(e)}},hasGroup:function(t){return!!this.groups[t]},getGroup:function(t){var e={};if(this.hasGroup(t))for(var n in this.groups[t].values)e[n]=this.getGroupValue(t,n);return e},getGroupValue:function(t,e){var n=[];if(this.hasGroup(t)&&this.groups[t].values[e])for(var r=this.groups[t].values[e],s=0;r.length>s;s++)n.push(this.values[r[s]]);return n},hasGroupKey:function(t,e){return this.hasGroup(t)&&e in this.groups[t].values},getGroupKeys:function(t){return this.hasGroup(t)?Object.keys(this.groups[t].values):[]},removeGroup:function(t){return this._removeType("groups",t),this},destroy:function(){this.values=this.filters=this.maps=this.groups=null,this.add=this.filter=this.map=this.group=t.constantFunctions.ndef}});s._pathWrapper=function(t){return function(e){return r.path(e,t)}},s.sort=function(t,e,n){return(n?-1:1)*(t>e)?1:e>t?-1:0},s.pathSort=function(t,e){return t=t.split(","),function(n,i){for(var a=0,o=0;t.length>o&&0===a;o++)a=s.sort(r.path(n,t[o]),r.path(i,t[o]),e);return a}},s.filterPattern=function(t){return function(e){return r.eq(e,t)}},s.getOrderIndex=function(t,e,n,r){for(var s=(r?r:e).length,i=Math.ceil(s/2),a=i,o=null;i&&a>0&&s>=a&&(1!==i||-1!==o);){o=i;var u=r?e[r[a-1]]:e[a-1];i=Math.ceil(Math.abs(i)/2)*Math.sign(n(t,u))||1,a+=i}return a=Math.min(Math.max(a-1,0),s)},s.getSortedOrder=function(t,e){var n=[];return r.it(t,function(r,i){var a=s.getOrderIndex(r,t,e,n);n.splice(a,0,i)}),n},e("Organizer",s)})(Morgas,Morgas.setModule,Morgas.getModule);
//Morgas.Detached.js
(function(t,e,n){var s=n("shortcut")({debug:"debug"}),r=function(t,e){return function(n,r){try{var i=t.apply({complete:n,error:r},e);i&&"function"==typeof i.then?i.then(n,r):void 0!==i&&n(i)}catch(a){s.debug(a,1),r(a)}}},i=t.Detached=t.Class({init:function(t,e){var n=t===i.WAIT;n&&(t=arguments[1]),this.fn=[].concat(t||[]),this.onError=[],this.onComplete=[],this.onAlways=[],this.onPropagate=[],this.status=0,this.args=void 0,n||(0===this.fn.length?this.status=1:this._start(e))},_start:function(t){for(var e=0;this.fn.length>e;e++)"function"==typeof this.fn[e]&&(this.fn[e]=new Promise(r(this.fn[e],t)));var n=this;Promise.all(this.fn).then(function(t){n._setStatus(1,t)},function(){n._setStatus(-1,Array.slice(arguments,0))})},_setStatus:function(t,e){if(this.status=t,this.args=e,1===t)for(;this.onComplete.length>0;)this.onComplete.shift()._start(this.args);else if(-1===t){for(;this.onError.length>0;)this.onError.shift()._start(this.args);for(;this.onPropagate.length>0;)this.onPropagate.shift()._setStatus(t,this.args)}for(var n=[1===this.status].concat(this.args);this.onAlways.length>0;)this.onAlways.shift()._start(n);this.onComplete.length=this.onError.length=this.onPropagate.length=this.onAlways.length=this.fn.length=0},error:function(t){t=[].concat(t);for(var e=0;t.length>e;e++)t[e]=new i(i.WAIT,t[e]),-1==this.status&&this.finished>=this.fn.length?t[e]._start(this.args):0===this.status&&this.onError.push(t[e]);return t[t.length-1]},complete:function(t){t=[].concat(t);for(var e=0;t.length>e;e++)t[e]=new i(i.WAIT,t[e]),1==this.status?t[e]._start(this.args):0==this.status&&this.onComplete.push(t[e]);return t[t.length-1]},then:function(t,e){var n=this.complete(t);return e===!0?this.propagateError(n):this.error(e),n},always:function(t){t=[].concat(t);for(var e=0;t.length>e;e++)if(t[e]=new i(i.WAIT,t[e]),0!==this.status){var n=[1===this.status].concat(this.args);t[e]._start(n)}else 0===this.status&&this.onAlways.push(t[e]);return t[t.length-1]},propagateError:function(t){0===this.status?this.onPropagate.push(t):-1===this.status&&0===t.status&&t._setStatus(-1,this.args)}});i.WAIT={},e("Detached",i),i.complete=function(){var t=new i;return t.args=arguments,t},i.error=function(){var t=new i;return t.status=-1,t.args=arguments,t},i.detache=function(t,e){return e=e||window,function(){var n=Array.slice(arguments,0);return new i(function(){n.unshift(this);try{return t.apply(e,n)}catch(r){s.debug(r,1),this.error(r)}})}},i.detacheAll=function(t,e){e=[].concat(e);for(var n=0;e.length>n;n++){var s=t[e[n]];t[e[n]]=i.detache(s,t)}}})(Morgas,Morgas.setModule,Morgas.getModule);
//DB/Morgas.DB.js
(function(t,e,n){var r,s,i,a,o=n("shortcut")({debug:"debug",det:"Detached"}),u=t.DB=t.DB||{};r=u.Connector=t.Class({init:function(){o.det.detacheAll(this,["save","load","delete","destroy"])},save:function(){throw Error("abstract Class DB.Connector")},load:function(){throw Error("abstract Class DB.Connector")},"delete":function(){throw Error("abstract Class DB.Connector")},destroy:function(){throw Error("abstract Class DB.Connector")},saveChildren:function(t,e){return this.save(t.getChildren(e))},saveFriendships:function(t,e){var n=t.relations[e],s=t.friends[e];if(!s)return o.debug("no friends in relation "+e+" found",2),new o.det.complete(!1);var i=s[0].relations[n.targetRelationName],a=t.getID();if(null==a)return o.debug("friend id is null",2),new o.det.complete(!1);for(var u=[],h=0;s.length>h;h++){var c=s[h].getID();null!=c&&u.push(c)}if(0===u.length)return o.debug("no friend with friend id found"),new o.det.complete(!1);var f=r.getFriendTableName(t.objectType,e,s[0].objectType,n.targetRelationName),d=t.objectType+"_ID",p=s[0].objectType+"_ID",g=[];n.relatedClass===i.relatedClass&&(p+=2);for(var h=0;u.length>h;h++)g.push(new l(f,d,a,p,u[h]));return this.save(g)},loadParent:function(t,e){var n=t.relations[e],r=n.relatedClass,s=n.fieldName;return this.load(r,{ID:t.getValueOf(s)}).then(function(n){var r=n[0];r.addChild(e,t),this.complete(r)})},loadChildren:function(t,e,n){var r=t.relations[e],s=rel.relatedClass,i=r.fieldName;return n[i]=this.getID(),this.load(s,n).then(function(e){t.addChildren(e),this.complete(e)})},loadFriends:function(t,e,n){var s=this,i=t.relations[e],a=i.relatedClass,u=(new a).relations[i.targetRelationName],h=t.objectType+"_ID",c=a.prototype.objectType+"_ID",f=r.getFriendTableName(t.objectType,e,a.prototype.objectType,i.targetRelationName),d={};i.relatedClass===u.relatedClass&&(c+=2),d[h]=t.getID();var p=l.Generator(f,h,c),g=this.load(p,d);return i.relatedClass===u.relatedClass&&(g=g.then(function(t){var e=this;d[c]=d[h],delete d[h],s.load(p,d).then(function(n){for(var r=0;n.length>r;r++){var s=n[r].fields[h].value;n[r].fields[h].value=n[r].fields[c].value,n[r].fields[c].value=s}e.complete(t.concat(n))},o.debug)},o.debug)),g.then(function(t){return n.ID=t.map(function(t){return t.fields[c].value}),s.load(a,n)},o.debug)},deleteFriendships:function(t,e){var n=t.relations[e],s=t.friends[e];if(!s)return o.debug("no friends in relation "+e+" found",2),new o.det.complete(!1);var i=s[0].relations[n.targetRelationName],a=t.getID();if(null==a)return o.debug("friend id is null",2),new o.det.complete(!1);for(var u=[],h=0;s.length>h;h++){var c=s[h].getID();null!=c&&u.push(c)}if(0===u.length)return o.debug("no friend with friend id found"),new o.det.complete(!1);var f=r.getFriendTableName(t.objectType,e,s[0].objectType,n.targetRelationName),d=t.objectType+"_ID",p=s[0].objectType+"_ID",g=[];if(n.relatedClass===i.relatedClass){p+=2;var v={};v[d]=u,v[p]=a,g.push(v)}var v={};v[d]=a,v[p]=u,g.push(v);for(var y=[],m=l.Generator(f,d,p),h=0;g.length>h;h++)y.push(this["delete"](m,g[h]));return new o.det(y)}}),r.sortObjs=function(t){for(var e={friend:{},fresh:{},preserved:{}},n=0;t.length>n;n++){var r=t[n],s=r instanceof l?"friend":void 0===r.getID()?"fresh":"preserved",i=r.objectType;void 0===e[s][i]&&(e[s][i]=[]),e[s][i].push(r)}return e},r.getDeletePattern=function(t,e){var n=typeof e;if(("number"===n||e instanceof u.Object)&&(e=[e]),Array.isArray(e)){for(var r=0;e.length>r;r++)e[r]instanceof t&&(e[r]=e[r].getID());e={ID:e}}return e},r.getFriendTableName=function(t,e,n,r){return[t,e,n,r].sort().join("_")},e("DBConn",r),s=u.Object=t.Class({objectType:null,init:function(t){if(t=t||{},null==this.objectType)throw"DB.Object: objectType not defined";this.fields={},this.relations={},this.parents={},this.children={},this.friends={},this.addField("ID",a.TYPES.INT,t.ID,{UNIQUE:!0,AUTOGENERATE:!0})},addRelation:function(t,e,n,r,s){this.relations[t]=new i(e,n,r||t,s)},addField:function(t,e,n,r){this.fields[t]=new a(e,n,r)},getValueOf:function(t){return this.fields[t].getValue()},setValueOf:function(t,e){"ID"!=t&&this.fields[t].setValue(e)},setID:function(t){this.fields.ID.setValue(t);for(var e in this.children)for(var n=this.children[e],r=0;n.length>r;r++)n[r]._setParent(this.relations[e],this)},getID:function(){return this.getValueOf("ID")},getParent:function(t){return this.parents[t]},_setParent:function(t,e){var n=this.relations[t.targetRelationName];this.parents[t.targetRelationName]=e,this.setValueOf(n.fieldName,e.getValueOf(t.fieldName))},_add:function(t,e,n){var r=t[e]=t[e]||[];-1==r.indexOf(n)&&r.push(n)},_get:function(t,e){return(t[e]||[]).slice(0)},addChild:function(t,e){this.relations[t].type==i.TYPES.CHILD&&(this._add(this.children,t,e),e._setParent(this.relations[t],this))},addChildren:function(t,e){for(var n=0;e.length>n;n++)this.addChild(t,e[n])},getChildren:function(t){return this._get(this.children,t)},addFriend:function(t,e){this.relations[t].type==i.TYPES.FRIEND&&(this._add(this.friends,t,e),e._add(e.friends,this.relations[t].targetRelationName,this))},addFriends:function(t,e){for(var n=0;e.length>n;n++)this.addFriend(t,e[n])},getFriends:function(t){return this._get(this.friends,t)},toJSON:function(){var t={};for(var e in this.fields)t[e]=this.fields[e].toJSON();return t},fromJSON:function(t){for(var e in this.fields)void 0!==t[e]&&this.fields[e].fromJSON(t[e]);return this},toString:function(){return JSON.stringify(this)}}),e("DBObj",s);var l=u.Firendship=t.Class({init:function(t,e,n,r,s){this.objectType=t,this.fields={},this.fields[e]=new a(a.TYPES.INT,n),this.fields[r]=new a(a.TYPES.INT,s)},toJSON:s.prototype.toJSON,fromJSON:s.prototype.fromJSON});l.Generator=function(e,n,r){return t.Class(l,{objectType:e,init:function(){this.superInit(l,e,n,null,r,null)}})},e("DBFriend",l),i=u.Relation=t.Class({init:function(t,e,n,r){if(null==r){if(e==i.TYPES.PARENT)throw"DB.Relation: "+e+" relation needs a fieldName";r="ID"}this.type=e,this.relatedClass=t,this.fieldName=r,this.targetRelationName=n}}),i.TYPES={PARENT:-1,FRIEND:0,CHILD:1},e("DBRel",i),a=u.Field=t.Class({init:function(t,e,n){this.type=t,this.value=e,this.options=n||{}},setValue:function(t){this.value=t},getValue:function(){return this.value},toJSON:function(){switch(this.type){case a.TYPES.DATE:var t=this.getValue();if(t instanceof Date)return t.getUTCFullYear()+","+t.getUTCMonth()+","+t.getUTCDate()+","+t.getUTCHours()+","+t.getUTCMinutes()+","+t.getUTCSeconds()+","+t.getUTCMilliseconds();break;default:return this.getValue()}},fromJSON:function(t){switch(this.type){case a.TYPES.DATE:this.value=new Date(Date.UTC.apply(Date,t.split(",")));break;default:this.value=t}},toString:function(){return JSON.stringify(this)},fromString:function(t){switch(this.type){case a.TYPES.BOOL:this.value=!!~~t;break;case a.TYPES.INT:this.value=~~t;break;case a.TYPES.DOUBLE:this.value=1*t;break;case a.TYPES.DATE:this.fromJSON(JSON.parse(t));break;case a.TYPES.STRING:case a.TYPES.JSON:default:this.value=JSON.parse(t)}}}),a.TYPES={BOOL:0,INT:1,DOUBLE:2,STRING:3,DATE:4,JSON:5,BLOB:6},e("DBField",a)})(Morgas,Morgas.setModule,Morgas.getModule);
//DB/Morgas.DB.ObjectConnector.js
(function(t,e,n){var r,s=n("DBConn"),i=n("Organizer"),a=n("shortcut")({eq:"equals",find:"find"});r=s.ObjectConnector=t.Class(s,{db:(new i).group("objectType","objectType"),init:function(t){this.superInit(s),t||(this.db=(new i).group("objectType","objectType"))},save:function(t,e){e=[].concat(e);var n=s.sortObjs(e);for(var r in n.fresh)for(var e=n.fresh[r],i=this._getNextID(r),o=0;e.length>o;o++){var u=i.length>o?i[o]:i[i.length-1]+o-i.length+1;e[o].setID(u),this.db.add([{objectType:e[o].objectType,fields:e[o].toJSON()}])}for(var r in n.preserved)for(var e=n.preserved[r],l=this.db.getGroupValue("objectType",r),o=0;e.length>o;o++){var h=a.find(l,{fields:{ID:e[o].getID()}});h.length>0&&(h[0].value.fields=e[o].toJSON())}for(var r in n.friend){for(var e=n.friend[r],l=this.db.getGroupValue("objectType",r),c=[],o=0;e.length>o;o++){var f={fields:e[o].toJSON()},h=a.find(l,f);0===h.length&&(f.objectType=e[o].objectType,c.push(f))}this.db.add(c)}t.complete()},load:function(t,e,n,r,s){var o=this.db.getGroupValue("objectType",e.prototype.objectType),u=[];r&&(r=i.pathSort("fields."+r+".value",s));for(var l=0;o.length>l;l++)if(a.eq(o[l].fields,n)){var h=new e;h.fromJSON(o[l].fields),r?u.splice(i.getOrderIndex(h,u,r),0,h):u.push(h)}t.complete(u)},"delete":function(t,e,n){n={objectType:e.prototype.objectType,fields:s.getDeletePattern(e,n)};for(var r=JSON.stringify(n),i=this.db.filter(r,n).getFilter(r),a=0;i.length>a;a++)this.db.remove(i[a]);this.db.removeFilter(r),t.complete()},destroy:function(){this.db!==r.prototype.db&&this.db.clear(),this.db=null,this.save=this.load=this["delete"]=t.constantFunctions.ndef},_getNextID:function(t){for(var e=[],n=this.db.getGroupValue("objectType",t),r=0;n.length>0;r++){var s=a.find(n,{fields:{ID:r}});0===s.length?e.push(r):n.splice(s[0].index,1)}return e.push(r),e}}),e("ObjectConnector",r)})(Morgas,Morgas.setModule,Morgas.getModule);
//DB/Morgas.DB.IndexedDBConnector.js
(function(e,t,n){var r=n("DBConn"),s=n("shortcut")({det:"Detached",it:"iterate",eq:"equals",find:"find",DBObj:"DBObj",DBFriend:"DBFriend"}),i=e.Class(r,{init:function(e){this.superInit(r),this.name=e,s.det.detacheAll(this,["_open"])},save:function(t,n){n=[].concat(n);var r=i.sortObjs(n),o=Object.keys(r);this._open(o).then(function(n){var i=s.it(r,s.det.detache(function(t,r,i){var o=n.transaction(i,"readwrite");o.onerror=function(n){e.debug(n,0),t.complete(n)},o.oncomplete=function(n){e.debug(n,2),t.complete()};var a=o.objectStore(i);s.it(r,function(t){var n=t.toJSON(),r="put";void 0===n.ID&&(delete n.ID,r="add");var s=a[r](n);s.onerror=function(t){e.debug(t,0)},s.onsuccess=function(n){e.debug(n,3),t.setID&&t.setID(s.result)}})}),!1,!0);n.close(),t.complete(new s.det(i)),this.complete()},t.error)},load:function(t,n,r){this._open().then(function(i){if(i.objectStoreNames.contains(n.prototype.objectType)){var o=i.transaction(n.prototype.objectType,"readonly"),a=[];o.onerror=function(n){e.debug(n,0),i.close(),t.error(n)},o.oncomplete=function(){i.close(),t.complete(a)};var u=o.objectStore(n.prototype.objectType);if("number"==typeof r.ID||Array.isArray(r.ID))s.it([].concat(r.ID),function(t){var i=u.get(t);i.onerror=function(t){e.debug(t,0)},i.onsuccess=function(t){if(e.debug(t,3),s.eq(i.result,r)){var o=new n;o.fromJSON(i.result),a.push(o)}}});else{var l=u.openCursor();l.onerror=function(n){e.debug(n,0),i.close(),t.error(n)},l.onsuccess=function(){if(l.result){if(s.eq(l.result.value,r)){var e=new n;e.fromJSON(l.result.value),a.push(e)}l.result["continue"]()}}}}else i.close(),t.complete([]);this.complete()},t.error)},"delete":function(t,n,i){var o=this,a=n.prototype.objectType,u=null;if("number"==typeof i||i instanceof s.DBObj||i instanceof s.DBFriend||Array.isArray(i)){var l=r.getDeletePattern(n,i).ID;u=s.det.complete(l)}else u=this._open().then(function(n){var r=this,o=[],u=n.transaction(a,"readonly");u.onerror=function(s){e.debug(s,0),n.close(),t.error(s),r.error(s)},u.oncomplete=function(){n.close(),r.complete(o)};var l=u.objectStore(a),c=l.openCursor();c.onerror=function(s){e.debug(s,0),n.close(),t.error(s),r.error(s)},c.onsuccess=function(){c.result&&(s.eq(c.result.value,i)&&o.push(c.result.key),c.result["continue"]())}},t.error);u.then(function(r){return r.length>0?o._open().then(function(i){var o=i.transaction(n.prototype.objectType,"readwrite");o.onerror=function(n){e.debug(n,0),i.close(),t.error(n)};var u=o.objectStore(a),l=s.it(r,s.det.detache(function(t,n){var r=u["delete"](n);r.onerror=function(r){e.debug(r,0),t.complete(n)},r.onsuccess=function(n){e.debug(n,3),t.complete()}}));return new s.det(l).then(function(){i.close(),t.complete(Array.slice(arguments)),this.complete()},e.debug)}):(t.complete(!1),this.complete(),void 0)},function(e){db.close(),t.error(e,0),this.complete()})},destroy:function(){},_open:function(e,t){var n=this,r=indexedDB.open(this.name);r.onerror=function(t){e.error(t,0)},r.onsuccess=function(){for(var s=[],i=r.result,o=r.result.version,a=0;t&&t.length>a;a++)i.objectStoreNames.contains(t[a])||s.push(t[a]);if(0===s.length)e.complete(i);else{var u=indexedDB.open(n.name,o+1);u.onerror=function(t){e.error(t,0)},u.onupgradeneeded=function(){for(var e=0;s.length>e;e++)u.result.createObjectStore(s[e],{keyPath:"ID",autoIncrement:!0})},u.onsuccess=function(){n.version=u.result.version,e.complete(u.result)},i.close()}}}});i.sortObjs=function(e){for(var t={},n=0;e.length>n;n++){var r=e[n],s=r.objectType;void 0===t[s]&&(t[s]=[]),t[s].push(r)}return t},t("IndexedDBConnector",i),t("IDBConn",i)})(Morgas,Morgas.setModule,Morgas.getModule);
//DB/Morgas.Organizer.LazyCache.js
(function(t,e,n){var r=n("Organizer"),s=n("shortcut")({it:"iterate",debug:"debug",det:"Detache"}),i=r.LazyCache=t.Class(r,{init:function(t,e){this.superInit(r),s.det.detacheAll(this,["get","getUnique"]),this.dbClass=t,this.connector=e;var n=new t;for(var i in n.fields)n.fields[i].options.UNIQUE&&(this.map(i,"fields."+i+".value"),this.maps[i].signals={})},add:function(t,e){var n=[],i=[];return s.it(t,function(t){var r=t.getID();t instanceof this.dbClass&&null!=r&&(this.hasMapKey("ID",r)?(e&&(this.values[this.maps.ID.values[r]]=t),n.push(this.values[this.maps.ID.values[r]])):(i.push(t),n.push(t)))},!1,!1,this),r.prototype.add.call(this,i),n},get:function(t,e,n,r){var s=JSON.stringify(e);if(r||null==this.filters[s]){n&&(n="fields."+n+".value"),this.filter(s,i.filterPattern(e),n);var o=this.filters[s].signals=[t];this._load(e,o,!1,r)}else 0==this.filters[s].signals.length?t.complete(this.getFilter(s)):this.filters[s].signals.push(t)},getUnique:function(t,e,n,r){if(null!=this.maps[e])if(r||null==this.maps[e].values[n]){var s={};if(s[e]=n,null==this.maps[e].signals[n]){var i=this.maps[e].signals[n]=[t];this._load(s,i,!0,r)}else this.maps[e].signals[n].push(t)}else t.complete(this.getMapValue(e,n));else t.error("Field "+e+" is not unique")},_load:function(t,e,n,r){s.debug(["LazyCache._load:",arguments],3);var i=this;this.connector.load(this.dbClass,t).then(function(t){i.add([].concat(t),r),t=n?t[0]:t;for(var s;s=e.shift();)s.complete(t)},function(t){s.debug(t,1);for(var r;r=e.shift();)r.complete(n?void 0:[])})}});i.filterPattern=function(t){var e={fields:{}};for(var n in t)e.fields[n]={value:t[n]};return r.filterPattern(e)}})(Morgas,Morgas.setModule,Morgas.getModule);