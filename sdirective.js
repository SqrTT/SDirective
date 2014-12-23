/* global define */
/// define some basic modules
define('window', function (require, exports, module) {
	module.exports = window;
});
define('document', function (require, exports, module) {
	module.exports = require('window').document;
});
define('$', function (require, exports, module) {
	module.exports = require('jQuery');
});
define('$doc', function (require, exports, module) {
	module.exports = require('$')(require('document'));
});
define('$win', function (require, exports, module) {
	module.exports = require('$')(require('window'));
});
define('$body', function (require, exports, module) {
	module.exports = require('$')('body');
});
define('console', function (require, exports, module) {
	module.exports = require('window').console;
});
define('gevent', function (require, exports, module) {
	module.exports = require('$doc');
});
// jQuery don't support AMD
define('jquery', function (require, exports, module) {
	var window = require('window');
	if (window.jQuery) {
		module.exports = window.jQuery;
	} else {
		throw "jQuery is undefined!";
	}
});
define('lodash', function (require, exports, module) {
	var window = require('window');
	if (window._) {
		module.exports = window._;
	} else {
		throw "jQuery is undefined!";
	}
});

define('dirs', function (require, exports, module) {
	module.exports = require('app.directives');
});

define('dir.helper', function (require, exports, module) {
	module.exports = require('dirs').helpers;
});

