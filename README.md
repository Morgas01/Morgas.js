Morgas.js
=========

JavaScript data processing framework for fun

[ImportManager](http://morgas01.github.io/Morgas.js/tools/importManager.html)

[tests](http://morgas01.github.io/Morgas.js/test/test_pages.html)

## Usage

- Browser
```html
<script defer src="Morgas.js"></script>
```

- Node
	1. cli
	```
	npm install Morgas
	```
	2. js
	```js
		require("Morgas");
		// creates global "Morgas" and "µ" namespaces
	```
	In Node context every module is available via µ.getModule("\<name\>").

##Node custom modules
In order to load custom modules you need to
```js
µ.addModuleRegister(register,baseDir);
// or
µ.addResourceFolder(folder);
```
In resource folders the filename is automatically also the module name.
 
##Build
npm build script for bundles
```
npm run build <bundleName.js> <module> [module [...]]
```
output
```
build/bundleName.js
build/bundleName.js.map
```

You can also write your own script with `require("Morgas/lib/dependencyParser")` and `µ.getModule("DependencyResolver")`.

##dependencyParser
checks for
```js
SC=SC({
	[...]
});
```
and parses every shortcut as "use" dependency and every `GMOD("<moduleName>")` **before** that as "hard" dependency.


therefore it is recommended to use an IIFE like this:
```json
(function(µ,SMOD,GMOD,HMOD,SC){
	
})(Morgas,Morgas.setModule,Morgas.getModule,Morgas.hasModule,Morgas.shortcut);
```