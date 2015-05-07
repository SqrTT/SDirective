SDirective
==========

Directives is class binded to DOM node. On page loads directives manager search for all directives on the page and build tree form that directives. After tree is ready in each directive instance methods initDir and events will be called. Also there is possible to load only required scripts for page dynamicly using RequireJS. Each instance will have propertys with name $el and options. $el is element where directive is found (wrapped in jQuery object) and options is object with propertys, useful for configuration of directive. Property options is filfiled by directive manager form defferent places (ex. data attributes, JSON in data attribute, JSON in node, object in global name space).

Example of directve:
```javascript
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
Goals
====
* reduce dependency of scripts form DOM elements and CSS classes;
* initialization only required scripts and logic;
* increase reusing of code;
* possibility of unit testing (tested not for testing itself but for improve architecture of project, as we know code developed for testing have better quality interfaces and dependency);
* transparent and flexible configuration;
* inheritance of directives with overriding required methods (this will improve code reusing).

Using
====

First of all directive need to be defined in template. More useful place for it is DW modules (ismodule) or assets, so we will have chance to use this module in different pages and be sure that all scripts are working as well.

Definition of directive in template:
```html
<div data-dir="test.module" class="col-md-1">
...
</div>
```
**data-dir** attribute shows what directive should be inited for this template. All data attributes will be pushed to options in directive.

Each directive will be loaded by require method so some AMD library should be used. Directive name is AMD module name.

Directives class is builded with inheritance support same as used in Service Framework and Integration Framework. This will inprove edications of developers.

 
Examples of directive which show element (element selector is specified in options) on click.
```javascript
define('show', function (require, exports, module) {
    var $ = require('$');
 
    module.exports = require('base.dir').extend({
        events : function () {
            this.on('click', 'show');
        },
        show : function (e) {
            $(this.options.show).show();
            e.preventDefault();
        }
    });
});
```

Template is next:
```html
<span data-dir="show" data-show=".js-dialog" >Open!</span>
```

Cases when some new DOM node (with child branches) was added happends. New node can contain directives and they will not be inited (as result will not work as expected). To solve this case there is attachTree method. Method attachTree should be used after node is added in DOM. It will initialize all directives insade and attach it to the parent tree.

Example:
```javascript
// attachTree(el, callback /* optional */);
require('dirs').attachTree(element, function () {
    // do some after dirs is attached and inited
});
```
Similar thins happends when we need to remove node. Solution is the same: we have detachTree method whitch should be used before node will be removed. For each directives will be called destroy method so they have chance to do some before will be deleted. 

Example:
```javascript
// detachTree(el)
require('dirs').detachTree(el); 
```

Configuration
=============
TBD

Inheritance
==========
TBD

Interaction/communication
==========
TBD