define('app.directives', function (require, exports, module, undefined) {
	var ctrlsConfig = {},
		availableDirsCnstrs = {},
		DIR_ATTR = 'dir',
		$doc = require('$doc'),
		CONFIG_TPL = 'config-tpl',
		DIR_ATTR_INITED = DIR_ATTR + '-inited',
		inited = false,
		directivesTree = {
			'dir' : $doc,
			'childs' : [],
			'parent' : undefined
		},
		$ = require('$'),
		log = require('console'),
		document = require('document');

	log.info('Init directives controller');


	function callDir(dir, fnName, data) {
		if (dir && dir.dirInstance && $.isFunction(dir.dirInstance[fnName])) {
			return dir.dirInstance[fnName](data);
		}
	}

	function callChilds($el, fnName, data, deep) {
		var result = [];
		deep = deep || 1;

		loopOverChildDirs($el.data(DIR_ATTR_INITED), function (d) {
			result.push(callDir(d, fnName, data));
		}, deep);
		return result;
	}
	function callParents($el, fnName, data, deep) {
		var result = [];
		deep = deep || 1;
		loopOverParents($el.data(DIR_ATTR_INITED), function (d) {
			result.push(callDir(d, fnName, data));
		}, deep);
		return result;
	}

	function loopOverChildDirs(dir, callback, deep) {
		if (deep > 0 && dir && dir.childs && dir.childs.length) {
			$.each(dir.childs, function (c, currDir) {
				loopOverChildDirs(currDir, callback, deep - 1);
				callback(currDir);
			});
		}
	}

	function loopOverParents(dir, callback, deep) {
		var tempDir = dir;
		while (tempDir.parent && deep > 0) {
			tempDir = tempDir.parent;
			callback(tempDir);
			--deep;
		}
	}

	function isElInDOM($el) {
		return $el && $el[0] && $.contains(document.documentElement, $el[0]);
	}

	function isInitedDirectiveEl($el) {
		return !!$el.data(DIR_ATTR_INITED);
	}

	function buildTree(el, currEl) {
		var currDir = currEl || directivesTree,
			$child = $(el || 'html').children(),
			childs = currDir.childs,
			cel;

		$child.each(function () {
			if ($(this).data(DIR_ATTR)) {
				cel = {
					'dirName' : $(this).data(DIR_ATTR),
					'dir' : $(this),
					'childs' : [],
					'parent' : currEl,
					dirInstance: undefined
				};
				buildTree(this, cel);
				childs.push(cel);
				return;
			}
			buildTree(this, currDir);
		});
	}

	function attachEl(el, callback) {
		if (!inited) {
			initDirective(directivesTree);
		}
		var $el = $(el),
			$tmpEl = $el,
			newDir = {'dir' : undefined, 'childs' : [], 'parent' : undefined},
			requireDirs = [];


		while (!isInitedDirectiveEl($tmpEl) && $tmpEl.length) {
			$tmpEl = $tmpEl.parent();
		}
		if (!$tmpEl.length) {
			newDir.dir = $tmpEl = $doc;
		} else {
			newDir = $tmpEl.data(DIR_ATTR_INITED);
		}

		if (newDir.parent) {
			newDir.parent.childs.push(newDir);
		}

		buildTree($tmpEl, newDir);

		// detect requiredDirs
		loopOverChildDirs(newDir, function (d) {
			if (!availableDirsCnstrs[d.dirName]) {
				requireDirs.push(d.dirName);
			}
		}, 1e9);
		require(requireDirs, function () {
			var args = arguments;
			$.each(requireDirs, function(index) {
				availableDirsCnstrs[requireDirs[index]] = args[index];
			});

			initDirective(newDir);
			// initDir
			loopOverChildDirs(newDir, function (d) {
				if (d && d.dirInstance && !d.initedDir) {
					callDir(d, 'initDir');
					d.initedDir = true;
				}
			}, 1e9);
			// events
			loopOverChildDirs(newDir, function (d) {
				if (d && d.dirInstance && !d.initedEvents){
					callDir(d, 'events');
					d.initedEvents = true;
				}
			}, 1e9);

			if (callback) {
				callback();
			}
		});
	}

	function detachEl(el) {
		var $el = $(el),
			$tmpEl = $el;

		while (!isInitedDirectiveEl($tmpEl) && $tmpEl.length) {
			$tmpEl = $tmpEl.parent();
		}
		callChilds($tmpEl, 'destroy', undefined, 1e9);
	}

	function initDirective(dir) {
		if (dir && dir.dir && !dir.dirInstance && !isInitedDirectiveEl(dir.dir)) {
			var $this = dir.dir,
				dirData = $this.data(),
				tpl,
				tplConfig,
				Dir;

			dirData.dir = dirData.dir || 'base.dir';
			Dir = availableDirsCnstrs[dirData.dir];
			if (Dir) {
				if ($.isFunction(Dir)) {
					if (dirData[CONFIG_TPL]) {
						tpl = $this.find('.' + dirData[CONFIG_TPL]);
						if (tpl.length === 1) {
							try {
								tplConfig = JSON.parse(tpl.get(0).innerHTML);
								dirData = $.extend(true, dirData, tplConfig);
							} catch (e) {
								log.error('Can\'t parse JSON form template: ' + dirData[CONFIG_TPL], e);
							}
						} else {
							log.info('Can\'t find config: ' + dirData[CONFIG_TPL]);
						}
					}
					log.debug('Init directive: ' + dirData.dir);
					dir.dirInstance = new Dir(
							$this,
							$.extend(true, ctrlsConfig[dirData.dir] || {}, dirData)
						);
					$this.data(DIR_ATTR_INITED, dir);
				} else {
					log.error('Directive should be a function:' + dirData.dir);
				}
			}
		}
		if (dir && dir.childs && dir.childs.length) {
			$.each(dir.childs, function (c, k) {
				initDirective(k);
			});
		}
	}

	$doc.ready(function () {
			attachEl($doc);
			log.info('Directives controller has been started');
		}
	);

	exports.attachEl = attachEl;
	exports.detachEl = detachEl;
	exports.helpers = {
			'callChilds' : callChilds,
			'callParents' : callParents
		};
});


