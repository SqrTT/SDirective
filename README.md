SDirective
==========

Directives is class binded to DOM node. On page loads directives manager search for all directives on the page and build tree form that directives. After tree is ready in each directive instance methods initDir and events will be called. Also there is possible to load only required scripts for page dynamicly using RequireJS. Each instance will have propertys with name $el and options. $el is element where directive is found (wrapped in jQuery object) and options is object with propertys, useful for configuration of directive. Property options is filfiled by directive manager form defferent places (ex. data attributes, JSON in data attribute, JSON in node, object in global name space).

Example of directve:
```
/* global define */
define('test.module', function (require, exports, module) {
    var $ = require('$'),
        baseDir = require('base.dir');
 
    var TestModule = baseDir.extend({
        events : function () {
            // binding events to derectives methods
            this.on('click'/*event type*/, 'button.js-btn'/* event class*/, 'informMainTest' /* method name in directive*/);
            this.on('click', 'a.js-open-collapsed', 'openCollapsed');
        },
        informMainTest : function (e) {
            // call method in parent directive (not inherit parent but upper directive in directives tree)
            this.callParents('runTest',  this.options, 100);
            e.preventDefault();
        },
        openCollapsed : function (event) {
            // context(this) in method leads to directive instance but not to DOM element where event happend (as usual with jQuery)
            $(event.target).closest('.js-collapsed').toggleClass('h-hidden');
            event.preventDefault();
        }
    });
 
    module.exports = TestModule;
});

```