define('Class', function (require, exports, module) {
/**
 * Inspired by base2 and Prototype
 *
 * This script provides inheritance support
 *
 * The constructor is named 'init()'
 *
 * If a needs to override a method of a superclass, the overridden method can always be
 * called using
 *                   this._super();
 *
 * This is true for the constructor as well as for any other method.
 *
 * see http://etobi.de/blog/artikel/weiterlesen/vererbung-mit-javascript/
 */
	function Class() {}

	(function () {
		var initializing = false,
			fnTest = /xyz/.test(function () {xyz; }) ? /\b_super\b/ : /.*/;

		// The base Class implementation (does nothing)
		//this.Class = function(){};

		// Create a new Class that inherits from this class
		Class.extend = function extend(prop) {
			var _super = this.prototype, name, prototype;

			// Instantiate a base class (but only create the instance,
			// don't run the init constructor)
			initializing = true;
			prototype = new this();
			initializing = false;

			// Copy the properties over onto the new prototype
			for (name in prop) {
				// Check if we're overwriting an existing function
				prototype[name] =
					typeof prop[name] === 'function' &&
					typeof _super[name] === 'function' &&
					fnTest.test(prop[name]) ?
					(function (name, fn) {
						return function () {
							var tmp = this._super, ret;

							// Add a new ._super() method that is the same method
							// but on the super-class
							this._super = _super[name];

							// The method only need to be bound temporarily, so we
							// remove it when we're done executing
							ret = fn.apply(this, arguments);
							this._super = tmp;

							return ret;
						};
					})(name, prop[name])
					:
					prop[name];
			}

			// The dummy class constructor
			function Class() {
				// All construction is actually done in the init method
				if (!initializing && this.init) {
					this.init.apply(this, arguments);
				}
			}

			// Populate our constructed prototype object
			Class.prototype = prototype;

			// Enforce the constructor to be what we expect
			Class.constructor = Class;

			// And make this class extendable
			Class.extend = extend;

			return Class;
		};
	})();
	module.exports = Class;
});


define('base.dir', function (require, exports, module) {
	var helper = require('dir.helper'),
		gevent = require('gevent'),
		uniqueID = 0;

	module.exports = require('Class').extend({
		on : function (event, classes, fnName) {
			var self = this;
			if (!fnName) {
				self.$el.on(event, self[classes].bind(self));
			} else {
				self.$el.on(event, classes, self[fnName].bind(self));
			}
		},
		trigger : function () {
			gevent.trigger.apply(gevent, arguments);
		},
		ong : function (event, classes, fnName) {
			var self = this;

			if (!fnName) {
				gevent.on(event, function (doc, event, data) {
					self[classes].call(self, event, data);
				});
			} else {
				gevent.on(event, classes, function (doc, event, data) {
					self[fnName].call(self, event, data);
				});
			}
		},
		callParents : function (fnName, data, deep) {
			return helper.callParents(this.$el, fnName, data, deep);
		},
		callChilds : function (fnName, data, deep) {
			return helper.callChilds(this.$el, fnName, data, deep);
		},
		destroy : function () {
			this.$el.off();
		},
		init : function ($el, options) {
			this.$el = $el;
			this.type = options.dir;
			this.options = options;
			this._id = uniqueID++;
			$el.addClass('d-' + options.dir);
		}
	});
});

define('generic.input', function (require, exports, module) {
	var defaultDir = require('base.dir'),
		durtyClass = 'durty',
		validClass = 'valid';

	module.exports = defaultDir.extend({
		init : function ($el, options) {
			var self = this;
			if (self._super) {
				self._super($el, options);
			}
			self.initValue = self.getValue();
		},
		events : function () {
			this.on('change', 'updateDurty');
		},
		isDurty : function () {
			return this.initValue !== this.getValue();
		},
		updateDurty : function () {
			var self = this;
			if (self.isDurty()) {
				self.$el.addClass(self.options.durtyClass || durtyClass);
			} else {
				self.$el.removeClass(self.options.durtyClass || durtyClass);
			}
		},
		getValue : function () {
			return this.$el.val();
		},
		setValue : function (val) {
			this.$el.val(val);
			this.updateDurty();
		},
		isValid : function () {
			return true;// TODO: implement validation for inputs
		},
		validate : function () {
			var self = this,
				valid = self.isValid();
			if (valid) {
				self.$el.addClass(self.options.validClass || validClass);
			} else {
				self.$el.removeClass(self.options.validClass || validClass);
			}
			return valid;
		},
		getInput : function () {
			var self = this;
			return {
				'value' : self.getValue(),
				'valid' : self.isValid(),
				'name' : self.$el.prop('name')
			};
		},
		setInput : function (data) {
			if (data && data.value) {
				this.setValue(data.value);
			}
		}
	});
});

if (window && window.requirejs) {
	requirejs(['dirs'], function (dirs) {
		// init
	});
}
