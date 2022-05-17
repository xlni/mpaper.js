/*!
 * Paper.js v0.12.15-develop - The Swiss Army Knife of Vector Graphics Scripting.
 * http://paperjs.org/
 *
 * Copyright (c) 2011 - 2020, Jürg Lehni & Jonathan Puckey
 * http://juerglehni.com/ & https://puckey.studio/
 *
 * Distributed under the MIT license. See LICENSE file for details.
 *
 * All rights reserved.
 *
 * Date: Tue May 17 00:00:23 2022 +0800
 *
 ***
 *
 * Straps.js - Class inheritance library with support for bean-style accessors
 *
 * Copyright (c) 2006 - 2020 Jürg Lehni
 * http://juerglehni.com/
 *
 * Distributed under the MIT license.
 *
 ***
 *
 * Acorn.js
 * https://marijnhaverbeke.nl/acorn/
 *
 * Acorn is a tiny, fast JavaScript parser written in JavaScript,
 * created by Marijn Haverbeke and released under an MIT license.
 *
 */

var mpaper = function(self, undefined) {

self = self || require('./node/self.js');
var window = self.window,
	document = self.document;

var Base = new function() {
	var hidden = /^(statics|enumerable|beans|preserve)$/,
		array = [],
		slice = array.slice,
		create = Object.create,
		describe = Object.getOwnPropertyDescriptor,
		define = Object.defineProperty,

		forEach = array.forEach || function(iter, bind) {
			for (var i = 0, l = this.length; i < l; i++) {
				iter.call(bind, this[i], i, this);
			}
		},

		forIn = function(iter, bind) {
			for (var i in this) {
				if (this.hasOwnProperty(i))
					iter.call(bind, this[i], i, this);
			}
		},

		set = Object.assign || function(dst) {
			for (var i = 1, l = arguments.length; i < l; i++) {
				var src = arguments[i];
				for (var key in src) {
					if (src.hasOwnProperty(key))
						dst[key] = src[key];
				}
			}
			return dst;
		},

		each = function(obj, iter, bind) {
			if (obj) {
				var desc = describe(obj, 'length');
				(desc && typeof desc.value === 'number' ? forEach : forIn)
					.call(obj, iter, bind = bind || obj);
			}
			return bind;
		};

	function inject(dest, src, enumerable, beans, preserve) {
		var beansNames = {};

		function field(name, val) {
			val = val || (val = describe(src, name))
					&& (val.get ? val : val.value);
			if (typeof val === 'string' && val[0] === '#')
				val = dest[val.substring(1)] || val;
			var isFunc = typeof val === 'function',
				res = val,
				prev = preserve || isFunc && !val.base
						? (val && val.get ? name in dest : dest[name])
						: null,
				bean;
			if (!preserve || !prev) {
				if (isFunc && prev)
					val.base = prev;
				if (isFunc && beans !== false
						&& (bean = name.match(/^([gs]et|is)(([A-Z])(.*))$/)))
					beansNames[bean[3].toLowerCase() + bean[4]] = bean[2];
				if (!res || isFunc || !res.get || typeof res.get !== 'function'
						|| !Base.isPlainObject(res)) {
					res = { value: res, writable: true };
				}
				if ((describe(dest, name)
						|| { configurable: true }).configurable) {
					res.configurable = true;
					res.enumerable = enumerable != null ? enumerable : !bean;
				}
				define(dest, name, res);
			}
		}
		if (src) {
			for (var name in src) {
				if (src.hasOwnProperty(name) && !hidden.test(name))
					field(name);
			}
			for (var name in beansNames) {
				var part = beansNames[name],
					set = dest['set' + part],
					get = dest['get' + part] || set && dest['is' + part];
				if (get && (beans === true || get.length === 0))
					field(name, { get: get, set: set });
			}
		}
		return dest;
	}

	function Base() {
		for (var i = 0, l = arguments.length; i < l; i++) {
			var src = arguments[i];
			if (src)
				set(this, src);
		}
		return this;
	}

	return inject(Base, {
		inject: function(src) {
			if (src) {
				var statics = src.statics === true ? src : src.statics,
					beans = src.beans,
					preserve = src.preserve;
				if (statics !== src)
					inject(this.prototype, src, src.enumerable, beans, preserve);
				inject(this, statics, null, beans, preserve);
			}
			for (var i = 1, l = arguments.length; i < l; i++)
				this.inject(arguments[i]);
			return this;
		},

		extend: function() {
			var base = this,
				ctor,
				proto;
			for (var i = 0, obj, l = arguments.length;
					i < l && !(ctor && proto); i++) {
				obj = arguments[i];
				ctor = ctor || obj.initialize;
				proto = proto || obj.prototype;
			}
			ctor = ctor || function() {
				base.apply(this, arguments);
			};
			proto = ctor.prototype = proto || create(this.prototype);
			define(proto, 'constructor',
					{ value: ctor, writable: true, configurable: true });
			inject(ctor, this);
			if (arguments.length)
				this.inject.apply(ctor, arguments);
			ctor.base = base;
			return ctor;
		}
	}).inject({
		enumerable: false,

		initialize: Base,

		set: Base,

		inject: function() {
			for (var i = 0, l = arguments.length; i < l; i++) {
				var src = arguments[i];
				if (src) {
					inject(this, src, src.enumerable, src.beans, src.preserve);
				}
			}
			return this;
		},

		extend: function() {
			var res = create(this);
			return res.inject.apply(res, arguments);
		},

		each: function(iter, bind) {
			return each(this, iter, bind);
		},

		clone: function() {
			return new this.constructor(this);
		},

		statics: {
			set: set,
			each: each,
			create: create,
			define: define,
			describe: describe,

			clone: function(obj) {
				return set(new obj.constructor(), obj);
			},

			isPlainObject: function(obj) {
				var ctor = obj != null && obj.constructor;
				return ctor && (ctor === Object || ctor === Base
						|| ctor.name === 'Object');
			},

			pick: function(a, b) {
				return a !== undefined ? a : b;
			},

			slice: function(list, begin, end) {
				return slice.call(list, begin, end);
			}
		}
	});
};

if (typeof module !== 'undefined')
	module.exports = Base;

Base.inject({
	enumerable: false,

	toString: function() {
		return this._id != null
			?  (this._class || 'Object') + (this._name
				? " '" + this._name + "'"
				: ' @' + this._id)
			: '{ ' + Base.each(this, function(value, key) {
				if (!/^_/.test(key)) {
					var type = typeof value;
					this.push(key + ': ' + (type === 'number'
							? Formatter.instance.number(value)
							: type === 'string' ? "'" + value + "'" : value));
				}
			}, []).join(', ') + ' }';
	},

	getClassName: function() {
		return this._class || '';
	},

	importJSON: function(json) {
		return Base.importJSON(json, this);
	},

	exportJSON: function(options) {
		return Base.exportJSON(this, options);
	},

	toJSON: function() {
		return Base.serialize(this);
	},

	set: function(props, exclude) {
		if (props)
			Base.filter(this, props, exclude, this._prioritize);
		return this;
	}
}, {

beans: false,
statics: {
	exports: {},

	extend: function extend() {
		var res = extend.base.apply(this, arguments),
			name = res.prototype._class;
		if (name && !Base.exports[name])
			Base.exports[name] = res;
		return res;
	},

	equals: function(obj1, obj2) {
		if (obj1 === obj2)
			return true;
		if (obj1 && obj1.equals)
			return obj1.equals(obj2);
		if (obj2 && obj2.equals)
			return obj2.equals(obj1);
		if (obj1 && obj2
				&& typeof obj1 === 'object' && typeof obj2 === 'object') {
			if (Array.isArray(obj1) && Array.isArray(obj2)) {
				var length = obj1.length;
				if (length !== obj2.length)
					return false;
				while (length--) {
					if (!Base.equals(obj1[length], obj2[length]))
						return false;
				}
			} else {
				var keys = Object.keys(obj1),
					length = keys.length;
				if (length !== Object.keys(obj2).length)
					return false;
				while (length--) {
					var key = keys[length];
					if (!(obj2.hasOwnProperty(key)
							&& Base.equals(obj1[key], obj2[key])))
						return false;
				}
			}
			return true;
		}
		return false;
	},

	read: function(list, start, options, amount) {
		if (this === Base) {
			var value = this.peek(list, start);
			list.__index++;
			return value;
		}
		var proto = this.prototype,
			readIndex = proto._readIndex,
			begin = start || readIndex && list.__index || 0,
			length = list.length,
			obj = list[begin];
		amount = amount || length - begin;
		if (obj instanceof this
			|| options && options.readNull && obj == null && amount <= 1) {
			if (readIndex)
				list.__index = begin + 1;
			return obj && options && options.clone ? obj.clone() : obj;
		}
		obj = Base.create(proto);
		if (readIndex)
			obj.__read = true;
		obj = obj.initialize.apply(obj, begin > 0 || begin + amount < length
				? Base.slice(list, begin, begin + amount)
				: list) || obj;
		if (readIndex) {
			list.__index = begin + obj.__read;
			var filtered = obj.__filtered;
			if (filtered) {
				list.__filtered = filtered;
				obj.__filtered = undefined;
			}
			obj.__read = undefined;
		}
		return obj;
	},

	peek: function(list, start) {
		return list[list.__index = start || list.__index || 0];
	},

	remain: function(list) {
		return list.length - (list.__index || 0);
	},

	readList: function(list, start, options, amount) {
		var res = [],
			entry,
			begin = start || 0,
			end = amount ? begin + amount : list.length;
		for (var i = begin; i < end; i++) {
			res.push(Array.isArray(entry = list[i])
					? this.read(entry, 0, options)
					: this.read(list, i, options, 1));
		}
		return res;
	},

	readNamed: function(list, name, start, options, amount) {
		var value = this.getNamed(list, name),
			hasValue = value !== undefined;
		if (hasValue) {
			var filtered = list.__filtered;
			if (!filtered) {
				var source = this.getSource(list);
				filtered = list.__filtered = Base.create(source);
				filtered.__unfiltered = source;
			}
			filtered[name] = undefined;
		}
		return this.read(hasValue ? [value] : list, start, options, amount);
	},

	readSupported: function(list, dest) {
		var source = this.getSource(list),
			that = this,
			read = false;
		if (source) {
			Object.keys(source).forEach(function(key) {
				if (key in dest) {
					var value = that.readNamed(list, key);
					if (value !== undefined) {
						dest[key] = value;
					}
					read = true;
				}
			});
		}
		return read;
	},

	getSource: function(list) {
		var source = list.__source;
		if (source === undefined) {
			var arg = list.length === 1 && list[0];
			source = list.__source = arg && Base.isPlainObject(arg)
				? arg : null;
		}
		return source;
	},

	getNamed: function(list, name) {
		var source = this.getSource(list);
		if (source) {
			return name ? source[name] : list.__filtered || source;
		}
	},

	hasNamed: function(list, name) {
		return !!this.getNamed(list, name);
	},

	filter: function(dest, source, exclude, prioritize) {
		var processed;

		function handleKey(key) {
			if (!(exclude && key in exclude) &&
				!(processed && key in processed)) {
				var value = source[key];
				if (value !== undefined)
					dest[key] = value;
			}
		}

		if (prioritize) {
			var keys = {};
			for (var i = 0, key, l = prioritize.length; i < l; i++) {
				if ((key = prioritize[i]) in source) {
					handleKey(key);
					keys[key] = true;
				}
			}
			processed = keys;
		}

		Object.keys(source.__unfiltered || source).forEach(handleKey);
		return dest;
	},

	isPlainValue: function(obj, asString) {
		return Base.isPlainObject(obj) || Array.isArray(obj)
				|| asString && typeof obj === 'string';
	},

	serialize: function(obj, options, compact, dictionary) {
		options = options || {};

		var isRoot = !dictionary,
			res;
		if (isRoot) {
			options.formatter = new Formatter(options.precision);
			dictionary = {
				length: 0,
				definitions: {},
				references: {},
				add: function(item, create) {
					var id = '#' + item._id,
						ref = this.references[id];
					if (!ref) {
						this.length++;
						var res = create.call(item),
							name = item._class;
						if (name && res[0] !== name)
							res.unshift(name);
						this.definitions[id] = res;
						ref = this.references[id] = [id];
					}
					return ref;
				}
			};
		}
		if (obj && obj._serialize) {
			res = obj._serialize(options, dictionary);
			var name = obj._class;
			if (name && !obj._compactSerialize && (isRoot || !compact)
					&& res[0] !== name) {
				res.unshift(name);
			}
		} else if (Array.isArray(obj)) {
			res = [];
			for (var i = 0, l = obj.length; i < l; i++)
				res[i] = Base.serialize(obj[i], options, compact, dictionary);
		} else if (Base.isPlainObject(obj)) {
			res = {};
			var keys = Object.keys(obj);
			for (var i = 0, l = keys.length; i < l; i++) {
				var key = keys[i];
				res[key] = Base.serialize(obj[key], options, compact,
						dictionary);
			}
		} else if (typeof obj === 'number') {
			res = options.formatter.number(obj, options.precision);
		} else {
			res = obj;
		}
		return isRoot && dictionary.length > 0
				? [['dictionary', dictionary.definitions], res]
				: res;
	},

	deserialize: function(json, create, _data, _setDictionary, _isRoot) {
		var res = json,
			isFirst = !_data,
			hasDictionary = isFirst && json && json.length
				&& json[0][0] === 'dictionary';
		_data = _data || {};
		if (Array.isArray(json)) {
			var type = json[0],
				isDictionary = type === 'dictionary';
			if (json.length == 1 && /^#/.test(type)) {
				return _data.dictionary[type];
			}
			type = Base.exports[type];
			res = [];
			for (var i = type ? 1 : 0, l = json.length; i < l; i++) {
				res.push(Base.deserialize(json[i], create, _data,
						isDictionary, hasDictionary));
			}
			if (type) {
				var args = res;
				if (create) {
					res = create(type, args, isFirst || _isRoot);
				} else {
					res = new type(args);
				}
			}
		} else if (Base.isPlainObject(json)) {
			res = {};
			if (_setDictionary)
				_data.dictionary = res;
			for (var key in json)
				res[key] = Base.deserialize(json[key], create, _data);
		}
		return hasDictionary ? res[1] : res;
	},

	exportJSON: function(obj, options) {
		var json = Base.serialize(obj, options);
		return options && options.asString == false
				? json
				: JSON.stringify(json);
	},

	importJSON: function(json, target) {
		return Base.deserialize(
				typeof json === 'string' ? JSON.parse(json) : json,
				function(ctor, args, isRoot) {
					var useTarget = isRoot && target
							&& target.constructor === ctor,
						obj = useTarget ? target
							: Base.create(ctor.prototype);
					if (args.length === 1 && obj instanceof Item
							&& (useTarget || !(obj instanceof Layer))) {
						var arg = args[0];
						if (Base.isPlainObject(arg)) {
							arg.insert = false;
							if (useTarget) {
								args = args.concat([{ insert: true }]);
							}
						}
					}
					(useTarget ? obj.set : ctor).apply(obj, args);
					if (useTarget)
						target = null;
					return obj;
				});
	},

	push: function(list, items) {
		var itemsLength = items.length;
		if (itemsLength < 4096) {
			list.push.apply(list, items);
		} else {
			var startLength = list.length;
			list.length += itemsLength;
			for (var i = 0; i < itemsLength; i++) {
				list[startLength + i] = items[i];
			}
		}
		return list;
	},

	splice: function(list, items, index, remove) {
		var amount = items && items.length,
			append = index === undefined;
		index = append ? list.length : index;
		if (index > list.length)
			index = list.length;
		for (var i = 0; i < amount; i++)
			items[i]._index = index + i;
		if (append) {
			Base.push(list, items);
			return [];
		} else {
			var args = [index, remove];
			if (items)
				Base.push(args, items);
			var removed = list.splice.apply(list, args);
			for (var i = 0, l = removed.length; i < l; i++)
				removed[i]._index = undefined;
			for (var i = index + amount, l = list.length; i < l; i++)
				list[i]._index = i;
			return removed;
		}
	},

	capitalize: function(str) {
		return str.replace(/\b[a-z]/g, function(match) {
			return match.toUpperCase();
		});
	},

	camelize: function(str) {
		return str.replace(/-(.)/g, function(match, chr) {
			return chr.toUpperCase();
		});
	},

	hyphenate: function(str) {
		return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
	}
}});

var Emitter = {
	on: function(type, func) {
		if (typeof type !== 'string') {
			Base.each(type, function(value, key) {
				this.on(key, value);
			}, this);
		} else {
			var types = this._eventTypes,
				entry = types && types[type],
				handlers = this._callbacks = this._callbacks || {};
			handlers = handlers[type] = handlers[type] || [];
			if (handlers.indexOf(func) === -1) {
				handlers.push(func);
				if (entry && entry.install && handlers.length === 1)
					entry.install.call(this, type);
			}
		}
		return this;
	},

	off: function(type, func) {
		if (typeof type !== 'string') {
			Base.each(type, function(value, key) {
				this.off(key, value);
			}, this);
			return;
		}
		var types = this._eventTypes,
			entry = types && types[type],
			handlers = this._callbacks && this._callbacks[type],
			index;
		if (handlers) {
			if (!func || (index = handlers.indexOf(func)) !== -1
					&& handlers.length === 1) {
				if (entry && entry.uninstall)
					entry.uninstall.call(this, type);
				delete this._callbacks[type];
			} else if (index !== -1) {
				handlers.splice(index, 1);
			}
		}
		return this;
	},

	once: function(type, func) {
		return this.on(type, function handler() {
			func.apply(this, arguments);
			this.off(type, handler);
		});
	},

	emit: function(type, event) {
		var handlers = this._callbacks && this._callbacks[type];
		if (!handlers)
			return false;
		var args = Base.slice(arguments, 1),
			setTarget = event && event.target && !event.currentTarget;
		handlers = handlers.slice();
		if (setTarget)
			event.currentTarget = this;
		for (var i = 0, l = handlers.length; i < l; i++) {
			if (handlers[i].apply(this, args) == false) {
				if (event && event.stop)
					event.stop();
				break;
		   }
		}
		if (setTarget)
			delete event.currentTarget;
		return true;
	},

	responds: function(type) {
		return !!(this._callbacks && this._callbacks[type]);
	},

	attach: '#on',
	detach: '#off',
	fire: '#emit',

	_installEvents: function(install) {
		var types = this._eventTypes,
			handlers = this._callbacks,
			key = install ? 'install' : 'uninstall';
		if (types) {
			for (var type in handlers) {
				if (handlers[type].length > 0) {
					var entry = types[type],
						func = entry && entry[key];
					if (func)
						func.call(this, type);
				}
			}
		}
	},

	statics: {
		inject: function inject(src) {
			var events = src._events;
			if (events) {
				var types = {};
				Base.each(events, function(entry, key) {
					var isString = typeof entry === 'string',
						name = isString ? entry : key,
						part = Base.capitalize(name),
						type = name.substring(2).toLowerCase();
					types[type] = isString ? {} : entry;
					name = '_' + name;
					src['get' + part] = function() {
						return this[name];
					};
					src['set' + part] = function(func) {
						var prev = this[name];
						if (prev)
							this.off(type, prev);
						if (func)
							this.on(type, func);
						this[name] = func;
					};
				});
				src._eventTypes = types;
			}
			return inject.base.apply(this, arguments);
		}
	}
};

var PaperScope = Base.extend({
	_class: 'PaperScope',

	initialize: function PaperScope() {
		mpaper = this;
		this.settings = new Base({
			applyMatrix: true,
			insertItems: false,
			handleSize: 4,
			hitTolerance: 0
		});
		this.project = null;
		this.projects = [];
		this.tools = [];
		this.studio = new Studio({});
		this._id = PaperScope._id++;
		PaperScope._scopes[this._id] = this;
		var proto = PaperScope.prototype;
		if (!this.support) {
			var ctx = CanvasProvider.getContext(1, 1) || {};
			proto.support = {
				nativeDash: 'setLineDash' in ctx || 'mozDash' in ctx,
				nativeBlendModes: BlendMode.nativeModes
			};
			CanvasProvider.release(ctx);
		}
		if (!this.agent) {
			var user = self.navigator.userAgent.toLowerCase(),
				os = (/(darwin|win|mac|linux|freebsd|sunos)/.exec(user)||[])[0],
				platform = os === 'darwin' ? 'mac' : os,
				agent = proto.agent = proto.browser = { platform: platform };
			if (platform)
				agent[platform] = true;
			user.replace(
				/(opera|chrome|safari|webkit|firefox|msie|trident|atom|node|jsdom)\/?\s*([.\d]+)(?:.*version\/([.\d]+))?(?:.*rv\:v?([.\d]+))?/g,
				function(match, n, v1, v2, rv) {
					if (!agent.chrome) {
						var v = n === 'opera' ? v2 :
								/^(node|trident)$/.test(n) ? rv : v1;
						agent.version = v;
						agent.versionNumber = parseFloat(v);
						n = { trident: 'msie', jsdom: 'node' }[n] || n;
						agent.name = n;
						agent[n] = true;
					}
				}
			);
			if (agent.chrome)
				delete agent.webkit;
			if (agent.atom)
				delete agent.chrome;
		}
	},

	version: "0.12.15-develop",

	getView: function() {
		var project = this.project;
		return project && project._view;
	},

	getPaper: function() {
		return this;
	},

	execute: function(code, options) {
			var exports = mpaper.PaperScript.execute(code, this, options);
			View.updateFocus();
			return exports;
	},

	install: function(scope) {
		var that = this;
		Base.each(['project', 'view', 'tool', 'studio'], function(key) {
			Base.define(scope, key, {
				configurable: true,
				get: function() {
					return that[key];
				}
			});
		});
		for (var key in this)
			if (!/^_/.test(key) && this[key])
				scope[key] = this[key];
	},

	setup: function(element) {
		mpaper = this;
		this.project = new Project(element);
		this.project.studio = this.studio;
		return this;
	},

	createCanvas: function(width, height) {
		return CanvasProvider.getCanvas(width, height);
	},

	activate: function() {
		mpaper = this;
	},

	clear: function() {
		var projects = this.projects,
			tools = this.tools;
		for (var i = projects.length - 1; i >= 0; i--)
			projects[i].remove();
		for (var i = tools.length - 1; i >= 0; i--)
			tools[i].remove();
	},

	remove: function() {
		this.clear();
		delete PaperScope._scopes[this._id];
	},

	statics: new function() {
		function handleAttribute(name) {
			name += 'Attribute';
			return function(el, attr) {
				return el[name](attr) || el[name]('data-mpaper-' + attr);
			};
		}

		return {
			_scopes: {},
			_id: 0,

			get: function(id) {
				return this._scopes[id] || null;
			},

			getAttribute: handleAttribute('get'),
			hasAttribute: handleAttribute('has')
		};
	}
});

var PaperScopeItem = Base.extend(Emitter, {

	initialize: function(activate) {
		this._scope = mpaper;
		this._index = this._scope[this._list].push(this) - 1;
		if (activate || !this._scope[this._reference])
			this.activate();
	},

	activate: function() {
		if (!this._scope)
			return false;
		var prev = this._scope[this._reference];
		if (prev && prev !== this)
			prev.emit('deactivate');
		this._scope[this._reference] = this;
		this.emit('activate', prev);
		return true;
	},

	isActive: function() {
		return this._scope[this._reference] === this;
	},

	remove: function() {
		if (this._index == null)
			return false;
		Base.splice(this._scope[this._list], null, this._index, 1);
		if (this._scope[this._reference] == this)
			this._scope[this._reference] = null;
		this._scope = null;
		return true;
	},

	getView: function() {
		return this._scope.getView();
	}
});

if(!window["OpenAjax"]){
	OpenAjax = new function(){
		var t = true;
		var f = false;
		var g = window;
		var ooh = "org.openajax.hub.";

		var h = {};
		this.hub = h;
		h.implementer = "http://openajax.org";
		h.implVersion = "2.0";
		h.specVersion = "2.0";
		h.implExtraData = {};
		var libs = {};
		h.libraries = libs;

		h.registerLibrary = function(prefix, nsURL, version, extra){
			libs[prefix] = {
				prefix: prefix,
				namespaceURI: nsURL,
				version: version,
				extraData: extra
			};
			this.publish(ooh+"registerLibrary", libs[prefix]);
		}
		h.unregisterLibrary = function(prefix){
			this.publish(ooh+"unregisterLibrary", libs[prefix]);
			delete libs[prefix];
		}

		h._subscriptions = {};
		h._cleanup = [];
		h._subIndex = 0;
		h._pubDepth = 0;

		h.cleanup= function( )
		{
	  	      this._subscriptions = {};
		     this._cleanup = [];
		     this._subIndex = 0;
		     this._pubDepth = 0;
		}

		h._getData = function(timeline){
			var tllist = this._subscriptions[timeline];
	        if( typeof tllist === 'undefined' ){
	        	tllist = { c:{}, s:[] };
	            this._subscriptions[timeline] = tllist;
	        }
	        return tllist;
		}
		h.subscribe = function(name, callback, scope, subscriberData, filter, timeline)
		{
			if(!scope){
				scope = window;
			}
			timeline = timeline || "";
			var tllist = this._getData(timeline);
			var handle = name + "." + this._subIndex;
			var sub = { scope: scope, cb: callback, fcb: filter, tl: timeline, data: subscriberData, sid: this._subIndex++, hdl: handle };
			var path = name.split(".");
	 		this._subscribe(tllist, path, 0, sub);
			return handle;
		}

		h.publish = function(  name, message)
		{
			var path = name.split(".");
			for(var key in this._subscriptions){
				this._pubDepth++;
				this._publish(this._getData(key), path, 0, name, message);
				this._pubDepth--;
				if((this._cleanup.length > 0) && (this._pubDepth == 0)) {
					for(var i = 0; i < this._cleanup.length; i++)
						this.unsubscribe(this._cleanup[i].hdl);
					delete(this._cleanup);
					this._cleanup = [];
				}
			}
		}

		h.unsubscribe = function(sub)
		{
			var path = sub.split(".");
			var sid = path.pop();
			for(var key in this._subscriptions){
			    this._unsubscribe(this._getData(key), path, 0, sid);
			}
		}
		h.cleanupTimeline = function(timeline){
			try{
			   delete this._subscriptions[timeline];
			}catch(e){
			   console.log(e);
			}
		}
		h._subscribe = function(tree, path, index, sub)
		{
			var token = path[index];
			if(index == path.length)
				tree.s.push(sub);
			else {
				if(typeof tree.c == "undefined")
					 tree.c = {};
				if(typeof tree.c[token] == "undefined") {
					tree.c[token] = { c: {}, s: [] };
					this._subscribe(tree.c[token], path, index + 1, sub);
				}
				else
					this._subscribe( tree.c[token], path, index + 1, sub);
			}
		}

		h._publish = function(  tree, path, index, name, msg, pid) {
			if(typeof tree != "undefined") {
				var node;
				if(index == path.length) {
					node = tree;
				} else {
					this._publish(  tree.c[path[index]], path, index + 1, name, msg, pid);
					this._publish(  tree.c["*"], path, index + 1, name, msg, pid);
					node = tree.c["**"];
				}
				if(typeof node != "undefined") {
					var callbacks = node.s;
					var max = callbacks.length;
					for(var i = 0; i < max; i++) {
						if(callbacks[i].cb ) {
							var sc = callbacks[i].scope;
							var cb = callbacks[i].cb;
							var fcb = callbacks[i].fcb;
							var d = callbacks[i].data;
							if(typeof cb == "string"){
								cb = sc[cb];
							}
							if(typeof fcb == "string"){
								fcb = sc[fcb];
							}
							if((!fcb) || (fcb.call(sc, name, msg, d))) {
								var p = name.indexOf('.');
								var sname = name.substring(p+1);
								cb.call(sc, sname, msg, d, pid);
							}
						}
					}
				}
			}
		}
		h._unsubscribe = function(tree, path, index, sid) {
			if(typeof tree != "undefined") {
				if(index < path.length) {
					var childNode = tree.c[path[index]];
					this._unsubscribe(childNode, path, index + 1, sid);
					if(childNode.s.length == 0) {
						for(var x in childNode.c)
					 		return;
						delete tree.c[path[index]];
					}
					return;
				}
				else {
					var callbacks = tree.s;
					var max = callbacks.length;
					for(var i = 0; i < max; i++)
						if(sid == callbacks[i].sid) {
							if(this._pubDepth > 0) {
								callbacks[i].cb = null;
								this._cleanup.push(callbacks[i]);
							}
							else
								callbacks.splice(i, 1);
							return;
						}
				}
			}
		}
	};
	OpenAjax.hub.registerLibrary("OpenAjax", "http://openajax.org/hub", "1.0", {});
}

if(!window["PageBus"]) {
  function PageBus(app) {
	var D = 0;
	var Q = [];
	var that = this;
	this.app = app || {docuuid: 'a'};
	this.version = "2.0.0";
	this._debug = function() {
	};

	_badParm = function() {
		throw new Error("OpenAjax.hub.Errors.BadParameters");
	}

	_valPub = function(name) {
		if((name == null) || (name.indexOf("*") != -1) || (name.indexOf("..") != -1) ||
			(name.charAt(0) == ".") || (name.charAt(name.length-1) == "."))
			_badParm();
	}
	_valSub = function(name) {
		var path = name.split(".");
		var len = path.length;
		for(var i = 0; i < len; i++) {
			if((path[i] == "") ||
			  ((path[i].indexOf("*") != -1) && (path[i] != "*") && (path[i] != "**")))
				_badParm();
			if((path[i] == "**") && (i < len - 1))
				_badParm();
		}
		return path;
	}
	_cacheIt = function( subData ) {
		return ( (subData) && (typeof subData == "object") && (subData["PageBus"]) && (subData.PageBus["cache"]) );
	};

	_TopicMatcher = function() {
		this._items = {};
	};
	_TopicMatcher.prototype.store = function( topic, val ) {
		var path = topic.split(".");
		var len = path.length;
		_recurse = function(tree, index) {
			if (index == len)
				tree["."] = { topic: topic, value: val };
			else {
				var token = path[index];
				if (!tree[token])
					tree[token] = {};
				_recurse(tree[token], index + 1);
			}
		};
		_recurse( this._items, 0 );
	};
	_TopicMatcher.prototype.match = function( topic, exactMatch ) {
		var path = topic.split(".");
		var len = path.length;
		var res = [];
		_recurse = function(tree, index) {
			if(!tree)
				return;
			var node;
			if (index == len)
				node = tree;
			else {
				_recurse(tree[path[index]], index + 1);
				if(exactMatch)
					return;
				if(path[index] != "**")
					_recurse(tree["*"], index + 1);
				node = tree["**"];
			}
			if ( (!node) || (!node["."]) )
				return;
			res.push(node["."]);
		};
		_recurse( this._items, 0 );
		return res;
	};
	_TopicMatcher.prototype.exists = function( topic, exactMatch ) {
		var path = topic.split(".");
		var len = path.length;
		var res = false;
		_recurse = function(tree, index) {
			if(!tree)
				return;
			var node;
			if (index == len)
				node = tree;
			else {
				_recurse(tree[path[index]], index + 1);
				if(res || exactMatch)
					return;
				if(path[index] != "**") {
					_recurse(tree["*"], index + 1);
					if(res)
						return;
				}
				node = tree["**"];
			}
			if ( (!node) || (!node["."]) )
				return;
			res = true;
		};
		_recurse( this._items, 0 );
		return res;
	};
	_TopicMatcher.prototype.clear = function( topic ) {
		var path = topic.split(".");
		var len = path.length;
		_recurse = function(tree, index) {
			if(!tree)
				return;
			if (index == len) {
				if (tree["."])
					delete tree["."];
			}
			else {
				_recurse(tree[path[index]], index + 1);
				for(var x in tree[path[index]]) {
					return;
				}
				delete tree[path[index]];
			}
		};
		_recurse( this._items, 0 );
	};
	_TopicMatcher.prototype.wildcardMatch = function( topic ) {
		var path = topic.split(".");
		var len = path.length;
		var res = [];
		_recurse = function( tree, index ) {
			var tok = path[index];
			var node;
			if( (!tree) || (index == len) )
				return;
			if( tok == "**" ) {
				for( var n in tree ) {
					if( n != "." ) {
						node = tree[n];
						if( node["."] )
							res.push( node["."] );
						_recurse( node, index );
					}
				}
			}
			else if( tok == "*" ) {
				for( var n in tree ) {
					if( (n != ".") && (n != "**") ){
						node = tree[n];
						if( index == len - 1 ) {
							if( node["."] )
								res.push( node["."] );
						}
						else
							_recurse( node, index + 1 );
					}
				}
			}
			else {
				node = tree[tok];
				if(!node)
					return;
				if( index == len - 1 ) {
					if( node["."] )
						res.push( node["."] );
				}
				else
					_recurse( node, index + 1 );
			}
		};
		_recurse( this._items, 0 );
		return res;
	};
	this._refs = {};
	this._doCache = new _TopicMatcher();
	this._caches = new _TopicMatcher();
	_isCaching = function( topic ) {
		return that._doCache.exists( topic, false );
	};
	_copy = function(obj) {
		var c;
		if( typeof(obj) == "object" ) {
			if(obj == null)
				return null;
			else if(obj.constructor == Array) {
				c = [];
				for(var i = 0; i < obj.length; i++)
					c[i] = _copy(obj[i]);
				return c;
			}
			else if(obj.constructor == Date) {
				c = new Date();
				c.setDate(obj.getDate());
				return c;
			}
			c = {};
			for(var p in obj)
				c[p] = _copy(obj[p]);
			return c;
		}
		else {
			return obj;
		}
	};
	this._add = function( topic, subID ) {
		var dc;
		var dca = this._doCache.match( topic, true );
		if( dca.length > 0 )
			dc = dca[0].value;
		else {
			dc = { rc: 0 };
			this._doCache.store( topic, dc );
		}
		dc.rc++;
		this._refs[subID] = topic;
	};
	this._remove = function( subID ) {
		var topic = this._refs[subID];
		if( !topic )
			return;
		delete this._refs[subID];
		var dca = this._doCache.match( topic, true );
		if(dca.length == 0)
			return;
		dca[0].value.rc--;
		if(dca[0].value.rc == 0) {
			this._doCache.clear(topic);
			var caches = this._caches.wildcardMatch(topic);
			for(var i = 0; i < caches.length; i++) {
				if( !(this._doCache.exists(caches[i].topic, false)) )
					this._caches.clear(caches[i].topic);
			}
		}
	};

	this.cleanup = function(){
		 this. D = 0;
	     this. Q = [];
		 this._refs = {};
	     this._doCache = new _TopicMatcher();
	     this._caches = new _TopicMatcher();
	};
	this.cleanupTimeline = function(timeline){
	    OpenAjax.hub.cleanupTimeline(timeline);
	};

	this.subscribe = function( topic, scope, onData, subscriberData, timeline) {
		if(!subscriberData)
			subscriberData = null;
		topic = this.app.docuuid + '.' + topic;
		var sid = OpenAjax.hub.subscribe( topic, onData, scope,  subscriberData, null, timeline );
		if( _cacheIt( subscriberData ) ) {
			this._add( topic, sid );
			var vals = this.query( topic );
			for (var i = 0; i < vals.length; i++) {
				try {
					onData.call(scope ? scope : window, vals[i].topic, vals[i].value, subscriberData);
				}
				catch(e) {
					PageBus._debug();
				}
			}
		}
		return sid;
	}
	this.publish = function ( topic, data ) {
		topic = this.app.docuuid + '.' + topic;
		_valPub( topic );
		Q.push({ n: topic, m: data, d: (D + 1) });
		if( _isCaching( topic ) ) {
			try {
				this._caches.store( topic, data );
			} catch(e) {
				console.log(err);
				_badParm();
			}
		}
		if(D == 0) {
			while(Q.length > 0) {
				var qitem = Q.shift();
				var path = qitem.n.split(".");
				try {
					D = qitem.d;
					OpenAjax.hub.publish(qitem.n, qitem.m);
					D = 0;
				}
				catch(err) {
					D = 0;
					console.log(err);
				}
			}
		}
	}
	this.unsubscribe = function(sub) {
		try {
			this._remove(sub);
			OpenAjax.hub.unsubscribe(sub);
		}
		catch(err) {
			console.log(err);
			_badParm();
		}
	}
	this.store = function( topic, data ) {
		if( !_isCaching( topic ) )
			throw new Error( "PageBus.cache.NoCache" );
		this.publish( topic, data );
	};
	this.query = function( topic ) {
		try {
			_valSub( topic );
			return this._caches.wildcardMatch( topic );
		} catch(e) {
			console.log(err);
			_badParm();
		}
	};
};

OpenAjax.hub.registerLibrary("PageBus", "http://tibco.com/PageBus", "1.2.0", {});

window["PageBus"] = new PageBus();
window["PageBusFn"] =   PageBus ;
}

 var CoreUtils = new function() {
	var GET = 'get',
		RGB = 'RGB',
		SET = 'set';

	return {
		r9_log_console : function (e) {
			if (window.console && console.error("Error:" + e));
		},
		_r9norm : function(content){
			if( content )
				return content.replace(/r9newline/g, '\n').replace(/r9apostrophe/g, "'").replace(/r9backslash/g, "\\").replace(/&lt;/g, "<").replace(/&gt;/g, ">");
			else
				return content;
		},
		_isArray: function(obj) {
			return Object.prototype.toString.call(obj) == '[object Array]';
		},
		_isNumber: function(obj) {
			return Object.prototype.toString.call(obj) == '[object Number]';
		},
		_isString: function(obj) {
			return Object.prototype.toString.call(obj) == '[object String]';
		},

		addGetterSetter: function (constructor, attr, def, validator, after) {
			this.addGetter(constructor, attr, def);
			this.addSetter(constructor, attr, validator, after);
			this.addOverloadedGetterSetter(constructor, attr);
		},
		addGetter: function (constructor, attr, def) {
			var method = GET + Base.capitalize(attr);

			constructor.prototype[method] = function () {
				var val = this.attrs[attr];
				return val === undefined ? def : val;
			};
		},
		addSetter: function (constructor, attr, validator, after) {
			var method = SET + Base.capitalize(attr);

			constructor.prototype[method] = function (val) {
				if (validator) {
					val = validator.call(this, val);
				}

				this._setAttr(attr, val);

				if (after) {
					after.call(this);
				}

				return this;
			};
		},
		addComponentsGetterSetter: function (constructor, attr, components, validator, after) {
			var len = components.length,
				capitalize = Base.capitalize,
				getter = GET + capitalize(attr),
				setter = SET + capitalize(attr),
				n, component;

			constructor.prototype[getter] = function () {
				var ret = {};

				for (n = 0; n < len; n++) {
					component = components[n];
					ret[component] = this.getAttr(attr + capitalize(component));
				}

				return ret;
			};

			constructor.prototype[setter] = function (val) {
				var oldVal = this.attrs[attr],
					key;

				if (validator) {
					val = validator.call(this, val);
				}

				for (key in val) {
					this._setAttr(attr + capitalize(key), val[key]);
				}

				this._fireChangeEvent(attr, oldVal, val);

				if (after) {
					after.call(this);
				}

				return this;
			};

			this.addOverloadedGetterSetter(constructor, attr);
		},
		addOverloadedGetterSetter: function (constructor, attr) {
			var capitalizedAttr = Base.capitalize(attr),
				setter = SET + capitalizedAttr,
				getter = GET + capitalizedAttr;

			constructor.prototype[attr] = function () {
				if (arguments.length) {
					this[setter](arguments[0]);
					return this;
				}
				else {
					return this[getter]();
				}
			};
		},
		backCompat: function (constructor, methods) {
			var key;

			for (key in methods) {
				constructor.prototype[key] = constructor.prototype[methods[key]];
			}
		},
		afterSetFilter: function () {
			this._filterUpToDate = false;
		}
	}
};

 var Constants = new function() {
	return {
	   Env:  ' const ORIGIN = new Point([0,0]);' +
	   ' const UP = new Point([0,1]);' +
	   ' const DOWN = new Point([0,-1]);' +
	   ' const RIGHT = new Point([1,0]);' +
	   ' const LEFT = new Point([-1,0]);' +
	   ' const X_AXIS = new Point([1,0]);' +
	   ' const Y_AXIS = new Point([0,1]);' +
	   ' const UL = new Point([-1,1]);' +
	   ' const UR = new Point([1,1]);' +
	   ' const DL = new Point([-1,-1]);' +
	   ' const DR = new Point([1,-1]);' +
	   ' const START_X = 30;' +
	   ' const START_Y = 20;' +
	   ' const DEFAULT_DOT_RADIUS = 6;' +
	   ' const DEFAULT_SMALL_DOT_RADIUS = 3;' +
	   ' const DEFAULT_DASH_LENGTH = 3;' +
	   ' const DEFAULT_ARROW_TIP_LENGTH = 20;' +
	   ' const SMALL_BUFF = 5;' +
	   ' const MED_SMALL_BUFF = 10;' +
	   ' const MED_LARGE_BUFF = 20;' +
	   ' const LARGE_BUFF = 50; '
	};
};

var CollisionDetection = {
	findItemBoundsCollisions: function(items1, items2, tolerance) {
		function getBounds(items) {
			var bounds = new Array(items.length);
			for (var i = 0; i < items.length; i++) {
				var rect = items[i].getBounds();
				bounds[i] = [rect.left, rect.top, rect.right, rect.bottom];
			}
			return bounds;
		}

		var bounds1 = getBounds(items1),
			bounds2 = !items2 || items2 === items1
				? bounds1
				: getBounds(items2);
		return this.findBoundsCollisions(bounds1, bounds2, tolerance || 0);
	},

	findCurveBoundsCollisions: function(curves1, curves2, tolerance, bothAxis) {
		function getBounds(curves) {
			var min = Math.min,
				max = Math.max,
				bounds = new Array(curves.length);
			for (var i = 0; i < curves.length; i++) {
				var v = curves[i];
				bounds[i] = [
					min(v[0], v[2], v[4], v[6]),
					min(v[1], v[3], v[5], v[7]),
					max(v[0], v[2], v[4], v[6]),
					max(v[1], v[3], v[5], v[7])
				];
			}
			return bounds;
		}

		var bounds1 = getBounds(curves1),
			bounds2 = !curves2 || curves2 === curves1
				? bounds1
				: getBounds(curves2);
		if (bothAxis) {
			var hor = this.findBoundsCollisions(
					bounds1, bounds2, tolerance || 0, false, true),
				ver = this.findBoundsCollisions(
					bounds1, bounds2, tolerance || 0, true, true),
				list = [];
			for (var i = 0, l = hor.length; i < l; i++) {
				list[i] = { hor: hor[i], ver: ver[i] };
			}
			return list;
		}
		return this.findBoundsCollisions(bounds1, bounds2, tolerance || 0);
	},

	findBoundsCollisions: function(boundsA, boundsB, tolerance,
		sweepVertical, onlySweepAxisCollisions) {
		var self = !boundsB || boundsA === boundsB,
			allBounds = self ? boundsA : boundsA.concat(boundsB),
			lengthA = boundsA.length,
			lengthAll = allBounds.length;

		function binarySearch(indices, coord, value) {
			var lo = 0,
				hi = indices.length;
			while (lo < hi) {
				var mid = (hi + lo) >>> 1;
				if (allBounds[indices[mid]][coord] < value) {
					lo = mid + 1;
				} else {
					hi = mid;
				}
			}
			return lo - 1;
		}

		var pri0 = sweepVertical ? 1 : 0,
			pri1 = pri0 + 2,
			sec0 = sweepVertical ? 0 : 1,
			sec1 = sec0 + 2;
		var allIndicesByPri0 = new Array(lengthAll);
		for (var i = 0; i < lengthAll; i++) {
			allIndicesByPri0[i] = i;
		}
		allIndicesByPri0.sort(function(i1, i2) {
			return allBounds[i1][pri0] - allBounds[i2][pri0];
		});
		var activeIndicesByPri1 = [],
			allCollisions = new Array(lengthA);
		for (var i = 0; i < lengthAll; i++) {
			var curIndex = allIndicesByPri0[i],
				curBounds = allBounds[curIndex],
				origIndex = self ? curIndex : curIndex - lengthA,
				isCurrentA = curIndex < lengthA,
				isCurrentB = self || !isCurrentA,
				curCollisions = isCurrentA ? [] : null;
			if (activeIndicesByPri1.length) {
				var pruneCount = binarySearch(activeIndicesByPri1, pri1,
						curBounds[pri0] - tolerance) + 1;
				activeIndicesByPri1.splice(0, pruneCount);
				if (self && onlySweepAxisCollisions) {
					curCollisions = curCollisions.concat(activeIndicesByPri1);
					for (var j = 0; j < activeIndicesByPri1.length; j++) {
						var activeIndex = activeIndicesByPri1[j];
						allCollisions[activeIndex].push(origIndex);
					}
				} else {
					var curSec1 = curBounds[sec1],
						curSec0 = curBounds[sec0];
					for (var j = 0; j < activeIndicesByPri1.length; j++) {
						var activeIndex = activeIndicesByPri1[j],
							activeBounds = allBounds[activeIndex],
							isActiveA = activeIndex < lengthA,
							isActiveB = self || activeIndex >= lengthA;

						if (
							onlySweepAxisCollisions ||
							(
								isCurrentA && isActiveB ||
								isCurrentB && isActiveA
							) && (
								curSec1 >= activeBounds[sec0] - tolerance &&
								curSec0 <= activeBounds[sec1] + tolerance
							)
						) {
							if (isCurrentA && isActiveB) {
								curCollisions.push(
									self ? activeIndex : activeIndex - lengthA);
							}
							if (isCurrentB && isActiveA) {
								allCollisions[activeIndex].push(origIndex);
							}
						}
					}
				}
			}
			if (isCurrentA) {
				if (boundsA === boundsB) {
					curCollisions.push(curIndex);
				}
				allCollisions[curIndex] = curCollisions;
			}
			if (activeIndicesByPri1.length) {
				var curPri1 = curBounds[pri1],
					index = binarySearch(activeIndicesByPri1, pri1, curPri1);
				activeIndicesByPri1.splice(index + 1, 0, curIndex);
			} else {
				activeIndicesByPri1.push(curIndex);
			}
		}
		for (var i = 0; i < allCollisions.length; i++) {
			var collisions = allCollisions[i];
			if (collisions) {
				collisions.sort(function(i1, i2) { return i1 - i2; });
			}
		}
		return allCollisions;
	}
};

var Formatter = Base.extend({
	initialize: function(precision) {
		this.precision = Base.pick(precision, 5);
		this.multiplier = Math.pow(10, this.precision);
	},

	number: function(val) {
		return this.precision < 16
				? Math.round(val * this.multiplier) / this.multiplier : val;
	},

	pair: function(val1, val2, separator) {
		return this.number(val1) + (separator || ',') + this.number(val2);
	},

	point: function(val, separator) {
		return this.number(val.x) + (separator || ',') + this.number(val.y);
	},

	size: function(val, separator) {
		return this.number(val.width) + (separator || ',')
				+ this.number(val.height);
	},

	rectangle: function(val, separator) {
		return this.point(val, separator) + (separator || ',')
				+ this.size(val, separator);
	},
	tex2svg: function(input, options,callback){
		if( window.tex2svg ){
			return window.tex2svg(input, options, callback);
		}
	},
	toAbcOrder: function(order){
		return  String.fromCharCode('A'.charCodeAt(0) + order) ;
	},
	toMathJaxId: function(char){
		var code = char.charCodeAt(0);
		if( code >= 48 && code <= 57 ){
			return 'TEX-N-' + (30 + code-48);
		}
		if( code >= 97 && code <= 122 ){
			var v = parseInt('4E', 16) + (code - 97);
			return 'TEX-I-1D4' + v.toString(16).toUpperCase();
		}
		if( code >= 65 && code <= 90 ){
			var v = parseInt('34', 16) + (code - 65);
			return 'TEX-I-1D4' + v.toString(16).toUpperCase();
		}
		if( code >= 945 && code <= 969 ){
			var v = parseInt('FC', 16) + (code - 945);
			return 'TEX-I-1D6' + v.toString(16).toUpperCase();
		}
		if( code >= 913 && code <= 937 ){
			var v = parseInt('E2', 16) + (code - 913);
			return 'TEX-I-1D6' + v.toString(16).toUpperCase();
		}
		return null;
	},
	_getMathSymbol2: function(obj,  targetId, s){
		if(  obj instanceof Group ){
			 for(var g in obj._children){
				 if( g.indexOf(targetId) >= 0) s.finds++;
				 if(  s.finds === s.to ) return obj._children[g];
				 var r =  this._getMathSymbol2(  obj._children[g],  targetId, s );
				 if( r ) return r;
			 }
		}
		return null;
	 },
	getMathSymbol: function(obj, char, targetOrder){
		var id = this.toMathJaxId(char);
		if( !id ) return null;
		return this._getMathSymbol2(obj, id, {finds:0, to: targetOrder} );
	},
	_getMathSymbolAll2: function(obj,  targetId , r){
		if(  obj instanceof Group ){
			 for(var g in obj._children){
				if( g.indexOf(targetId) >= 0 )  r.push( obj._children[g] );
				this._getMathSymbolAll2(  obj._children[g],  targetId, r );
			 }
		}
	 },
	 forceStyleChanges: function(obj,  fillColor, strokeColor, nodeType){
		 if(!obj) return;
		 if(!nodeType || obj instanceof nodeType){
			obj.fillColor = fillColor;
			obj.strokeColor = strokeColor;
		 }
		if(  obj instanceof Group ){
			var that = this;
			obj._children.forEach( e => { that.forceStyleChanges(e, fillColor, strokeColor, nodeType); } )
		}
	 },
	 _getMathSymbolRange2: function(obj,  start, end , result){
		if(  obj instanceof Group ){
			 for(var g in obj._children){
				 var t = obj._children[g];
				 if( t == start ) result.f = 1;
				 else if (t == end ) result.f = 2;
				 else {
					 if( result.f == 1 && (t instanceof PathItem))  result.r.push( t );
					 else if( result.f != 2 ){
						 this._getMathSymbolRange2(t, start, end, result)
					 }
				 }
			 }
		}
	 },
	getMathSymbolRange: function(obj, query){
		var that = this, r = [];
		if( typeof query == 'string' ){
			for(var i in query){
				var id = this.toMathJaxId(query[i]);
				if( id ){
					that._getMathSymbolAll2(obj, id , r);
				}
			};
			return r;
		}
		var start = that.getMathSymbol(obj, query.start_char, query.start_pos) ;
		if( start ){
			r.push(start);
			var end = that.getMathSymbol(obj, query.end_char, query.end_pos) ;
			if( end ){
				var result =  {f: 0, r: r };
				that._getMathSymbolRange2(obj,  start, end ,result);
				r.push(end);
				return r;
			}
		}
		return r;
	},
	mathjax_idmapper: function(id){
		var pos = id.lastIndexOf('-');
		if( pos > 0 )  id.substring(pos+1);
		pos  = id.indexOf(' ');
		if( pos > 0 )  id.substring(0, pos );
		return id;
	},
});

Formatter.instance = new Formatter();

var Numerical = new function() {

	var abscissas = [
		[  0.5773502691896257645091488],
		[0,0.7745966692414833770358531],
		[  0.3399810435848562648026658,0.8611363115940525752239465],
		[0,0.5384693101056830910363144,0.9061798459386639927976269],
		[  0.2386191860831969086305017,0.6612093864662645136613996,0.9324695142031520278123016],
		[0,0.4058451513773971669066064,0.7415311855993944398638648,0.9491079123427585245261897],
		[  0.1834346424956498049394761,0.5255324099163289858177390,0.7966664774136267395915539,0.9602898564975362316835609],
		[0,0.3242534234038089290385380,0.6133714327005903973087020,0.8360311073266357942994298,0.9681602395076260898355762],
		[  0.1488743389816312108848260,0.4333953941292471907992659,0.6794095682990244062343274,0.8650633666889845107320967,0.9739065285171717200779640],
		[0,0.2695431559523449723315320,0.5190961292068118159257257,0.7301520055740493240934163,0.8870625997680952990751578,0.9782286581460569928039380],
		[  0.1252334085114689154724414,0.3678314989981801937526915,0.5873179542866174472967024,0.7699026741943046870368938,0.9041172563704748566784659,0.9815606342467192506905491],
		[0,0.2304583159551347940655281,0.4484927510364468528779129,0.6423493394403402206439846,0.8015780907333099127942065,0.9175983992229779652065478,0.9841830547185881494728294],
		[  0.1080549487073436620662447,0.3191123689278897604356718,0.5152486363581540919652907,0.6872929048116854701480198,0.8272013150697649931897947,0.9284348836635735173363911,0.9862838086968123388415973],
		[0,0.2011940939974345223006283,0.3941513470775633698972074,0.5709721726085388475372267,0.7244177313601700474161861,0.8482065834104272162006483,0.9372733924007059043077589,0.9879925180204854284895657],
		[  0.0950125098376374401853193,0.2816035507792589132304605,0.4580167776572273863424194,0.6178762444026437484466718,0.7554044083550030338951012,0.8656312023878317438804679,0.9445750230732325760779884,0.9894009349916499325961542]
	];

	var weights = [
		[1],
		[0.8888888888888888888888889,0.5555555555555555555555556],
		[0.6521451548625461426269361,0.3478548451374538573730639],
		[0.5688888888888888888888889,0.4786286704993664680412915,0.2369268850561890875142640],
		[0.4679139345726910473898703,0.3607615730481386075698335,0.1713244923791703450402961],
		[0.4179591836734693877551020,0.3818300505051189449503698,0.2797053914892766679014678,0.1294849661688696932706114],
		[0.3626837833783619829651504,0.3137066458778872873379622,0.2223810344533744705443560,0.1012285362903762591525314],
		[0.3302393550012597631645251,0.3123470770400028400686304,0.2606106964029354623187429,0.1806481606948574040584720,0.0812743883615744119718922],
		[0.2955242247147528701738930,0.2692667193099963550912269,0.2190863625159820439955349,0.1494513491505805931457763,0.0666713443086881375935688],
		[0.2729250867779006307144835,0.2628045445102466621806889,0.2331937645919904799185237,0.1862902109277342514260976,0.1255803694649046246346943,0.0556685671161736664827537],
		[0.2491470458134027850005624,0.2334925365383548087608499,0.2031674267230659217490645,0.1600783285433462263346525,0.1069393259953184309602547,0.0471753363865118271946160],
		[0.2325515532308739101945895,0.2262831802628972384120902,0.2078160475368885023125232,0.1781459807619457382800467,0.1388735102197872384636018,0.0921214998377284479144218,0.0404840047653158795200216],
		[0.2152638534631577901958764,0.2051984637212956039659241,0.1855383974779378137417166,0.1572031671581935345696019,0.1215185706879031846894148,0.0801580871597602098056333,0.0351194603317518630318329],
		[0.2025782419255612728806202,0.1984314853271115764561183,0.1861610000155622110268006,0.1662692058169939335532009,0.1395706779261543144478048,0.1071592204671719350118695,0.0703660474881081247092674,0.0307532419961172683546284],
		[0.1894506104550684962853967,0.1826034150449235888667637,0.1691565193950025381893121,0.1495959888165767320815017,0.1246289712555338720524763,0.0951585116824927848099251,0.0622535239386478928628438,0.0271524594117540948517806]
	];

	var abs = Math.abs,
		sqrt = Math.sqrt,
		pow = Math.pow,
		log2 = Math.log2 || function(x) {
			return Math.log(x) * Math.LOG2E;
		},
		EPSILON = 1e-12,
		MACHINE_EPSILON = 1.12e-16;

	function clamp(value, min, max) {
		return value < min ? min : value > max ? max : value;
	}

	function getDiscriminant(a, b, c) {
		function split(v) {
			var x = v * 134217729,
				y = v - x,
				hi = y + x,
				lo = v - hi;
			return [hi, lo];
		}

		var D = b * b - a * c,
			E = b * b + a * c;
		if (abs(D) * 3 < E) {
			var ad = split(a),
				bd = split(b),
				cd = split(c),
				p = b * b,
				dp = (bd[0] * bd[0] - p + 2 * bd[0] * bd[1]) + bd[1] * bd[1],
				q = a * c,
				dq = (ad[0] * cd[0] - q + ad[0] * cd[1] + ad[1] * cd[0])
						+ ad[1] * cd[1];
			D = (p - q) + (dp - dq);
		}
		return D;
	}

	function getNormalizationFactor() {
		var norm = Math.max.apply(Math, arguments);
		return norm && (norm < 1e-8 || norm > 1e8)
				? pow(2, -Math.round(log2(norm)))
				: 0;
	}

	function sigmoid(x){
		return 1.0 / (1 + Math.exp(-x));
	}
	function smooth(t, inflection ){
		if( inflection == null )
			inflection =  10.0
		var error = sigmoid(-inflection / 2)
		return Math.min(
				Math.max((sigmoid(inflection * (t - 0.5)) - error) / (1 - 2 * error), 0),
				1,
			)
	}

	return {
		EPSILON: EPSILON,
		MACHINE_EPSILON: MACHINE_EPSILON,
		CURVETIME_EPSILON: 1e-8,
		GEOMETRIC_EPSILON: 1e-7,
		TRIGONOMETRIC_EPSILON: 1e-8,
		ANGULAR_EPSILON: 1e-5,
		KAPPA: 4 * (sqrt(2) - 1) / 3,

		isZero: function(val) {
			return val >= -EPSILON && val <= EPSILON;
		},

		isMachineZero: function(val) {
			return val >= -MACHINE_EPSILON && val <= MACHINE_EPSILON;
		},

		clamp: clamp,

		integrate: function(f, a, b, n) {
			var x = abscissas[n - 2],
				w = weights[n - 2],
				A = (b - a) * 0.5,
				B = A + a,
				i = 0,
				m = (n + 1) >> 1,
				sum = n & 1 ? w[i++] * f(B) : 0;
			while (i < m) {
				var Ax = A * x[i];
				sum += w[i++] * (f(B + Ax) + f(B - Ax));
			}
			return A * sum;
		},

		findRoot: function(f, df, x, a, b, n, tolerance) {
			for (var i = 0; i < n; i++) {
				var fx = f(x),
					dx = fx / df(x),
					nx = x - dx;
				if (abs(dx) < tolerance) {
					x = nx;
					break;
				}
				if (fx > 0) {
					b = x;
					x = nx <= a ? (a + b) * 0.5 : nx;
				} else {
					a = x;
					x = nx >= b ? (a + b) * 0.5 : nx;
				}
			}
			return clamp(x, a, b);
		},

		solveQuadratic: function(a, b, c, roots, min, max) {
			var x1, x2 = Infinity;
			if (abs(a) < EPSILON) {
				if (abs(b) < EPSILON)
					return abs(c) < EPSILON ? -1 : 0;
				x1 = -c / b;
			} else {
				b *= -0.5;
				var D = getDiscriminant(a, b, c);
				if (D && abs(D) < MACHINE_EPSILON) {
					var f = getNormalizationFactor(abs(a), abs(b), abs(c));
					if (f) {
						a *= f;
						b *= f;
						c *= f;
						D = getDiscriminant(a, b, c);
					}
				}
				if (D >= -MACHINE_EPSILON) {
					var Q = D < 0 ? 0 : sqrt(D),
						R = b + (b < 0 ? -Q : Q);
					if (R === 0) {
						x1 = c / a;
						x2 = -x1;
					} else {
						x1 = R / a;
						x2 = c / R;
					}
				}
			}
			var count = 0,
				boundless = min == null,
				minB = min - EPSILON,
				maxB = max + EPSILON;
			if (isFinite(x1) && (boundless || x1 > minB && x1 < maxB))
				roots[count++] = boundless ? x1 : clamp(x1, min, max);
			if (x2 !== x1
					&& isFinite(x2) && (boundless || x2 > minB && x2 < maxB))
				roots[count++] = boundless ? x2 : clamp(x2, min, max);
			return count;
		},

		solveCubic: function(a, b, c, d, roots, min, max) {
			var f = getNormalizationFactor(abs(a), abs(b), abs(c), abs(d)),
				x, b1, c2, qd, q;
			if (f) {
				a *= f;
				b *= f;
				c *= f;
				d *= f;
			}

			function evaluate(x0) {
				x = x0;
				var tmp = a * x;
				b1 = tmp + b;
				c2 = b1 * x + c;
				qd = (tmp + b1) * x + c2;
				q = c2 * x + d;
			}

			if (abs(a) < EPSILON) {
				a = b;
				b1 = c;
				c2 = d;
				x = Infinity;
			} else if (abs(d) < EPSILON) {
				b1 = b;
				c2 = c;
				x = 0;
			} else {
				evaluate(-(b / a) / 3);
				var t = q / a,
					r = pow(abs(t), 1/3),
					s = t < 0 ? -1 : 1,
					td = -qd / a,
					rd = td > 0 ? 1.324717957244746 * Math.max(r, sqrt(td)) : r,
					x0 = x - s * rd;
				if (x0 !== x) {
					do {
						evaluate(x0);
						x0 = qd === 0 ? x : x - q / qd / (1 + MACHINE_EPSILON);
					} while (s * x0 > s * x);
					if (abs(a) * x * x > abs(d / x)) {
						c2 = -d / x;
						b1 = (c2 - c) / x;
					}
				}
			}
			var count = Numerical.solveQuadratic(a, b1, c2, roots, min, max),
				boundless = min == null;
			if (isFinite(x) && (count === 0
					|| count > 0 && x !== roots[0] && x !== roots[1])
					&& (boundless || x > min - EPSILON && x < max + EPSILON))
				roots[count++] = boundless ? x : clamp(x, min, max);
			return count;
		},
		nice_number: function( value,  round_){
			round_ = round_ || false;
			var exponent = Math.floor(Math.log(value) / Math.log(10));
			var fraction = value / Math.pow(10, exponent);
			var nice_fraction = 1;
			if (round_) {
				if (fraction < 1.5)
					nice_fraction = 1;
				else if (fraction < 3.)
					nice_fraction = 2;
				else if (fraction < 7.)
					nice_fraction = 5;
				else
					nice_fraction = 10;
			} else {
				if (fraction <= 1)
					nice_fraction = 1;
				else if (fraction <= 2)
					nice_fraction = 2;
				else if (fraction <= 5)
					nice_fraction = 5;
				else
					nice_fraction = 10;
			}
			return nice_fraction * Math.pow(10, exponent);
		},
		numticks : function(length){
			if( length <=0 ) return 1;
			if( length < 100 ) return 3;
			if( length < 300) return 6;
			if( length < 500) return 8;
			return 10;
		},
		nice_bounds : function(axis_start,  axis_end, num_ticks){
		   if ( num_ticks <=1 ) num_ticks = 2;
			var axis_width = axis_end - axis_start;
			if (axis_width == 0){
				axis_start -= .5;
				axis_end += .5;
				axis_width = axis_end - axis_start;
			}
			var nice_range = this.nice_number(axis_width, false);
			var nice_tick = this.nice_number(nice_range / (num_ticks -1), true);
			return nice_tick;
		},
		calcuateStepLength: function(pixal2value) {
			if( pixal2value <= 0 )
				return -1;
			if( pixal2value < 5) {
				var numticks = this.numticks( pixal2value * 100);
				return this.nice_bounds( 0,  100, numticks);
			} else if( pixal2value < 10) {
				var numticks = this.numticks( pixal2value * 40);
				return this.nice_bounds( 0,  40, numticks);
			} else if ( pixal2value < 20 ) {
				var numticks = this.numticks( pixal2value * 10);
				return this.nice_bounds( 0,  10, numticks);
			} else if ( pixal2value < 30 ) {
				var numticks = this.numticks( pixal2value * 5 );
				return this.nice_bounds( 0,  5, numticks);
			} else {
				var numticks = this.numticks( pixal2value );
				return this.nice_bounds( 0,  1, numticks);
			}
		},
		sigmoid: function(x){
			return sigmoid(x);
		},
		smooth: function(t, inflection ){
			return smooth(t, inflection);
		},
		interpolate: function(start, end, value){
			return   (1 - value) * start + value * end;
		},
		inverse_interpolate: function(start, end, value){
			return   (value - start) /( end - start );
		},
	};
};

var UID = {
	_id: 1,
	_pools: {},

	get: function(name) {
		if (name) {
			var pool = this._pools[name];
			if (!pool)
				pool = this._pools[name] = { _id: 1 };
			return pool._id++;
		} else {
			return this._id++;
		}
	}
};

 var RU = new function() {
	 var Ani_Types = [
		'in_situ',
		'box_random',
		'box_tlbr',
		'box_ltr',
		'box_rtl' ,
		'box_ttb' ,
		'box_btt' ,
		'blinder_h' ,
		'blinder_v' ,
		'random' ,
		'particle' ,
		'winding' ,
		'none' ,
		'delay',
		'flipboard' ,
		'page_turn',
	 ];
	 var project;
	 function shuffle0(arr) {
		 let curInx = arr.length,  ranInx;
		 while (curInx != 0) {
		   ranInx = Math.floor(Math.random() * curInx);
		   curInx--;
		   [arr[curInx], arr[ranInx]] = [arr[ranInx], arr[curInx]];
		 }
		 return arr;
	 }
	 function guessSize(kiw){
		 if ( kiw >= 800 ) return 20;
		 else if ( kiw > 600 ) return 20;
		 else if  (kiw > 400 ) return 20;
		 else if  (kiw  > 200 ) return 20;
		 else if  (kiw > 50 )  return parseInt(kiw / 10)
		 else if  (kiw > 20 )  return parseInt(kiw / 5)
		 else if  (kiw > 4 )  return parseInt(kiw / 4)
		 return 1;
	 }
	 function getImageBoxes(kimage, boxCols, boxRows){
		 if (!kimage )  return [];
		 var  kiw = kimage.bounds.width, kih = kimage.bounds.height;
		 boxCols = boxCols || guessSize(kiw); boxRows = boxRows || guessSize(kih);
		 var boxList = [];
		 var boxWidth = Math.round(kiw/boxCols),  boxHeight = Math.round(kih/boxRows), nimage;
		 for(var rows = 0; rows < boxRows; rows++){
			 for(var cols = 0; cols < boxCols; cols++){
				 nimage = new CroppedImage(kimage, cols*boxWidth, rows*boxHeight, boxWidth, boxHeight);
				 boxList.push(nimage);
			 }
		 }
		 return {list : boxList, width: boxWidth, height: boxHeight, boxRows: boxRows, boxCols: boxCols};
	 }
	 function getImageStrips (kimage, horizontal){
		 if (!kimage )    return [];
		 var boxWidth,boxHeight, boxList = [];
		 var  kiw = kimage.bounds.width, kih = kimage.bounds.height,
		   kiw = horizontal ? kiw : kih, boxCols = 8;
		 if ( kiw >= 800 ) boxCols = 40;
		 else if ( kiw > 600 ) boxCols = 35;
		 else if  (kiw > 400 ) boxCols = 25;
		 else if  (kiw  > 200 ) boxCols = 16;
		 if ( horizontal ){
			 boxWidth = Math.round(kiw /boxCols),
			 boxHeight = Math.round(kih) ;
			 if( Math.random() > 0.3 ){
				 var curx = 0, curw = 2, fright = Math.random() > 0.5;
				 if( fright ) curx = kiw - curw;
				 while( curx <  kiw  && curx >= 0 ){
					 curw +=1;
					 if(! fright ){
						 if( curx + curw > kiw){
							 curw = kiw - curx;
						 }
					 }
					 var nimage = new CroppedImage(kimage, curx, 0, curw, boxHeight);
					 boxList.push(nimage);
					 if( fright ){
						 if( curx > 0 && curx < curw ){
							 curw = curx;
							 curx = 0;
						 } else {
							 curx -= curw;
						 }
					 } else
						 curx += curw;
				 }
			 } else {
				 for(var cols = 0; cols < boxCols; cols++){
					 var adjusted_w = cols ===  boxCols-1 ? kiw -boxWidth*cols : boxWidth;
					 var nimage = new CroppedImage(kimage, boxWidth*cols , 0, adjusted_w, boxHeight);
					 boxList.push(nimage);
				 }
			 }
		 } else {
			 boxRows = boxCols;
			 kiw = kimage.bounds.width
			 boxWidth = Math.round(kiw),
			 boxHeight = Math.round(kih/boxRows);
			 for(var rows = 0; rows < boxRows; rows++){
				 var adjusted_h = rows ===  boxRows-1 ? kih - boxHeight*rows : boxHeight;
				 var nimage = new CroppedImage(kimage, 0, boxHeight*rows,boxWidth,adjusted_h);
				 boxList.push(nimage);
			 }
		 }
		 if( horizontal )
			return {list : boxList, width: boxWidth, height: boxHeight, boxRows: 1, boxCols: boxCols};
		  else
			return {list : boxList, width: boxWidth, height: boxHeight, boxRows: boxCols, boxCols: 1};
	 }
	 function handleImageTrans(layer, item, duration, transType, easing, positionFunc, isCreation, callback , sentToBackOnFinish){

		var timeline = layer.getCurPage().ptimer, boxWidth= item.bounds.width, boxHeight = item.bounds.height;
		var isRaster = item instanceof Raster;
		var kimage = isRaster ? item :  item.rasterize();
		if( !isRaster ){
		  if( isCreation )
			item.setShowHide(false);
		  else
			item.remove();
		}
		if( callback && callback.onStart ){
			callback.onStart();
		}
		var newCallback = {};
		newCallback.onSuccess = function( ) {
			if( isCreation   ){
				item.setShowHide(true);
				if( sentToBackOnFinish  ){
					item.sendToBack();
				}
				if(!isRaster){
					kimage.remove();
				}
			} else {
				kimage.remove();
				item.remove();
			}
			if( callback && callback.onEnd ){
				callback.onEnd();
			}
		};
		if ( isCreation ){
		 }else {
		 }

		if( transType == 15 ){
			var tweenwrap = {
				targets: kimage,
				'bounds.width' : isCreation ? boxWidth :  1,
				'bounds.height' : isCreation ? boxHeight :  1,
				position: kimage.position.clone(),
				complete: function() {
					newCallback.onSuccess(true);
				} ,
				easing: easing,
				duration: duration,
			};
			if ( isCreation ){
				tweenwrap.position = kimage.position.clone();
				kimage.position  = kimage.position.__add(new Point(50, 200));
				kimage.bounds.width = 1;
				kimage.bounds.height /=2;
			} else {
				tweenwrap.position  =  kimage.position.__subtract(new Point( 50,  200));
				kimage.position = kimage.position.clone();
			}
			if(typeof positionFunc == 'function') {
				tweenwrap.positionFunc = positionFunc;
			} else {
				tweenwrap.positionFunc = function(from, to, curpos, easing){
					return new Point(curpos.x+ Math.sin( Math.PI/2 *easing ) * 50 * (1-easing), curpos.y );
				}
			}
			timeline.add(tweenwrap) ;
		}
	}

	 function imgBoxEffect(layer, item, duration, transType, easing, positionFunc, isCreation, callback , sentToBackOnFinish){

		 var boxList, boxWidth,boxHeight, boxRows, boxCols, result, timeline = layer.getCurPage().ptimer;
		 var isRaster = item instanceof Raster;
		 var kimage = isRaster ? item :  item.rasterize();
		 if( transType == 9 ) transType = Math.floor(Math.random() * 9);

		 if ( transType < 7 || transType == 10 || transType == 11 ){
			 result = getImageBoxes(kimage);
		 } else if (  transType == 7 || transType == 8 ){
			 result = getImageStrips(kimage, transType == 7);
		 }   else {
			 return;
		 }
		   if( isCreation )
			   item.setShowHide(false);
		   else
			   item.remove();
		   if(! isRaster )
			   kimage.remove();
		 if( callback && callback.onStart ){
			 callback.onStart();
		 }
		 boxList = result.list;
		 boxWidth = result.width;
		 boxHeight = result.height;
		 boxRows = result.boxRows;
		 boxCols = result.boxCols;
		 var size = boxList.length;
		 var tweens = [];
		 var finished = false;
		 var newCallback = {};
		 newCallback.onSuccess = function(removenimages) {
			 size --;
			 if (!finished && size <= 0 ){
				 finished = true;
				 if( isCreation   ){
					 item.setShowHide(true);
					 if( sentToBackOnFinish  ){
						 item.sendToBack();
					 }
				 }
				 if( callback && callback.onEnd ){
					 callback.onEnd();
				 }
				 if(removenimages){
					 for( var b = 0; b < boxList.length; b++){
						 var nimage = boxList[b];
						  nimage.remove();
					 }
				 }
			 }
		 };
		 for( var b = 0; b < size; b++){
			 var nimage = boxList[b];

			 if( transType == 7 ){
				var tweenwrap = {   targets: nimage,
					'bounds.width' : isCreation ? boxWidth :  1,
					position: nimage.position.clone(),
					complete: function() {
						newCallback.onSuccess(true);
					} ,
					easing: easing,
					duration: duration,
				};
				if ( isCreation ){
					nimage.position.x -= nimage.bounds.width/2;
					nimage.bounds.width = 1;
				}
				tweens.push(   tweenwrap );
				continue;
			 }
			 if( transType == 8 ){
				var tweenwrap = {   targets: nimage,
				   'bounds.height' : isCreation ? boxHeight :  1,
					complete: function() {
						newCallback.onSuccess(true);
					} ,
					easing: easing,
					duration: duration,
				};
				if ( isCreation ){
					nimage.position.y -= nimage.bounds.height/2;
					nimage.bounds.height = 1;
				}
				tweens.push(   tweenwrap );
				continue;
			 }

			 if ( isCreation ){
				nimage.opacity = 0.1;
			 }else {
				nimage.opacity = 1;
			 }
			 var tweenwrap = {   targets: nimage,
				 opacity :  isCreation ? 1 : 0.1 ,
				 complete: function() {
					 newCallback.onSuccess(true);
				 } ,
				 easing: easing,
				 duration: duration,
			 };
			 if ( transType == 10 ){
				if ( isCreation ){
					tweenwrap.position = nimage.position.clone();
					nimage.position  = nimage.position.__add(new Point(nimage.bounds.width * 25 * (0.5- Math.random() ), nimage.bounds.height * 25 * (0.5- Math.random() )));
				} else {
					tweenwrap.position  = nimage.position.__add(new Point(nimage.bounds.width * 25 * (0.5- Math.random() ), nimage.bounds.height * 25 * (0.5- Math.random() )));
					nimage.position = nimage.position.clone();
				}
			  }
			  if ( transType == 11 ){
				if ( isCreation ){
					tweenwrap.position = nimage.position.clone();
					 nimage.position  = nimage.position.__subtract(new Point(200, 50));
				 } else {
					 tweenwrap.position  =  nimage.position.__add(new Point( 200,  50));
					 nimage.position = nimage.position.clone();
				}
				tweenwrap.positionFunc = positionFunc || true;
			  }
			  if( positionFunc && transType != 11 ){
				if( typeof tweenwrap.position === 'undefined' ){
					if ( isCreation ){
						tweenwrap.position = nimage.position.clone();
						 nimage.position  = nimage.position.__subtract(new Point(100, 50));
					 } else {
						 tweenwrap.position  =  nimage.position.__add(new Point( 100,  50));
						 nimage.position = nimage.position.clone();
					}
				}
			 }
			 tweens.push(   tweenwrap );
		 }
		 if ( transType ==  0 || transType == 7 || transType == 8 || transType == 10 ){
			 tweens.forEach(e => {  timeline.add(e, 0)  ; } );
		 } else if ( transType == 1){
			 shuffle0(tweens);
			 var toffset = 0, step = 2.0 / tweens.length;
			 for( var i = 0; i < tweens.length; i++){
				 timeline.add(tweens[i], toffset) ;
				 toffset +=  step;
			 }
		 } else if ( transType ==  2){
			   TL2BR1(timeline, tweens, 0, boxRows, boxCols);
		 } else if ( transType == 3 || transType == 5  ){
			   _one_dir(timeline, duration, tweens, 0, transType - 3, boxRows, boxCols);
		 } else if ( transType == 11){
			_one_dir(timeline, duration, tweens, 0, 0, boxRows, boxCols);
		 }  else if ( transType ==4 || transType ==6 ){
				var startPos = transType == 4 ? boxCols -1 : boxRows -1;
			   _one_dir(timeline, duration, tweens, startPos, transType - 3, boxRows, boxCols);
		 }
	 }
	 function  TL2BR1(timeline, tweens, colIndex, boxRows, boxCols){
		 var toffset = 0;
		 while ( colIndex <   boxCols -1 ){
			 for(var col  = 0; col <= colIndex; col++ ){
				 var row = colIndex - col;
				 var index = row * boxCols + col;
				 if (index < tweens.length ){
					 var tween  = tweens[index];
					 timeline.add(tween, toffset) ;
				 }
			 }
			 colIndex ++;
			 toffset += 0.1;
		 }
		 if ( colIndex >= boxCols -1 ) {   TL2BR_2(timeline, tweens,0, boxRows, boxCols);  }
	 }
	 function  TL2BR_2(timeline, tweens, rowIndex, boxRows, boxCols){
		 var toffset = 0;
		 while ( rowIndex < boxRows -1 ){
			 for(var row  = rowIndex; row < boxRows; row++ ){
				 var col = boxRows - 1 + rowIndex - row;
				 var index = row * boxCols + col;
				 if (index < tweens.length ){
					 var tween  = tweens[index];
					 timeline.add(tween, toffset) ;
				 }
			 }
			 rowIndex ++;
			 toffset += 0.1;
		 }
	 }
	 function  _one_dir(timeline, duration, tweens, curIndex, direction, boxRows, boxCols){
		 var is_hor = direction == 0 ||  direction == 1 ;
		 var nextIndex = curIndex;
		 var needPlays = [], needTargets = [];
		 var toffset = 0;
		 while( nextIndex >=0 && ( (is_hor && nextIndex < boxCols) ||( !is_hor && nextIndex < boxRows  ) )){
			 needPlays = [];
			 if ( is_hor ){
				 for(var row  = 0; row < boxRows; row++ ){
					 var index = row * boxCols + nextIndex;
					 if (index < tweens.length ){
						 needPlays.push( tweens[index] );
					 }
				 }
				 nextIndex =  direction == 0 ? nextIndex + 1 : nextIndex - 1  ;
			 }
			 else {
				 for(var col  = 0; col < boxCols; col++ ){
					 var index = nextIndex * boxCols + col;
					 if (index < tweens.length ){
						 needPlays.push( tweens[index] );
					 }
				 }
				 nextIndex = direction == 2 ? nextIndex + 1 : nextIndex - 1  ;
			 }
			 if( needPlays.length == 0 ) continue;
			for( var i = 0; i < needPlays.length; i++)
			   timeline.add(needPlays[i], toffset) ;
			toffset += Math.max(0.2, duration / (is_hor? boxCols : boxRows));
		 }
	 }

	 function showTempObj(cly, timeline, rect, duration){
		var callback = function(){
			rect.remove();
		}
		cly.createItems(timeline, {
			targets: rect,
			type: 'Write',
			duration: duration,
		},
		undefined,
		callback
		);
	 }
	 function doHomotopy(timeline, item, homotopy, duration, offset, doneCallback){
		var isRaster = item instanceof Raster;
		var kimage = isRaster ? item :  item.rasterize();
		var result = getImageBoxes(kimage), boxList = result.list, blen = boxList.length, started = false;
		timeline.add({
			targets : item,
			progressFunc : function(progress){
				if(!started) {
					started = true;
					boxList.forEach(e => { item._project._activeLayer.addChild(e); });
				};
				   var t  =  progress * duration, box,pos, r;
				   for(var i = 0; i < blen; i++){
						box = boxList[i];
						pos = box.position;
						r = homotopy(pos.x, pos.y, t);
						box.position = new Point(r[0], r[1]);
				   }
			}.bind(this),
			duration : duration,
			complete: function(){
				if( doneCallback ) doneCallback();
				boxList.forEach(e => { e.remove(); });
			}.bind(this)
		  }, offset);
	 }

	 return {
		 setProject: function(p){
			project = p;
		 },
		 shuffle: function(arr){
			  return shuffle0(arr);
		 },
		 handleSeveralTargets: function(items, duration, offset, callback){
			if( Array.isArray( items )){
				if( typeof offset != 'undefined' && offset != '=='){
					duration = duration * 1.0 / items.length;
				}
				callback( items[0], duration, offset);
				if( typeof offset == 'undefined' || offset == '=='){
					offset = '==';
				}
				for(var i = 1; i < items.length; i++)
					callback( items[i], duration, offset);
			} else {
				callback( items, duration, offset);
			}
		},
		handleTargets : function(params, offset, callback){
			var that = this,  items = params.target || params.targets, duration = params.duration || 1,
				offset = params.delay || offset ;
			this.handleSeveralTargets(items, duration, offset, function(item, duration, offset){
				var options = Base.set({}, params);
				delete options.target; delete options.targets;
				options.target = item;
				options.duration = duration;
				callback(options, offset);
			});
		},

		handleDelayedDelete: function(  item, duration, callback ){
			setTimeout(function(){
				item.remove();
				if( callback && callback.onEnd ){
					callback.onEnd();
				}
			},duration);
		 },
		 imageEffect2: function(layer, item, duration, transType, easing, positionFunc, isCreation, callback){
			if( typeof transType != 'number' )
			   transType = Ani_Types.indexOf(transType)
			if( transType < 0 ) transType = 0;
			  if( transType == 13 )
				this.handleDelayedDelete(item, duration, callback);
			 else if ( transType == 15 )
				  handleImageTrans(layer, item, duration, transType, easing || 'linear', positionFunc, isCreation, callback);
			 else
				  imgBoxEffect(layer, item, duration, transType, easing || 'linear', positionFunc, isCreation, callback);

		 },
		 imageFlipEffect: function(layer, removed, added, duration){
			var bd = removed.bounds,
				img_rmv = removed instanceof Raster ? removed : removed.rasterize(),
				rmv_1 = new CroppedImage(img_rmv,0, 0, bd.width/2, bd.height),
				rmv_2 = new CroppedImage(img_rmv, bd.width/2, 0, bd.width/2, bd.height),
				img_add= added instanceof Raster ? added : added.rasterize(),
				add_1 = new CroppedImage(img_add, 0, 0, bd.width/2, bd.height),
				timeline =  layer.getCurPage().ptimer;
			removed.remove();
			if(!(removed instanceof Raster)) img_rmv.remove();
			if(!(added instanceof Raster)) img_add.remove();
			var p1 = add_1.position.clone(), add_1_w = add_1.bounds.width, opacity = added.opacity;
			added.opacity = 0.01;
			add_1.bounds.width = 0.01;
			add_1.position = p1.__add(new Point(add_1_w/2+2,0))
			timeline.add({
				targets: rmv_2,
				'bounds.width' :   1,
				position: rmv_2.position.clone().__add(new Point(-bd.width/4, 0)),
				duration: duration/2,
				begin: function(){
					layer.addChild(rmv_1);
				},
				complete: function(){
					rmv_2.remove();
				}
			}) .add({
				targets: add_1,
				'bounds.width' :   add_1_w,
				position: p1,
				duration: duration/2,
				complete: function(){
					add_1.remove();
					rmv_1.remove();
				}
			}).add({
				targets: added,
				opacity: opacity,
				duration: duration
			}, '-=' + duration) ;
		 },

		 handleImageBgTransition : function( alay, kimage, duration, transType, kimage2, duration2, transType2, useForground){
			 var callback = {};
			 var count = 2;
			 if( typeof transType != 'number' )
				 transType = Ani_Types.indexOf(transType)
			 if( transType < 0 ) transType = 0;
			 if( !kimage  || transType == 13)
				 count --;
			 if( !kimage2 )
				 count --;
			 if( count <= 0 )
				 return;
			 callback.onStart = function( ) { };
			 callback.onEnd = function( ) {
				 count -- ;
				 if( count == 0 ) {
					 if( transType == 13 && kimage){
						 kimage.remove();
					 }
					 if(!useForground && kimage2){
						 kimage2.sendToBack();
					 }
				 }
			 };
			 if(useForground && kimage2){
				 kimage2.bringToFront();
			 }
			 if( transType != 13 && kimage) {
				 imgBoxEffect(alay, kimage, duration, transType, 'linear', null, false, callback);
			 }
			 if( kimage2 ) {
				 imgBoxEffect(alay, kimage2, duration2, transType2, 'linear', null, true, callback);
			 }
		 },
		 tweenSize: function( item, fromBounds, toBounds, duration, easing){
				var tweenwrap = {
					targets: item,
					'bounds.size': toBounds.size,
					'bounds.point': toBounds.point,
					easing: easing || 'linear',
					duration: duration,
				};
				item.bounds.point = fromBounds.point;
				item.bounds.size = fromBounds.size;
				return tweenwrap;
		 },
		 tweenPosition: function(  item, fromPos, toPos, duration, easing){
			var tweenwrap = {
				targets: item,
				position: toPos,
				easing: easing || 'linear',
				duration: duration,
			};
			item.position = fromPos;
			return tweenwrap;
		 },

		Homotopy: function(params, offset){
			var that = this;
			this.handleTargets(params, offset, function(params, offset){
				that.homotopy(params, offset);
			});
		},
		homotopy: function(params){
			 var  page = params.page, timeline = page.ptimer, item = params.targets || params.target,
				 homotopy = params.homotopy || function(x,y,t){ return [x,y]; },
				 duration = params.duration, offset = params.delay || params.offset,
				 doneCallback = params.doneCallback;
				if( item instanceof Path || item instanceof CompoundPath ||  (typeof item.containsAllPaths == 'function' && item.containsAllPaths(true)) ){
					item.doHomotopy(timeline, homotopy, duration, offset, doneCallback);
				} else {
					doHomotopy(timeline, item, homotopy, duration, offset, doneCallback);
				}
		 },
		 MorphingTo: function(params, offset){
			var that = this;
			this.handleTargets(params, offset, function(params, offset){
				that.morphingTo(params, offset);
			});
		 },
		 morphingTo: function(params, offset){
			var  page = params.page, timeline = page.ptimer, item = params.targets || params.target,
				duration = params.duration, offset = params.delay || params.offset, to = params.to,
				doneCallback = params.doneCallback;
			if( typeof item.morphingTo == 'function' ){
				item.morphingTo(timeline, to, duration, offset, doneCallback);
			}
		},
		 Flash: function(params, offset){
			var that = this;
			this.handleTargets(params, offset, function(params, offset){
				that.flash(params, offset);
			});
		 },
		 flash : function(params ){
			var  page = params.page, item = params.target || params.targets, times = params.times, color_array = params.color_array;
			 times = typeof times == 'undefined' ? 0 : times;
			if( !color_array ){
				var tweenwrap = {
					targets: item,
					opacity: 0.1,
					duration: 0.5,
					direction: 'alternate',
					loop: times == 0 ? true : times
				};
				times ? page.ptimer.add(tweenwrap) : anime(tweenwrap) ;
				return;
			}
			if(  color_array.length == 1 ){
				var tweenwrap = {
					targets: item,
					fillColor: color_array[0],
					duration: 0.5,
					direction: 'alternate',
					loop: times == 0 ? true : times
				};
				times ? page.ptimer.add(tweenwrap) : anime(tweenwrap) ;
				return;
			}
			var ocolor = item.fillColor, curcolor;
			color_array.push( ocolor );
			if( times ){
			   for(var k = 0; k < times; k++){
					for(var i = 0; i < color_array.length; i++){
						var tweenwrap = {
							targets: item,
							fillColor: color_array[i],
							duration: 0.5,
						};
							page.ptimer.add(tweenwrap);
					}
			   }
			} else {
				var acc = 0, pos = 0, ncolor ;
				for(var i = 0; i < color_array.length; i++){
					var c = color_array[i];
					if( c._class !== 'Color' )
						color_array[i] = new Color( c )
				}
				item.addUpdater(function(event){
					acc += event.delta *2;
					if( acc > 0.5 ){
						acc = 0;
						ocolor = color_array[pos];
						pos = (++pos) % color_array.length;
					}
					ncolor = color_array[pos];
					item.fillColor = ocolor.add( ncolor.subtract(ocolor).multiply(acc*2));
				});
			}
		 },
	   Indicate: function(params, offset){
			var that = this;
			this.handleTargets(params, offset, function(params, offset){
				that.indicate(params, offset);
			});
		},
		indicate : function( params, offset){
			var  page = params.page, item = params.target, times = params.times, w = item.bounds.width,
				 h = item.bounds.height, dw, dh ;
			if( w < 20 ) dw = w; else if (w < 100) dw = 20; else if (w < 200 ) dw = 40; else dw = 60;
			if( h < 20 ) dh = h; else if (h < 100) dh = 20; else if (h < 200 ) dh = 40; else dh = 60;

			if( times ){
				var pos = item.position, tweenwrap = {
					targets: item,
					position: pos,
					easing:  'linear',
					update: function(anim){
						var p =   anim.progress/100  ;
						item.bounds.width =  w +  Math.abs(Math.sin( Math.PI * times * p )) * dw  ;
						item.bounds.height =  h + Math.abs(Math.sin( Math.PI * times * p )) * dh   ;
					},
					complete: function(){
						 item.bounds.width = w;
						 item.bounds.height = h;
					},
					loop: times,
				};
				page.ptimer.add(tweenwrap);
			} else {
				var acc = 0;
				item.addUpdater(function(event){
					acc += event.delta *2;
					item.bounds.width =  w +  Math.abs(Math.sin(  acc )) * dw  ;
					item.bounds.height =  h + Math.abs(Math.sin(  acc)) * dh   ;
				});
			}
		 },
		 revolver_back: function( items, center,  easing, duration, callback){
			items.forEach( (v, i) =>{
					anime({
						targets: v,
						position: center,
						duration: duration || 1,
						easing: easing || 'linear',
						complete: function() {
							if( callback ) callback();
						} ,
					})
				}
			)
		 },
		 revolver: function( items, center, radius, angleFrom, angleTo, easing, duration, callback){
			var counts = items.length, step = (angleTo - angleFrom) / counts;
			items.forEach( (v, i) =>{
					anime({
						targets: v,
						position:  new Point(center.x + radius * Math.cos((angleFrom + step*i)* (Math.PI / 180)),
											center.y - radius * Math.sin((angleFrom + step*i)* (Math.PI / 180)) ) ,
						duration: duration || 1,
						easing: easing || 'linear',
						complete: function() {
							if( callback ) callback();
						} ,
					})
				}
			)
		 },
		 r9divmove : function (div, nx, ny, nw, nh, dur, callback) {
			 var x = parseInt(div.style.left), y = parseInt(div.style.top),
				 w = parseInt(div.style.width), h = parseInt(div.style.height),
				 t = 60.0 * dur / 1000, duration = dur;
			 var dx = typeof nx === 'number' ? (parseInt(nx) - x) / t : 0;
			 var dy = typeof ny === 'number' ? (parseInt(ny) - y) / t : 0;
			 var dw = typeof nw === 'number' ? (parseInt(nw) - w) / t : 0;
			 var dh = typeof nh === 'number' ? (parseInt(nh) - h) / t : 0;
			 function r() {
				 if (typeof dx === 'number' && dx != 0) div.style.left = parseInt(div.style.left) + dx + 'px';
				 if (typeof dy === 'number' && dy != 0) div.style.top = parseInt(div.style.top) + dy + 'px';
				 if (typeof dh === 'number' && dh != 0) div.style.width = parseInt(div.style.width) + dw + 'px';
				 if (typeof dw === 'number' && dw != 0) div.style.height = parseInt(div.style.height) + dh + 'px';
			 };
			 return {
				 target: {},
				 duration: dur,
				 update: r
			 };
		 },
		 r9_drawRounded : function (ctx, x, y, w, h, r) {
			 var rawctx = ctx
			 if (w < 2 * r) r = w / 2;
			 if (h < 2 * r) r = h / 2;
			 rawctx.beginPath();
			 rawctx.moveTo(x + r, y);
			 rawctx.arcTo(x + w, y, x + w, y + h, r);
			 rawctx.arcTo(x + w, y + h, x, y + h, r);
			 rawctx.arcTo(x, y + h, x, y, r);
			 rawctx.arcTo(x, y, x + w, y, r);
			 rawctx.closePath();
		 },

		 r9_drawMathForm: function(context, mathInput, tXoff, tYoff, context, style) {
		   if (mathInput != null && (typeof mathInput.render != 'undefined')) {
			 context.save();
			 context.translate(tXoff, tYoff);
			 context.setAttr('textBaseline', 'middle');
			 var fillcolor = style? style.fillColor : null;
			 var strokecolor = style? style.strokeColor : null;
			 var strokeWidth = style? style.strokeWidth : 1;
			 var fontSize = style? style.fontSize : 18;
			 if (fillcolor) context.setAttr('fillStyle', fillcolor);
			 if (strokecolor) context.setAttr('storkeStyle', strokecolor);
			 for (var i in mathInput.render) {
				 var r = mathInput.render[i];
				 if (r.type == 'fra-sign' || r.type == 'root-group') {
					 context.beginPath();
					 context.moveTo(r.x1, r.y1);
					 context.lineTo(r.x2, r.y2);
					 context.stroke();
				 } else if (r.type == 'rootsign') {
					 context.beginPath();
					 context.moveTo(r.x, r.y + r.h * 2 / 3);
					 context.lineTo(r.x + r.w / 3, r.y + r.h);
					 context.lineTo(r.x + r.w, r.y);
					 context.stroke();
					 if (style){
						 style.strokeWidth = 1;
						 style.fontSize = r.fs;
						 context.font = style.getFontStyle();
					 }
					 context.strokeText(r.s, r.x, r.y);
					 context.fillText(r.s, r.x, r.y + r.asc / 4);
					 if (style){
						 style.strokeWidth = strokeWidth;
						 style.fontSize = fontSize;
						 context.font = style.getFontStyle();
					 }
				 } else if (typeof r.value != 'undefined') {
						 context.save();
						 if (style){
							  style.strokeWidth = 1;
							  style.fontSize = r.fs;
							  context.font = style.getFontStyle();
						  }
						 context.translate(r.x, r.y);
						 if (typeof r.sx != 'undefined' && typeof r.sy != 'undefined') {
							 context.scale(r.sx, r.sy);
						 }
						 context.strokeText(r.value, 0, 0);
						 context.fillText(r.value, 0, 0);
						 if (style){
							  style.strokeWidth = strokeWidth;
							  style.fontSize = fontSize;
						  }
						 context.restore();
				 }
			 }
			 context.restore();
		   }
		},
		nextSequenceSymbol: function(symbol) {
			return this.nextSequenceSymbol(symbol, false);
		},
		nextSequenceSymbol: function(symbol, upcase) {
			if( !symbol  || symbol.length == 0 )
				return upcase? "A" : "a";
			var v =  parseInt(symbol);
			if(!Number.isNaN(v))  return (v + 1) + "";
			var length = symbol.length, pos = symbol.indexOf("_");
			if( pos == 0 || pos ==  length -1)
				return null;
			if( pos > 0 ) {
				  v =  parseInt(symbol.substring(pos+1));
				if(!Number.isNaN(v)) return symbol.substring(0, pos) + "_" + (v+1);
			}
			pos = symbol.indexOf("^");
			if( pos == 0 || pos ==  length-1)
				return null;
			if( pos > 0 ) {
				  v =  parseInt(symbol.substring(pos+1));
				if(!Number.isNaN(v)) return symbol.substring(0, pos) + "^" + (v+1);
			}
			var c = symbol.charAt(0), ccode = symbol.charCodeAt(0);
			if( !c.match(/[a-z]/i)   )
				return null;
			if( length == 1 ) {
				return ( c.match(/[A-Z]/) ) ?
					   (( c  == 'Z' ) ? "A0" : String.fromCharCode(ccode+1))
					  :  (( c  == 'z' ) ? "a0" : String.fromCharCode(ccode+1));
			}
			 v =   parseInt(symbol.substring(1));
			return Number.isNaN(v) ? null :  "" + c + (v+1);
		} ,
	   Focus: function(params, offset){
			var that = this;
			this.handleTargets(params, offset, function(params, offset){
				that.focus(params, offset);
			});
		},
		focus: function(params){
			  var  conf =  project.configuration,
			  w = conf.frame_width, h = conf.frame_height,
			  circle = new Path.Circle({
				  center: params.target ? params.target.position : params.position,
				  radius: (w+h)/4,
				  fillColor : params.color || 'gray',
				  opacity: params.opacity || '0.3',
			  })
			  params.page.ptimer.add({
				  targets: circle,
				  'bounds.size': new Size(10,10),
				  position: '+=[0,0]',
				  duration: params.duration || 1,
				  complete: function(){
					  circle.remove();
				  }
			  })
		},
		Circumscribe: function(params, offset){
			var that = this;
			this.handleTargets(params, offset, function(params, offset){
				that.circumscribe(params, offset);
			});
		},
		circumscribe: function(params, offset){
			var  page = params.page, target =   params.target, bd = target.bounds, rect;
			if( target instanceof PathItem ){
			   rect = target.clone();
			   rect.bounds.width = bd.width + 20;
			   rect.bounds.height = bd.height + 20;
			   rect.position = target.position;
			   rect.strokeColor = params.color ||  target.strokeColor;
			   rect.strokeWidth = params.strokeWidth || target.strokeWidth || 2;
			   rect.fillColor = null;
			} else {
				rect = new Path.Rectangle({
					from:  bd.topLeft.__add(-10,-10),
					to: bd.bottomRight.__add(10,10),
					strokeColor : params.color ||  target.strokeColor,
					strokeWidth:  params.strokeWidth || 2,
				})
			}
			showTempObj( page.cly, page.ptimer, rect, params.duration || 1);
	  },
	   ShowPassingFlash : function(params, offset){
			var that = this;
			this.handleTargets(params, offset, function(params, offset){
				that.showpassingflash(params, offset);
			});
	   },

	   showpassingflash : function(params, offset){
			var page = params.page, target = params.target, bd = target.bounds, underline;
			underline = new R9Line(bd.bottomLeft.__add(0, 20), bd.bottomRight.__add(0,20));
			underline.strokeColor = params.color ||  target.strokeColor;
			underline.strokeWidth = params.strokeWidth || target.strokeWidth || 2;
			if( params.tips )  underline.setTips(params.tips);
			showTempObj( page.cly, page.ptimer, underline, params.duration || 1);
	  },
		ApplyingWaves : function(params, offset){
			var that = this;
			this.handleTargets(params, offset, function(params, offset){
				 that.applyingwaves(params, offset);
			});
		},

		applyingwaves : function(params, offset){
			var page = params.page, direction = params.direction || new Point([0,1]),
				target = params.target, bd = target.bounds,
				amplitude = params.amplitude ||  Math.max(bd.height/10, 30),
				wave_func = params.wave_func ||  Numerical.smooth,
				time_width = params.time_width ||  Math.max(bd.width/10, 50),  ripples = params.ripples || 1 ;
			var  x_min = target.bounds.x,
				x_max = x_min + target.bounds.width,
				vect = direction.normalize().__multiply( amplitude );
			var wave = function(t) {
				t = 1 - t;
				if (t >= 1 || t <= 0)
					return 0
				let phases = ripples * 2;
				let phase = parseInt(t * phases);
				if (phase == 0)
					return wave_func(t * phases);
				else if( phase == phases - 1 ){
					t -= phase / phases   ;
					return (1 - wave_func(t * phases)) * (2 * (ripples % 2) - 1);
				}
				else {
					phase = parseInt((phase - 1) / 2);
					t -= (2 * phase + 1) / phases;
					return (1 - 2 * wave_func(t * ripples)) * (1 - 2 * ((phase) % 2))
				}
			}
			var homo = function(x,y,t){
				var upper = Numerical.interpolate(0, 1 + time_width, t);
				var lower = upper - time_width
				var relative_x = Numerical.inverse_interpolate(x_min, x_max, x)
				var  wave_phase = Numerical.inverse_interpolate(lower, upper, relative_x)
				var nudge =  vect.__multiply(wave(wave_phase));
				return  [x + nudge.x, y + nudge.y];
			}
		   params.homotopy = homo;
		   this.homotopy(params, offset);
	  },
	}
};

var Point = Base.extend({
	_class: 'Point',
	_readIndex: true,

	initialize: function Point(arg0, arg1) {
		var type = typeof arg0,
			reading = this.__read,
			read = 0;
		if (type === 'number') {
			var hasY = typeof arg1 === 'number';
			this._set(arg0, hasY ? arg1 : arg0);
			if (reading)
				read = hasY ? 2 : 1;
		} else if (type === 'undefined' || arg0 === null) {
			this._set(0, 0);
			if (reading)
				read = arg0 === null ? 1 : 0;
		} else {
			var obj = type === 'string' ? arg0.split(/[\s,]+/) || [] : arg0;
			read = 1;
			if (Array.isArray(obj)) {
				this._set(+obj[0], +(obj.length > 1 ? obj[1] : obj[0]));
			} else if ('x' in obj) {
				this._set(obj.x || 0, obj.y || 0);
			} else if ('width' in obj) {
				this._set(obj.width || 0, obj.height || 0);
			} else if ('angle' in obj) {
				this._set(obj.length || 0, 0);
				this.setAngle(obj.angle || 0);
			} else {
				this._set(0, 0);
				read = 0;
			}
		}
		if (reading)
			this.__read = read;
		return this;
	},

	set: '#initialize',

	_set: function(x, y) {
		this.x = x;
		this.y = y;
		return this;
	},

	equals: function(point) {
		return this === point || point
				&& (this.x === point.x && this.y === point.y
					|| Array.isArray(point)
						&& this.x === point[0] && this.y === point[1])
				|| false;
	},

	clone: function() {
		return new Point(this.x, this.y);
	},

	toString: function() {
		var f = Formatter.instance;
		return '{ x: ' + f.number(this.x) + ', y: ' + f.number(this.y) + ' }';
	},

	_serialize: function(options) {
		var f = options.formatter;
		return [f.number(this.x), f.number(this.y)];
	},

	getLength: function() {
		return Math.sqrt(this.x * this.x + this.y * this.y);
	},

	setLength: function(length) {
		if (this.isZero()) {
			var angle = this._angle || 0;
			this._set(
				Math.cos(angle) * length,
				Math.sin(angle) * length
			);
		} else {
			var scale = length / this.getLength();
			if (Numerical.isZero(scale))
				this.getAngle();
			this._set(
				this.x * scale,
				this.y * scale
			);
		}
	},

	morphingTo: function(to, progress){
		var x = ( to.x - this.x ) * progress + this.x,
			y = ( to.y - this.y ) * progress + this.y;
		return new Point(x, y );
	},
	getAngle: function() {
		return this.getAngleInRadians.apply(this, arguments) * 180 / Math.PI;
	},

	setAngle: function(angle) {
		this.setAngleInRadians.call(this, angle * Math.PI / 180);
	},

	getAngleInDegrees: '#getAngle',
	setAngleInDegrees: '#setAngle',

	getAngleInRadians: function() {
		if (!arguments.length) {
			return this.isZero()
					? this._angle || 0
					: this._angle = Math.atan2(this.y, this.x);
		} else {
			var point = Point.read(arguments),
				div = this.getLength() * point.getLength();
			if (Numerical.isZero(div)) {
				return NaN;
			} else {
				var a = this.dot(point) / div;
				return Math.acos(a < -1 ? -1 : a > 1 ? 1 : a);
			}
		}
	},

	setAngleInRadians: function(angle) {
		this._angle = angle;
		if (!this.isZero()) {
			var length = this.getLength();
			this._set(
				Math.cos(angle) * length,
				Math.sin(angle) * length
			);
		}
	},

	getQuadrant: function() {
		return this.x >= 0 ? this.y >= 0 ? 1 : 4 : this.y >= 0 ? 2 : 3;
	}
}, {
	beans: false,

	getDirectedAngle: function() {
		var point = Point.read(arguments);
		return Math.atan2(this.cross(point), this.dot(point)) * 180 / Math.PI;
	},

	getDistance: function() {
		var args = arguments,
			point = Point.read(args),
			x = point.x - this.x,
			y = point.y - this.y,
			d = x * x + y * y,
			squared = Base.read(args);
		return squared ? d : Math.sqrt(d);
	},

	normalize: function(length) {
		if (length === undefined)
			length = 1;
		var current = this.getLength(),
			scale = current !== 0 ? length / current : 0,
			point = new Point(this.x * scale, this.y * scale);
		if (scale >= 0)
			point._angle = this._angle;
		return point;
	},

	rotate: function(angle, center) {
		if (angle === 0)
			return this.clone();
		angle = angle * Math.PI / 180;
		var point = center ? this.subtract(center) : this,
			sin = Math.sin(angle),
			cos = Math.cos(angle);
		point = new Point(
			point.x * cos - point.y * sin,
			point.x * sin + point.y * cos
		);
		return center ? point.add(center) : point;
	},

	transform: function(matrix) {
		return matrix ? matrix._transformPoint(this) : this;
	},

	add: function() {
		var point = Point.read(arguments);
		return new Point(this.x + point.x, this.y + point.y);
	},

	subtract: function() {
		var point = Point.read(arguments);
		return new Point(this.x - point.x, this.y - point.y);
	},

	multiply: function() {
		var point = Point.read(arguments);
		return new Point(this.x * point.x, this.y * point.y);
	},

	divide: function() {
		var point = Point.read(arguments);
		return new Point(this.x / point.x, this.y / point.y);
	},

	modulo: function() {
		var point = Point.read(arguments);
		return new Point(this.x % point.x, this.y % point.y);
	},

	negate: function() {
		return new Point(-this.x, -this.y);
	},

	isInside: function() {
		return Rectangle.read(arguments).contains(this);
	},

	isClose: function() {
		var args = arguments,
			point = Point.read(args),
			tolerance = Base.read(args);
		return this.getDistance(point) <= tolerance;
	},

	isCollinear: function() {
		var point = Point.read(arguments);
		return Point.isCollinear(this.x, this.y, point.x, point.y);
	},

	isColinear: '#isCollinear',

	isOrthogonal: function() {
		var point = Point.read(arguments);
		return Point.isOrthogonal(this.x, this.y, point.x, point.y);
	},

	isZero: function() {
		var isZero = Numerical.isZero;
		return isZero(this.x) && isZero(this.y);
	},

	isNaN: function() {
		return isNaN(this.x) || isNaN(this.y);
	},

	isInQuadrant: function(q) {
		return this.x * (q > 1 && q < 4 ? -1 : 1) >= 0
			&& this.y * (q > 2 ? -1 : 1) >= 0;
	},

	dot: function() {
		var point = Point.read(arguments);
		return this.x * point.x + this.y * point.y;
	},

	cross: function() {
		var point = Point.read(arguments);
		return this.x * point.y - this.y * point.x;
	},

	project: function() {
		var point = Point.read(arguments),
			scale = point.isZero() ? 0 : this.dot(point) / point.dot(point);
		return new Point(
			point.x * scale,
			point.y * scale
		);
	},

	statics: {
		min: function() {
			var args = arguments,
				point1 = Point.read(args),
				point2 = Point.read(args);
			return new Point(
				Math.min(point1.x, point2.x),
				Math.min(point1.y, point2.y)
			);
		},

		max: function() {
			var args = arguments,
				point1 = Point.read(args),
				point2 = Point.read(args);
			return new Point(
				Math.max(point1.x, point2.x),
				Math.max(point1.y, point2.y)
			);
		},

		random: function() {
			return new Point(Math.random(), Math.random());
		},

		isCollinear: function(x1, y1, x2, y2) {
			return Math.abs(x1 * y2 - y1 * x2)
					<= Math.sqrt((x1 * x1 + y1 * y1) * (x2 * x2 + y2 * y2))
						* 1e-8;
		},

		isOrthogonal: function(x1, y1, x2, y2) {
			return Math.abs(x1 * x2 + y1 * y2)
					<= Math.sqrt((x1 * x1 + y1 * y1) * (x2 * x2 + y2 * y2))
						* 1e-8;
		}
	}
}, Base.each(['round', 'ceil', 'floor', 'abs'], function(key) {
	var op = Math[key];
	this[key] = function() {
		return new Point(op(this.x), op(this.y));
	};
}, {}));

var LinkedPoint = Point.extend({
	initialize: function Point(x, y, owner, setter) {
		this._x = x;
		this._y = y;
		this._owner = owner;
		this._setter = setter;
	},

	_set: function(x, y, _dontNotify) {
		this._x = x;
		this._y = y;
		if (!_dontNotify)
			this._owner[this._setter](this);
		return this;
	},

	getX: function() {
		return this._x;
	},

	setX: function(x) {
		this._x = x;
		this._owner[this._setter](this);
	},

	getY: function() {
		return this._y;
	},

	setY: function(y) {
		this._y = y;
		this._owner[this._setter](this);
	},

	isSelected: function() {
		return !!(this._owner._selection & this._getSelection());
	},

	setSelected: function(selected) {
		this._owner._changeSelection(this._getSelection(), selected);
	},

	_getSelection: function() {
		return this._setter === 'setPosition' ? 4 : 0;
	}
});

var Size = Base.extend({
	_class: 'Size',
	_readIndex: true,

	initialize: function Size(arg0, arg1) {
		var type = typeof arg0,
			reading = this.__read,
			read = 0;
		if (type === 'number') {
			var hasHeight = typeof arg1 === 'number';
			this._set(arg0, hasHeight ? arg1 : arg0);
			if (reading)
				read = hasHeight ? 2 : 1;
		} else if (type === 'undefined' || arg0 === null) {
			this._set(0, 0);
			if (reading)
				read = arg0 === null ? 1 : 0;
		} else {
			var obj = type === 'string' ? arg0.split(/[\s,]+/) || [] : arg0;
			read = 1;
			if (Array.isArray(obj)) {
				this._set(+obj[0], +(obj.length > 1 ? obj[1] : obj[0]));
			} else if ('width' in obj) {
				this._set(obj.width || 0, obj.height || 0);
			} else if ('x' in obj) {
				this._set(obj.x || 0, obj.y || 0);
			} else {
				this._set(0, 0);
				read = 0;
			}
		}
		if (reading)
			this.__read = read;
		return this;
	},

	set: '#initialize',

	_set: function(width, height) {
		this.width = width;
		this.height = height;
		return this;
	},

	equals: function(size) {
		return size === this || size && (this.width === size.width
				&& this.height === size.height
				|| Array.isArray(size) && this.width === size[0]
					&& this.height === size[1]) || false;
	},

	clone: function() {
		return new Size(this.width, this.height);
	},

	toString: function() {
		var f = Formatter.instance;
		return '{ width: ' + f.number(this.width)
				+ ', height: ' + f.number(this.height) + ' }';
	},

	_serialize: function(options) {
		var f = options.formatter;
		return [f.number(this.width),
				f.number(this.height)];
	},

	add: function() {
		var size = Size.read(arguments);
		return new Size(this.width + size.width, this.height + size.height);
	},

	subtract: function() {
		var size = Size.read(arguments);
		return new Size(this.width - size.width, this.height - size.height);
	},

	multiply: function() {
		var size = Size.read(arguments);
		return new Size(this.width * size.width, this.height * size.height);
	},

	divide: function() {
		var size = Size.read(arguments);
		return new Size(this.width / size.width, this.height / size.height);
	},

	modulo: function() {
		var size = Size.read(arguments);
		return new Size(this.width % size.width, this.height % size.height);
	},

	negate: function() {
		return new Size(-this.width, -this.height);
	},

	isZero: function() {
		var isZero = Numerical.isZero;
		return isZero(this.width) && isZero(this.height);
	},

	isNaN: function() {
		return isNaN(this.width) || isNaN(this.height);
	},

	morphingTo: function(to, progress){
		var w = ( to.width - this.width ) * progress + this.width,
			h = ( to.height - this.height ) * progress + this.height;
		return new Point(w, h);
	},

	statics: {
		min: function(size1, size2) {
			return new Size(
				Math.min(size1.width, size2.width),
				Math.min(size1.height, size2.height));
		},

		max: function(size1, size2) {
			return new Size(
				Math.max(size1.width, size2.width),
				Math.max(size1.height, size2.height));
		},

		random: function() {
			return new Size(Math.random(), Math.random());
		}
	}
}, Base.each(['round', 'ceil', 'floor', 'abs'], function(key) {
	var op = Math[key];
	this[key] = function() {
		return new Size(op(this.width), op(this.height));
	};
}, {}));

var LinkedSize = Size.extend({
	initialize: function Size(width, height, owner, setter) {
		this._width = width;
		this._height = height;
		this._owner = owner;
		this._setter = setter;
	},

	_set: function(width, height, _dontNotify) {
		this._width = width;
		this._height = height;
		if (!_dontNotify)
			this._owner[this._setter](this);
		return this;
	},

	getWidth: function() {
		return this._width;
	},

	setWidth: function(width) {
		this._width = width;
		this._owner[this._setter](this);
	},

	getHeight: function() {
		return this._height;
	},

	setHeight: function(height) {
		this._height = height;
		this._owner[this._setter](this);
	}
});

var Rectangle = Base.extend({
	_class: 'Rectangle',
	_readIndex: true,
	beans: true,

	initialize: function Rectangle(arg0, arg1, arg2, arg3) {
		var args = arguments,
			type = typeof arg0,
			read;
		if (type === 'number') {
			this._set(arg0, arg1, arg2, arg3);
			read = 4;
		} else if (type === 'undefined' || arg0 === null) {
			this._set(0, 0, 0, 0);
			read = arg0 === null ? 1 : 0;
		} else if (args.length === 1) {
			if (Array.isArray(arg0)) {
				this._set.apply(this, arg0);
				read = 1;
			} else if (arg0.x !== undefined || arg0.width !== undefined) {
				this._set(arg0.x || 0, arg0.y || 0,
						arg0.width || 0, arg0.height || 0);
				read = 1;
			} else if (arg0.from === undefined && arg0.to === undefined) {
				this._set(0, 0, 0, 0);
				if (Base.readSupported(args, this)) {
					read = 1;
				}
			}
		}
		if (read === undefined) {
			var frm = Point.readNamed(args, 'from'),
				next = Base.peek(args),
				x = frm.x,
				y = frm.y,
				width,
				height;
			if (next && next.x !== undefined || Base.hasNamed(args, 'to')) {
				var to = Point.readNamed(args, 'to');
				width = to.x - x;
				height = to.y - y;
				if (width < 0) {
					x = to.x;
					width = -width;
				}
				if (height < 0) {
					y = to.y;
					height = -height;
				}
			} else {
				var size = Size.read(args);
				width = size.width;
				height = size.height;
			}
			this._set(x, y, width, height);
			read = args.__index;
		}
		var filtered = args.__filtered;
		if (filtered)
			this.__filtered = filtered;
		if (this.__read)
			this.__read = read;
		return this;
	},

	set: '#initialize',

	_set: function(x, y, width, height) {
		this.x = x;
		this.y = y;
		this.width = width;
		this.height = height;
		return this;
	},

	clone: function() {
		return new Rectangle(this.x, this.y, this.width, this.height);
	},

	equals: function(rect) {
		var rt = Base.isPlainValue(rect)
				? Rectangle.read(arguments)
				: rect;
		return rt === this
				|| rt && this.x === rt.x && this.y === rt.y
					&& this.width === rt.width && this.height === rt.height
				|| false;
	},

	toString: function() {
		var f = Formatter.instance;
		return '{ x: ' + f.number(this.x)
				+ ', y: ' + f.number(this.y)
				+ ', width: ' + f.number(this.width)
				+ ', height: ' + f.number(this.height)
				+ ' }';
	},

	_serialize: function(options) {
		var f = options.formatter;
		return [f.number(this.x),
				f.number(this.y),
				f.number(this.width),
				f.number(this.height)];
	},

	getPoint: function(_dontLink) {
		var ctor = _dontLink ? Point : LinkedPoint;
		return new ctor(this.x, this.y, this, 'setPoint');
	},

	setPoint: function() {
		var point = Point.read(arguments);
		this.x = point.x;
		this.y = point.y;
	},

	getSize: function(_dontLink) {
		var ctor = _dontLink ? Size : LinkedSize;
		return new ctor(this.width, this.height, this, 'setSize');
	},

	_fw: 1,
	_fh: 1,

	setSize: function() {
		var size = Size.read(arguments),
			sx = this._sx,
			sy = this._sy,
			w = size.width,
			h = size.height;
		if (sx) {
			this.x += (this.width - w) * sx;
		}
		if (sy) {
			this.y += (this.height - h) * sy;
		}
		this.width = w;
		this.height = h;
		this._fw = this._fh = 1;
	},

	getLeft: function() {
		return this.x;
	},

	setLeft: function(left) {
		if (!this._fw) {
			var amount = left - this.x;
			this.width -= this._sx === 0.5 ? amount * 2 : amount;
		}
		this.x = left;
		this._sx = this._fw = 0;
	},

	getTop: function() {
		return this.y;
	},

	setTop: function(top) {
		if (!this._fh) {
			var amount = top - this.y;
			this.height -= this._sy === 0.5 ? amount * 2 : amount;
		}
		this.y = top;
		this._sy = this._fh = 0;
	},

	getRight: function() {
		return this.x + this.width;
	},

	setRight: function(right) {
		if (!this._fw) {
			var amount = right - this.x;
			this.width = this._sx === 0.5 ? amount * 2 : amount;
		}
		this.x = right - this.width;
		this._sx = 1;
		this._fw = 0;
	},

	getBottom: function() {
		return this.y + this.height;
	},

	setBottom: function(bottom) {
		if (!this._fh) {
			var amount = bottom - this.y;
			this.height = this._sy === 0.5 ? amount * 2 : amount;
		}
		this.y = bottom - this.height;
		this._sy = 1;
		this._fh = 0;
	},

	getCenterX: function() {
		return this.x + this.width / 2;
	},

	setCenterX: function(x) {
		if (this._fw || this._sx === 0.5) {
			this.x = x - this.width / 2;
		} else {
			if (this._sx) {
				this.x += (x - this.x) * 2 * this._sx;
			}
			this.width = (x - this.x) * 2;
		}
		this._sx = 0.5;
		this._fw = 0;
	},

	getCenterY: function() {
		return this.y + this.height / 2;
	},

	setCenterY: function(y) {
		if (this._fh || this._sy === 0.5) {
			this.y = y - this.height / 2;
		} else {
			if (this._sy) {
				this.y += (y - this.y) * 2 * this._sy;
			}
			this.height = (y - this.y) * 2;
		}
		this._sy = 0.5;
		this._fh = 0;
	},

	getCenter: function(_dontLink) {
		var ctor = _dontLink ? Point : LinkedPoint;
		return new ctor(this.getCenterX(), this.getCenterY(), this, 'setCenter');
	},

	setCenter: function() {
		var point = Point.read(arguments);
		this.setCenterX(point.x);
		this.setCenterY(point.y);
		return this;
	},

	getArea: function() {
		return this.width * this.height;
	},

	isEmpty: function() {
		return this.width === 0 || this.height === 0;
	},

	morphingTo: function(to, progress){
	  var w = ( to.width - this.width ) * progress + this.width,
		  h = ( to.height - this.height ) * progress + this.height,
		  x = ( to.x - this.x ) * progress + this.x,
		  y = ( to.y - this.y ) * progress + this.y;
	  return new Rectangle(x, y, w, h);
	},

	contains: function(arg) {
		return arg && arg.width !== undefined
				|| (Array.isArray(arg) ? arg : arguments).length === 4
				? this._containsRectangle(Rectangle.read(arguments))
				: this._containsPoint(Point.read(arguments));
	},

	_containsPoint: function(point) {
		var x = point.x,
			y = point.y;
		return x >= this.x && y >= this.y
				&& x <= this.x + this.width
				&& y <= this.y + this.height;
	},

	_containsRectangle: function(rect) {
		var x = rect.x,
			y = rect.y;
		return x >= this.x && y >= this.y
				&& x + rect.width <= this.x + this.width
				&& y + rect.height <= this.y + this.height;
	},

	intersects: function() {
		var rect = Rectangle.read(arguments),
			epsilon = Base.read(arguments) || 0;
		return rect.x + rect.width > this.x - epsilon
				&& rect.y + rect.height > this.y - epsilon
				&& rect.x < this.x + this.width + epsilon
				&& rect.y < this.y + this.height + epsilon;
	},

	intersect: function() {
		var rect = Rectangle.read(arguments),
			x1 = Math.max(this.x, rect.x),
			y1 = Math.max(this.y, rect.y),
			x2 = Math.min(this.x + this.width, rect.x + rect.width),
			y2 = Math.min(this.y + this.height, rect.y + rect.height);
		return new Rectangle(x1, y1, x2 - x1, y2 - y1);
	},

	unite: function() {
		var rect = Rectangle.read(arguments),
			x1 = Math.min(this.x, rect.x),
			y1 = Math.min(this.y, rect.y),
			x2 = Math.max(this.x + this.width, rect.x + rect.width),
			y2 = Math.max(this.y + this.height, rect.y + rect.height);
		return new Rectangle(x1, y1, x2 - x1, y2 - y1);
	},

	include: function() {
		var point = Point.read(arguments);
		var x1 = Math.min(this.x, point.x),
			y1 = Math.min(this.y, point.y),
			x2 = Math.max(this.x + this.width, point.x),
			y2 = Math.max(this.y + this.height, point.y);
		return new Rectangle(x1, y1, x2 - x1, y2 - y1);
	},

	expand: function() {
		var amount = Size.read(arguments),
			hor = amount.width,
			ver = amount.height;
		return new Rectangle(this.x - hor / 2, this.y - ver / 2,
				this.width + hor, this.height + ver);
	},

	scale: function(hor, ver) {
		return this.expand(this.width * hor - this.width,
				this.height * (ver === undefined ? hor : ver) - this.height);
	}
}, Base.each([
		['Top', 'Left'], ['Top', 'Right'],
		['Bottom', 'Left'], ['Bottom', 'Right'],
		['Left', 'Center'], ['Top', 'Center'],
		['Right', 'Center'], ['Bottom', 'Center']
	],
	function(parts, index) {
		var part = parts.join(''),
			xFirst = /^[RL]/.test(part);
		if (index >= 4)
			parts[1] += xFirst ? 'Y' : 'X';
		var x = parts[xFirst ? 0 : 1],
			y = parts[xFirst ? 1 : 0],
			getX = 'get' + x,
			getY = 'get' + y,
			setX = 'set' + x,
			setY = 'set' + y,
			get = 'get' + part,
			set = 'set' + part;
		this[get] = function(_dontLink) {
			var ctor = _dontLink ? Point : LinkedPoint;
			return new ctor(this[getX](), this[getY](), this, set);
		};
		this[set] = function() {
			var point = Point.read(arguments);
			this[setX](point.x);
			this[setY](point.y);
		};
	}, {
		beans: true
	}
));

var LinkedRectangle = Rectangle.extend({
	initialize: function Rectangle(x, y, width, height, owner, setter) {
		this._set(x, y, width, height, true);
		this._owner = owner;
		this._setter = setter;
	},

	_set: function(x, y, width, height, _dontNotify) {
		this._x = x;
		this._y = y;
		this._width = width;
		this._height = height;
		if (!_dontNotify)
			this._owner[this._setter](this);
		return this;
	}
},
new function() {
	var proto = Rectangle.prototype;

	return Base.each(['x', 'y', 'width', 'height'], function(key) {
		var part = Base.capitalize(key),
			internal = '_' + key;
		this['get' + part] = function() {
			return this[internal];
		};

		this['set' + part] = function(value) {
			this[internal] = value;
			if (!this._dontNotify)
				this._owner[this._setter](this);
		};
	}, Base.each(['Point', 'Size', 'Center',
			'Left', 'Top', 'Right', 'Bottom', 'CenterX', 'CenterY',
			'TopLeft', 'TopRight', 'BottomLeft', 'BottomRight',
			'LeftCenter', 'TopCenter', 'RightCenter', 'BottomCenter'],
		function(key) {
			var name = 'set' + key;
			this[name] = function() {
				this._dontNotify = true;
				proto[name].apply(this, arguments);
				this._dontNotify = false;
				this._owner[this._setter](this);
			};
		}, {
			isSelected: function() {
				return !!(this._owner._selection & 2);
			},

			setSelected: function(selected) {
				var owner = this._owner;
				if (owner._changeSelection) {
					owner._changeSelection(2, selected);
				}
			}
		})
	);
});

var Matrix = Base.extend({
	_class: 'Matrix',

	initialize: function Matrix(arg, _dontNotify) {
		var args = arguments,
			count = args.length,
			ok = true;
		if (count >= 6) {
			this._set.apply(this, args);
		} else if (count === 1 || count === 2) {
			if (arg instanceof Matrix) {
				this._set(arg._a, arg._b, arg._c, arg._d, arg._tx, arg._ty,
						_dontNotify);
			} else if (Array.isArray(arg)) {
				this._set.apply(this,
						_dontNotify ? arg.concat([_dontNotify]) : arg);
			} else {
				ok = false;
			}
		} else if (!count) {
			this.reset();
		} else {
			ok = false;
		}
		if (!ok) {
			throw new Error('Unsupported matrix parameters');
		}
		return this;
	},

	set: '#initialize',

	_set: function(a, b, c, d, tx, ty, _dontNotify) {
		this._a = a;
		this._b = b;
		this._c = c;
		this._d = d;
		this._tx = tx;
		this._ty = ty;
		if (!_dontNotify)
			this._changed();
		return this;
	},

	_serialize: function(options, dictionary) {
		return Base.serialize(this.getValues(), options, true, dictionary);
	},

	_changed: function() {
		var owner = this._owner;
		if (owner) {
			if (owner._applyMatrix) {
				owner.transform(null, true);
			} else {
				owner._changed(25);
			}
		}
	},

	clone: function() {
		return new Matrix(this._a, this._b, this._c, this._d,
				this._tx, this._ty);
	},

	equals: function(mx) {
		return mx === this || mx && this._a === mx._a && this._b === mx._b
				&& this._c === mx._c && this._d === mx._d
				&& this._tx === mx._tx && this._ty === mx._ty;
	},

	toString: function() {
		var f = Formatter.instance;
		return '[[' + [f.number(this._a), f.number(this._c),
					f.number(this._tx)].join(', ') + '], ['
				+ [f.number(this._b), f.number(this._d),
					f.number(this._ty)].join(', ') + ']]';
	},

	reset: function(_dontNotify) {
		this._a = this._d = 1;
		this._b = this._c = this._tx = this._ty = 0;
		if (!_dontNotify)
			this._changed();
		return this;
	},

	apply: function(recursively, _setApplyMatrix) {
		var owner = this._owner;
		if (owner) {
			owner.transform(null, Base.pick(recursively, true), _setApplyMatrix);
			return this.isIdentity();
		}
		return false;
	},

	translate: function() {
		var point = Point.read(arguments),
			x = point.x,
			y = point.y;
		this._tx += x * this._a + y * this._c;
		this._ty += x * this._b + y * this._d;
		this._changed();
		return this;
	},

	scale: function() {
		var args = arguments,
			scale = Point.read(args),
			center = Point.read(args, 0, { readNull: true });
		if (center)
			this.translate(center);
		this._a *= scale.x;
		this._b *= scale.x;
		this._c *= scale.y;
		this._d *= scale.y;
		if (center)
			this.translate(center.negate());
		this._changed();
		return this;
	},

	rotate: function(angle ) {
		angle *= Math.PI / 180;
		var center = Point.read(arguments, 1),
			x = center.x,
			y = center.y,
			cos = Math.cos(angle),
			sin = Math.sin(angle),
			tx = x - x * cos + y * sin,
			ty = y - x * sin - y * cos,
			a = this._a,
			b = this._b,
			c = this._c,
			d = this._d;
		this._a = cos * a + sin * c;
		this._b = cos * b + sin * d;
		this._c = -sin * a + cos * c;
		this._d = -sin * b + cos * d;
		this._tx += tx * a + ty * c;
		this._ty += tx * b + ty * d;
		this._changed();
		return this;
	},

	shear: function() {
		var args = arguments,
			shear = Point.read(args),
			center = Point.read(args, 0, { readNull: true });
		if (center)
			this.translate(center);
		var a = this._a,
			b = this._b;
		this._a += shear.y * this._c;
		this._b += shear.y * this._d;
		this._c += shear.x * a;
		this._d += shear.x * b;
		if (center)
			this.translate(center.negate());
		this._changed();
		return this;
	},

	skew: function() {
		var args = arguments,
			skew = Point.read(args),
			center = Point.read(args, 0, { readNull: true }),
			toRadians = Math.PI / 180,
			shear = new Point(Math.tan(skew.x * toRadians),
				Math.tan(skew.y * toRadians));
		return this.shear(shear, center);
	},

	append: function(mx, _dontNotify) {
		if (mx) {
			var a1 = this._a,
				b1 = this._b,
				c1 = this._c,
				d1 = this._d,
				a2 = mx._a,
				b2 = mx._c,
				c2 = mx._b,
				d2 = mx._d,
				tx2 = mx._tx,
				ty2 = mx._ty;
			this._a = a2 * a1 + c2 * c1;
			this._c = b2 * a1 + d2 * c1;
			this._b = a2 * b1 + c2 * d1;
			this._d = b2 * b1 + d2 * d1;
			this._tx += tx2 * a1 + ty2 * c1;
			this._ty += tx2 * b1 + ty2 * d1;
			if (!_dontNotify)
				this._changed();
		}
		return this;
	},

	prepend: function(mx, _dontNotify) {
		if (mx) {
			var a1 = this._a,
				b1 = this._b,
				c1 = this._c,
				d1 = this._d,
				tx1 = this._tx,
				ty1 = this._ty,
				a2 = mx._a,
				b2 = mx._c,
				c2 = mx._b,
				d2 = mx._d,
				tx2 = mx._tx,
				ty2 = mx._ty;
			this._a = a2 * a1 + b2 * b1;
			this._c = a2 * c1 + b2 * d1;
			this._b = c2 * a1 + d2 * b1;
			this._d = c2 * c1 + d2 * d1;
			this._tx = a2 * tx1 + b2 * ty1 + tx2;
			this._ty = c2 * tx1 + d2 * ty1 + ty2;
			if (!_dontNotify)
				this._changed();
		}
		return this;
	},

	appended: function(mx) {
		return this.clone().append(mx);
	},

	prepended: function(mx) {
		return this.clone().prepend(mx);
	},

	invert: function() {
		var a = this._a,
			b = this._b,
			c = this._c,
			d = this._d,
			tx = this._tx,
			ty = this._ty,
			det = a * d - b * c,
			res = null;
		if (det && !isNaN(det) && isFinite(tx) && isFinite(ty)) {
			this._a = d / det;
			this._b = -b / det;
			this._c = -c / det;
			this._d = a / det;
			this._tx = (c * ty - d * tx) / det;
			this._ty = (b * tx - a * ty) / det;
			res = this;
		}
		return res;
	},

	inverted: function() {
		return this.clone().invert();
	},

	concatenate: '#append',
	preConcatenate: '#prepend',
	chain: '#appended',

	_shiftless: function() {
		return new Matrix(this._a, this._b, this._c, this._d, 0, 0);
	},

	_orNullIfIdentity: function() {
		return this.isIdentity() ? null : this;
	},

	isIdentity: function() {
		return this._a === 1 && this._b === 0 && this._c === 0 && this._d === 1
				&& this._tx === 0 && this._ty === 0;
	},

	isInvertible: function() {
		var det = this._a * this._d - this._c * this._b;
		return det && !isNaN(det) && isFinite(this._tx) && isFinite(this._ty);
	},

	isSingular: function() {
		return !this.isInvertible();
	},

	transform: function( src, dst, count) {
		return arguments.length < 3
			? this._transformPoint(Point.read(arguments))
			: this._transformCoordinates(src, dst, count);
	},

	_transformPoint: function(point, dest, _dontNotify) {
		var x = point.x,
			y = point.y;
		if (!dest)
			dest = new Point();
		return dest._set(
				x * this._a + y * this._c + this._tx,
				x * this._b + y * this._d + this._ty,
				_dontNotify);
	},

	_transformCoordinates: function(src, dst, count) {
		for (var i = 0, max = 2 * count; i < max; i += 2) {
			var x = src[i],
				y = src[i + 1];
			dst[i] = x * this._a + y * this._c + this._tx;
			dst[i + 1] = x * this._b + y * this._d + this._ty;
		}
		return dst;
	},

	_transformCorners: function(rect) {
		var x1 = rect.x,
			y1 = rect.y,
			x2 = x1 + rect.width,
			y2 = y1 + rect.height,
			coords = [ x1, y1, x2, y1, x2, y2, x1, y2 ];
		return this._transformCoordinates(coords, coords, 4);
	},

	_transformBounds: function(bounds, dest, _dontNotify) {
		var coords = this._transformCorners(bounds),
			min = coords.slice(0, 2),
			max = min.slice();
		for (var i = 2; i < 8; i++) {
			var val = coords[i],
				j = i & 1;
			if (val < min[j]) {
				min[j] = val;
			} else if (val > max[j]) {
				max[j] = val;
			}
		}
		if (!dest)
			dest = new Rectangle();
		return dest._set(min[0], min[1], max[0] - min[0], max[1] - min[1],
				_dontNotify);
	},

	inverseTransform: function() {
		return this._inverseTransform(Point.read(arguments));
	},

	_inverseTransform: function(point, dest, _dontNotify) {
		var a = this._a,
			b = this._b,
			c = this._c,
			d = this._d,
			tx = this._tx,
			ty = this._ty,
			det = a * d - b * c,
			res = null;
		if (det && !isNaN(det) && isFinite(tx) && isFinite(ty)) {
			var x = point.x - this._tx,
				y = point.y - this._ty;
			if (!dest)
				dest = new Point();
			res = dest._set(
					(x * d - y * c) / det,
					(y * a - x * b) / det,
					_dontNotify);
		}
		return res;
	},

	decompose: function() {
		var a = this._a,
			b = this._b,
			c = this._c,
			d = this._d,
			det = a * d - b * c,
			sqrt = Math.sqrt,
			atan2 = Math.atan2,
			degrees = 180 / Math.PI,
			rotate,
			scale,
			skew;
		if (a !== 0 || b !== 0) {
			var r = sqrt(a * a + b * b);
			rotate = Math.acos(a / r) * (b > 0 ? 1 : -1);
			scale = [r, det / r];
			skew = [atan2(a * c + b * d, r * r), 0];
		} else if (c !== 0 || d !== 0) {
			var s = sqrt(c * c + d * d);
			rotate = Math.asin(c / s)  * (d > 0 ? 1 : -1);
			scale = [det / s, s];
			skew = [0, atan2(a * c + b * d, s * s)];
		} else {
			rotate = 0;
			skew = scale = [0, 0];
		}
		return {
			translation: this.getTranslation(),
			rotation: rotate * degrees,
			scaling: new Point(scale),
			skewing: new Point(skew[0] * degrees, skew[1] * degrees)
		};
	},

	getValues: function() {
		return [ this._a, this._b, this._c, this._d, this._tx, this._ty ];
	},

	getTranslation: function() {
		return new Point(this._tx, this._ty);
	},

	getScaling: function() {
		return this.decompose().scaling;
	},

	getRotation: function() {
		return this.decompose().rotation;
	},

	applyToContext: function(ctx) {
		if (!this.isIdentity()) {
			ctx.transform(this._a, this._b, this._c, this._d,
					this._tx, this._ty);
		}
	}
}, Base.each(['a', 'b', 'c', 'd', 'tx', 'ty'], function(key) {
	var part = Base.capitalize(key),
		prop = '_' + key;
	this['get' + part] = function() {
		return this[prop];
	};
	this['set' + part] = function(value) {
		this[prop] = value;
		this._changed();
	};
}, {}));

var Line = Base.extend({
	_class: 'Line',

	initialize: function Line(arg0, arg1, arg2, arg3, arg4) {
		var asVector = false;
		if (arguments.length >= 4) {
			this._px = arg0;
			this._py = arg1;
			this._vx = arg2;
			this._vy = arg3;
			asVector = arg4;
		} else {
			this._px = arg0.x;
			this._py = arg0.y;
			this._vx = arg1.x;
			this._vy = arg1.y;
			asVector = arg2;
		}
		if (!asVector) {
			this._vx -= this._px;
			this._vy -= this._py;
		}
	},

	getPoint: function() {
		return new Point(this._px, this._py);
	},

	getVector: function() {
		return new Point(this._vx, this._vy);
	},

	getLength: function() {
		return this.getVector().getLength();
	},

	intersect: function(line, isInfinite) {
		return Line.intersect(
				this._px, this._py, this._vx, this._vy,
				line._px, line._py, line._vx, line._vy,
				true, isInfinite);
	},

	getSide: function(point, isInfinite) {
		return Line.getSide(
				this._px, this._py, this._vx, this._vy,
				point.x, point.y, true, isInfinite);
	},

	getDistance: function(point) {
		return Math.abs(this.getSignedDistance(point));
	},

	getSignedDistance: function(point) {
		return Line.getSignedDistance(this._px, this._py, this._vx, this._vy,
				point.x, point.y, true);
	},

	isCollinear: function(line) {
		return Point.isCollinear(this._vx, this._vy, line._vx, line._vy);
	},

	isOrthogonal: function(line) {
		return Point.isOrthogonal(this._vx, this._vy, line._vx, line._vy);
	},

	statics: {
		intersect: function(p1x, p1y, v1x, v1y, p2x, p2y, v2x, v2y, asVector,
				isInfinite) {
			if (!asVector) {
				v1x -= p1x;
				v1y -= p1y;
				v2x -= p2x;
				v2y -= p2y;
			}
			var cross = v1x * v2y - v1y * v2x;
			if (!Numerical.isMachineZero(cross)) {
				var dx = p1x - p2x,
					dy = p1y - p2y,
					u1 = (v2x * dy - v2y * dx) / cross,
					u2 = (v1x * dy - v1y * dx) / cross,
					epsilon = 1e-12,
					uMin = -epsilon,
					uMax = 1 + epsilon;
				if (isInfinite
						|| uMin < u1 && u1 < uMax && uMin < u2 && u2 < uMax) {
					if (!isInfinite) {
						u1 = u1 <= 0 ? 0 : u1 >= 1 ? 1 : u1;
					}
					return new Point(
							p1x + u1 * v1x,
							p1y + u1 * v1y);
				}
			}
		},

		getSide: function(px, py, vx, vy, x, y, asVector, isInfinite) {
			if (!asVector) {
				vx -= px;
				vy -= py;
			}
			var v2x = x - px,
				v2y = y - py,
				ccw = v2x * vy - v2y * vx;
			if (!isInfinite && Numerical.isMachineZero(ccw)) {
				ccw = (v2x * vx + v2x * vx) / (vx * vx + vy * vy);
				if (ccw >= 0 && ccw <= 1)
					ccw = 0;
			}
			return ccw < 0 ? -1 : ccw > 0 ? 1 : 0;
		},

		getSignedDistance: function(px, py, vx, vy, x, y, asVector) {
			if (!asVector) {
				vx -= px;
				vy -= py;
			}
			  return  vx === 0 ? (vy > 0 ? x - px : px - x)
					: vy === 0 ? (vx < 0 ? y - py : py - y)
					: ((x - px) * vy - (y - py) * vx) / (
						vy > vx
							? vy * Math.sqrt(1 + (vx * vx) / (vy * vy))
							: vx * Math.sqrt(1 + (vy * vy) / (vx * vx))
					);
		},

		getDistance: function(px, py, vx, vy, x, y, asVector) {
			return Math.abs(
					Line.getSignedDistance(px, py, vx, vy, x, y, asVector));
		}
	}
});

var Updater = Base.extend({
	_class: 'Updater',

	initialize: function Updater(param) {
		this.id = UID.get();
		this.host = param.host;
		this.update_func = param.func;
		this.duration = param.duration || 0;
		this.startAniTime = param.startAniTime || 0;
		this.accTime = 0;
		this.lastTime = 0;
		this.repeat = param.repeat || false;
		this.doneCallback = param.doneCallback;
		this.paused = false;
		this.name = this.id + '';
	},
	pause: function(){
		this.paused = true;
		this.lastTime = 0;
	},
	resume: function(){
		this.paused = false;
	},

	update: function(event){
		var that = this;
		if( this.startAniTime > event.time || this.paused ) return;
		if(  that.duration == 0 ){
			if( !this.paused )
				that.update_func(event);
		} else {
			that.accTime += event.delta;

			if(  that.accTime  <= that.duration ){
				 var progress = that.accTime / that.duration;
				 that.update_func(event, progress);
			} else {
				if( that.doneCallback )
					that.doneCallback();
				if( that.repeat ){
					that.accTime = 0;
				} else {
					if( that.host )
						that.host.removeUpdaterById( that.id )
				}
			}
		}
	}
});

var VarInCxt = Base.extend({
	_class: 'VarInCxt',
	context: null,
	name: null,
	value: null,

	initialize: function VarInCxt(context, name, value) {
		this.context = context;
		this.name = name;
		this.value = value;
	},
	get_value: function(){
		if( this.context != null )
			return this.context[this.name];
		return this.value;
	},
	set_value: function(value, duration){
		if( this.context != null )
			this.context[this.name] = value;
		else
			this.value = value;
	},
	increment: function(delta){
		 this.set_value( this._add(delta) );
	},
	_add: function(delta){
		var v = this.get_value();
		if( typeof delta == 'Array'   ){
			 var r = new Array();
			 for(var i in delta){
				 r[i] = v[i] + delta[i];
			 }
			 return r;
		}
		else if( typeof delta == 'object' && v.hasOwnProperty('__add') )
			return v.__add( delta )  ;
		else
			return v + delta;
	},
	statics:{
		progress: function(start, end, percentage){
			if( typeof start == 'Array'  ){
				var r = new Array();
				for(var i in start){
					r[i] = start[i] + (end[i] - start[i]) * percentage;
				}
				return r;
			}  if( typeof start == 'object' && v.hasOwnProperty('__add') ) {
				return start.__add( end.__subtract( start ) * percentage  );
			}
			else {
				return start + (end - start) * percentage;
			}
		}
	}

});

var ValueTracker = Base.extend({
	_class: 'ValueTracker',
	value : null,
	duration: 0,
	startAniTime: 0,

	initialize: function ValueTracker() {
		var params = arguments;
		this.value = new VarInCxt(null, '', 0);
		if( params.length == 0){
		}
		else if ( params.length == 1 ){
			var value = params[0];
			if( typeof value == 'object' && value._class == 'VarInCxt')
				this.value = value;
			else {
				if( typeof value == 'string' )
					this.value = new VarInCxt(null, value, 0);
				else if( typeof value == 'number' )
					this.value = new VarInCxt(null, '', value);
			}
		}
		else if ( params.length == 2 ){
			var value = params[0], value2 = params[1];
			if( typeof value == 'string' )
				this.value = new VarInCxt(null, value, value2);
			else  if( typeof value == 'object' && typeof value2 == 'string')
				this.value = new VarInCxt(  value, value2, 0);
		}
		else if ( params.length == 3){
			var value = params[0], value2 = params[1], value3 = params[2];
			if( typeof value == 'object' && typeof value2 == 'string' )
				this.value = new VarInCxt(  value, value2, value3);
		}
	},
	set_value: function(value, duration){
		if( duration ){
			this.duration = duration;
			this.startAniTime = 0;
			this._start = this.value.get_value();
			this._end = value;
		} else {
			this.duration = 0;
			this.startAniTime = 0;
			this.value.set_value(value);
		}
	},
	increment: function(delta, duration){
		if( duration ){
			this.duration = duration;
			this.startAniTime = 0;
			this._start = this.value.get_value();
			this._end = this.value._add( delta);
		} else {
			this.duration = 0;
			this.startAniTime = 0;
			this.value.increment(delta);
		}
	},
	get_value: function(){
		return this.value.get_value();
	},
	update: function(event){
		var that = this;
		if(  that.duration != 0 ){
			if( that.startAniTime == 0 )
				that.startAniTime = event.time ;
			if(   event.time - that.startAniTime < that.duration ){
				 var progress = (event.time - that.startAniTime ) / that.duration;
				 var v = VarInCxt.progress( that._start, that._end, progress);
				 this.value.set_value(v)
			} else {
			   that.duration = 0;
			   that.startAniTime = 0;
			}
		}
	}
});

var PositionControl = Base.extend({
	_class: 'PositionControl',

	initialize: function PositionControl(param) {
		this.type = param.type ;
		this.shape = param.shape;
		this.order = param.order || 0;
		this.location = param.location;
		this.percentage = param.percentage;
		this.fixlength = param.fixlength;
		if ( param.loc ){
			this.loc = new Point(param.loc);
		}
		if( !(this.shape instanceof Item) ){
			 throw console.error("shape is not an Item ini PositionControl");
		}
		if( this.type == 'segment' && !(this.shape instanceof Path) ){
			throw console.error("shape is not an Path while type is segment");
		}
		if( this.type == 'bound' && '|top|left|right|bottom|'.indexOf( '|'+ this.location +'|') < 0 ){
			throw console.error("shape type is bound, but location constant is not supported");
		}
		if( this.type == 'onborder' && !(this.shape instanceof Path) ){
			throw console.error("shape is not an Path while type is onborder");
		}
	},

	getPosition: function(){
		var that = this, type = that.type;
		if( type == 'center' ){
			return that.shape.position;
		}
		else if( type == 'segment' ){
			return that.shape.segments[ that.order ].point;
		}
		else if( type == 'bound' ){
			var b = that.shape.bounds;
			return b[that.location + 'Center'];
		}
		else if( type == 'onborder' ){
			var length = that.shape.length;
			if( typeof that.percentage != 'undefined' ){
				 return that.shape.getPointAt( length * that.percentage );
			} else if( typeof that.fixlength != 'undefined' ){
				var len = that.fixlength > length ? length : that.fixlength;
				return that.shape.getPointAt( len );
			} else if( typeof that.loc == 'Point') {
				return that.loc;
			}
		}
	},
	setPosition: function(position){
		var that = this, type = that.type;
		if( type == 'center' ){
			that.shape.position = position;
		}
		else if( type == 'segment' ){
		   that.shape.segments[ that.order ].point = position;
		}
		else if( type == 'bound'){
		} else if( type == 'onborder' ){
			var length = that.shape.length;
			if( typeof that.loc == 'Point') {
				 that.loc = that.shape.getNearestPoint(position);
			}
		}
	}
});

var MoveRestriction = Updater.extend({
	_class: 'MoveRestriction',

	initialize: function MoveRestriction(param) {
		Updater.apply(this, arguments);
		var type = param.type, that = this;
		that.min = param.min || 0,
		that.max = param.max || 0;
		that.min2 = param.min2 || 0,
		that.max2 = param.max2 || 0;
		that.shape = param.shape;
		that.onborder = typeof param.onborder == 'undefined' ? true : !!param.onborder;
		if( param.pos_control ){
			if( typeof param.pos_control.shape == 'undefined' )
				param.pos_control.shape = that.host;
			that.pos_control = new PositionControl( param.pos_control );
		} else {
			that.pos_control = new PositionControl( {
				shape: that.host,
				type: 'center'
			} );
		}
		that.orig_x = that.pos_control.getPosition().x;
		that.orig_y = that.pos_control.getPosition().y;

		if( type == 'mrs_x' ){
			that.update_func = function(event, progress){
				var pos = that.pos_control.getPosition().clone();
				if( pos.y != that.orig_y ){
					pos.y = that.orig_y;
					that.pos_control.setPosition(pos);
				}
			}
		}
		else if( type == 'mrs_y' ){
			that.update_func = function(event, progress){
				var pos = that.pos_control.getPosition().clone();
				if( pos.x != that.orig_x ){
					pos.x = that.orig_x;
					that.pos_control.setPosition(pos);
				}
			}
		}
		else if( type == 'mrs_range_x' ){
			that.update_func = function(event, progress){
				var pos = that.pos_control.getPosition().clone(), changed=false;
				if( pos.y != that.orig_y ){
					pos.y = that.orig_y;
					changed = true;
				}
				if( pos.x < that.min ){
					pos.x = that.min;
					changed = true;
				}
				if( pos.x > that.max ){
					pos.x = that.max;
					changed = true;
				}
				if( changed ){
					that.pos_control.setPosition(pos);
				}
			}
		}
		else if( type == 'mrs_range_y' ){
			that.update_func = function(event, progress){
				var pos = that.pos_control.getPosition(), changed=false;
				if( pos.x != that.orig_x ){
					pos.x = that.orig_x;
					changed = true;
				}
				if( pos.y < that.min ){
					changed = true;
					pos.y = that.min;
				}
				if( pos.y > that.max ){
					pos.y = that.max;
					changed = true;
				}
				if( changed ){
					that.pos_control.setPosition(pos);
				}
			}
		}
		else if( type == 'mrs_range' ){
			that.update_func = function(event, progress){
				var pos = that.pos_control.getPosition().clone(), changed=false;
				if( pos.x < that.min ){
					changed = true;
					pos.x = that.min;
				}
				if( pos.x > that.max ){
					changed = true;
					pos.x = that.max;
				}
				if( pos.y < that.min2 ){
					changed = true;
					pos.y = that.min2;
				}
				if( pos.y > that.max2 ){
					changed = true;
					pos.y = that.max2;
				}
				if( changed ){
					that.pos_control.setPosition(pos);
				}
			}
		}
		else if( type == 'mrs_shape' ){
			that.update_func = function(event, progress){
				if( that.onborder ){
					var point = that.pos_control.getPosition() ,
						nearestPoint = that.shape.getNearestPoint(point);
					if( !point.equals( nearestPoint) )
						that.pos_control.setPosition(nearestPoint);
				} else {
					var point = that.pos_control.getPosition() ;
					if( !that.shape.contains( point ) ){
						var nearestPoint = that.shape.getNearestPoint(point);
						that.pos_control.setPosition(nearestPoint);
					}
				}
			}
		}
		else if( type == 'mrs_move_with' ){
			var p = that.pos_control.getPosition() ;
			that.move_with_dist = that.shape.position.__subtract( p );
			that.update_func = function(event, progress){
				var point = that.pos_control.getPosition(), pos = that.shape.position.__add(that.move_with_dist);
				if( !point.equals(pos) ){
					that.pos_control.setPosition(pos);
				}
			}
		} else if ( type == 'move_tracking' ){
			var p = that.pos_control.getPosition() ;
			that.update_func = function(event, progress){
				var point = that.pos_control.getPosition(), x_dff = point.x - that.orig_x,
				y_dff = point.y - that.orig_y;
				that.orig_x = that.pos_control.getPosition().x;
				that.orig_y = that.pos_control.getPosition().y;
				if( x_dff != 0 || y_dff != 0 )
					param.callback(x_dff, y_dff);
			}
		}
	},

});

var Project = PaperScopeItem.extend({
	_class: 'Project',
	_list: 'projects',
	_reference: 'project',
	_compactSerialize: true,

	initialize: function Project(element) {
		PaperScopeItem.call(this, true);
		this._children = [];
		this._topIndex = -1;
		this._namedChildren = {};
		this._activeLayer = null;
		this._layerStack = [];
		this._currentStyle = new Style(null, null, this);
		this._view = View.create(this,
				element || CanvasProvider.getCanvas(1, 1));
		this._selectionItems = {};
		this._selectionCount = 0;
		this._updateVersion = 0;
		this._newimages = [];
		this.cachedItemDefs = {};
		this.r9timestamp = 0;
		this.configuration = {
			frame_width:  this._view.bounds.width || 860,
			frame_height: this._view.bounds.height || 480,
		}

	},
	setStudio: function(s){
		this._studio = s;
		this._studio.subscribe('global.message.notification', this, this.on_message, null);
	},
	getStudio: function(){
		return this._studio;
	},
	getPageBus: function(){
		return this._studio ? this._studio.pageBus : null;
	},
	showMessage: function(message){
		this.on_message('', {content: message})
	},
	on_message: function(topic, data){
	   if( this._activeLayer ){
			if( data && data.content ){
				var  that = this,  content =   data.content,
					astyle =   data.style || '',
					pos = data.position ||  that._view.center.__add(  [0, -150] ),
					type = typeof data.ani_type == 'undefined' ? 10 : data.ani_type;
				var message_item = new StyledText({
					position: pos,
					fillColor:  'bgColor1' ,
					strokeColor:  'strokeColor' ,
					justification: 'center',
					bgColor:'bgColor2',
					borderColor:'color2',
					corner:5,
					textXOffset:10,
					textYOffset:3,
					fontSize: 18,
					content: content,
					r9textstyle :astyle
				  });
				var callback = {
					onEnd: function(){
						setTimeout(function(){
							RU.imageEffect2(that._activeLayer, message_item,   1,
							   type, 'linear', '', false, null);
					   },   data.duration || 2000 );
					}
				}
				RU.imageEffect2(this._activeLayer, message_item, 1,
					type, 'linear', '', true,  callback );
			}
	   }
	},

	_serialize: function(options, dictionary) {
		return Base.serialize(this._children, options, true, dictionary);
	},

	getCacheImageByName : function(name){
		var _newimages = this._newimages;
		for(var img in _newimages){
		   if( _newimages[img].name  === name || _newimages[img].name  + ".png" === name ||
			   _newimages[img].name + ".jpg" === name      ){
			  return _newimages[img];
		   }
		 }
		 for(var img in _newimages){
		   if( _newimages[img].src.indexOf("/" + name + ".png") >=0 ||
			   _newimages[img].src.indexOf("/" + name + ".jpg") >=0 ||
			   _newimages[img].src.indexOf(   name + ".png") >=0 ||
			   _newimages[img].src.indexOf(   name + ".jpg") >=0 ){
			  return _newimages[img];
		   }
		 }
		 for(var img in _newimages){
		   if( _newimages[img].src.indexOf(   name  ) >=0  ){
			  return _newimages[img];
		   }
		 }
		 return null;
	},
	markr9times: function(){
	   this.r9timestamp = new Date().getTime();
	},
	heartbeat: function(){
	   if( this._activeLayer ) this._activeLayer.heartbeat();
	},
	_changed: function(flags, item) {
		if (flags & 1) {
			var view = this._view;
			if (view) {
				view._needsUpdate = true;
				if (!view._requested && view._autoUpdate)
					view.requestUpdate();
			}
		}
		var changes = this._changes;
		if (changes && item) {
			var changesById = this._changesById,
				id = item._id,
				entry = changesById[id];
			if (entry) {
				entry.flags |= flags;
			} else {
				changes.push(changesById[id] = { item: item, flags: flags });
			}
		}
	},
	broadcast: function(props){
		if(! this._studio ) return;
		var obj = Base.isPlainObject(props) ;
		if( obj ){
			this._studio.pageBus.publish( props.topic, props);
		} else {
			this._studio.pageBus.publish( props , {});
		}
	},

	clear: function() {
		var children = this._children;
		for (var i = children.length - 1; i >= 0; i--)
			children[i].remove();
		this._layerStack = [];
	},

	isEmpty: function() {
		return !this._children.length;
	},

	remove: function remove() {
		if (!remove.base.call(this))
			return false;
		if (this._view)
			this._view.remove();
		return true;
	},

	getView: function() {
		return this._view;
	},

	getCurrentStyle: function() {
		return this._currentStyle;
	},

	setCurrentStyle: function(style) {
		this._currentStyle.set(style);
		this._children.forEach(e => {
			e._changed(undefined)
		});
	},
	useBuiltinStyle: function(name){
		var s = Style.getBuiltinStyle(name, this);
		if(s){
			this._currentStyle.set(s);
			if( this._activeLayer )
				this._activeLayer._style.set(s);
			if( this._studio ){
				this._studio.updateStyle(this._currentStyle);
			}
			this.builtinStyleName = name;
		}
	},
	getBuiltInColor: function(name){
		return this.builtinStyleName ? Style.getBuiltinColors(this.builtinStyleName, this)[name] : undefined;
	},

	getIndex: function() {
		return this._index;
	},

	getOptions: function() {
		return this._scope.settings;
	},

	getLayers: function() {
		return this._children;
	},

	getLayerByName: function(name){
		var children = this._children, len = children.length, e;
		for(var i = 0; i < len; i++) {
			e = children[i];
			if( e.name == name || e.id == name )
				return e;
		}
		return null;
	},
	showLayer: function(name, props, callback){
		var layer = this.getLayerByName(name);
		if( layer ){
			this.addLayer( layer );
			var mask_from, mask_to,  animType_from = props || {} ,
				animType_to = layer._sceneSetupOptions || false,
				keepFromVisible = layer.sublayer || false;
			if( this._activeLayer ) {
				if( !keepFromVisible ){
					mask_from = this._activeLayer.rasterize();
					this._activeLayer.visible = false;
				}
			}
			if( this._activeLayer != layer || (this._layerStack.length == 0 && layer.name == 'main') ){
				this._activeLayer = layer;
				this._layerStack.push( this._activeLayer );
			}

			if( animType_to ){
				mpaper.settings.insertItems = true;
				layer.getPlayer().start();
				mpaper.settings.insertItems = false;
				layer.visible = true;
				mask_to = layer.rasterize();
				layer.visible = false;
			}

			if( mask_from || mask_to ){
				var that = this, temp = new Layer({ project: this, insert: true }),
					count = ( mask_from ? 1 : 0)  + ( mask_to ? 1 : 0);
				var timeline = anime.timeline({ autoplay: false});
				that._activeLayer = temp;
				var doneCallback = function(){
					count --;
					if( count == 0 ){
						temp._remove(false, true);
						that._activeLayer = layer;
						that._activeLayer.visible = true;
						if( animType_to )
							that._activeLayer.getPlayer().resume();
						else
							that._activeLayer.getPlayer().start();
					}
				}
				if( mask_from ){
					temp.addChild( mask_from );
					animType_from.targets = mask_from;
					if(!animType_from.type)  animType_from.type = 'FadeOut';
					temp.uncreateItems( timeline,  animType_from, undefined, doneCallback);
				}
				if( mask_to ){
					mask_to.remove();
					animType_to.targets = mask_to;
					if(!animType_to.type)  animType_to.type = 'FadeIn';
					animType_to.begin = function(){
						temp.addChild(mask_to);
					};
					temp.createItems( timeline,  animType_to, undefined, doneCallback);
				}
				timeline.play(callback);
			}
			else {
				this._activeLayer.visible = true;
				this._activeLayer.getPlayer().start(callback);
			}
		}
	},
	hideTopLayer: function(props){
		var stacks = this._layerStack, len = stacks.length, props = props || {};
		if( len > 1 ){
			var that = this, resume = this._activeLayer.resumeOnClose || (props && props.resumeOnClose) || false;
			this._activeLayer.getPlayer().stop();
			var mask  =  this._activeLayer.rasterize();
			this._activeLayer.visible = false;
			stacks.pop();
			this._activeLayer = stacks[len-2];
			this._activeLayer.visible = true;
			this._activeLayer.addChild( mask )
			this._activeLayer._changed()  ;

			delete props.resumeOnClose;
			props.targets = mask;
			props.type = props.type || 'FadeOut';

			this._activeLayer.uncreateItems( anime.timeline({ autoplay: true}), props, 0, function(){
				if(  resume ){
					that._activeLayer.getPlayer().resume();
				}
			});
		}
	},
	resetLayerStack: function(){
		this._layerStack = [];
		this._children.forEach( e => { e.visible = false; });
		this._activeLayer = null;
	},

	getActiveLayer: function() {
		return this._activeLayer || new Layer({ project: this, insert: true });
	},

	addNewLayer: function(props){
		var obj = Base.isPlainObject(props), layer = new Layer({ project: this, insert: true });
		if( obj ){
			layer.name = props.name;
			layer.resumeOnClose = props.resumeOnClose || false;
			var  w =  props.width || 0,  h =  props.height || 0, pos =  props.position || this._view.center ;
			if( w && h ){
				if( Array.isArray( pos) )
					pos = new Point( pos[0], pos[1] );
				var mask = new Path.Rectangle( pos.x - w/2, pos.y - h/2, w, h);
				layer.insertChild(0, mask);
				mask._clipMask = true;
				mask._matrix = new Matrix();
				layer.clipped = true;
				layer.sublayer = true;
				layer._style._values.sceneBgColor =  props.fillColor;
			}
		} else {
			layer.name = props;
		}
		layer._style._values.sceneBgColor =  props.fillColor;
		this._activeLayer = layer;
		return layer;
	},

	getSymbolDefinitions: function() {
		var definitions = [],
			ids = {};
		this.getItems({
			class: SymbolItem,
			match: function(item) {
				var definition = item._definition,
					id = definition._id;
				if (!ids[id]) {
					ids[id] = true;
					definitions.push(definition);
				}
				return false;
			}
		});
		return definitions;
	},

	getSymbols: 'getSymbolDefinitions',

	getSelectedItems: function() {
		var selectionItems = this._selectionItems,
			items = [];
		for (var id in selectionItems) {
			var item = selectionItems[id],
				selection = item._selection;
			if ((selection & 1) && item.isInserted()) {
				items.push(item);
			} else if (!selection) {
				this._updateSelection(item);
			}
		}
		return items;
	},

	_updateSelection: function(item) {
		var id = item._id,
			selectionItems = this._selectionItems;
		if (item._selection) {
			if (selectionItems[id] !== item) {
				this._selectionCount++;
				selectionItems[id] = item;
			}
		} else if (selectionItems[id] === item) {
			this._selectionCount--;
			delete selectionItems[id];
		}
	},

	selectAll: function() {
		var children = this._children;
		for (var i = 0, l = children.length; i < l; i++)
			children[i].setFullySelected(true);
	},

	deselectAll: function() {
		var selectionItems = this._selectionItems;
		for (var i in selectionItems)
			selectionItems[i].setFullySelected(false);
	},
	addLayer: function(layer) {
		return this.insertLayer(undefined, layer);
	},

	insertLayer: function(index, layer) {
		if (layer instanceof Layer) {
			layer._remove(false, true);
			Base.splice(this._children, [layer], index, 0);
			layer._setProject(this, true);
			var name = layer._name;
			if (name)
				layer.setName(name);
			if (this._changes)
				layer._changed(5);
			if (!this._activeLayer)
				this._activeLayer = layer;
		} else {
			layer = null;
		}
		return layer;
	},

	_insertItem: function(index, item, _created) {
		item = this.insertLayer(index, item)
				|| (this._activeLayer || this._insertItem(undefined,
						new Layer(Item.NO_INSERT), true))
						.insertChild(index, item);
		if (_created && item.activate)
			item.activate();
		return item;
	},

	getItems: function(options) {
		return Item._getItems(this, options);
	},

	getItem: function(options) {
		return Item._getItems(this, options, null, null, true)[0] || null;
	},

	importJSON: function(json) {
		this.activate();
		var layer = this._activeLayer;
		return Base.importJSON(json, layer && layer.isEmpty() && layer);
	},

	removeOn: function(type) {
		var sets = this._removeSets;
		if (sets) {
			if (type === 'mouseup')
				sets.mousedrag = null;
			var set = sets[type];
			if (set) {
				for (var id in set) {
					var item = set[id];
					for (var key in sets) {
						var other = sets[key];
						if (other && other != set)
							delete other[item._id];
					}
					item.remove();
				}
				sets[type] = null;
			}
		}
	},

	draw: function(ctx, matrix, pixelRatio) {
		this._updateVersion++;
		ctx.save();
		matrix.applyToContext(ctx);
		var children = this._children,
			param = new Base({
				offset: new Point(0, 0),
				pixelRatio: pixelRatio,
				viewMatrix: matrix.isIdentity() ? null : matrix,
				matrices: [new Matrix()],
				updateMatrix: true
			});
		for (var i = 0, l = children.length; i < l; i++) {
			children[i].draw(ctx, param);
		}
		ctx.restore();

		if (this._selectionCount > 0) {
			ctx.save();
			ctx.strokeWidth = 1;
			var items = this._selectionItems,
				size = this._scope.settings.handleSize,
				version = this._updateVersion;
			for (var id in items) {
				items[id]._drawSelection(ctx, matrix, size, items, version);
			}
			ctx.restore();
		}
	}
});

var Item = Base.extend(Emitter, {
	statics: {
		extend: function extend(src) {
			if (src._serializeFields)
				src._serializeFields = Base.set({},
					this.prototype._serializeFields, src._serializeFields);
			return extend.base.apply(this, arguments);
		},

		NO_INSERT: { insert: false }
	},

	_class: 'Item',
	_name: null,
	_applyMatrix: true,
	_canApplyMatrix: true,
	_canScaleStroke: false,
	_pivot: null,
	_visible: true,
	_blendMode: 'normal',
	_opacity: 1,
	_locked: false,
	_draggable:false,
	_guide: false,
	_clipMask: false,
	_selection: 0,
	_selectBounds: true,
	_selectChildren: false,
	_updaters: [],
	_serializeFields: {
		name: null,
		applyMatrix: null,
		matrix: new Matrix(),
		pivot: null,
		visible: true,
		blendMode: 'normal',
		opacity: 1,
		locked: false,
		draggable: false,
		guide: false,
		clipMask: false,
		selected: false,
		updaters: [],
		data: {}
	},
	_prioritize: ['applyMatrix']
},
new function() {
	var handlers = ['onMouseDown', 'onMouseUp', 'onMouseDrag', 'onClick',
			'onDoubleClick', 'onMouseMove', 'onMouseEnter', 'onMouseLeave'];
	return Base.each(handlers,
		function(name) {
			this._events[name] = {
				install: function(type) {
					this.getView()._countItemEvent(type, 1);
				},

				uninstall: function(type) {
					this.getView()._countItemEvent(type, -1);
				}
			};
		}, {
			_events: {
				onFrame: {
					install: function() {
						this.getView()._animateItem(this, true);
					},

					uninstall: function() {
						this.getView()._animateItem(this, false);
					}
				},

				onLoad: {},
				onError: {}
			},
			statics: {
				_itemHandlers: handlers
			}
		}
	);
}, {
	initialize: function Item() {
	},

	_initialize: function(props, point) {
		var hasProps = props && Base.isPlainObject(props),
			internal = hasProps && props.internal === true,
			matrix = this._matrix = new Matrix(),
			project = hasProps && props.project || mpaper.project,
			settings = mpaper.settings;
		this._id = internal ? null : UID.get();
		this._parent = this._index = null;
		this._applyMatrix = this._canApplyMatrix && settings.applyMatrix;
		if (point)
			matrix.translate(point);
		matrix._owner = this;
		this._style = new Style(project._activeLayer? project.activeLayer._style : project._currentStyle, this, project);
		if (internal || hasProps && props.insert == false
			|| !settings.insertItems && !(hasProps && props.insert === true)) {
			this._setProject(project);
		} else {
			(hasProps && props.parent || project)
					._insertItem(undefined, this, true);
		}
		if (hasProps && props !== Item.NO_INSERT) {
			this.set(props, {
				internal: true, insert: true, project: true, parent: true
			});
		}
		return hasProps;
	},

	_serialize: function(options, dictionary) {
		var props = {},
			that = this;

		function serialize(fields) {
			for (var key in fields) {
				var value = that[key];
				if (!Base.equals(value, key === 'leading'
						? fields.fontSize * 1.2 : fields[key])) {
					props[key] = Base.serialize(value, options,
							key !== 'data', dictionary);
				}
			}
		}

		serialize(this._serializeFields);
		if (!(this instanceof Group))
			serialize(this._style._defaults);
		return [ this._class, props ];
	},
	getAllLeaves: function(groupLevel){
		var alist = [];
		if( groupLevel )
			this._getLeavesGroupLevel(alist);
		else
			this._getLeavesNoChild(alist);
		return alist;
	},
	_getLeavesNoChild: function(alist){
		if( this._children && Array.isArray(this._children) && this._children.length > 0 ){
			this._children.forEach(e => {
				if( typeof e._getLeavesNoChild === 'function')
					e._getLeavesNoChild(alist);
			});
		} else {
			alist.push(this);
		}
	},
	_getLeavesGroupLevel: function(alist){
		if( this._children && (this instanceof Group) ){
			this._children.forEach(e => {
				if( typeof e._getLeavesGroupLevel === 'function')
					e._getLeavesGroupLevel(alist);
			});
		} else {
			alist.push(this);
		}
	},
	_changed: function(flags) {
		var symbol = this._symbol,
			cacheParent = this._parent || symbol,
			project = this._project;
		if (flags & 8) {
			this._bounds = this._position = this._decomposed = undefined;
		}
		if (flags & 16) {
			this._globalMatrix = undefined;
		}
		if (cacheParent
				&& (flags & 72)) {
			Item._clearBoundsCache(cacheParent);
		}
		if (flags & 2) {
			Item._clearBoundsCache(this);
		}
		if (project)
			project._changed(flags, this);
		if (symbol)
			symbol._changed(flags);
	},

	getId: function() {
		return this._id;
	},

	pause: function(){
		this._paused = true;
	},
	resume: function(){
		this._paused = false;
	},

	setProgress : function(progress) {
		this._progress = progress  ;
		this._changed(1033);
	},
	getProgress: function(){
		return typeof this._progress == 'undefined' ? -1 : this._progress;
	},
	setTooltip : function(tip) {
		if( !this._tooltip && !tip ) return;
		var that = this;
		if( !that._tooltip ){
			that.on('mouseenter', that._tooltipHandler1);
			that.on('mouseleave', that._tooltipHandler2 );
		}
		this._tooltip = tip;
		if(!tip){
			that.off('mouseenter', that._tooltipHandler1);
			that.off('mouseleave', that._tooltipHandler2 );
		}
	},
	getTooltip: function(){
		return this._tooltip;
	},
	_tooltipHandler1: function(event){
		var that = this;
		if(typeof that._tooltipid  == 'undefined'){
			that._tooltipid = setTimeout(function(){
				var type = that.tooltip_type, type = (typeof type == 'undefined') ? 10 : ( type == 'random' ? 9: type);
				that._project._studio.publish('global.message.notification',
					{ content : that.tooltip, position: that.position, ani_type:type });
			}, 1000);
		}
	},
	_tooltipHandler2: function(event){
		var that = this;
		if(typeof that._tooltipid !== 'undefined'){
			clearTimeout(that._tooltipid);
		}
		that._tooltipid = undefined;
	},
	addUpdater:function(update_func,  duration, index, doneCallback){
		var updater;
		if( update_func instanceof Updater){
			updater = update_func;
			if( typeof updater.parent == 'undefined' )
				updater.parent = this;
		} else {
			updater = new Updater( { parent: this,
				func: update_func,
				duration: duration || 0 ,
				startAniTime : 0,
				doneCallback: doneCallback} )
		}
		if( typeof index != 'undefined' && index >= 0){
			this._updaters.splice( index, 0, updater );
		} else {
			this._updaters.push( updater );
		}
		if( this._updaters.length == 1 ){
			var that = this;
			that.on('frame', that._onFrameHandler);
		}
		if( this._updaters.length == 0){
			var that = this;
			that.off('frame', that._onFrameHandler);
		}
		return updater;
	},
	_onFrameHandler: function(event){
		var that = this;
		if(  that._paused ) return;
		for(var key in that._updaters){
			var updater = that._updaters[key];
			updater.update(event);
		}
	},
	getUpdater: function(updaterId){
		for(var i = this._updaters.length-1; i>=0; i--){
			if( this._updaters[i].id === updaterId || this._updaters[i].name == updaterId){
				return this._updaters[i];
			}
		}
		return null;
	},
	removeUpdaterById: function(updaterId){
		for(var i = this._updaters.length-1; i>=0; i--){
			if( this._updaters[i].id === updaterId ){
				this._updaters.splice(i, 1);
				break;
			}
		}
	},
	removeUpdater: function(update_func){
		for(var i = this._updaters.length-1; i>=0; i--){
			if( this._updaters[i].func === update_func ){
				this._updaters.splice(i, 1);
				break;
			}
		}
	},
	clearUpdaters: function(){
		this._updaters = [];
	},

	getName: function() {
		return this._name;
	},

	setName: function(name) {

		if (this._name)
			this._removeNamed();
		if (name === (+name) + '')
			throw new Error(
					'Names consisting only of numbers are not supported.');
		var owner = this._getOwner();
		if (name && owner) {
			var children = owner._children,
				namedChildren = owner._namedChildren;
			(namedChildren[name] = namedChildren[name] || []).push(this);
			if (!(name in children))
				children[name] = this;
		}
		this._name = name || undefined;
		this._changed(256);
	},

	getStyle: function() {
		return this._style;
	},

	setStyle: function(style) {
		this.getStyle().set(style);
	}
}, Base.each(['locked', 'draggable', 'visible', 'blendMode', 'opacity', 'guide'],
	function(name) {
		var part = Base.capitalize(name),
			key = '_' + name,
			flags = {
				locked: 256,
				draggable: 265,
				visible: 265
			};
		this['get' + part] = function() {
			return this[key];
		};
		this['set' + part] = function(value) {
			if (value != this[key]) {
				this[key] = value;
				this._changed(flags[name] || 257);
			}
		};
	},
{}), {
	beans: true,

	setShowHide: function(show){
	   this.visible = show;
	   if( show ){
		   this.addToViewIfNot();
	   }
	},
	showing: function(duration){
		var that = this, opa = that.opacity;
		this.opacity = 0.001;
		this.visible = true;
		this.addToViewIfNot();
		anime({
			targets: that,
			opacity: 1,
			duration: duration || 0.5
		});
	},
	hiding: function( removeIt, duration ){
		var that = this, opa = that.opacity ;
		anime({
			targets: that,
			opacity: 0.001,
			duration: duration ||  0.5,
			complete: function(){
				that.visible = false;
				that.opacity = opa;
				if( removeIt ){
					if( typeof removeIt === 'function' )
						removeIt();
					else
						that.remove();
				}
			}
		});
	},
	addToViewIfNot: function(duration, offset){
		var p = this, pp;
		while( (pp = p._parent) != null)
			p = pp;
		if( !(p instanceof Layer)) {
			this._project._activeLayer.addChild(p);
			this._animForShowing(duration, offset)
		}
	},

	getSelection: function() {
		return this._selection;
	},

	setSelection: function(selection) {
		if (selection !== this._selection) {
			this._selection = selection;
			var project = this._project;
			if (project) {
				project._updateSelection(this);
				this._changed(257);
			}
		}
	},

	_changeSelection: function(flag, selected) {
		var selection = this._selection;
		this.setSelection(selected ? selection | flag : selection & ~flag);
	},

	isSelected: function() {
		if (this._selectChildren) {
			var children = this._children;
			for (var i = 0, l = children.length; i < l; i++)
				if (children[i].isSelected())
					return true;
		}
		return !!(this._selection & 1);
	},

	setSelected: function(selected) {
		if (this._selectChildren) {
			var children = this._children;
			for (var i = 0, l = children.length; i < l; i++)
				children[i].setSelected(selected);
		}
		this._changeSelection(1, selected);
	},

	isFullySelected: function() {
		var children = this._children,
			selected = !!(this._selection & 1);
		if (children && selected) {
			for (var i = 0, l = children.length; i < l; i++)
				if (!children[i].isFullySelected())
					return false;
			return true;
		}
		return selected;
	},

	setFullySelected: function(selected) {
		var children = this._children;
		if (children) {
			for (var i = 0, l = children.length; i < l; i++)
				children[i].setFullySelected(selected);
		}
		this._changeSelection(1, selected);
	},

	isClipMask: function() {
		return this._clipMask;
	},

	setClipMask: function(clipMask) {
		if (this._clipMask != (clipMask = !!clipMask)) {
			this._clipMask = clipMask;
			if (clipMask) {
				this.setFillColor(null);
				this.setStrokeColor(null);
			}
			this._changed(257);
			if (this._parent)
				this._parent._changed(2048);
		}
	},

	getData: function() {
		if (!this._data)
			this._data = {};
		return this._data;
	},

	setData: function(data) {
		this._data = data;
	},

	getPosition: function(_dontLink) {
		var ctor = _dontLink ? Point : LinkedPoint;
		var position = this._position ||
			(this._position = this._getPositionFromBounds());
		return new ctor(position.x, position.y, this, 'setPosition');
	},

	setPosition: function() {
		this.translate(Point.read(arguments).subtract(this.getPosition(true)));
	},

	_getPositionFromBounds: function(bounds) {
		return this._pivot
				? this._matrix._transformPoint(this._pivot)
				: (bounds || this.getBounds()).getCenter(true);
	},

	getPivot: function() {
		var pivot = this._pivot;
		return pivot
				? new LinkedPoint(pivot.x, pivot.y, this, 'setPivot')
				: null;
	},

	setPivot: function() {
		this._pivot = Point.read(arguments, 0, { clone: true, readNull: true });
		this._position = undefined;
	}
}, Base.each({
		getStrokeBounds: { stroke: true },
		getHandleBounds: { handle: true },
		getInternalBounds: { internal: true }
	},
	function(options, key) {
		this[key] = function(matrix) {
			return this.getBounds(matrix, options);
		};
	},
{
	beans: true,

	getBounds: function(matrix, options) {
		var hasMatrix = options || matrix instanceof Matrix,
			opts = Base.set({}, hasMatrix ? options : matrix,
					this._boundsOptions);
		if (!opts.stroke || this.getStrokeScaling())
			opts.cacheItem = this;
		var rect = this._getCachedBounds(hasMatrix && matrix, opts).rect;
		return !arguments.length
				? new LinkedRectangle(rect.x, rect.y, rect.width, rect.height,
					this, 'setBounds')
				: rect;
	},

	setBounds: function() {
		var rect = Rectangle.read(arguments),
			bounds = this.getBounds(),
			_matrix = this._matrix,
			matrix = new Matrix(),
			center = rect.getCenter();
		matrix.translate(center);
		if (rect.width != bounds.width || rect.height != bounds.height) {
			if (!_matrix.isInvertible()) {
				_matrix.set(_matrix._backup
						|| new Matrix().translate(_matrix.getTranslation()));
				bounds = this.getBounds();
			}
			matrix.scale(
					bounds.width !== 0 ? rect.width / bounds.width : 0,
					bounds.height !== 0 ? rect.height / bounds.height : 0);
		}
		center = bounds.getCenter();
		matrix.translate(-center.x, -center.y);
		this.transform(matrix);
	},

	_getBounds: function(matrix, options) {
		var children = this._children;
		if (!children || !children.length)
			return new Rectangle();
		Item._updateBoundsCache(this, options.cacheItem);
		return Item._getBounds(children, matrix, options);
	},

	_getBoundsCacheKey: function(options, internal) {
		return [
			options.stroke ? 1 : 0,
			options.handle ? 1 : 0,
			internal ? 1 : 0
		].join('');
	},

	_getCachedBounds: function(matrix, options, noInternal) {
		matrix = matrix && matrix._orNullIfIdentity();
		var internal = options.internal && !noInternal,
			cacheItem = options.cacheItem,
			_matrix = internal ? null : this._matrix._orNullIfIdentity(),
			cacheKey = cacheItem && (!matrix || matrix.equals(_matrix))
				&& this._getBoundsCacheKey(options, internal),
			bounds = this._bounds;
		Item._updateBoundsCache(this._parent || this._symbol, cacheItem);
		if (cacheKey && bounds && cacheKey in bounds) {
			var cached = bounds[cacheKey];
			return {
				rect: cached.rect.clone(),
				nonscaling: cached.nonscaling
			};
		}
		var res = this._getBounds(matrix || _matrix, options),
			rect = res.rect || res,
			style = this._style,
			nonscaling = res.nonscaling || style.hasStroke()
				&& !style.getStrokeScaling();
		if (cacheKey) {
			if (!bounds) {
				this._bounds = bounds = {};
			}
			var cached = bounds[cacheKey] = {
				rect: rect.clone(),
				nonscaling: nonscaling,
				internal: internal
			};
		}
		return {
			rect: rect,
			nonscaling: nonscaling
		};
	},

	_getStrokeMatrix: function(matrix, options) {
		var parent = this.getStrokeScaling() ? null
				: options && options.internal ? this
					: this._parent || this._symbol && this._symbol._item,
			mx = parent ? parent.getViewMatrix().invert() : matrix;
		return mx && mx._shiftless();
	},

	statics: {
		_updateBoundsCache: function(parent, item) {
			if (parent && item) {
				var id = item._id,
					ref = parent._boundsCache = parent._boundsCache || {
						ids: {},
						list: []
					};
				if (!ref.ids[id]) {
					ref.list.push(item);
					ref.ids[id] = item;
				}
			}
		},

		_clearBoundsCache: function(item) {
			var cache = item._boundsCache;
			if (cache) {
				item._bounds = item._position = item._boundsCache = undefined;
				for (var i = 0, list = cache.list, l = list.length; i < l; i++){
					var other = list[i];
					if (other !== item) {
						other._bounds = other._position = undefined;
						if (other._boundsCache)
							Item._clearBoundsCache(other);
					}
				}
			}
		},

		_getBounds: function(items, matrix, options) {
			var x1 = Infinity,
				x2 = -x1,
				y1 = x1,
				y2 = x2,
				nonscaling = false;
			options = options || {};
			for (var i = 0, l = items.length; i < l; i++) {
				var item = items[i];
				if (item._visible && !item.isEmpty(true)) {
					var bounds = item._getCachedBounds(
						matrix && matrix.appended(item._matrix), options, true),
						rect = bounds.rect;
					x1 = Math.min(rect.x, x1);
					y1 = Math.min(rect.y, y1);
					x2 = Math.max(rect.x + rect.width, x2);
					y2 = Math.max(rect.y + rect.height, y2);
					if (bounds.nonscaling)
						nonscaling = true;
				}
			}
			return {
				rect: isFinite(x1)
					? new Rectangle(x1, y1, x2 - x1, y2 - y1)
					: new Rectangle(),
				nonscaling: nonscaling
			};
		}
	}

}), {
	beans: true,

	_decompose: function() {
		return this._applyMatrix
			? null
			: this._decomposed || (this._decomposed = this._matrix.decompose());
	},

	getRotation: function() {
		var decomposed = this._decompose();
		return decomposed ? decomposed.rotation : 0;
	},

	setRotation: function(rotation) {
		var current = this.getRotation();
		if (current != null && rotation != null) {
			var decomposed = this._decomposed;
			this.rotate(rotation - current);
			if (decomposed) {
				decomposed.rotation = rotation;
				this._decomposed = decomposed;
			}
		}
	},

	getScaling: function() {
		var decomposed = this._decompose(),
			s = decomposed && decomposed.scaling;
		return new LinkedPoint(s ? s.x : 1, s ? s.y : 1, this, 'setScaling');
	},

	setScaling: function() {
		var current = this.getScaling(),
			scaling = Point.read(arguments, 0, { clone: true, readNull: true });
		if (current && scaling && !current.equals(scaling)) {
			var rotation = this.getRotation(),
				decomposed = this._decomposed,
				matrix = new Matrix(),
				isZero = Numerical.isZero;
			if (isZero(current.x) || isZero(current.y)) {
				matrix.translate(decomposed.translation);
				if (rotation) {
					matrix.rotate(rotation);
				}
				matrix.scale(scaling.x, scaling.y);
				this._matrix.set(matrix);
			} else {
				var center = this.getPosition(true);
				matrix.translate(center);
				if (rotation)
					matrix.rotate(rotation);
				matrix.scale(scaling.x / current.x, scaling.y / current.y);
				if (rotation)
					matrix.rotate(-rotation);
				matrix.translate(center.negate());
				this.transform(matrix);
			}
			if (decomposed) {
				decomposed.scaling = scaling;
				this._decomposed = decomposed;
			}
		}
	},

	getMatrix: function() {
		return this._matrix;
	},

	setMatrix: function() {
		var matrix = this._matrix;
		matrix.set.apply(matrix, arguments);
	},

	getGlobalMatrix: function(_dontClone) {
		var matrix = this._globalMatrix;
		if (matrix) {
			var parent = this._parent;
			var parents = [];
			while (parent) {
				if (!parent._globalMatrix) {
					matrix = null;
					for (var i = 0, l = parents.length; i < l; i++) {
						parents[i]._globalMatrix = null;
					}
					break;
				}
				parents.push(parent);
				parent = parent._parent;
			}
		}
		if (!matrix) {
			matrix = this._globalMatrix = this._matrix.clone();
			var parent = this._parent;
			if (parent)
				matrix.prepend(parent.getGlobalMatrix(true));
		}
		return _dontClone ? matrix : matrix.clone();
	},

	getViewMatrix: function() {
		return this.getGlobalMatrix().prepend(this.getView()._matrix);
	},

	getApplyMatrix: function() {
		return this._applyMatrix;
	},

	setApplyMatrix: function(apply) {
		if (this._applyMatrix = this._canApplyMatrix && !!apply)
			this.transform(null, true);
	},

	getTransformContent: '#getApplyMatrix',
	setTransformContent: '#setApplyMatrix',
}, {
	getProject: function() {
		return this._project;
	},

	_setProject: function(project, installEvents) {
		if (this._project !== project) {
			if (this._project)
				this._installEvents(false);
			this._project = project;
			var children = this._children;
			for (var i = 0, l = children && children.length; i < l; i++)
				children[i]._setProject(project);
			installEvents = true;
		}
		if (installEvents)
			this._installEvents(true);
	},

	getView: function() {
		return this._project._view;
	},
	 getLayer: function() {
		var parent = this;
		while (parent = parent._parent) {
			if (parent instanceof Layer)
				return parent;
		}
		return null;
	},

	getCurPage: function(){
	   return this.getTimlinePlayer() .getCurPage();
	},
	getTimlinePlayer: function(){
		var layer = this.getLayer();
		return layer != null ? layer.getPlayer() : this._project.getActiveLayer().getPlayer();
	},
	_animForShowing: function(){
		this.visible = true;
	},
	_installEvents: function _installEvents(install) {
		_installEvents.base.call(this, install);
		var children = this._children;
		for (var i = 0, l = children && children.length; i < l; i++)
			children[i]._installEvents(install);
	},

	getParent: function() {
		return this._parent;
	},

	setParent: function(item) {
		return item.addChild(this);
	},

	_getOwner: '#getParent',

	getChildren: function() {
		return this._children;
	},

	setChildren: function(items) {
		this.removeChildren();
		this.addChildren(items);
	},
	getFirstChild: function() {
		return this._children && this._children[0] || null;
	},

	getLastChild: function() {
		return this._children && this._children[this._children.length - 1]
				|| null;
	},

	getNextSibling: function() {
		var owner = this._getOwner();
		return owner && owner._children[this._index + 1] || null;
	},

	getPreviousSibling: function() {
		var owner = this._getOwner();
		return owner && owner._children[this._index - 1] || null;
	},

	getIndex: function() {
		return this._index;
	},

	equals: function(item) {
		return item === this || item && this._class === item._class
				&& this._style.equals(item._style)
				&& this._matrix.equals(item._matrix)
				&& this._locked === item._locked
				&& this._draggable === item._draggable
				&& this._visible === item._visible
				&& this._blendMode === item._blendMode
				&& this._opacity === item._opacity
				&& this._clipMask === item._clipMask
				&& this._guide === item._guide
				&& this._equals(item)
				|| false;
	},

	_equals: function(item) {
		return Base.equals(this._children, item._children);
	},

	clone: function(options) {
		var copy = new this.constructor(Item.NO_INSERT),
			children = this._children,
			insert = Base.pick(options ? options.insert : undefined,
					options === undefined || options === true),
			deep = Base.pick(options ? options.deep : undefined, true);
		if (children)
			copy.copyAttributes(this);
		if (!children || deep)
			copy.copyContent(this);
		if (!children)
			copy.copyAttributes(this);
		if (insert)
			copy.insertAbove(this);
		var name = this._name,
			parent = this._parent;
		if (name && parent) {
			var children = parent._children,
				orig = name,
				i = 1;
			while (children[name])
				name = orig + ' ' + (i++);
			if (name !== orig)
				copy.setName(name);
		}
		return copy;
	},

	copyContent: function(source) {
		var children = source._children;
		for (var i = 0, l = children && children.length; i < l; i++) {
			this.addChild(children[i].clone(false), true);
		}
	},

	_copyExtraAttr: function(source, excludeMatrix){
	},
	copyAttributes: function(source, excludeMatrix) {
		this.setStyle(source._style);
		var keys = ['_locked', '_draggable', '_visible', '_blendMode', '_opacity',
				'_clipMask', '_guide'];
		for (var i = 0, l = keys.length; i < l; i++) {
			var key = keys[i];
			if (source.hasOwnProperty(key))
				this[key] = source[key];
		}
		this._copyExtraAttr(source, excludeMatrix);
		if (!excludeMatrix)
			this._matrix.set(source._matrix, true);
		this.setApplyMatrix(source._applyMatrix);
		this.setPivot(source._pivot);
		this.setSelection(source._selection);
		var data = source._data,
			name = source._name;
		this._data = data ? Base.clone(data) : null;
		if (name)
			this.setName(name);
	},

	rasterize: function(arg0, arg1) {
		var resolution,
			insert,
			raster;
		if (Base.isPlainObject(arg0)) {
			resolution = arg0.resolution;
			insert = arg0.insert;
			raster = arg0.raster;
		} else {
			resolution = arg0;
			insert = arg1;
		}
		if (!raster) {
			raster = new Raster(Item.NO_INSERT);
		}
		var bounds = this.getStrokeBounds(),
			scale = (resolution || this.getView().getResolution()) / 72,
			topLeft = bounds.getTopLeft().floor(),
			bottomRight = bounds.getBottomRight().ceil(),
			boundsSize = new Size(bottomRight.subtract(topLeft)),
			rasterSize = boundsSize.multiply(scale);
		raster.setSize(rasterSize, true);

		if (!rasterSize.isZero()) {
			var ctx = raster.getContext(true),
				matrix = new Matrix().scale(scale).translate(topLeft.negate());
			ctx.save();
			matrix.applyToContext(ctx);
			this.draw(ctx, new Base({ matrices: [matrix] }));
			ctx.restore();
		}
		raster._matrix.set(
			new Matrix()
				.translate(topLeft.add(boundsSize.divide(2)))
				.scale(1 / scale)
		);
		if (insert === undefined || insert) {
			raster.insertAbove(this);
		}
		return raster;
	},

	contains: function() {
		var matrix = this._matrix;
		return (
			matrix.isInvertible() &&
			!!this._contains(matrix._inverseTransform(Point.read(arguments)))
		);
	},

	_contains: function(point) {
		var children = this._children;
		if (children) {
			for (var i = children.length - 1; i >= 0; i--) {
				if (children[i].contains(point))
					return true;
			}
			return false;
		}
		return point.isInside(this.getInternalBounds());
	},

	isInside: function() {
		return Rectangle.read(arguments).contains(this.getBounds());
	},

	_asPathItem: function() {
		return new Path.Rectangle({
			rectangle: this.getInternalBounds(),
			matrix: this._matrix,
			insert: false,
		});
	},

	intersects: function(item, _matrix) {
		if (!(item instanceof Item))
			return false;
		return this._asPathItem().getIntersections(item._asPathItem(), null,
				_matrix, true).length > 0;
	}
},
new function() {
	function hitTest() {
		var args = arguments;
		return this._hitTest(
				Point.read(args),
				HitResult.getOptions(args));
	}

	function hitTestAll() {
		var args = arguments,
			point = Point.read(args),
			options = HitResult.getOptions(args),
			all = [];
		this._hitTest(point, new Base({ all: all }, options));
		return all;
	}

	function hitTestChildren(point, options, viewMatrix, _exclude) {
		var children = this._children;
		if (children) {
			for (var i = children.length - 1; i >= 0; i--) {
				var child = children[i];
				var res = child !== _exclude && child._hitTest(point, options,
						viewMatrix);
				if (res && !options.all)
					return res;
			}
		}
		return null;
	}

	Project.inject({
		hitTest: hitTest,
		hitTestAll: hitTestAll,
		_hitTest: hitTestChildren
	});

	return {
		hitTest: hitTest,
		hitTestAll: hitTestAll,
		_hitTestChildren: hitTestChildren,
	};
}, {

	_hitTest: function(point, options, parentViewMatrix) {
		if (this._locked || !this._visible || this._guide && !options.guides
				|| this.isEmpty()) {
			return null;
		}

		var matrix = this._matrix,
			viewMatrix = parentViewMatrix
					? parentViewMatrix.appended(matrix)
					: this.getGlobalMatrix().prepend(this.getView()._matrix),
			tolerance = Math.max(options.tolerance, 1e-12),
			tolerancePadding = options._tolerancePadding = new Size(
					Path._getStrokePadding(tolerance,
						matrix._shiftless().invert()));
		point = matrix._inverseTransform(point);
		if (!point || !this._children &&
			!this.getBounds({ internal: true, stroke: true, handle: true })
				.expand(tolerancePadding.multiply(2))._containsPoint(point)) {
			return null;
		}

		var checkSelf = !(options.guides && !this._guide
				|| options.selected && !this.isSelected()
				|| options.type && options.type !== Base.hyphenate(this._class)
				|| options.class && !(this instanceof options.class)),
			match = options.match,
			that = this,
			bounds,
			res;

		function filter(hit) {
			if (hit && match && !match(hit))
				hit = null;
			if (hit && options.all)
				options.all.push(hit);
			return hit;
		}

		function checkPoint(type, part) {
			var pt = part ? bounds['get' + part]() : that.getPosition();
			if (point.subtract(pt).divide(tolerancePadding).length <= 1) {
				return new HitResult(type, that, {
					name: part ? Base.hyphenate(part) : type,
					point: pt
				});
			}
		}

		var checkPosition = options.position,
			checkCenter = options.center,
			checkBounds = options.bounds;
		if (checkSelf && this._parent
				&& (checkPosition || checkCenter || checkBounds)) {
			if (checkCenter || checkBounds) {
				bounds = this.getInternalBounds();
			}
			res = checkPosition && checkPoint('position') ||
					checkCenter && checkPoint('center', 'Center');
			if (!res && checkBounds) {
				var points = [
					'TopLeft', 'TopRight', 'BottomLeft', 'BottomRight',
					'LeftCenter', 'TopCenter', 'RightCenter', 'BottomCenter'
				];
				for (var i = 0; i < 8 && !res; i++) {
					res = checkPoint('bounds', points[i]);
				}
			}
			res = filter(res);
		}

		if (!res) {
			res = this._hitTestChildren(point, options, viewMatrix)
				|| checkSelf
					&& filter(this._hitTestSelf(point, options, viewMatrix,
						this.getStrokeScaling() ? null
							: viewMatrix._shiftless().invert()))
				|| null;
		}
		if (res && res.point) {
			res.point = matrix.transform(res.point);
		}
		return res;
	},

	_hitTestSelf: function(point, options) {
		if (options.fill && this.hasFill() && this._contains(point))
			return new HitResult('fill', this);
	},

	matches: function(name, compare) {
		function matchObject(obj1, obj2) {
			for (var i in obj1) {
				if (obj1.hasOwnProperty(i)) {
					var val1 = obj1[i],
						val2 = obj2[i];
					if (Base.isPlainObject(val1) && Base.isPlainObject(val2)) {
						if (!matchObject(val1, val2))
							return false;
					} else if (!Base.equals(val1, val2)) {
						return false;
					}
				}
			}
			return true;
		}
		var type = typeof name;
		if (type === 'object') {
			for (var key in name) {
				if (name.hasOwnProperty(key) && !this.matches(key, name[key]))
					return false;
			}
			return true;
		} else if (type === 'function') {
			return name(this);
		} else if (name === 'match') {
			return compare(this);
		} else {
			var value = /^(empty|editable)$/.test(name)
					? this['is' + Base.capitalize(name)]()
					: name === 'type'
						? Base.hyphenate(this._class)
						: this[name];
			if (name === 'class') {
				if (typeof compare === 'function')
					return this instanceof compare;
				value = this._class;
			}
			if (typeof compare === 'function') {
				return !!compare(value);
			} else if (compare) {
				if (compare.test) {
					return compare.test(value);
				} else if (Base.isPlainObject(compare)) {
					return matchObject(compare, value);
				}
			}
			return Base.equals(value, compare);
		}
	},

	getItems: function(options) {
		return Item._getItems(this, options, this._matrix);
	},

	getItem: function(options) {
		return Item._getItems(this, options, this._matrix, null, true)[0]
				|| null;
	},

	statics: {
		_getItems: function _getItems(item, options, matrix, param, firstOnly) {
			if (!param) {
				var obj = typeof options === 'object' && options,
					overlapping = obj && obj.overlapping,
					inside = obj && obj.inside,
					bounds = overlapping || inside,
					rect = bounds && Rectangle.read([bounds]);
				param = {
					items: [],
					recursive: obj && obj.recursive !== false,
					inside: !!inside,
					overlapping: !!overlapping,
					rect: rect,
					path: overlapping && new Path.Rectangle({
						rectangle: rect,
						insert: false
					})
				};
				if (obj) {
					options = Base.filter({}, options, {
						recursive: true, inside: true, overlapping: true
					});
				}
			}
			var children = item._children,
				items = param.items,
				rect = param.rect;
			matrix = rect && (matrix || new Matrix());
			for (var i = 0, l = children && children.length; i < l; i++) {
				var child = children[i],
					childMatrix = matrix && matrix.appended(child._matrix),
					add = true;
				if (rect) {
					var bounds = child.getBounds(childMatrix);
					if (!rect.intersects(bounds))
						continue;
					if (!(rect.contains(bounds)
							|| param.overlapping && (bounds.contains(rect)
								|| param.path.intersects(child, childMatrix))))
						add = false;
				}
				if (add && child.matches(options)) {
					items.push(child);
					if (firstOnly)
						break;
				}
				if (param.recursive !== false) {
					_getItems(child, options, childMatrix, param, firstOnly);
				}
				if (firstOnly && items.length > 0)
					break;
			}
			return items;
		}
	}
}, {

	importJSON: function(json) {
		var res = Base.importJSON(json, this);
		return res !== this ? this.addChild(res) : res;
	},

	addChild: function(item, asTopLayer) {
		var pos = this._children.length;
		if( asTopLayer ){
			if( this._topIndex < 0 )
				this._topIndex = 0;
			return this.insertChild(pos, item);
		}
		if( this._topIndex >= 0 )
			pos = this._topIndex;
		return this.insertChild(pos, item);

	},

	insertChild: function(index, item) {
		var res = item ? this.insertChildren(index, [item]) : null;
		return res && res[0];
	},

	addChildren: function(items, asTopLayer) {
		var pos = this._children.length;
		if( asTopLayer ){
			return this.insertChildren(pos, items);
		}
		if( this._topIndex >= 0 )
			pos = this._topIndex;
		return this.insertChildren(pos, items);
	},

	insertChildren: function(index, items) {
		var children = this._children, topIndex = this._topIndex;
		if( typeof index == 'undefined' && topIndex >= 0 )
			index = topIndex;
		if (children && items && items.length > 0) {
			items = Base.slice(items);
			var inserted = {};
			for (var i = items.length - 1; i >= 0; i--) {
				var item = items[i],
					id = item && item._id;
				if (!item || inserted[id]) {
					items.splice(i, 1);
				} else {
					item._remove(false, true);
					inserted[id] = true;
				}
			}
			Base.splice(children, items, index, 0);
			if( topIndex >= index ) topIndex += items.length;
			this._topIndex = topIndex;

			var project = this._project,
				notifySelf = project._changes;
			for (var i = 0, l = items.length; i < l; i++) {
				var item = items[i],
					name = item._name;
				item._parent = this;
				item._setProject(project, true);
				if (name)
					item.setName(name);
				if (notifySelf)
					item._changed(5);
			}
			this._changed(11);
		} else {
			items = null;
		}
		return items;
	},

	_insertItem: '#insertChild',

	_insertAt: function(item, offset) {
		var owner = item && item._getOwner(),
			res = item !== this && owner ? this : null;
		if (res) {
			res._remove(false, true);
			owner._insertItem(item._index + offset, res);
		}
		return res;
	},

	insertAbove: function(item) {
		return this._insertAt(item, 1);
	},

	insertBelow: function(item) {
		return this._insertAt(item, 0);
	},

	sendToBack: function() {
		var owner = this._getOwner();
		return owner ? owner._insertItem(0, this) : null;
	},

	bringToFront: function() {
		var owner = this._getOwner();
		return owner ? owner._insertItem(undefined, this) : null;
	},
	setAsTopOne: function() {
		var owner = this._getOwner();
		return owner ? owner.addChild(this, true) : null;
	},
	appendTop: '#addChild',

	appendBottom: function(item) {
		return this.insertChild(0, item);
	},

	moveAbove: '#insertAbove',

	moveBelow: '#insertBelow',

	addTo: function(owner) {
		return owner._insertItem(undefined, this);
	},

	copyTo: function(owner) {
		return this.clone(false).addTo(owner);
	},

	reduce: function(options) {
		var children = this._children;
		if (children && children.length === 1) {
			var child = children[0].reduce(options);
			if (this._parent) {
				child.insertAbove(this);
				this.remove();
			} else {
				child.remove();
			}
			return child;
		}
		return this;
	},

	_removeNamed: function() {
		var owner = this._getOwner();
		if (owner) {
			var children = owner._children,
				namedChildren = owner._namedChildren,
				name = this._name,
				namedArray = namedChildren[name],
				index = namedArray ? namedArray.indexOf(this) : -1;
			if (index !== -1) {
				if (children[name] == this)
					delete children[name];
				namedArray.splice(index, 1);
				if (namedArray.length) {
					children[name] = namedArray[0];
				} else {
					delete namedChildren[name];
				}
			}
		}
	},

	_remove: function(notifySelf, notifyParent) {
		var owner = this._getOwner(),
			project = this._project,
			index = this._index;
		if (this._style)
			this._style._dispose();
		if (owner) {
			if (this._name)
				this._removeNamed();
			if( owner.isTopItem && owner.isTopItem( this ) ){
				owner._topIndex --;
			}
			if (index != null) {
				if (project._activeLayer === this)
					project._activeLayer = this.getNextSibling()
							|| this.getPreviousSibling();
				Base.splice(owner._children, null, index, 1);
			}
			this._installEvents(false);
			if (notifySelf && project._changes)
				this._changed(5);
			if (notifyParent)
				owner._changed(11, this);
			this._parent = null;
			return true;
		}
		return false;
	},

	remove: function() {
		return this._remove(true, true);
	},

	replaceWith: function(item) {
		var ok = item && item.insertBelow(this);
		if (ok)
			this.remove();
		return ok;
	},

	removeChildren: function(start, end) {
		if (!this._children)
			return null;
		start = start || 0;
		end = Base.pick(end, this._children.length);
		var removed = Base.splice(this._children, null, start, end - start);
		for (var i = removed.length - 1; i >= 0; i--) {
			removed[i]._remove(true, false);
		}
		var topIndex = this._topIndex;
		if( topIndex >= 0 ){
			if( end < topIndex ) this._topIndex -= end - start;
			else if( start < topIndex ) this._topIndex -= topIndex - start;

			if(  this._topIndex >= this._children.length ) this._topIndex = -1;
		}
		if (removed.length > 0)
			this._changed(11);
		return removed;
	},
	isTopItem: function(item){
		if( this._topIndex < 0 ) return false;
		var index = this._children.indexOf(item);
		return index < 0 ? false : index >= this._topIndex;
	},

	clear: '#removeChildren',

	reverseChildren: function() {
		if (this._children) {
			this._children.reverse();
			for (var i = 0, l = this._children.length; i < l; i++)
				this._children[i]._index = i;
			this._changed(11);
		}
	},

	isEmpty: function(recursively) {
		var children = this._children;
		var numChildren = children ? children.length : 0;
		if (recursively) {
			for (var i = 0; i < numChildren; i++) {
				if (!children[i].isEmpty(recursively)) {
					return false;
				}
			}
			return true;
		}
		return !numChildren;
	},

	isEditable: function() {
		var item = this;
		while (item) {
			if (!item._visible || item._locked)
				return false;
			item = item._parent;
		}
		return true;
	},

	hasFill: function() {
		return this.getStyle().hasFill();
	},

	hasStroke: function() {
		return this.getStyle().hasStroke();
	},

	hasShadow: function() {
		return this.getStyle().hasShadow();
	},

	_getOrder: function(item) {
		function getList(item) {
			var list = [];
			do {
				list.unshift(item);
			} while (item = item._parent);
			return list;
		}
		var list1 = getList(this),
			list2 = getList(item);
		for (var i = 0, l = Math.min(list1.length, list2.length); i < l; i++) {
			if (list1[i] != list2[i]) {
				return list1[i]._index < list2[i]._index ? 1 : -1;
			}
		}
		return 0;
	},

	hasChildren: function() {
		return this._children && this._children.length > 0;
	},

	isInserted: function() {
		return this._parent ? this._parent.isInserted() : false;
	},

	isAbove: function(item) {
		return this._getOrder(item) === -1;
	},

	isBelow: function(item) {
		return this._getOrder(item) === 1;
	},

	isParent: function(item) {
		return this._parent === item;
	},

	isChild: function(item) {
		return item && item._parent === this;
	},

	isDescendant: function(item) {
		var parent = this;
		while (parent = parent._parent) {
			if (parent === item)
				return true;
		}
		return false;
	},

	isAncestor: function(item) {
		return item ? item.isDescendant(this) : false;
	},

	isSibling: function(item) {
		return this._parent === item._parent;
	},

	isGroupedWith: function(item) {
		var parent = this._parent;
		while (parent) {
			if (parent._parent
				&& /^(Group|Layer|CompoundPath)$/.test(parent._class)
				&& item.isDescendant(parent))
					return true;
			parent = parent._parent;
		}
		return false;
	},

}, Base.each(['rotate', 'scale', 'shear', 'skew'], function(key) {
	var rotate = key === 'rotate';
	this[key] = function() {
		var args = arguments,
			value = (rotate ? Base : Point).read(args),
			center = Point.read(args, 0, { readNull: true });
		return this.transform(new Matrix()[key](value,
				center || this.getPosition(true)));
	};
}, {
	translate: function() {
		var mx = new Matrix();
		return this.transform(mx.translate.apply(mx, arguments));
	},

	transform: function(matrix, _applyRecursively, _setApplyMatrix) {
		var _matrix = this._matrix,
			transformMatrix = matrix && !matrix.isIdentity(),
			applyMatrix = (
				_setApplyMatrix && this._canApplyMatrix ||
				this._applyMatrix && (
					transformMatrix || !_matrix.isIdentity() ||
					_applyRecursively && this._children
				)
			);
		if (!transformMatrix && !applyMatrix)
			return this;
		if (transformMatrix) {
			if (!matrix.isInvertible() && _matrix.isInvertible())
				_matrix._backup = _matrix.getValues();
			_matrix.prepend(matrix, true);
			var style = this._style,
				fillColor = style.getFillColor(true),
				strokeColor = style.getStrokeColor(true);
			if (fillColor)
				fillColor.transform(matrix);
			if (strokeColor)
				strokeColor.transform(matrix);
		}

		if (applyMatrix && (applyMatrix = this._transformContent(
				_matrix, _applyRecursively, _setApplyMatrix))) {
			var pivot = this._pivot;
			if (pivot)
				_matrix._transformPoint(pivot, pivot, true);
			_matrix.reset(true);
			if (_setApplyMatrix && this._canApplyMatrix)
				this._applyMatrix = true;
		}
		var bounds = this._bounds,
			position = this._position;
		if (transformMatrix || applyMatrix) {
			this._changed(25);
		}
		var decomp = transformMatrix && bounds && matrix.decompose();
		if (decomp && decomp.skewing.isZero() && decomp.rotation % 90 === 0) {
			for (var key in bounds) {
				var cache = bounds[key];
				if (cache.nonscaling) {
					delete bounds[key];
				} else if (applyMatrix || !cache.internal) {
					var rect = cache.rect;
					matrix._transformBounds(rect, rect);
				}
			}
			this._bounds = bounds;
			var cached = bounds[this._getBoundsCacheKey(
				this._boundsOptions || {})];
			if (cached) {
				this._position = this._getPositionFromBounds(cached.rect);
			}
		} else if (transformMatrix && position && this._pivot) {
			this._position = matrix._transformPoint(position, position);
		}
		return this;
	},

	_transformContent: function(matrix, applyRecursively, setApplyMatrix) {
		var children = this._children;
		if (children) {
			for (var i = 0, l = children.length; i < l; i++) {
				children[i].transform(matrix, applyRecursively, setApplyMatrix);
			}
			return true;
		}
	},

	globalToLocal: function() {
		return this.getGlobalMatrix(true)._inverseTransform(
				Point.read(arguments));
	},

	localToGlobal: function() {
		return this.getGlobalMatrix(true)._transformPoint(
				Point.read(arguments));
	},

	parentToLocal: function() {
		return this._matrix._inverseTransform(Point.read(arguments));
	},

	localToParent: function() {
		return this._matrix._transformPoint(Point.read(arguments));
	},

	fitBounds: function(rectangle, fill) {
		rectangle = Rectangle.read(arguments);
		var bounds = this.getBounds(),
			itemRatio = bounds.height / bounds.width,
			rectRatio = rectangle.height / rectangle.width,
			scale = (fill ? itemRatio > rectRatio : itemRatio < rectRatio)
					? rectangle.width / bounds.width
					: rectangle.height / bounds.height,
			newBounds = new Rectangle(new Point(),
					new Size(bounds.width * scale, bounds.height * scale));
		newBounds.setCenter(rectangle.getCenter());
		this.setBounds(newBounds);
	}
}), {

	_setStyles: function(ctx, param, viewMatrix) {
		var style = this._style,
			matrix = this._matrix;
		if (style.hasFill()) {
			ctx.fillStyle = style.getFillColor().toCanvasStyle(ctx, matrix);
		}
		if (style.hasStroke()) {
			ctx.strokeStyle = style.getStrokeColor().toCanvasStyle(ctx, matrix);
			ctx.lineWidth = style.getStrokeWidth();
			var strokeJoin = style.getStrokeJoin(),
				strokeCap = style.getStrokeCap(),
				miterLimit = style.getMiterLimit();
			if (strokeJoin)
				ctx.lineJoin = strokeJoin;
			if (strokeCap)
				ctx.lineCap = strokeCap;
			if (miterLimit)
				ctx.miterLimit = miterLimit;
			if (mpaper.support.nativeDash) {
				var dashArray = style.getDashArray(),
					dashOffset = style.getDashOffset();
				if (dashArray && dashArray.length) {
					if ('setLineDash' in ctx) {
						ctx.setLineDash(dashArray);
						ctx.lineDashOffset = dashOffset;
					} else {
						ctx.mozDash = dashArray;
						ctx.mozDashOffset = dashOffset;
					}
				}
			}
		}
		if (style.hasShadow()) {
			var pixelRatio = param.pixelRatio || 1,
				mx = viewMatrix._shiftless().prepend(
					new Matrix().scale(pixelRatio, pixelRatio)),
				blur = mx.transform(new Point(style.getShadowBlur(), 0)),
				offset = mx.transform(this.getShadowOffset());
			ctx.shadowColor = style.getShadowColor().toCanvasStyle(ctx);
			ctx.shadowBlur = blur.getLength();
			ctx.shadowOffsetX = offset.x;
			ctx.shadowOffsetY = offset.y;
		}
	},

	imageEffect: function(duration, transType, isCreation){
		var easing = '';
		RU.imageEffect2(this._project._activeLayer, this, duration,  transType, easing, "", isCreation, null);
	},

	draw: function(ctx, param, parentStrokeMatrix) {
		var updateVersion = this._updateVersion = this._project._updateVersion;
		if (!this._visible || this._opacity === 0)
			return;
		var matrices = param.matrices,
			viewMatrix = param.viewMatrix,
			matrix = this._matrix,
			globalMatrix = matrices[matrices.length - 1].appended(matrix);
		if (!globalMatrix.isInvertible())
			return;

		viewMatrix = viewMatrix ? viewMatrix.appended(globalMatrix)
				: globalMatrix;

		matrices.push(globalMatrix);
		if (param.updateMatrix) {
			this._globalMatrix = globalMatrix;
		}

		var blendMode = this._blendMode,
			opacity = Numerical.clamp(this._opacity, 0, 1),
			normalBlend = blendMode === 'normal',
			nativeBlend = BlendMode.nativeModes[blendMode],
			direct = normalBlend && opacity === 1
					|| param.dontStart
					|| param.clip
					|| (nativeBlend || normalBlend && opacity < 1)
						&& this._canComposite(),
			pixelRatio = param.pixelRatio || 1,
			mainCtx, itemOffset, prevOffset;
		if (!direct) {
			var bounds = this.getStrokeBounds(viewMatrix);
			if (!bounds.width || !bounds.height) {
				matrices.pop();
				return;
			}
			prevOffset = param.offset;
			itemOffset = param.offset = bounds.getTopLeft().floor();
			mainCtx = ctx;
			ctx = CanvasProvider.getContext(bounds.getSize().ceil().add(1)
					.multiply(pixelRatio));
			if (pixelRatio !== 1)
				ctx.scale(pixelRatio, pixelRatio);
		}
		ctx.save();
		var strokeMatrix = parentStrokeMatrix
				? parentStrokeMatrix.appended(matrix)
				: this._canScaleStroke && !this.getStrokeScaling(true)
					&& viewMatrix,
			clip = !direct && param.clipItem,
			transform = !strokeMatrix || clip;
		if (direct) {
			ctx.globalAlpha = opacity;
			if (nativeBlend)
				ctx.globalCompositeOperation = blendMode;
		} else if (transform) {
			ctx.translate(-itemOffset.x, -itemOffset.y);
		}
		if (transform) {
			(direct ? matrix : viewMatrix).applyToContext(ctx);
		}
		if (clip) {
			param.clipItem.draw(ctx, param.extend({ clip: true }));
		}
		if (strokeMatrix) {
			ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
			var offset = param.offset;
			if (offset)
				ctx.translate(-offset.x, -offset.y);
		}
		this._draw(ctx, param, viewMatrix, strokeMatrix);
		ctx.restore();
		matrices.pop();
		if (param.clip && !param.dontFinish) {
			ctx.clip(this.getFillRule());
		}
		if (!direct) {
			BlendMode.process(blendMode, ctx, mainCtx, opacity,
					itemOffset.subtract(prevOffset).multiply(pixelRatio));
			CanvasProvider.release(ctx);
			param.offset = prevOffset;
		}
	},

	_isUpdated: function(updateVersion) {
		var parent = this._parent;
		if (parent instanceof CompoundPath)
			return parent._isUpdated(updateVersion);
		var updated = this._updateVersion === updateVersion;
		if (!updated && parent && parent._visible
				&& parent._isUpdated(updateVersion)) {
			this._updateVersion = updateVersion;
			updated = true;
		}
		return updated;
	},

	_drawSelection: function(ctx, matrix, size, selectionItems, updateVersion) {
		var selection = this._selection,
			itemSelected = selection & 1,
			boundsSelected = selection & 2
					|| itemSelected && this._selectBounds,
			positionSelected = selection & 4;
		if (!this._drawSelected)
			itemSelected = false;
		if ((itemSelected || boundsSelected || positionSelected)
				&& this._isUpdated(updateVersion)) {
			var layer,
				color = this.getSelectedColor(true) || (layer = this.getLayer())
					&& layer.getSelectedColor(true),
				mx = matrix.appended(this.getGlobalMatrix(true)),
				half = size / 2;
			ctx.strokeStyle = ctx.fillStyle = color
					? color.toCanvasStyle(ctx) : '#009dec';
			if (itemSelected)
				this._drawSelected(ctx, mx, selectionItems);
			if (positionSelected) {
				var pos = this.getPosition(true),
					parent = this._parent,
					point = parent ? parent.localToGlobal(pos) : pos,
					x = point.x,
					y = point.y;
				ctx.beginPath();
				ctx.arc(x, y, half, 0, Math.PI * 2, true);
				ctx.stroke();
				var deltas = [[0, -1], [1, 0], [0, 1], [-1, 0]],
					start = half,
					end = size + 1;
				for (var i = 0; i < 4; i++) {
					var delta = deltas[i],
						dx = delta[0],
						dy = delta[1];
					ctx.moveTo(x + dx * start, y + dy * start);
					ctx.lineTo(x + dx * end, y + dy * end);
					ctx.stroke();
				}
			}
			if (boundsSelected) {
				var coords = mx._transformCorners(this.getInternalBounds());
				ctx.beginPath();
				for (var i = 0; i < 8; i++) {
					ctx[!i ? 'moveTo' : 'lineTo'](coords[i], coords[++i]);
				}
				ctx.closePath();
				ctx.stroke();
				for (var i = 0; i < 8; i++) {
					ctx.fillRect(coords[i] - half, coords[++i] - half,
							size, size);
				}
			}
		}
	},
	showSelf: function( timeline, options, offset){
		var layer = this.getLayer() || this._project._activeLayer;
		var newops = Base.set({}, options);
		delete newops.target; delete newops.targets;
		newops.target = this;
		layer.createItems(timeline, options, offset);
	},

	_canComposite: function() {
		return false;
	}
}, Base.each(['down', 'drag', 'up', 'move'], function(key) {
	this['removeOn' + Base.capitalize(key)] = function() {
		var hash = {};
		hash[key] = true;
		return this.removeOn(hash);
	};
}, {

	removeOn: function(obj) {
		for (var name in obj) {
			if (obj[name]) {
				var key = 'mouse' + name,
					project = this._project,
					sets = project._removeSets = project._removeSets || {};
				sets[key] = sets[key] || {};
				sets[key][this._id] = this;
			}
		}
		return this;
	}
}), {
	tween: function( options ) {

		var tween_op = Base.set({}, {
			targets: this,
			easing: 'linear'  ,
			duration: 1
		},  options);
		this.project.activeLayer._timeline.add( tween_op ).play();
	},

	make_progress: function(duration, options) {
		var time = 0, that = this;
		function onFrame(event) {
			if(time == 0)
				time = event.time;
			var p = event.time - time;
			that._progress_imp(p, options);
			if ( p >= duration ) {
				this.off('frame', onFrame);
			}
		}
		if (duration) {
			this.on('frame', onFrame);
		}
		return this;
	},
	_progress_imp: function(progress, options){
	},

});

var Group = Item.extend({
	_class: 'Group',
	_selectBounds: false,
	_selectChildren: true,
	_serializeFields: {
		children: []
	},

	initialize: function Group(arg) {
		this._children = [];
		this._topIndex = -1;
		this._namedChildren = {};
		if (!this._initialize(arg))
			this.addChildren(Array.isArray(arg) ? arg : arguments);
	},

	_changed: function _changed(flags) {
		_changed.base.call(this, flags);
		if (flags & 2178) {
			this._clipItem = undefined;
		}
	},
	setShowHide: function(show){
		this.visible = show;
		var children = this._children;
		for (var i = 0, l = children.length; i < l; i++) {
			children[i].setShowHide(show);
		}
	},
	showSelf: function(timeline, options, offset){
		var children = this._children, layer = this.getLayer() || this._project._activeLayer;
		options.duration = options.duration || 1;
		delete options.target; delete options.targets;
		RU.handleSeveralTargets(children, options.duration||1, offset, function(item, duration, offset){
			var newops = Base.set({}, options);
			newops.targets = item;
			newops.duration = duration;
			layer.createItems(timeline, newops, offset);
		});
	},
	containsAllPaths: function(forSVG){
		var   children = this._children, count = children.length;
		for (var i = 0, l = count; i < l; i++){
			var c = children[i] ;
			if( c instanceof Path || c instanceof CompoundPath )
				continue;
			if( c.containsAllPaths && c.containsAllPaths(forSVG) )
				continue;
			if( forSVG &&  c._class == 'Shape' && c._type == 'rectangle' )
				continue;
			return false;
		 }
		 return true;
	},
	write: function(timeline, duration, offset, doneCallback) {
		this._write0(timeline, duration, offset,  true, doneCallback);
	},
	unwrite: function(timeline, duration, offset,  doneCallback) {
		this._write0(timeline, duration, offset, false, doneCallback);
	},
	_write0: function(timeline, duration, offset,  create, doneCallback) {
		var   cs = this._children, count = cs.length;
		if( count == 0 ) return;
		var  cdur = duration/count;
		if( cs[0]._write0 ) cs[0]._write0( timeline, cdur, offset,  create, doneCallback);
		for(var i = 1; i < count; i++)
			if( cs[i]._write0 ) cs[i]._write0( timeline, cdur, undefined,  create, doneCallback);
   },
   start: function(duration, offset, repeat, doneCallback ) {
		var   cs = this._children, count = cs.length;
		if( count == 0 ) return;
		var   cdur = duration/count, acc= offset;
		cs.forEach(e =>{  e._progress = 0; });
		if( cs[0].start ) cs[0].start(   cdur, offset,  repeat, doneCallback);
		for(var i = 1; i < count; i++){
			acc += cdur;
			if( cs[i].start ) cs[i].start(  cdur, acc,  repeat, doneCallback);
		}
   },

	showChildOneByOne: function(timeline,  duration, offset, doneCallback){
		var that = this, children = this._children, len = children.length, started = false;
		timeline.add({
			targets : that,
			progressFunc : function(progress){
				if( !started ) {
					started = true;
					children.forEach(e => {  e.visible = false; });
				}
				var t  =  Math.floor( len * progress );
				for(var i = 0; i < t; i++){
					children[i].visible = true;
				}
			}.bind(this),
			duration : duration,
			complete: function(){
				if( doneCallback ) doneCallback();
				children.forEach(e => {  e.visible = true; });
			}.bind(this)
		}, offset);
	},

	_getClipItem: function() {
		var clipItem = this._clipItem;
		if (clipItem === undefined) {
			clipItem = null;
			var children = this._children;
			for (var i = 0, l = children.length; i < l; i++) {
				if (children[i]._clipMask) {
					clipItem = children[i];
					break;
				}
			}
			this._clipItem = clipItem;
		}
		return clipItem;
	},

	isClipped: function() {
		return !!this._getClipItem();
	},

	setClipped: function(clipped) {
		var child = this.getFirstChild();
		if (child)
			child.setClipMask(clipped);
	},

	_getBounds: function _getBounds(matrix, options) {
		var clipItem = this._getClipItem();
		return clipItem
			? clipItem._getCachedBounds(clipItem._matrix.prepended(matrix),
				Base.set({}, options, { stroke: false }))
			: _getBounds.base.call(this, matrix, options);
	},

	_hitTestChildren: function _hitTestChildren(point, options, viewMatrix) {
		var clipItem = this._getClipItem();
		return (!clipItem || clipItem.contains(point))
				&& _hitTestChildren.base.call(this, point, options, viewMatrix,
					clipItem);
	},
	_draw_extra_bg: function(ctx, param, viewMatrix) { },
	_draw_extra_fb: function(ctx, param, viewMatrix) { },
	_draw: function(ctx, param, viewMatrix) {
		var clip = param.clip,
			clipItem = !clip && this._getClipItem();
		param = param.extend({ clipItem: clipItem, clip: false });
		if (clip) {
			ctx.beginPath();
			param.dontStart = param.dontFinish = true;
		} else if (clipItem) {
			clipItem.draw(ctx, param.extend({ clip: true }));
		}
		this._draw_extra_bg(ctx, param, viewMatrix);

		var children = this._children;
		for (var i = 0, l = children.length; i < l; i++) {
			var item = children[i];
			if (item !== clipItem  )
				item.draw(ctx, param);
		}
		this._draw_extra_fb(ctx, param, viewMatrix);

	},
	align_grid: function(numrows, numcols, gap, exclude){
		var children = this._children, max_w, max_h, tlx, tly, pos;
		numrows = Math.abs(numrows) || 1; numcols == Math.abs(numcols) || 1;
		let linfo = this._get_child_layout(exclude);
		tlx = linfo[0], tly = linfo[1], max_w = linfo[2], max_h = linfo[3];
		if( exclude )
			children = children.filter(e => {
				return e != exclude;
			});
		var counts = children.length;
		if( numrows * numcols < counts ){
			numrows = 1; numcols = counts;
		}
		gap = gap || 0;
		for (var i = 0; i < numrows; i++){
			for (var j = 0; j < numcols; j++){
				pos = i * numcols + j;
				if( pos >= counts  ) break;
				var item = children[pos];
				item.position = new Point(j* (max_w +gap)+ max_w/2, i* (max_h+gap) + max_h/2 );
			}
		}
		return this;
	},
	_get_child_layout: function(excluded){
		var children = this._children,
		max_w = 0, max_h = 0, tlx = 100000, tly = 100000, pos;
		for (var i = 0, l = children.length; i < l; i++) {
			var item = children[i];
			if( item == excluded ) continue;
			if( item.bounds.width > max_w ) max_w = item.bounds.width;
			if( item.bounds.height > max_h ) max_h = item.bounds.height;
			if( item.bounds.x < tlx ) tlx = item.bounds.x;
			if( item.bounds.y < tly ) tly = item.bounds.y;
		}
		return [tlx, tly, max_w, max_h];
	},
	align: function(vertical, gap, exclude){
		var children = this._children,  max_w, max_h, tlx, tly, offset = 0;
		let linfo = this._get_child_layout(exclude);
		tlx = linfo[0], tly = linfo[1], max_w = linfo[2], max_h = linfo[3];
		if( exclude )
			children = children.filter(e => {
				return e != exclude;
			});
		gap = gap || 0;
		if( vertical ){
			children.forEach(item => {
				item.position = new Point( max_w/2, offset + item.bounds.height/2 );
				offset += item.bounds.height + gap;
			});
		} else {
			children.forEach(item => {
				item.position = new Point(  offset + item.bounds.width/2, max_h/2);
				offset += item.bounds.width + gap;
			});
		}
		return this;
	},
	doHomotopy: function(timeline, homotopy, duration, offset, doneCallback){
		var that = this, fromList = this.getAllLeaves(true),
			children = fromList.filter(e =>{ return e instanceof Path || e instanceof CompoundPath; }) ;
		children[0]. doHomotopy(timeline, homotopy, duration, offset, doneCallback);
		for (var i = 1, l = children.length; i < l; i++)
			children[i]. doHomotopy(timeline, homotopy, duration, '==', doneCallback);
	},
	morphingTo: function(timeline, target, duration, offset, finishCallback){
		var that = this, fromList = this.getAllLeaves(true), cc = fromList.filter(e =>{ return e instanceof PathItem; }),
			toList = target.getAllLeaves(true), tc = toList.filter(e =>{ return e instanceof PathItem; }),
			ccount = cc.length, tcount = tc.length;
			that.removeChildren();
			fromList.forEach(e => {
				e.remove();
				that._project._activeLayer.addChild(e);
			} );

			var diff =  Math.abs(ccount - tcount);
			var added = [];
			if( diff > 0 ){
				var to_more = ccount < tcount, temp = to_more ? cc : tc, last = temp[temp.length-1], c;
				for(var i = diff; i > 0; i--) {
					c =  last.clone();
					added.push( c );
					temp.push( c );
				}
			}
			var count = Math.max(ccount, tcount), fs=0;
			var callback = function(){
				fs++;
				if( fs == count ){
					if( finishCallback )
						finishCallback();
				   {
						cc.forEach(e => {  if( e ) e.hiding( true );   });
						added.forEach(e => {    if( e ) e.hiding(true);   });
						that.hiding(true)
						target.showing(0.1);
					}
				}
			}
			cc[0].morphingTo(timeline, tc[0], duration, offset, callback) ;
			for(var k = 1; k < count; k++){
				cc[k].morphingTo(timeline, tc[k], duration, '==', callback) ;
			}
	},
});

var Layer = Group.extend({
	_class: 'Layer',

	initialize: function Layer() {
		Group.apply(this, arguments);
		this._timeline = anime.timeline({
			autoplay: false
		  });
		this._player = new R9TimlinePlayer(this._project, this, {});
	},
	getPlayer: function(){
		return this._player;
	},
	addPage: function(page){
		this._player.addPage(page);
	},
	removePage: function(page){
		this._player.remove(page);
	},
	getCurPage: function(){
	   return this._player.getCurPage();
	},
	getTimeline: function(){
		return this._timeline;
	},
	setTimeline: function(timeline){
		this._timeline = timeline;
	},
	heartbeat: function(){
		this._player.heartbeat();
	},
	_anime: function(params){
		anime(params);
	},
	 createItems: function( timeline, options, offset, doneCallback){
		var that = this,  conf = that._project.configuration,
			w = conf.frame_width, h = conf.frame_height ;
		if( options.target ){ options.targets = options.target; delete options.target; }
		if( !Array.isArray( options.targets ) ) options.targets = [options.targets];
		var targets = options.targets; options.type = options.type || 'FadeIn';
		if( options.type == 'ShowCreation' ||  options.type == 'DrawBorderThenFill' || options.type == 'Write'){
			options.progress = 1;
			var allpath = true;
			targets.forEach(e =>{
				 e.progress = 0;
				 if( !(e  instanceof Path || e instanceof CompoundPath ||
					(typeof e.containsAllPaths == 'function' && e.containsAllPaths(true))) )
					allpath = false;
			});
			if(  allpath ){
				targets.forEach(e =>{
					e.write(timeline, options.duration||1, offset,   doneCallback);
				});
			} else {
				options.complete = function(){
					targets.forEach(e =>{ e.progress = -1; });
					if( doneCallback ) doneCallback();
				};
				timeline.add( options, offset )
			}
		}
		else if( options.type == 'GrowFromCenter' ){
			var bdss = [], poss = [];
			targets.forEach(e =>{
				var pos = e.position.clone();
				bdss.push( e.bounds.clone() );
				poss.push(pos);
				e.bounds.width = 1;
				e.bounds.height = 1;
				e.position = pos;
			 });
			options['bounds.size'] = function(ta, i){  return bdss[i].size ;   } ;
			options.position = '+=[0,0]';
			if( doneCallback )   options.complete = function(){   doneCallback();  };
			timeline.add( options, offset );
		}
		else if( options.type == 'GrowFromPoint' ){
			var bdss = [], poss = [];
			targets.forEach(e =>{
				var pos = e.position.clone();
				bdss.push( e.bounds.clone() );
				poss.push(pos);
				e.bounds.width = 1;
				e.bounds.height = 1;
				e.position = options.point;
			 });
			 options['bounds.size'] = function(ta, i){  return bdss[i].size ;   } ;
			 if( doneCallback )   options.complete = function(){   doneCallback();  };

			delete options.point;
			timeline.add( options, offset);
		}
		else if( options.type == 'GrowFromEdge' ){
			var bdss = [], poss = [];
			targets.forEach(e =>{
				var pos = e.position.clone();
				bdss.push( e.bounds.clone() );
				poss.push(pos);
				var dir = options.direction, pos;
				if( dir ==  'UP') pos = e.bounds.topCenter;
				else if( dir == 'DOWN') pos = e.bounds.bottomCenter;
				else if( dir == 'LEFT') pos = e.bounds.leftCenter;
				else   pos = e.bounds.rightCenter;
				e.bounds.width = 1;
				e.bounds.height = 1;
				e.position = pos;
			 });
			 options['bounds.size'] = function(ta, i){  return bdss[i].size ;   } ;
			 if( doneCallback )   options.complete = function(){   doneCallback();  };
			delete options.direction;
			timeline.add( options , offset);
		}
		else if( options.type == 'SpinInFromNothing' ){
			var bdss = [], poss = [], ams = [];
			targets.forEach(e =>{
				var pos = e.position.clone();
				bdss.push( e.bounds.clone() );
				poss.push(pos);
				ams.push(e.applyMatrix);
				e.applyMatrix = false;
				e.bounds.width = 1;
				e.bounds.height = 1;
			 });
			options.position = '+=[0,0]';
			options.rotation = 360*5* options.duration;
			options['bounds.size'] = function(ta, i){  return bdss[i].size  ;   } ;
			options.complete = function(){
				targets.forEach( (e,i) =>{ e.applyMatrix = ams[i]; });
				if( doneCallback )   doneCallback();
			};
			timeline.add( options , offset);
		}
		else if( options.type.startsWith('FadeIn') ){
			if( options.type == 'FadeIn'  ){
			}
			else if( options.type == 'FadeInFromLarge' ){
				var bdss = [], poss = [] ;
				targets.forEach(e =>{
					var pos = e.position.clone();
					bdss.push( e.bounds.clone() );
					poss.push(pos);
					e.bounds.width = e.bounds.width * 10;
					e.bounds.height = e.bounds.heigh * 10;
				 });
				options['bounds.size'] = function(ta, i){  return bdss[i].size ;   } ;
				options.position = '+=[0,0]';
			}
			else {
				var bdss = [], poss = [] ;
				targets.forEach(e =>{
					var pos = e.position.clone();
					bdss.push( e.bounds.clone() );
					poss.push(pos);
					var point;
					if( options.type == 'FadeInFromPoint' ) {
						point = options.point;
						delete options.point;
					}
					else if( options.type == 'FadeInFromUp' ) point = new Point(pos.x, -100);
					else if( options.type == 'FadeInFromDown' ) point = new Point(pos.x, h+100);
					else if( options.type == 'FadeInFromLeft' ) point = new Point(-100, pos.y);
					else if( options.type == 'FadeInFromRight' ) point = new Point(w+100, pos.y);
					e.position =  point;
				 });
				 options.position = function(ta, i){  return poss[i] ;   } ;
			}
			options.opacity = 1;
			if( doneCallback )   options.complete = function(){   doneCallback();  };
			targets.forEach(e =>{ e.opacity = 0; });
			timeline.add( options , offset);
		}
		else if(   options.type == 'CurlDown'  ){
			var bdss = [], poss = [] ;
			targets.forEach(e =>{
				var pos = e.position.clone();
				bdss.push( e.bounds.clone() );
				poss.push(pos);
				 e.bounds.height = 0.1;
			 });
			options['bounds.size'] = function(ta, i){  return bdss[i].size ;   } ;
			if( doneCallback )   options.complete = function(){   doneCallback();  };
			options.position = '+=[0,0]';
			ani = timeline.add( options , offset);
		}
		else if( options.type == 'CurlRight'   ){
			var bdss = [], poss = [] ;
			targets.forEach(e =>{
				var pos = e.position.clone();
				bdss.push( e.bounds.clone() );
				poss.push(pos);
				e.position.x -= e.bounds.width / 2;
				e.bounds.width = e.bounds.width * 0.01;
			 });
			options.scaleX = 100;
			options.scaleY= 1 ;
			options.position = function(ta, i){  return poss[i] ;   } ;
			if( doneCallback )   options.complete = function(){   doneCallback();  };
			timeline.add( options , offset);
		}
		else if( options.type == 'ReplacementTransform' ){
			var to_targets = Array.isArray(options.to_target) ? options.to_target : [options.to_target];
			if( to_targets.length == targets.length ){
				for(var i = 0; i < targets.length; i++)
				   targets[i].morphingTo(timeline, to_targets[i], options.duration, offset, doneCallback);
			}
		}
		else if( options.type == 'TransformFromCopy'  ){
			var to_targets = Array.isArray(options.to_target) ? options.to_target : [options.to_target];
			if( to_targets.length == targets.length ){
				for(var i = 0; i < targets.length; i++)
				   targets[i].clone().morphingTo(timeline, to_targets[i], options.duration, offset, doneCallback);
			}
		}
		else if ( options.type == 'ImageEffect' ){
			var transType = options.effect, easing = options.easing, positionFunc = options.positionFunc;
			targets.forEach( e => {
				RU.imageEffect2(this, e, options.duration || 1, transType, easing, positionFunc, true, doneCallback);
			});
		}
		else if ( options.type == 'Text' ){
			targets.forEach( e => {
				 if( e instanceof Group &&  e.fromLatex ){
					e.showChildOneByOne(timeline,  options.duration || 1, offset, doneCallback);
				 }
				 else if ( e instanceof StyledText ){
					 e.animType =  e.animType || options.animType || 'writing';
					 e.write( timeline, options.duration || 1, offset, doneCallback)
				 }
			});
		}
	},

	uncreateItems: function( timeline, options, offset, doneCallback){
		var that = this,  conf = that._project.configuration,
			w = conf.frame_width, h = conf.frame_height, hasAnim = false;
		if( options.target ){ options.targets = options.target; delete options.target; }
		if( !Array.isArray( options.targets ) ) options.targets = [options.targets];
		var targets = options.targets;  options.type = options.type || 'FadeOut';
		if( options.type == 'Uncreate' ||  options.type == 'Unwrite' ){
			options.progress = 1;
			var allpath = true;
			targets.forEach(e =>{
				 e.progress = 0;
				 if( !(e  instanceof Path || e instanceof CompoundPath ||
					(typeof e.containsAllPaths == 'function' && e.containsAllPaths(true))) )
					allpath = false;
			});
			if(  allpath ){
				targets.forEach(e =>{
					e.unwrite(timeline, options.duration||1, offset,  function(){
						e.remove();
						if( doneCallback ) doneCallback();
					});
				});
				return;
			}
			hasAnim = true;
		}
		else if( options.type == 'DisappearToCenter' ){
			options['bounds.size'] = new Size(2,2) ;
			options.position = '+=[0,0]';
			hasAnim = true;
		}
		else if( options.type == 'DisappearToPoint' ){
			options['bounds.size'] = new Size(2,2) ;
			options.position = options.point;
			delete options.point;
			hasAnim = true;
		}
		else if( options.type == 'SpinInToNothing' ){
			targets.forEach(e =>{
				e.applyMatrix = false;
			 });
			options.position = '+=[0,0]';
			options.rotation = 360*5* options.duration;
			options['bounds.size'] = new Size(2,2) ;
			hasAnim = true;
		}
		else if( options.type.startsWith('FadeOut') ){
			if( options.type == 'FadeOut'  ){
			}
			else if( options.type == 'FadeOutToLarge' ){
				var bdss = [] ;
				targets.forEach(e =>{
					bdss.push( e.bounds.clone() );
				 });
				options['bounds.size'] = function(ta, i){  return bdss[i].size.__multiply(10) ;   } ;
				options.position = '+=[0,0]';
			}
			else {
				var   poss = [] ;
				targets.forEach(e =>{
					var point;
					if( options.type == 'FadeOutToPoint' ) {
						point = options.point;
						delete options.point;
					}
					else if( options.type == 'FadeOutToUp' ) point = new Point(pos.x, -100);
					else if( options.type == 'FadeOutToDown' ) point = new Point(pos.x, h+100);
					else if( options.type == 'FadeOutToLeft' ) point = new Point(-100, pos.y);
					else if( options.type == 'FadeOutToRight' ) point = new Point(w+100, pos.y);
					poss.push(point);
				 });
				 options.position = function(ta, i){  return poss[i] ;   } ;
			}
			options.opacity = 0.01;
			hasAnim = true;
		}
		else if ( options.type == 'ImageEffect' ){
			var transType = options.effect, easing = options.easing, positionFunc = options.positionFunc;
			targets.forEach( e => {
				RU.imageEffect2(this, e, options.duration, transType, easing, positionFunc, false, doneCallback);
			});
			return;
		}
		if(   hasAnim ){
			options.complete = function(){
				targets.forEach(e =>{ e.remove(); });
				if( doneCallback ) doneCallback();
			};
			timeline.add( options, offset )
		}
	},
	sceneSetup: function(options){
		this._sceneSetupOptions = options || {};
	},
	_getClipItem: function() {
		if(this._clipItem == undefined){
			if( this._children.length > 0 && this._children[0]._clipMask )
				this._clipItem = this._children[0];
			else {
				var cliparea = this.clips && this.clips._class == 'Rectangle' ?  this.clips : this._project.view.bounds.clone();
				var item = new Path.Rectangle( cliparea);
				this.insertChild(0, item);
				this._clipItem = item;
				this._clipItem._clipMask = true;
				this._clipItem._matrix = new Matrix()
				this._clipItem._aslayerbg = true;

			}
			this._clipItem.fillColor = this._style._values.sceneBgColor || this._project._currentStyle.sceneBgColor ||
									   this._style._defaults.sceneBgColor || 'white';
		}
		return this._clipItem;
	},
	getCurrentColors: function(){
	   return { fc: this._style._values.fillColor || this._project._currentStyle.fillColor, sc: this._style._values.strokeColor || this._project._currentStyle.strokeColor };
	},

	_draw_extra_bg: function(ctx, param, viewMatrix) {
		var item  = this._getClipItem(), bounds = item.bounds, color = this.fillColor || item.fillColor;
		if( !color ) return;
		ctx.fillStyle =  color.toCanvasStyle(ctx, viewMatrix);
		ctx.fillRect(bounds.x, bounds.y, bounds.width, bounds.height);
	},
	_getOwner: function() {
		return this._parent || this._index != null && this._project;
	},

	isInserted: function isInserted() {
		return this._parent ? isInserted.base.call(this) : this._index != null;
	},

	activate: function() {
		this._project._activeLayer = this;
	},

	_hitTestSelf: function() {
	}
});

  var ViewPort = Group.extend({
	_class: 'ViewPort',

	initialize: function ViewPort(params) {
		Group.apply(this, arguments);
		this._getClipItem();
		this._contentView = new Group();
		this.insertChild(1, this._contentView);
		this._setup_cover();
	},
	_getClipItem: function() {
		if(this._clipItem == undefined){
			if( this._children.length > 0 && this._children[0]._clipMask )
				this._clipItem = this._children[0];
			else {
				var item = new Path.Rectangle( this.clips );
				item.strokeColor = 'black';
				item.strokeWidth = 1;
				this.insertChild(0, item);
				this._clipItem = item;
				this._clipItem._clipMask = true;
				this._clipItem._matrix = new Matrix()
			}
		}
		return this._clipItem;
	},
	_setup_cover: function(){
		var clipItem = this._getClipItem(), sw = this.strokeWidth,  sb = this.getScrollPolicy();
		if( ! this._cover ){
			this._paddingObj = new Path.Rectangle( clipItem.bounds );
			this._paddingObj.remove();
			this._cover =  new Path.Rectangle( clipItem.bounds );
			this._cover.remove();
		}
		if( sw || !sb.startsWith('n') ) {
			this._cover._style = this._style.clone();
			this._cover.fillColor = !sb || sb.startsWith('n') ? 'rgba(0,0,0,0)' : 'rgba(123,123,123,0.01)';
			this._paddingObj.strokeWidth = this.padding;
			this._paddingObj.strokeColor = 'white';
			if( this._cover._parent == null ){
				this.addChild(this._paddingObj, true);
				this.addChild(this._cover, true);
			}
		} else {
			this._cover.strokeWidth = 0;
			this._paddingObj.strokeWidth = 0;
			this._cover.remove();
			this._paddingObj.remove();
		}

	},

	setScrollPolicy: function(s){
		this._scrollPolicy = s || 'n';
		this._setup_cover();
		var that = this, cover = that._cover;
		if( s ){
			cover.on('mousedown', that._scrollHandler.bind(that));
			cover.on('mousedrag', that._scrollHandler.bind(that));
		} else {
			cover.off('mousedown', that._scrollHandler.bind(that));
			cover.off('mousedrag', that._scrollHandler.bind(that));
		}
	},
	getScrollPolicy: function(){
		return this._scrollPolicy;
	},
	_scrollHandler: function(event){
		 var that = this, type = event.type, point = event.point, sp = that._scrollPolicy, diff = 0;
		 if( type == 'mousedown'){
			 that._prevPoint = point;
		 }
		 else if( type == 'mousedrag'){
			 diff = point.__subtract( that._prevPoint );
			 that._prevPoint = point;
			 that.scroll(diff.x, diff.y)
		}
	},
	scroll: function(xoffset, yoffset, duration){
		var that = this, sp = this._scrollPolicy, bs = that._cover.bounds,
			content = that.getContentView(), padding = Math.max(that.padding, that.strokeWidth||0),
			cbs = content.bounds, adj_xoffset, adj_yoffset;
		if( !cbs || sp.startsWith('n') ) return;
		var m_y_t = bs.y +padding - cbs.y,
			m_y_b = cbs.y + cbs.height - bs.y - bs.height + padding*2,
			m_x_l = bs.x + padding - cbs.x,
			m_x_r = cbs.x + cbs.width - bs.x - bs.width + padding*2;
		if( sp.startsWith('b') || sp.startsWith('v') ){
			if( yoffset > 0 && m_y_t > 0) {
				adj_yoffset = Math.min(yoffset, m_y_t);
			}
			if( yoffset < 0 && m_y_b > 0) {
				adj_yoffset = -Math.min(-yoffset, m_y_b);
			}
		}
		if( sp.startsWith('b') || sp.startsWith('h') ){
			if( xoffset > 0 && m_x_l > 0) {
				adj_xoffset = Math.min(xoffset, m_x_l);
			}
			if( xoffset < 0 && m_x_r > 0) {
				adj_xoffset = -Math.min(-xoffset, m_x_r);
			}
		}
		var npos = content.position.__add(new Point(adj_xoffset, adj_yoffset));
		if( duration ){
			anime({
				targets: content,
				position: npos,
				duration: duration
			})
		} else {
			content.position = npos;
		}
	},
	isEmpty: function(){
		return this._children.length < 2;
	},
	getContentView: function(){
		return this._contentView;
	},
	addToContentView: function(v){
		this._contentView.addChild(v);
	},
	centerIt: function(){
		var   clipview = this._getClipItem();
		this.setCameraPosition(clipview.position);
	},
	setCameraScale: function(scale, duration){
		var c = this.getContentView();
		if( duration ){
			 anime({
				 targets: c,
				 'bounds.size' : '*=[' + scale + ',' + scale + ']',
				 position : '+=[0,0]',
				 duration: duration
			 });
		} else {
			c.scale(scale);
		}
	},
	setCameraPosition: function(pos, duration){
		var c = this.getContentView();
		if( duration ){
			 anime({
				 targets: c,
				 position : pos,
				 duration: duration
			 });
		} else {
			c.position = pos;
		}
	},
});

var Shape = Item.extend({
	_class: 'Shape',
	_applyMatrix: false,
	_canApplyMatrix: false,
	_canScaleStroke: true,
	_serializeFields: {
		type: null,
		size: null,
		radius: null
	},

	initialize: function Shape(props, point) {
		this._initialize(props, point);
	},

	_equals: function(item) {
		return this._type === item._type
			&& this._size.equals(item._size)
			&& Base.equals(this._radius, item._radius);
	},

	copyContent: function(source) {
		this.setType(source._type);
		this.setSize(source._size);
		this.setRadius(source._radius);
	},

	getType: function() {
		return this._type;
	},

	setType: function(type) {
		this._type = type;
	},

	getShape: '#getType',
	setShape: '#setType',

	getSize: function() {
		var size = this._size;
		return new LinkedSize(size.width, size.height, this, 'setSize');
	},

	setSize: function() {
		var size = Size.read(arguments);
		if (!this._size) {
			this._size = size.clone();
		} else if (!this._size.equals(size)) {
			var type = this._type,
				width = size.width,
				height = size.height;
			if (type === 'rectangle') {
				this._radius.set(Size.min(this._radius, size.divide(2).abs()));
			} else if (type === 'circle') {
				width = height = (width + height) / 2;
				this._radius = width / 2;
			} else if (type === 'ellipse') {
				this._radius._set(width / 2, height / 2);
			}
			this._size._set(width, height);
			this._changed(9);
		}
	},

	getRadius: function() {
		var rad = this._radius;
		return this._type === 'circle'
				? rad
				: new LinkedSize(rad.width, rad.height, this, 'setRadius');
	},

	setRadius: function(radius) {
		var type = this._type;
		if (type === 'circle') {
			if (radius === this._radius)
				return;
			var size = radius * 2;
			this._radius = radius;
			this._size._set(size, size);
		} else {
			radius = Size.read(arguments);
			if (!this._radius) {
				this._radius = radius.clone();
			} else {
				if (this._radius.equals(radius))
					return;
				this._radius.set(radius);
				if (type === 'rectangle') {
					var size = Size.max(this._size, radius.multiply(2));
					this._size.set(size);
				} else if (type === 'ellipse') {
					this._size._set(radius.width * 2, radius.height * 2);
				}
			}
		}
		this._changed(9);
	},

	isEmpty: function() {
		return false;
	},

	toPath: function(insert) {
		var path = new Path[Base.capitalize(this._type)]({
			center: new Point(),
			size: this._size,
			radius: this._radius,
			insert: false
		});
		path.copyAttributes(this);
		if (mpaper.settings.applyMatrix)
			path.setApplyMatrix(true);
		if (insert === undefined || insert)
			path.insertAbove(this);
		return path;
	},

	toShape: '#clone',

	_asPathItem: function() {
		return this.toPath(false);
	},

	_draw: function(ctx, param, viewMatrix, strokeMatrix) {
		var style = this._style,
			hasFill = style.hasFill(),
			hasStroke = style.hasStroke(),
			dontPaint = param.dontFinish || param.clip,
			untransformed = !strokeMatrix;
		if (hasFill || hasStroke || dontPaint) {
			var type = this._type,
				radius = this._radius,
				isCircle = type === 'circle';
			if (!param.dontStart)
				ctx.beginPath();
			if (untransformed && isCircle) {
				ctx.arc(0, 0, radius, 0, Math.PI * 2, true);
			} else {
				var rx = isCircle ? radius : radius.width,
					ry = isCircle ? radius : radius.height,
					size = this._size,
					width = size.width,
					height = size.height;
				if (untransformed && type === 'rectangle' && rx === 0 && ry === 0) {
					ctx.rect(-width / 2, -height / 2, width, height);
				} else {
					var x = width / 2,
						y = height / 2,
						kappa = 1 - 0.5522847498307936,
						cx = rx * kappa,
						cy = ry * kappa,
						c = [
							-x, -y + ry,
							-x, -y + cy,
							-x + cx, -y,
							-x + rx, -y,
							x - rx, -y,
							x - cx, -y,
							x, -y + cy,
							x, -y + ry,
							x, y - ry,
							x, y - cy,
							x - cx, y,
							x - rx, y,
							-x + rx, y,
							-x + cx, y,
							-x, y - cy,
							-x, y - ry
						];
					if (strokeMatrix)
						strokeMatrix.transform(c, c, 32);
					ctx.moveTo(c[0], c[1]);
					ctx.bezierCurveTo(c[2], c[3], c[4], c[5], c[6], c[7]);
					if (x !== rx)
						ctx.lineTo(c[8], c[9]);
					ctx.bezierCurveTo(c[10], c[11], c[12], c[13], c[14], c[15]);
					if (y !== ry)
						ctx.lineTo(c[16], c[17]);
					ctx.bezierCurveTo(c[18], c[19], c[20], c[21], c[22], c[23]);
					if (x !== rx)
						ctx.lineTo(c[24], c[25]);
					ctx.bezierCurveTo(c[26], c[27], c[28], c[29], c[30], c[31]);
				}
			}
			ctx.closePath();
		}
		if (!dontPaint && (hasFill || hasStroke)) {
			this._setStyles(ctx, param, viewMatrix);
			if (hasFill) {
				ctx.fill(style.getFillRule());
				ctx.shadowColor = 'rgba(0,0,0,0)';
			}
			if (hasStroke)
				ctx.stroke();
		}
	},

	_canComposite: function() {
		return !(this.hasFill() && this.hasStroke());
	},

	_getBounds: function(matrix, options) {
		var rect = new Rectangle(this._size).setCenter(0, 0),
			style = this._style,
			strokeWidth = options.stroke && style.hasStroke()
					&& style.getStrokeWidth();
		if (matrix)
			rect = matrix._transformBounds(rect);
		return strokeWidth
				? rect.expand(Path._getStrokePadding(strokeWidth,
					this._getStrokeMatrix(matrix, options)))
				: rect;
	}
},
new function() {
	function getCornerCenter(that, point, expand) {
		var radius = that._radius;
		if (!radius.isZero()) {
			var halfSize = that._size.divide(2);
			for (var q = 1; q <= 4; q++) {
				var dir = new Point(q > 1 && q < 4 ? -1 : 1, q > 2 ? -1 : 1),
					corner = dir.multiply(halfSize),
					center = corner.subtract(dir.multiply(radius)),
					rect = new Rectangle(
							expand ? corner.add(dir.multiply(expand)) : corner,
							center);
				if (rect.contains(point))
					return { point: center, quadrant: q };
			}
		}
	}

	function isOnEllipseStroke(point, radius, padding, quadrant) {
		var vector = point.divide(radius);
		return (!quadrant || vector.isInQuadrant(quadrant)) &&
				vector.subtract(vector.normalize()).multiply(radius)
					.divide(padding).length <= 1;
	}

	return {
		_contains: function _contains(point) {
			if (this._type === 'rectangle') {
				var center = getCornerCenter(this, point);
				return center
						? point.subtract(center.point).divide(this._radius)
							.getLength() <= 1
						: _contains.base.call(this, point);
			} else {
				return point.divide(this.size).getLength() <= 0.5;
			}
		},

		_hitTestSelf: function _hitTestSelf(point, options, viewMatrix,
				strokeMatrix) {
			var hit = false,
				style = this._style,
				hitStroke = options.stroke && style.hasStroke(),
				hitFill = options.fill && style.hasFill();
			if (hitStroke || hitFill) {
				var type = this._type,
					radius = this._radius,
					strokeRadius = hitStroke ? style.getStrokeWidth() / 2 : 0,
					strokePadding = options._tolerancePadding.add(
						Path._getStrokePadding(strokeRadius,
							!style.getStrokeScaling() && strokeMatrix));
				if (type === 'rectangle') {
					var padding = strokePadding.multiply(2),
						center = getCornerCenter(this, point, padding);
					if (center) {
						hit = isOnEllipseStroke(point.subtract(center.point),
								radius, strokePadding, center.quadrant);
					} else {
						var rect = new Rectangle(this._size).setCenter(0, 0),
							outer = rect.expand(padding),
							inner = rect.expand(padding.negate());
						hit = outer._containsPoint(point)
								&& !inner._containsPoint(point);
					}
				} else {
					hit = isOnEllipseStroke(point, radius, strokePadding);
				}
			}
			return hit ? new HitResult(hitStroke ? 'stroke' : 'fill', this)
					: _hitTestSelf.base.apply(this, arguments);
		}
	};
}, {

statics: new function() {
	function createShape(type, point, size, radius, args) {
		var item = Base.create(Shape.prototype);
		item._type = type;
		item._size = size;
		item._radius = radius;
		item._initialize(Base.getNamed(args), point);
		return item;
	}

	return {
		Circle: function() {
			var args = arguments,
				center = Point.readNamed(args, 'center'),
				radius = Base.readNamed(args, 'radius');
			return createShape('circle', center, new Size(radius * 2), radius,
					args);
		},

		Rectangle: function() {
			var args = arguments,
				rect = Rectangle.readNamed(args, 'rectangle'),
				radius = Size.min(Size.readNamed(args, 'radius'),
						rect.getSize(true).divide(2));
			return createShape('rectangle', rect.getCenter(true),
					rect.getSize(true), radius, args);
		},

		Ellipse: function() {
			var args = arguments,
				ellipse = Shape._readEllipse(args),
				radius = ellipse.radius;
			return createShape('ellipse', ellipse.center, radius.multiply(2),
					radius, args);
		},

		_readEllipse: function(args) {
			var center,
				radius;
			if (Base.hasNamed(args, 'radius')) {
				center = Point.readNamed(args, 'center');
				radius = Size.readNamed(args, 'radius');
			} else {
				var rect = Rectangle.readNamed(args, 'rectangle');
				center = rect.getCenter(true);
				radius = rect.getSize(true).divide(2);
			}
			return { center: center, radius: radius };
		}
	};
}});

var Raster = Item.extend({
	_class: 'Raster',
	_applyMatrix: false,
	_canApplyMatrix: false,
	_boundsOptions: { stroke: false, handle: false },
	_serializeFields: {
		crossOrigin: null,
		source: null
	},
	_prioritize: ['crossOrigin'],
	_smoothing: 'low',
	beans: true,

	initialize: function Raster(source, position) {
		if (!this._initialize(source,
				position !== undefined && Point.read(arguments))) {
			var image,
				type = typeof source,
				object = type === 'string'
					? document.getElementById(source)
					: type  === 'object'
						? source
						: null;
			if (object && object !== Item.NO_INSERT) {
				if (object.getContext || object.naturalHeight != null) {
					image = object;
				} else if (object) {
					var size = Size.read(arguments);
					if (!size.isZero()) {
						image = CanvasProvider.getCanvas(size);
					}
				}
			}
			if (image) {
				this.setImage(image);
			} else {
				this.setSource(source);
			}
		}
		if (!this._size) {
			this._size = new Size();
			this._loaded = false;
		}
	},

	_equals: function(item) {
		return this.getSource() === item.getSource();
	},

	copyContent: function(source) {
		var image = source._image,
			canvas = source._canvas;
		if (image) {
			this._setImage(image);
		} else if (canvas) {
			var copyCanvas = CanvasProvider.getCanvas(source._size);
			copyCanvas.getContext('2d').drawImage(canvas, 0, 0);
			this._setImage(copyCanvas);
		}
		this._crossOrigin = source._crossOrigin;
	},

	getSize: function() {
		var size = this._size;
		return new LinkedSize(size ? size.width : 0, size ? size.height : 0,
				this, 'setSize');
	},

	setSize: function(_size, _clear) {
		var size = Size.read(arguments);
		if (!size.equals(this._size)) {
			if (size.width > 0 && size.height > 0) {
				var element = !_clear && this.getElement();
				this._setImage(CanvasProvider.getCanvas(size));
				if (element) {
					this.getContext(true).drawImage(element, 0, 0,
							size.width, size.height);
				}
			} else {
				if (this._canvas)
					CanvasProvider.release(this._canvas);
				this._size = size.clone();
			}
		} else if (_clear) {
			this.clear();
		}
	},

	getWidth: function() {
		return this._size ? this._size.width : 0;
	},

	setWidth: function(width) {
		this.setSize(width, this.getHeight());
	},

	getHeight: function() {
		return this._size ? this._size.height : 0;
	},

	setHeight: function(height) {
		this.setSize(this.getWidth(), height);
	},

	getLoaded: function() {
		return this._loaded;
	},

	isEmpty: function() {
		var size = this._size;
		return !size || size.width === 0 && size.height === 0;
	},

	getResolution: function() {
		var matrix = this._matrix,
			orig = new Point(0, 0).transform(matrix),
			u = new Point(1, 0).transform(matrix).subtract(orig),
			v = new Point(0, 1).transform(matrix).subtract(orig);
		return new Size(
			72 / u.getLength(),
			72 / v.getLength()
		);
	},

	getPpi: '#getResolution',

	getImage: function() {
		return this._image;
	},

	setImage: function(image) {
		var that = this;

		function emit(event) {
			var view = that.getView(),
				type = event && event.type || 'load';
			if (view && that.responds(type)) {
				mpaper = view._scope;
				that.emit(type, new Event(event));
			}
		}

		this._setImage(image);
		if (this._loaded) {
			setTimeout(emit, 0);
		} else if (image) {
			DomEvent.add(image, {
				load: function(event) {
					that._setImage(image);
					emit(event);
				},
				error: emit
			});
		}
	},

	_setImage: function(image) {
		if (this._canvas)
			CanvasProvider.release(this._canvas);
		if (image && image.getContext) {
			this._image = null;
			this._canvas = image;
			this._loaded = true;
		} else {
			this._image = image;
			this._canvas = null;
			this._loaded = !!(image && image.src && image.complete);
		}
		this._size = new Size(
				image ? image.naturalWidth || image.width : 0,
				image ? image.naturalHeight || image.height : 0);
		this._context = null;
		this._changed(1033);
	},

	getCanvas: function() {
		if (!this._canvas) {
			var ctx = CanvasProvider.getContext(this._size);
			try {
				if (this._image)
					ctx.drawImage(this._image, 0, 0);
				this._canvas = ctx.canvas;
			} catch (e) {
				CanvasProvider.release(ctx);
			}
		}
		return this._canvas;
	},

	setCanvas: '#setImage',

	getContext: function(_change) {
		if (!this._context)
			this._context = this.getCanvas().getContext('2d');
		if (_change) {
			this._image = null;
			this._changed(1025);
		}
		return this._context;
	},

	setContext: function(context) {
		this._context = context;
	},

	getSource: function() {
		var image = this._image;
		return image && image.src || this.toDataURL();
	},

	setSource: function(src) {
		var image = new self.Image(),
			crossOrigin = this._crossOrigin;
		if (crossOrigin)
			image.crossOrigin = crossOrigin;
		if (src)
			image.src = src;
		this.setImage(image);
	},

	getCrossOrigin: function() {
		var image = this._image;
		return image && image.crossOrigin || this._crossOrigin || '';
	},

	setCrossOrigin: function(crossOrigin) {
		this._crossOrigin = crossOrigin;
		var image = this._image;
		if (image)
			image.crossOrigin = crossOrigin;
	},

	getSmoothing: function() {
		return this._smoothing;
	},

	setSmoothing: function(smoothing) {
		this._smoothing = typeof smoothing === 'string'
			? smoothing
			: smoothing ? 'low' : 'off';
		this._changed(257);
	},

	getElement: function() {
		return this._canvas || this._loaded && this._image;
	}
}, {
	beans: false,

	getSubCanvas: function() {
		var rect = Rectangle.read(arguments),
			ctx = CanvasProvider.getContext(rect.getSize());
		ctx.drawImage(this.getCanvas(), rect.x, rect.y,
				rect.width, rect.height, 0, 0, rect.width, rect.height);
		return ctx.canvas;
	},

	getSubRaster: function() {
		var rect = Rectangle.read(arguments),
			raster = new Raster(Item.NO_INSERT);
		raster._setImage(this.getSubCanvas(rect));
		raster.translate(rect.getCenter().subtract(this.getSize().divide(2)));
		raster._matrix.prepend(this._matrix);
		raster.insertAbove(this);
		return raster;
	},

	toDataURL: function() {
		var image = this._image,
			src = image && image.src;
		if (/^data:/.test(src))
			return src;
		var canvas = this.getCanvas();
		return canvas ? canvas.toDataURL.apply(canvas, arguments) : null;
	},

	drawImage: function(image ) {
		var point = Point.read(arguments, 1);
		this.getContext(true).drawImage(image, point.x, point.y);
	},

	getAverageColor: function(object) {
		var bounds, path;
		if (!object) {
			bounds = this.getBounds();
		} else if (object instanceof PathItem) {
			path = object;
			bounds = object.getBounds();
		} else if (typeof object === 'object') {
			if ('width' in object) {
				bounds = new Rectangle(object);
			} else if ('x' in object) {
				bounds = new Rectangle(object.x - 0.5, object.y - 0.5, 1, 1);
			}
		}
		if (!bounds)
			return null;
		var sampleSize = 32,
			width = Math.min(bounds.width, sampleSize),
			height = Math.min(bounds.height, sampleSize);
		var ctx = Raster._sampleContext;
		if (!ctx) {
			ctx = Raster._sampleContext = CanvasProvider.getContext(
					new Size(sampleSize));
		} else {
			ctx.clearRect(0, 0, sampleSize + 1, sampleSize + 1);
		}
		ctx.save();
		var matrix = new Matrix()
				.scale(width / bounds.width, height / bounds.height)
				.translate(-bounds.x, -bounds.y);
		matrix.applyToContext(ctx);
		if (path)
			path.draw(ctx, new Base({ clip: true, matrices: [matrix] }));
		this._matrix.applyToContext(ctx);
		var element = this.getElement(),
			size = this._size;
		if (element)
			ctx.drawImage(element, -size.width / 2, -size.height / 2);
		ctx.restore();
		var pixels = ctx.getImageData(0.5, 0.5, Math.ceil(width),
				Math.ceil(height)).data,
			channels = [0, 0, 0],
			total = 0;
		for (var i = 0, l = pixels.length; i < l; i += 4) {
			var alpha = pixels[i + 3];
			total += alpha;
			alpha /= 255;
			channels[0] += pixels[i] * alpha;
			channels[1] += pixels[i + 1] * alpha;
			channels[2] += pixels[i + 2] * alpha;
		}
		for (var i = 0; i < 3; i++)
			channels[i] /= total;
		return total ? Color.read(channels) : null;
	},

	getPixel: function() {
		var point = Point.read(arguments);
		var data = this.getContext().getImageData(point.x, point.y, 1, 1).data;
		return new Color('rgb', [data[0] / 255, data[1] / 255, data[2] / 255],
				data[3] / 255);
	},

	setPixel: function() {
		var args = arguments,
			point = Point.read(args),
			color = Color.read(args),
			components = color._convert('rgb'),
			alpha = color._alpha,
			ctx = this.getContext(true),
			imageData = ctx.createImageData(1, 1),
			data = imageData.data;
		data[0] = components[0] * 255;
		data[1] = components[1] * 255;
		data[2] = components[2] * 255;
		data[3] = alpha != null ? alpha * 255 : 255;
		ctx.putImageData(imageData, point.x, point.y);
	},

	setPixeles: function(x, y , width, height, color  ) {
		var    components = color._convert('rgb'),
			alpha = color._alpha,
			r = components[0] * 255,
			g = components[1] * 255,
			b = components[2] * 255,
			a =  alpha != null ? alpha * 255 : 255,
			ctx = this.getContext(true),
			imageData = ctx.createImageData( width,  height),
			data = imageData.data;
		for (var i=0;i<data.length;i+=4)
		{
			data[i+0]=r;
			data[i+1]=g;
			data[i+2]=b;
			data[i+3]=a;
		}
		ctx.putImageData(imageData,  x,  y);
	},
	clear: function() {
		var size = this._size;
		this.getContext(true).clearRect(0, 0, size.width + 1, size.height + 1);
	},

	createImageData: function() {
		var size = Size.read(arguments);
		return this.getContext().createImageData(size.width, size.height);
	},

	getImageData: function() {
		var rect = Rectangle.read(arguments);
		if (rect.isEmpty())
			rect = new Rectangle(this._size);
		return this.getContext().getImageData(rect.x, rect.y,
				rect.width, rect.height);
	},

	putImageData: function(data ) {
		var point = Point.read(arguments, 1);
		this.getContext(true).putImageData(data, point.x, point.y);
	},

	setImageData: function(data) {
		this.setSize(data);
		this.getContext(true).putImageData(data, 0, 0);
	},

	_getBounds: function(matrix, options) {
		var rect = new Rectangle(this._size).setCenter(0, 0);
		return matrix ? matrix._transformBounds(rect) : rect;
	},

	_hitTestSelf: function(point) {
		if (this._contains(point)) {
			var that = this;
			return new HitResult('pixel', that, {
				offset: point.add(that._size.divide(2)).round(),
				color: {
					get: function() {
						return that.getPixel(this.offset);
					}
				}
			});
		}
	},

	_draw: function(ctx, param, viewMatrix) {
		if( this._raster ){
			this._raster.position = this.position;
			this._raster._style = this.getStyle();
			this._raster._draw(ctx, param, viewMatrix);
			return;
		}
		var element = this.getElement();
		if (element && element.width > 0 && element.height > 0) {
			ctx.globalAlpha = Numerical.clamp(this._opacity, 0, 1);

			this._setStyles(ctx, param, viewMatrix);

			var smoothing = this._smoothing,
				disabled = smoothing === 'off';
			DomElement.setPrefixed(
				ctx,
				disabled ? 'imageSmoothingEnabled' : 'imageSmoothingQuality',
				disabled ? false : smoothing
			);

			ctx.drawImage(element,
					-this._size.width / 2, -this._size.height / 2);
		}
	},

	morphingTo: function(timeline, target, duration, offset, finishCallback, precise){
		var that = this,  curc, tc  ;
		var width = Math.min(that.getWidth(), target.getWidth()),
		   height = Math.min(that.getHeight(), target.getHeight()), w, h;
		that._raster = null;
		target.visible = false;
		that._raster = new Raster(new Size(width, height), this.position);
		precise = precise || 'l';
		if( precise === 'm' ) {
			w = width > 500 ? 100 : (width > 100 ? Math.ceil(width/5) : ( width > 48 ? Math.ceil(width/2) : width));
			h = height > 500 ? 100 : (height > 100 ? Math.ceil(height/5) : ( height > 48 ? Math.ceil(height/2) : height));
		} else {
			w = width > 500 ? 30 : (width > 100 ? Math.ceil(width/20) : ( width > 48 ? Math.ceil(width/4) : width));
			h = height > 500 ? 30 : (height > 100 ? Math.ceil(height/20) : ( height > 48 ? Math.ceil(height/4) : height));
		}
		var size = new Size(w, h);
		var fb = this.bounds.clone(), tb = target.bounds.clone() , started = false;
		 that.visible = false;
		 that.size = size;
		 target.size = size;
	   var options = {
			target : this,
			progressFunc : function( progress){
				if(!started ) {
					started = true;
					that._raster.addToViewIfNot();
				}
				that._raster.bounds = fb.morphingTo(tb, progress);
				var adj = ( w == width && h == height) ? 0 : 1;
				for (var i = 0; i < size.width; i++) {
					for (var j = 0; j < size.height; j++) {
						curc = that.getPixel(i,j);
						tc = target.getPixel(i,j);
						tc = curc.morphingTo(tc, progress);
							var colSize = that._raster.size .__divide( size );
							var cw = colSize.width, ch = colSize.height;
							var pos = new Point(i, j) .__multiply(colSize) ;
							 that._raster.setPixeles( pos.x - cw/2, pos.y - ch/2, cw+adj, ch+adj , tc)
					 }
				}
			}.bind(that),
			duration :  duration,
			complete: function(){
				that._raster.remove();
				that._raster = null;
				that.bounds = fb;
				target.bounds = tb;
				if( finishCallback ){
					finishCallback();
				}
				else {
					that.remove();
					that.visible = false;
					target.visible = true;
					target._changed(41);
				}
			}.bind(this)
		};
		if( timeline )  timeline.add( options, offset);
		else anime(options);
	},

	_canComposite: function() {
		return true;
	}
});

var CroppedImage = Item.extend({
	_class: 'CroppedImage',
	_applyMatrix: false,
	_canApplyMatrix: false,

	initialize: function CroppedImage(raster, cropX, cropY, cropWidth, cropHeight) {
		this._initialize(raster, cropX, cropY, cropWidth, cropHeight)  ;
		this.raster = raster;
		this.cropX = cropX;
		this.cropY = cropY;
		this.cropWidth = cropWidth;
		this.cropHeight = cropHeight;
		this._size = new Size(cropWidth, cropHeight);
		this.position = raster.position.__subtract(new Point(raster.getSize().divide(2))).__add(
			new Rectangle(cropX, cropY, cropWidth, cropHeight).getCenter()
		 );
	},

	 getWidth: function() {
		return this._size ? this._size.width : 0;
	},

	setWidth: function(width) {
		this.setSize(width, this.getHeight());
	},

	getHeight: function() {
		return this._size ? this._size.height : 0;
	},

	setHeight: function(height) {
		this.setSize(this.getWidth(), height);
	},
	_getBounds: function(matrix, options) {
		var rect = new Rectangle(this._size).setCenter(0, 0);
		return matrix ? matrix._transformBounds(rect) : rect;
	},
	_draw: function(ctx, param, viewMatrix) {
		var element = this.raster.getElement(), cropX = this.cropX, cropY = this.cropY,
		cropWidth = this.cropWidth, cropHeight = this.cropHeight, size = this._size;
		if (element && element.width > 0 && element.height > 0) {
			ctx.globalAlpha = Numerical.clamp(this._opacity, 0, 1);
			ctx.drawImage(element, cropX, cropY, cropWidth, cropHeight,
					-size.width / 2, -size.height / 2, size.width, size.height);
		}
	}
})

var Sprite = Item.extend({
	_class: 'Sprite',
	_applyMatrix: false,
	_canApplyMatrix: false,
	_boundsOptions: { stroke: false, handle: false },
	_serializeFields: {
		crossOrigin: null,
		source: null,
		frameIndex: 0,
		frameRate: 0,
		animation: null,
		animations:null,
	},
	_prioritize: ['crossOrigin'],
	_smoothing: 'low',
	beans: true,

	initialize: function Sprite(image, position, animation, animations,  frameRate, frameIndex) {
		this._animation = null;
		this._animations = null;
		this._frameIndex = 0;
		this._frameRate = 0;
		this.running = 0;
		this.lastAniTime = 0;
		this._initialize(image, position, animation, animations, frameRate, frameIndex)
		if (!this._size) {
			var anim = this.getAnimation(),
			index = this.getFrameIndex(),
			ix4 = index * 4,
			set = this.getAnimations()[anim],
			width =  set[ix4 + 2],
			height = set[ix4 + 3];
			this._size = new Size({width:width, height:height});
			this._loaded = true;
		}
		this.on('frame', this._onFrame.bind(this));
		this.start();
	},
	_copyExtraAttr: function(source, excludeMatrix){
	   this. _frameIndex = source._frameIndex;
	   this. _frameRate = source._frameRate;
	   this. _animation = source._animation;
	   this. _animations = source._animations;
	   this._size = source._size;
	   this._loaded = source._loaded;
	   this.running = source.running;
	   this.lastAniTime = source.lastAniTime;
	},

	_updateIndex: function() {
		var index = this.getFrameIndex(),
			animation = this.getAnimation(),
			animations = this.getAnimations(),
			anim = animations[animation],
			len = anim.length / 4,
			punch = this._isPunch;

		if(index < len - 1) {
			this.setFrameIndex(index + 1);
		}
		else {
			if( punch ){
				if( this._animation_prev ){
					this._animation = this._animation_prev;
					this._frameIndex = this._frameIndex_prev;
				}
				this._isPunch = false;
			} else {
				this.setFrameIndex(0);
			}
		}
	},
	start: function() {
	   this.running = true
	},
	stop: function() {
		this.running = false
	},
	_onFrame: function(event){
		var that = this;
		if( !that.running  ) return;
		if( 1.0 / this.getFrameRate() <= event.time - this.lastAniTime ){
			 this.lastAniTime = event.time
			 this._updateIndex();
			this._changed(1033);
		}
	},
	getFrameIndex: function(){
		return this._frameIndex;
	},
	setFrameIndex: function(frameIndex){
		this._frameIndex = frameIndex;
	},
	getFrameRate: function(){
		return this._frameRate;
	},
	setFrameRate: function(frameRate){
		this._frameRate = frameRate;
	},
	getAnimation: function(){
		return this._animation;
	},
	setAnimation: function(animation, isPunch){
		this._isPunch = isPunch || false;
		if( this._isPunch ){
			this._animation_prev = this._animation;
			this._frameIndex_prev = this._frameIndex;
		}
		this._animation = animation;
		this._frameIndex = 0;
	},
	getAnimations: function(){
		return this._animations;
	},
	setAnimations: function(animations){
		this._animations = animations;
	},
	_equals: function(item) {
		return this.getSource() === item.getSource();
	},

	copyContent: function(source) {
		var image = source._image,
			canvas = source._canvas;
		if (image) {
			this._setImage(image);
		} else if (canvas) {
			var copyCanvas = CanvasProvider.getCanvas(source._size);
			copyCanvas.getContext('2d').drawImage(canvas, 0, 0);
			this._setImage(copyCanvas);
		}
		this._crossOrigin = source._crossOrigin;
	},

	getSize: function() {
		var size = this._size;
		return new LinkedSize(size ? size.width : 0, size ? size.height : 0,
				this, 'setSize');
	},

	setSize: function(_size, _clear) {
		var size = Size.read(arguments);
		if (!size.equals(this._size)) {
			if (size.width > 0 && size.height > 0) {
				var element = !_clear && this.getElement();
				this._setImage(CanvasProvider.getCanvas(size));
				if (element) {
					this.getContext(true).drawImage(element, 0, 0,
							size.width, size.height);
				}
			} else {
				if (this._canvas)
					CanvasProvider.release(this._canvas);
				this._size = size.clone();
			}
		} else if (_clear) {
			this.clear();
		}
	},

	getWidth: function() {
		return this._size ? this._size.width : 0;
	},

	setWidth: function(width) {
		this.setSize(width, this.getHeight());
	},

	getHeight: function() {
		return this._size ? this._size.height : 0;
	},

	setHeight: function(height) {
		this.setSize(this.getWidth(), height);
	},

	getLoaded: function() {
		return this._loaded;
	},

	isEmpty: function() {
		var size = this._size;
		return !size || size.width === 0 && size.height === 0;
	},

	getResolution: function() {
		var matrix = this._matrix,
			orig = new Point(0, 0).transform(matrix),
			u = new Point(1, 0).transform(matrix).subtract(orig),
			v = new Point(0, 1).transform(matrix).subtract(orig);
		return new Size(
			72 / u.getLength(),
			72 / v.getLength()
		);
	},

	getPpi: '#getResolution',

	getImage: function() {
		return this._image;
	},

	setImage: function(image) {
		var that = this;

		function emit(event) {
			var view = that.getView(),
				type = event && event.type || 'load';
			if (view && that.responds(type)) {
				mpaper = view._scope;
				that.emit(type, new Event(event));
			}
		}

		this._setImage(image);
		if (this._loaded) {
			setTimeout(emit, 0);
		} else if (image) {
			DomEvent.add(image, {
				load: function(event) {
					that._setImage(image);
					emit(event);
				},
				error: emit
			});
		}
	},

	_setImage: function(image) {
		if (this._canvas)
			CanvasProvider.release(this._canvas);
		if (image && image.getContext) {
			this._image = null;
			this._canvas = image;
			this._loaded = true;
		} else {
			this._image = image;
			this._canvas = null;
			this._loaded = !!(image && image.src && image.complete);
		}
		this._context = null;
		this._changed(1033);
	},

	getCanvas: function() {
		if (!this._canvas) {
			var ctx = CanvasProvider.getContext(this._size);
			try {
				if (this._image)
					ctx.drawImage(this._image, 0, 0);
				this._canvas = ctx.canvas;
			} catch (e) {
				CanvasProvider.release(ctx);
			}
		}
		return this._canvas;
	},

	setCanvas: '#setImage',

	getContext: function(_change) {
		if (!this._context)
			this._context = this.getCanvas().getContext('2d');
		if (_change) {
			this._image = null;
			this._changed(1025);
		}
		return this._context;
	},

	setContext: function(context) {
		this._context = context;
	},

	getSource: function() {
		var image = this._image;
		return image && image.src || this.toDataURL();
	},

	setSource: function(src) {
		var image = new self.Image(),
			crossOrigin = this._crossOrigin;
		if (crossOrigin)
			image.crossOrigin = crossOrigin;
		if (src)
			image.src = src;
		this.setImage(image);
	},

	getCrossOrigin: function() {
		var image = this._image;
		return image && image.crossOrigin || this._crossOrigin || '';
	},

	setCrossOrigin: function(crossOrigin) {
		this._crossOrigin = crossOrigin;
		var image = this._image;
		if (image)
			image.crossOrigin = crossOrigin;
	},

	getSmoothing: function() {
		return this._smoothing;
	},

	setSmoothing: function(smoothing) {
		this._smoothing = typeof smoothing === 'string'
			? smoothing
			: smoothing ? 'low' : 'off';
		this._changed(257);
	},

	getElement: function() {
		return this._canvas || this._loaded && this._image;
	}
}, {
	beans: false,

	getSubCanvas: function() {
		var rect = Rectangle.read(arguments),
			ctx = CanvasProvider.getContext(rect.getSize());
		ctx.drawImage(this.getCanvas(), rect.x, rect.y,
				rect.width, rect.height, 0, 0, rect.width, rect.height);
		return ctx.canvas;
	},

	getSubRaster: function() {
		var rect = Rectangle.read(arguments),
			raster = new Sprite(Item.NO_INSERT);
		raster._setImage(this.getSubCanvas(rect));
		raster.translate(rect.getCenter().subtract(this.getSize().divide(2)));
		raster._matrix.prepend(this._matrix);
		raster.insertAbove(this);
		return raster;
	},

	toDataURL: function() {
		var image = this._image,
			src = image && image.src;
		if (/^data:/.test(src))
			return src;
		var canvas = this.getCanvas();
		return canvas ? canvas.toDataURL.apply(canvas, arguments) : null;
	},

	drawImage: function(image ) {
		var point = Point.read(arguments, 1);
		this.getContext(true).drawImage(image, point.x, point.y);
	},
	getPixel: function() {
		var point = Point.read(arguments);
		var data = this.getContext().getImageData(point.x, point.y, 1, 1).data;
		return new Color('rgb', [data[0] / 255, data[1] / 255, data[2] / 255],
				data[3] / 255);
	},

	setPixel: function() {
		var args = arguments,
			point = Point.read(args),
			color = Color.read(args),
			components = color._convert('rgb'),
			alpha = color._alpha,
			ctx = this.getContext(true),
			imageData = ctx.createImageData(1, 1),
			data = imageData.data;
		data[0] = components[0] * 255;
		data[1] = components[1] * 255;
		data[2] = components[2] * 255;
		data[3] = alpha != null ? alpha * 255 : 255;
		ctx.putImageData(imageData, point.x, point.y);
	},

	clear: function() {
		var size = this._size;
		this.getContext(true).clearRect(0, 0, size.width + 1, size.height + 1);
	},

	createImageData: function() {
		var size = Size.read(arguments);
		return this.getContext().createImageData(size.width, size.height);
	},

	getImageData: function() {
		var rect = Rectangle.read(arguments);
		if (rect.isEmpty())
			rect = new Rectangle(this._size);
		return this.getContext().getImageData(rect.x, rect.y,
				rect.width, rect.height);
	},

	putImageData: function(data ) {
		var point = Point.read(arguments, 1);
		this.getContext(true).putImageData(data, point.x, point.y);
	},

	setImageData: function(data) {
		this.setSize(data);
		this.getContext(true).putImageData(data, 0, 0);
	},

	_getBounds: function(matrix, options) {
		var rect = new Rectangle(this._size).setCenter(0, 0);
		return matrix ? matrix._transformBounds(rect) : rect;
	},

	_hitTestSelf: function(point) {
		if (this._contains(point)) {
			var that = this;
			return new HitResult('pixel', that, {
				offset: point.add(that._size.divide(2)).round(),
				color: {
					get: function() {
						return that.getPixel(this.offset);
					}
				}
			});
		}
	},

	_draw: function(ctx, param, viewMatrix) {
		var element = this.getElement();
		if (element && element.width > 0 && element.height > 0) {
			ctx.globalAlpha = Numerical.clamp(this._opacity, 0, 1);

			this._setStyles(ctx, param, viewMatrix);

			var smoothing = this._smoothing,
				disabled = smoothing === 'off';
			DomElement.setPrefixed(
				ctx,
				disabled ? 'imageSmoothingEnabled' : 'imageSmoothingQuality',
				disabled ? false : smoothing
			);
			var anim = this.getAnimation(),
			index = this.getFrameIndex(),
			ix4 = index * 4,
			set = this.getAnimations()[anim],
			x =      set[ix4 + 0],
			y =      set[ix4 + 1],
			width =  set[ix4 + 2],
			height = set[ix4 + 3];
			ctx.translate(  -this._size.width / 2, -this._size.height / 2 );
			ctx.drawImage(element,  x, y, width, height, 0, 0, width, height );
			ctx.translate(   this._size.width / 2,  this._size.height / 2 );
		}
	},

	_canComposite: function() {
		return true;
	}
});

var SpriteSVG = Item.extend({
	_class: 'SpriteSVG',
	_applyMatrix: false,
	_canApplyMatrix: false,
	_boundsOptions: { stroke: false, handle: false },
	_serializeFields: {
		animation: null,
		animations:null,
		_state: null,
		_states:null,
	},
	beans: true,

	initialize: function SpriteSVG(position,  state, states, animation, animations ) {
		this._animation = null;
		this._animations = null;
		this._state= null;
		this._states=null;
		this._cursvg=null;
		this. yoyoState=true,
		this.running = 0;
		this.lastAniTime = 0;
		this.startAniTime = 0;
		this._initialize(position,  state, states, animation, animations ) ;
		var anim = this.getAnimation(), state = this.getState();
		if( anim ){
		   this.setAnimation(anim);
		} else {
		   this.setState(state);
		}
		this._size = this._cursvg._size;
		this.on('frame', this._onFrame.bind(this))
		this.start()
	},

	_copyExtraAttr: function(source, excludeMatrix){
		this. _state = source._state;
		this. _states = source._states;
		this. _cursvg = source._cursvg;
		this. yoyoState = source.yoyoState;
		this. running = source.running;
		this. lastAniTime = source.lastAniTime;
		this. _animation = source._animation;
		this. _animations = source._animations;
		this._size = source._size;
		this._loaded = source._loaded;
	 },

	_draw: function(ctx, param, viewMatrix) {
		if( this._cursvg == null )
			return;
		this._setStyles(ctx, param, viewMatrix);
		this._cursvg.position = this.position;
		this._cursvg._style = this._style;
		this._cursvg._draw(ctx, param, viewMatrix);
	},

	start: function() {
	   this.running = true;
	},
	stop: function() {
		this.running = false;
	},
	_onFrame: function(event){
		var that = this;
		if( !that.running  ) return;
		var anim = that.getAnimation(),  animsetting = that.getAnimations()[anim];
		if( !anim ) return;
		var fromdata = that.getStates()[animsetting.fromdata].adjusted;
		var todata = that.getStates()[animsetting.todata].adjusted;
		if( that.startAniTime == 0 || event.time - that.startAniTime < animsetting.morphtime ){
			var f = new Path(fromdata, Item.NO_INSERT);
			var t = new Path(todata, Item.NO_INSERT);
			if( that.startAniTime == 0 )
				that.startAniTime = event.time;
			var progress =  ( event.time - that.startAniTime ) /  animsetting.morphtime ;
			that._cursvg.resetPathData("");
			if( that.yoyoState )
				that._cursvg .interpolate(f,t,progress);
			else
				that._cursvg .interpolate(t,f,progress);
			f.remove();
			t.remove();
		} else {
			todata = that.yoyoState ? that.getStates()[animsetting.todata].data
			: that.getStates()[animsetting.fromdata].data;
			that._cursvg.resetPathData(todata);

			if( animsetting.yoyo ){
				that.yoyoState = !that.yoyoState;
				that.startAniTime = 0;
			} else {
				that.stop();
				that._reset( );
			}
		}
		that._changed(1033);
	},

	_reset:function(){
		this.lastAniTime = 0;
		this.yoyoState = true;
	},
	getAnimation: function(){
		return this._animation;
	},
	setAnimation: function(animation){
		this.stop();
		this._animation = animation;
		if( this.getAnimations() == null )
			return;
		this._state = null;
		this._reset() ;
		this.start();
		var anim = this.getAnimation(),  animsetting = this.getAnimations()[anim];
		var data = this.getStates()[animsetting.fromdata].data;
	   if(  this._cursvg == null ){
		   this._cursvg = new Path(data, Item.NO_INSERT);
		   this._cursvg.visible = false;
	   } else {
			this._cursvg.resetPathData(data);
	   }
	},
	getAnimations: function(){
		return this._animations;
	},
	setAnimations: function(animations){
		this._animations = animations;
	},

	getState: function(){
		return this._state;
	},
	setState: function(state){
		this._state = state;
		if( this.getStates() == null )
			return ;

		this.stop();
		this._reset();
		this._animation = null;
		var data = this.getStates()[state].data;
	   if(  this._cursvg == null ){
			this._cursvg = new Path(data, Item.NO_INSERT);
			this._cursvg.visible = false;
		} else {
			this._cursvg.resetPathData(data);
		}

		this._changed(1033);
	},
	getStates: function(){
		return this._states;
	},
	setStates: function(states){
		this._states = states;
	},

	_equals: function(item) {
		return this._animations === item._animations
		   && this._states === item._states
		   && this._size.equals(item._size) ;
	},

	copyContent: function(source) {
	},

	isEmpty: function() {
		return false;
	}

});

var SymbolItem = Item.extend({
	_class: 'SymbolItem',
	_applyMatrix: false,
	_canApplyMatrix: false,
	_boundsOptions: { stroke: true },
	_serializeFields: {
		symbol: null
	},

	initialize: function SymbolItem(arg0, arg1) {
		if (!this._initialize(arg0,
				arg1 !== undefined && Point.read(arguments, 1)))
			this.setDefinition(arg0 instanceof SymbolDefinition ?
					arg0 : new SymbolDefinition(arg0));
	},

	_equals: function(item) {
		return this._definition === item._definition;
	},

	copyContent: function(source) {
		this.setDefinition(source._definition);
	},

	getDefinition: function() {
		return this._definition;
	},

	setDefinition: function(definition) {
		this._definition = definition;
		this._changed(9);
	},

	getSymbol: '#getDefinition',
	setSymbol: '#setDefinition',

	isEmpty: function() {
		return this._definition._item.isEmpty();
	},

	_getBounds: function(matrix, options) {
		var item = this._definition._item;
		return item._getCachedBounds(item._matrix.prepended(matrix), options);
	},

	_hitTestSelf: function(point, options, viewMatrix) {
		var opts = options.extend({ all: false });
		var res = this._definition._item._hitTest(point, opts, viewMatrix);
		if (res)
			res.item = this;
		return res;
	},

	_draw: function(ctx, param) {
		this._definition._item.draw(ctx, param);
	}

});

var SymbolDefinition = Base.extend({
	_class: 'SymbolDefinition',

	initialize: function SymbolDefinition(item, dontCenter) {
		this._id = UID.get();
		this.project = mpaper.project;
		if (item)
			this.setItem(item, dontCenter);
	},

	_serialize: function(options, dictionary) {
		return dictionary.add(this, function() {
			return Base.serialize([this._class, this._item],
					options, false, dictionary);
		});
	},

	_changed: function(flags) {
		if (flags & 8)
			Item._clearBoundsCache(this);
		if (flags & 1)
			this.project._changed(flags);
	},

	getItem: function() {
		return this._item;
	},

	setItem: function(item, _dontCenter) {
		if (item._symbol)
			item = item.clone();
		if (this._item)
			this._item._symbol = null;
		this._item = item;
		item.remove();
		item.setSelected(false);
		if (!_dontCenter)
			item.setPosition(new Point());
		item._symbol = this;
		this._changed(9);
	},

	getDefinition: '#getItem',
	setDefinition: '#setItem',

	place: function(position) {
		return new SymbolItem(this, position);
	},

	clone: function() {
		return new SymbolDefinition(this._item.clone(false));
	},

	equals: function(symbol) {
		return symbol === this
				|| symbol && this._item.equals(symbol._item)
				|| false;
	}
});

var HitResult = Base.extend({
	_class: 'HitResult',

	initialize: function HitResult(type, item, values) {
		this.type = type;
		this.item = item;
		if (values)
			this.inject(values);
	},

	statics: {
		getOptions: function(args) {
			var options = args && Base.read(args);
			return new Base({
				type: null,
				tolerance: mpaper.settings.hitTolerance,
				fill: !options,
				stroke: !options,
				segments: !options,
				handles: false,
				ends: false,
				position: false,
				center: false,
				bounds: false,
				guides: false,
				selected: false
			}, options);
		}
	}
});

var Segment = Base.extend({
	_class: 'Segment',
	beans: true,
	_selection: 0,

	initialize: function Segment(arg0, arg1, arg2, arg3, arg4, arg5) {
		var count = arguments.length,
			point, handleIn, handleOut, selection;
		if (count > 0) {
			if (arg0 == null || typeof arg0 === 'object') {
				if (count === 1 && arg0 && 'point' in arg0) {
					point = arg0.point;
					handleIn = arg0.handleIn;
					handleOut = arg0.handleOut;
					selection = arg0.selection;
				} else {
					point = arg0;
					handleIn = arg1;
					handleOut = arg2;
					selection = arg3;
				}
			} else {
				point = [ arg0, arg1 ];
				handleIn = arg2 !== undefined ? [ arg2, arg3 ] : null;
				handleOut = arg4 !== undefined ? [ arg4, arg5 ] : null;
			}
		}
		new SegmentPoint(point, this, '_point');
		new SegmentPoint(handleIn, this, '_handleIn');
		new SegmentPoint(handleOut, this, '_handleOut');
		if (selection)
			this.setSelection(selection);
	},

	_serialize: function(options, dictionary) {
		var point = this._point,
			selection = this._selection,
			obj = selection || this.hasHandles()
					? [point, this._handleIn, this._handleOut]
					: point;
		if (selection)
			obj.push(selection);
		return Base.serialize(obj, options, true, dictionary);
	},

	_changed: function(point) {
		var path = this._path;
		if (!path)
			return;
		var curves = path._curves,
			index = this._index,
			curve;
		if (curves) {
			if ((!point || point === this._point || point === this._handleIn)
					&& (curve = index > 0 ? curves[index - 1] : path._closed
						? curves[curves.length - 1] : null))
				curve._changed();
			if ((!point || point === this._point || point === this._handleOut)
					&& (curve = curves[index]))
				curve._changed();
		}
		path._changed(41);
	},

	getPoint: function() {
		return this._point;
	},

	setPoint: function() {
		this._point.set(Point.read(arguments));
	},

	getHandleIn: function() {
		return this._handleIn;
	},

	setHandleIn: function() {
		this._handleIn.set(Point.read(arguments));
	},

	getHandleOut: function() {
		return this._handleOut;
	},

	setHandleOut: function() {
		this._handleOut.set(Point.read(arguments));
	},

	hasHandles: function() {
		return !this._handleIn.isZero() || !this._handleOut.isZero();
	},

	isSmooth: function() {
		var handleIn = this._handleIn,
			handleOut = this._handleOut;
		return !handleIn.isZero() && !handleOut.isZero()
				&& handleIn.isCollinear(handleOut);
	},

	clearHandles: function() {
		this._handleIn._set(0, 0);
		this._handleOut._set(0, 0);
	},

	getSelection: function() {
		return this._selection;
	},

	setSelection: function(selection) {
		var oldSelection = this._selection,
			path = this._path;
		this._selection = selection = selection || 0;
		if (path && selection !== oldSelection) {
			path._updateSelection(this, oldSelection, selection);
			path._changed(257);
		}
	},

	_changeSelection: function(flag, selected) {
		var selection = this._selection;
		this.setSelection(selected ? selection | flag : selection & ~flag);
	},

	isSelected: function() {
		return !!(this._selection & 7);
	},

	setSelected: function(selected) {
		this._changeSelection(7, selected);
	},

	getIndex: function() {
		return this._index !== undefined ? this._index : null;
	},

	getPath: function() {
		return this._path || null;
	},

	getCurve: function() {
		var path = this._path,
			index = this._index;
		if (path) {
			if (index > 0 && !path._closed
					&& index === path._segments.length - 1)
				index--;
			return path.getCurves()[index] || null;
		}
		return null;
	},

	getLocation: function() {
		var curve = this.getCurve();
		return curve
				? new CurveLocation(curve, this === curve._segment1 ? 0 : 1)
				: null;
	},

	getNext: function() {
		var segments = this._path && this._path._segments;
		return segments && (segments[this._index + 1]
				|| this._path._closed && segments[0]) || null;
	},

	smooth: function(options, _first, _last) {
		var opts = options || {},
			type = opts.type,
			factor = opts.factor,
			prev = this.getPrevious(),
			next = this.getNext(),
			p0 = (prev || this)._point,
			p1 = this._point,
			p2 = (next || this)._point,
			d1 = p0.getDistance(p1),
			d2 = p1.getDistance(p2);
		if (!type || type === 'catmull-rom') {
			var a = factor === undefined ? 0.5 : factor,
				d1_a = Math.pow(d1, a),
				d1_2a = d1_a * d1_a,
				d2_a = Math.pow(d2, a),
				d2_2a = d2_a * d2_a;
			if (!_first && prev) {
				var A = 2 * d2_2a + 3 * d2_a * d1_a + d1_2a,
					N = 3 * d2_a * (d2_a + d1_a);
				this.setHandleIn(N !== 0
					? new Point(
						(d2_2a * p0._x + A * p1._x - d1_2a * p2._x) / N - p1._x,
						(d2_2a * p0._y + A * p1._y - d1_2a * p2._y) / N - p1._y)
					: new Point());
			}
			if (!_last && next) {
				var A = 2 * d1_2a + 3 * d1_a * d2_a + d2_2a,
					N = 3 * d1_a * (d1_a + d2_a);
				this.setHandleOut(N !== 0
					? new Point(
						(d1_2a * p2._x + A * p1._x - d2_2a * p0._x) / N - p1._x,
						(d1_2a * p2._y + A * p1._y - d2_2a * p0._y) / N - p1._y)
					: new Point());
			}
		} else if (type === 'geometric') {
			if (prev && next) {
				var vector = p0.subtract(p2),
					t = factor === undefined ? 0.4 : factor,
					k = t * d1 / (d1 + d2);
				if (!_first)
					this.setHandleIn(vector.multiply(k));
				if (!_last)
					this.setHandleOut(vector.multiply(k - t));
			}
		} else {
			throw new Error('Smoothing method \'' + type + '\' not supported.');
		}
	},

	getPrevious: function() {
		var segments = this._path && this._path._segments;
		return segments && (segments[this._index - 1]
				|| this._path._closed && segments[segments.length - 1]) || null;
	},

	isFirst: function() {
		return !this._index;
	},

	isLast: function() {
		var path = this._path;
		return path && this._index === path._segments.length - 1 || false;
	},

	reverse: function() {
		var handleIn = this._handleIn,
			handleOut = this._handleOut,
			tmp = handleIn.clone();
		handleIn.set(handleOut);
		handleOut.set(tmp);
	},

	reversed: function() {
		return new Segment(this._point, this._handleOut, this._handleIn);
	},

	remove: function() {
		return this._path ? !!this._path.removeSegment(this._index) : false;
	},

	clone: function() {
		return new Segment(this._point, this._handleIn, this._handleOut);
	},

	equals: function(segment) {
		return segment === this || segment && this._class === segment._class
				&& this._point.equals(segment._point)
				&& this._handleIn.equals(segment._handleIn)
				&& this._handleOut.equals(segment._handleOut)
				|| false;
	},

	toString: function() {
		var parts = [ 'point: ' + this._point ];
		if (!this._handleIn.isZero())
			parts.push('handleIn: ' + this._handleIn);
		if (!this._handleOut.isZero())
			parts.push('handleOut: ' + this._handleOut);
		return '{ ' + parts.join(', ') + ' }';
	},

	transform: function(matrix) {
		this._transformCoordinates(matrix, new Array(6), true);
		this._changed();
	},

	interpolate: function(from, to, factor) {
		var u = 1 - factor,
			v = factor,
			point1 = from._point,
			point2 = to._point,
			handleIn1 = from._handleIn,
			handleIn2 = to._handleIn,
			handleOut2 = to._handleOut,
			handleOut1 = from._handleOut;
		this._point._set(
				u * point1._x + v * point2._x,
				u * point1._y + v * point2._y, true);
		this._handleIn._set(
				u * handleIn1._x + v * handleIn2._x,
				u * handleIn1._y + v * handleIn2._y, true);
		this._handleOut._set(
				u * handleOut1._x + v * handleOut2._x,
				u * handleOut1._y + v * handleOut2._y, true);
		this._changed();
	},

	_transformCoordinates: function(matrix, coords, change) {
		var point = this._point,
			handleIn = !change || !this._handleIn.isZero()
					? this._handleIn : null,
			handleOut = !change || !this._handleOut.isZero()
					? this._handleOut : null,
			x = point._x,
			y = point._y,
			i = 2;
		coords[0] = x;
		coords[1] = y;
		if (handleIn) {
			coords[i++] = handleIn._x + x;
			coords[i++] = handleIn._y + y;
		}
		if (handleOut) {
			coords[i++] = handleOut._x + x;
			coords[i++] = handleOut._y + y;
		}
		if (matrix) {
			matrix._transformCoordinates(coords, coords, i / 2);
			x = coords[0];
			y = coords[1];
			if (change) {
				point._x = x;
				point._y = y;
				i = 2;
				if (handleIn) {
					handleIn._x = coords[i++] - x;
					handleIn._y = coords[i++] - y;
				}
				if (handleOut) {
					handleOut._x = coords[i++] - x;
					handleOut._y = coords[i++] - y;
				}
			} else {
				if (!handleIn) {
					coords[i++] = x;
					coords[i++] = y;
				}
				if (!handleOut) {
					coords[i++] = x;
					coords[i++] = y;
				}
			}
		}
		return coords;
	}
});

var SegmentPoint = Point.extend({
	initialize: function SegmentPoint(point, owner, key) {
		var x, y,
			selected;
		if (!point) {
			x = y = 0;
		} else if ((x = point[0]) !== undefined) {
			y = point[1];
		} else {
			var pt = point;
			if ((x = pt.x) === undefined) {
				pt = Point.read(arguments);
				x = pt.x;
			}
			y = pt.y;
			selected = pt.selected;
		}
		this._x = x;
		this._y = y;
		this._owner = owner;
		owner[key] = this;
		if (selected)
			this.setSelected(true);
	},

	_set: function(x, y) {
		this._x = x;
		this._y = y;
		this._owner._changed(this);
		return this;
	},

	getX: function() {
		return this._x;
	},

	setX: function(x) {
		this._x = x;
		this._owner._changed(this);
	},

	getY: function() {
		return this._y;
	},

	setY: function(y) {
		this._y = y;
		this._owner._changed(this);
	},

	isZero: function() {
		var isZero = Numerical.isZero;
		return isZero(this._x) && isZero(this._y);
	},

	isSelected: function() {
		return !!(this._owner._selection & this._getSelection());
	},

	setSelected: function(selected) {
		this._owner._changeSelection(this._getSelection(), selected);
	},

	_getSelection: function() {
		var owner = this._owner;
		return this === owner._point ? 1
			: this === owner._handleIn ? 2
			: this === owner._handleOut ? 4
			: 0;
	}
});

var Curve = Base.extend({
	_class: 'Curve',
	beans: true,

	initialize: function Curve(arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7) {
		var count = arguments.length,
			seg1, seg2,
			point1, point2,
			handle1, handle2;
		if (count === 3) {
			this._path = arg0;
			seg1 = arg1;
			seg2 = arg2;
		} else if (!count) {
			seg1 = new Segment();
			seg2 = new Segment();
		} else if (count === 1) {
			if ('segment1' in arg0) {
				seg1 = new Segment(arg0.segment1);
				seg2 = new Segment(arg0.segment2);
			} else if ('point1' in arg0) {
				point1 = arg0.point1;
				handle1 = arg0.handle1;
				handle2 = arg0.handle2;
				point2 = arg0.point2;
			} else if (Array.isArray(arg0)) {
				point1 = [arg0[0], arg0[1]];
				point2 = [arg0[6], arg0[7]];
				handle1 = [arg0[2] - arg0[0], arg0[3] - arg0[1]];
				handle2 = [arg0[4] - arg0[6], arg0[5] - arg0[7]];
			}
		} else if (count === 2) {
			seg1 = new Segment(arg0);
			seg2 = new Segment(arg1);
		} else if (count === 4) {
			point1 = arg0;
			handle1 = arg1;
			handle2 = arg2;
			point2 = arg3;
		} else if (count === 8) {
			point1 = [arg0, arg1];
			point2 = [arg6, arg7];
			handle1 = [arg2 - arg0, arg3 - arg1];
			handle2 = [arg4 - arg6, arg5 - arg7];
		}
		this._segment1 = seg1 || new Segment(point1, null, handle1);
		this._segment2 = seg2 || new Segment(point2, handle2, null);
	},

	_serialize: function(options, dictionary) {
		return Base.serialize(this.hasHandles()
				? [this.getPoint1(), this.getHandle1(), this.getHandle2(),
					this.getPoint2()]
				: [this.getPoint1(), this.getPoint2()],
				options, true, dictionary);
	},

	_changed: function() {
		this._length = this._bounds = undefined;
	},

	clone: function() {
		return new Curve(this._segment1, this._segment2);
	},

	toString: function() {
		var parts = [ 'point1: ' + this._segment1._point ];
		if (!this._segment1._handleOut.isZero())
			parts.push('handle1: ' + this._segment1._handleOut);
		if (!this._segment2._handleIn.isZero())
			parts.push('handle2: ' + this._segment2._handleIn);
		parts.push('point2: ' + this._segment2._point);
		return '{ ' + parts.join(', ') + ' }';
	},

	classify: function() {
		return Curve.classify(this.getValues());
	},

	remove: function() {
		var removed = false;
		if (this._path) {
			var segment2 = this._segment2,
				handleOut = segment2._handleOut;
			removed = segment2.remove();
			if (removed)
				this._segment1._handleOut.set(handleOut);
		}
		return removed;
	},

	getPoint1: function() {
		return this._segment1._point;
	},

	setPoint1: function() {
		this._segment1._point.set(Point.read(arguments));
	},

	getPoint2: function() {
		return this._segment2._point;
	},

	setPoint2: function() {
		this._segment2._point.set(Point.read(arguments));
	},

	getHandle1: function() {
		return this._segment1._handleOut;
	},

	setHandle1: function() {
		this._segment1._handleOut.set(Point.read(arguments));
	},

	getHandle2: function() {
		return this._segment2._handleIn;
	},

	setHandle2: function() {
		this._segment2._handleIn.set(Point.read(arguments));
	},

	getSegment1: function() {
		return this._segment1;
	},

	getSegment2: function() {
		return this._segment2;
	},

	getPath: function() {
		return this._path;
	},

	getIndex: function() {
		return this._segment1._index;
	},

	getNext: function() {
		var curves = this._path && this._path._curves;
		return curves && (curves[this._segment1._index + 1]
				|| this._path._closed && curves[0]) || null;
	},

	getPrevious: function() {
		var curves = this._path && this._path._curves;
		return curves && (curves[this._segment1._index - 1]
				|| this._path._closed && curves[curves.length - 1]) || null;
	},

	isFirst: function() {
		return !this._segment1._index;
	},

	isLast: function() {
		var path = this._path;
		return path && this._segment1._index === path._curves.length - 1
				|| false;
	},

	isSelected: function() {
		return this.getPoint1().isSelected()
				&& this.getHandle1().isSelected()
				&& this.getHandle2().isSelected()
				&& this.getPoint2().isSelected();
	},

	setSelected: function(selected) {
		this.getPoint1().setSelected(selected);
		this.getHandle1().setSelected(selected);
		this.getHandle2().setSelected(selected);
		this.getPoint2().setSelected(selected);
	},

	getValues: function(matrix) {
		return Curve.getValues(this._segment1, this._segment2, matrix);
	},

	getPoints: function() {
		var coords = this.getValues(),
			points = [];
		for (var i = 0; i < 8; i += 2)
			points.push(new Point(coords[i], coords[i + 1]));
		return points;
	}
}, {
	getLength: function() {
		if (this._length == null)
			this._length = Curve.getLength(this.getValues(), 0, 1);
		return this._length;
	},

	getArea: function() {
		return Curve.getArea(this.getValues());
	},

	getLine: function() {
		return new Line(this._segment1._point, this._segment2._point);
	},

	getPart: function(from, to) {
		return new Curve(Curve.getPart(this.getValues(), from, to));
	},

	getPartLength: function(from, to) {
		return Curve.getLength(this.getValues(), from, to);
	},

	divideAt: function(location) {
		return this.divideAtTime(location && location.curve === this
				? location.time : this.getTimeAt(location));
	},

	divideAtTime: function(time, _setHandles) {
		var tMin = 1e-8,
			tMax = 1 - tMin,
			res = null;
		if (time >= tMin && time <= tMax) {
			var parts = Curve.subdivide(this.getValues(), time),
				left = parts[0],
				right = parts[1],
				setHandles = _setHandles || this.hasHandles(),
				seg1 = this._segment1,
				seg2 = this._segment2,
				path = this._path;
			if (setHandles) {
				seg1._handleOut._set(left[2] - left[0], left[3] - left[1]);
				seg2._handleIn._set(right[4] - right[6],right[5] - right[7]);
			}
			var x = left[6], y = left[7],
				segment = new Segment(new Point(x, y),
						setHandles && new Point(left[4] - x, left[5] - y),
						setHandles && new Point(right[2] - x, right[3] - y));
			if (path) {
				path.insert(seg1._index + 1, segment);
				res = this.getNext();
			} else {
				this._segment2 = segment;
				this._changed();
				res = new Curve(segment, seg2);
			}
		}
		return res;
	},

	splitAt: function(location) {
		var path = this._path;
		return path ? path.splitAt(location) : null;
	},

	splitAtTime: function(time) {
		return this.splitAt(this.getLocationAtTime(time));
	},

	divide: function(offset, isTime) {
		return this.divideAtTime(offset === undefined ? 0.5 : isTime ? offset
				: this.getTimeAt(offset));
	},

	split: function(offset, isTime) {
		return this.splitAtTime(offset === undefined ? 0.5 : isTime ? offset
				: this.getTimeAt(offset));
	},

	reversed: function() {
		return new Curve(this._segment2.reversed(), this._segment1.reversed());
	},

	clearHandles: function() {
		this._segment1._handleOut._set(0, 0);
		this._segment2._handleIn._set(0, 0);
	},

statics: {
	getValues: function(segment1, segment2, matrix, straight) {
		var p1 = segment1._point,
			h1 = segment1._handleOut,
			h2 = segment2._handleIn,
			p2 = segment2._point,
			x1 = p1.x, y1 = p1.y,
			x2 = p2.x, y2 = p2.y,
			values = straight
				? [ x1, y1, x1, y1, x2, y2, x2, y2 ]
				: [
					x1, y1,
					x1 + h1._x, y1 + h1._y,
					x2 + h2._x, y2 + h2._y,
					x2, y2
				];
		if (matrix)
			matrix._transformCoordinates(values, values, 4);
		return values;
	},

	subdivide: function(v, t) {
		var x0 = v[0], y0 = v[1],
			x1 = v[2], y1 = v[3],
			x2 = v[4], y2 = v[5],
			x3 = v[6], y3 = v[7];
		if (t === undefined)
			t = 0.5;
		var u = 1 - t,
			x4 = u * x0 + t * x1, y4 = u * y0 + t * y1,
			x5 = u * x1 + t * x2, y5 = u * y1 + t * y2,
			x6 = u * x2 + t * x3, y6 = u * y2 + t * y3,
			x7 = u * x4 + t * x5, y7 = u * y4 + t * y5,
			x8 = u * x5 + t * x6, y8 = u * y5 + t * y6,
			x9 = u * x7 + t * x8, y9 = u * y7 + t * y8;
		return [
			[x0, y0, x4, y4, x7, y7, x9, y9],
			[x9, y9, x8, y8, x6, y6, x3, y3]
		];
	},

	getMonoCurves: function(v, dir) {
		var curves = [],
			io = dir ? 0 : 1,
			o0 = v[io + 0],
			o1 = v[io + 2],
			o2 = v[io + 4],
			o3 = v[io + 6];
		if ((o0 >= o1) === (o1 >= o2) && (o1 >= o2) === (o2 >= o3)
				|| Curve.isStraight(v)) {
			curves.push(v);
		} else {
			var a = 3 * (o1 - o2) - o0 + o3,
				b = 2 * (o0 + o2) - 4 * o1,
				c = o1 - o0,
				tMin = 1e-8,
				tMax = 1 - tMin,
				roots = [],
				n = Numerical.solveQuadratic(a, b, c, roots, tMin, tMax);
			if (!n) {
				curves.push(v);
			} else {
				roots.sort();
				var t = roots[0],
					parts = Curve.subdivide(v, t);
				curves.push(parts[0]);
				if (n > 1) {
					t = (roots[1] - t) / (1 - t);
					parts = Curve.subdivide(parts[1], t);
					curves.push(parts[0]);
				}
				curves.push(parts[1]);
			}
		}
		return curves;
	},

	solveCubic: function (v, coord, val, roots, min, max) {
		var v0 = v[coord],
			v1 = v[coord + 2],
			v2 = v[coord + 4],
			v3 = v[coord + 6],
			res = 0;
		if (  !(v0 < val && v3 < val && v1 < val && v2 < val ||
				v0 > val && v3 > val && v1 > val && v2 > val)) {
			var c = 3 * (v1 - v0),
				b = 3 * (v2 - v1) - c,
				a = v3 - v0 - c - b;
			res = Numerical.solveCubic(a, b, c, v0 - val, roots, min, max);
		}
		return res;
	},

	getTimeOf: function(v, point, forceEpsilon) {
		var p0 = new Point(v[0], v[1]),
			p3 = new Point(v[6], v[7]),
			epsilon = 1e-12,
			geomEpsilon = 1e-7;
		if( forceEpsilon ){
			epsilon = forceEpsilon;
			geomEpsilon = forceEpsilon;
		}
		var  t = point.isClose(p0, epsilon) ? 0
			  : point.isClose(p3, epsilon) ? 1
			  : null;

		if (t === null) {
			var coords = [point.x, point.y],
				roots = [];
			for (var c = 0; c < 2; c++) {
				var count = Curve.solveCubic(v, c, coords[c], roots, 0, 1);
				for (var i = 0; i < count; i++) {
					var u = roots[i];
					if (point.isClose(Curve.getPoint(v, u), geomEpsilon))
						return u;
				}
			}
		}
		return point.isClose(p0, geomEpsilon) ? 0
			 : point.isClose(p3, geomEpsilon) ? 1
			 : null;
	},

	getNearestTime: function(v, point) {
		if (Curve.isStraight(v)) {
			var x0 = v[0], y0 = v[1],
				x3 = v[6], y3 = v[7],
				vx = x3 - x0, vy = y3 - y0,
				det = vx * vx + vy * vy;
			if (det === 0)
				return 0;
			var u = ((point.x - x0) * vx + (point.y - y0) * vy) / det;
			return u < 1e-12 ? 0
				 : u > 0.999999999999 ? 1
				 : Curve.getTimeOf(v,
					new Point(x0 + u * vx, y0 + u * vy));
		}

		var count = 100,
			minDist = Infinity,
			minT = 0;

		function refine(t) {
			if (t >= 0 && t <= 1) {
				var dist = point.getDistance(Curve.getPoint(v, t), true);
				if (dist < minDist) {
					minDist = dist;
					minT = t;
					return true;
				}
			}
		}

		for (var i = 0; i <= count; i++)
			refine(i / count);

		var step = 1 / (count * 2);
		while (step > 1e-8) {
			if (!refine(minT - step) && !refine(minT + step))
				step /= 2;
		}
		return minT;
	},

	getPart: function(v, from, to) {
		var flip = from > to;
		if (flip) {
			var tmp = from;
			from = to;
			to = tmp;
		}
		if (from > 0)
			v = Curve.subdivide(v, from)[1];
		if (to < 1)
			v = Curve.subdivide(v, (to - from) / (1 - from))[0];
		return flip
				? [v[6], v[7], v[4], v[5], v[2], v[3], v[0], v[1]]
				: v;
	},

	isFlatEnough: function(v, flatness) {
		var x0 = v[0], y0 = v[1],
			x1 = v[2], y1 = v[3],
			x2 = v[4], y2 = v[5],
			x3 = v[6], y3 = v[7],
			ux = 3 * x1 - 2 * x0 - x3,
			uy = 3 * y1 - 2 * y0 - y3,
			vx = 3 * x2 - 2 * x3 - x0,
			vy = 3 * y2 - 2 * y3 - y0;
		return Math.max(ux * ux, vx * vx) + Math.max(uy * uy, vy * vy)
				<= 16 * flatness * flatness;
	},

	getArea: function(v) {
		var x0 = v[0], y0 = v[1],
			x1 = v[2], y1 = v[3],
			x2 = v[4], y2 = v[5],
			x3 = v[6], y3 = v[7];
		return 3 * ((y3 - y0) * (x1 + x2) - (x3 - x0) * (y1 + y2)
				+ y1 * (x0 - x2) - x1 * (y0 - y2)
				+ y3 * (x2 + x0 / 3) - x3 * (y2 + y0 / 3)) / 20;
	},

	getBounds: function(v) {
		var min = v.slice(0, 2),
			max = min.slice(),
			roots = [0, 0];
		for (var i = 0; i < 2; i++)
			Curve._addBounds(v[i], v[i + 2], v[i + 4], v[i + 6],
					i, 0, min, max, roots);
		return new Rectangle(min[0], min[1], max[0] - min[0], max[1] - min[1]);
	},

	_addBounds: function(v0, v1, v2, v3, coord, padding, min, max, roots) {
		function add(value, padding) {
			var left = value - padding,
				right = value + padding;
			if (left < min[coord])
				min[coord] = left;
			if (right > max[coord])
				max[coord] = right;
		}

		padding /= 2;
		var minPad = min[coord] + padding,
			maxPad = max[coord] - padding;
		if (    v0 < minPad || v1 < minPad || v2 < minPad || v3 < minPad ||
				v0 > maxPad || v1 > maxPad || v2 > maxPad || v3 > maxPad) {
			if (v1 < v0 != v1 < v3 && v2 < v0 != v2 < v3) {
				add(v0, 0);
				add(v3, 0);
			} else {
				var a = 3 * (v1 - v2) - v0 + v3,
					b = 2 * (v0 + v2) - 4 * v1,
					c = v1 - v0,
					count = Numerical.solveQuadratic(a, b, c, roots),
					tMin = 1e-8,
					tMax = 1 - tMin;
				add(v3, 0);
				for (var i = 0; i < count; i++) {
					var t = roots[i],
						u = 1 - t;
					if (tMin <= t && t <= tMax)
						add(u * u * u * v0
							+ 3 * u * u * t * v1
							+ 3 * u * t * t * v2
							+ t * t * t * v3,
							padding);
				}
			}
		}
	}
}}, Base.each(
	['getBounds', 'getStrokeBounds', 'getHandleBounds'],
	function(name) {
		this[name] = function() {
			if (!this._bounds)
				this._bounds = {};
			var bounds = this._bounds[name];
			if (!bounds) {
				bounds = this._bounds[name] = Path[name](
						[this._segment1, this._segment2], false, this._path);
			}
			return bounds.clone();
		};
	},
{

}), Base.each({
	isStraight: function(p1, h1, h2, p2) {
		if (h1.isZero() && h2.isZero()) {
			return true;
		} else {
			var v = p2.subtract(p1);
			if (v.isZero()) {
				return false;
			} else if (v.isCollinear(h1) && v.isCollinear(h2)) {
				var l = new Line(p1, p2),
					epsilon = 1e-7;
				if (l.getDistance(p1.add(h1)) < epsilon &&
					l.getDistance(p2.add(h2)) < epsilon) {
					var div = v.dot(v),
						s1 = v.dot(h1) / div,
						s2 = v.dot(h2) / div;
					return s1 >= 0 && s1 <= 1 && s2 <= 0 && s2 >= -1;
				}
			}
		}
		return false;
	},

	isLinear: function(p1, h1, h2, p2) {
		var third = p2.subtract(p1).divide(3);
		return h1.equals(third) && h2.negate().equals(third);
	}
}, function(test, name) {
	this[name] = function(epsilon) {
		var seg1 = this._segment1,
			seg2 = this._segment2;
		return test(seg1._point, seg1._handleOut, seg2._handleIn, seg2._point,
				epsilon);
	};

	this.statics[name] = function(v, epsilon) {
		var x0 = v[0], y0 = v[1],
			x3 = v[6], y3 = v[7];
		return test(
				new Point(x0, y0),
				new Point(v[2] - x0, v[3] - y0),
				new Point(v[4] - x3, v[5] - y3),
				new Point(x3, y3), epsilon);
	};
}, {
	statics: {},

	hasHandles: function() {
		return !this._segment1._handleOut.isZero()
				|| !this._segment2._handleIn.isZero();
	},

	hasLength: function(epsilon) {
		return (!this.getPoint1().equals(this.getPoint2()) || this.hasHandles())
				&& this.getLength() > (epsilon || 0);
	},

	isCollinear: function(curve) {
		return curve && this.isStraight() && curve.isStraight()
				&& this.getLine().isCollinear(curve.getLine());
	},

	isHorizontal: function() {
		return this.isStraight() && Math.abs(this.getTangentAtTime(0.5).y)
				< 1e-8;
	},

	isVertical: function() {
		return this.isStraight() && Math.abs(this.getTangentAtTime(0.5).x)
				< 1e-8;
	}
}), {
	beans: false,

	getLocationAt: function(offset, _isTime) {
		return this.getLocationAtTime(
				_isTime ? offset : this.getTimeAt(offset));
	},

	getLocationAtTime: function(t) {
		return t != null && t >= 0 && t <= 1
				? new CurveLocation(this, t)
				: null;
	},

	getTimeAt: function(offset, start) {
		return Curve.getTimeAt(this.getValues(), offset, start);
	},

	getParameterAt: '#getTimeAt',

	getTimesWithTangent: function () {
		var tangent = Point.read(arguments);
		return tangent.isZero()
				? []
				: Curve.getTimesWithTangent(this.getValues(), tangent);
	},

	getOffsetAtTime: function(t) {
		return this.getPartLength(0, t);
	},

	getLocationOf: function(point, epsilon) {
		return this.getLocationAtTime(this.getTimeOf(Point.read(arguments), epsilon));
	},

	getOffsetOf: function() {
		var loc = this.getLocationOf.apply(this, arguments);
		return loc ? loc.getOffset() : null;
	},

	getTimeOf: function(point, epsilon) {
		return Curve.getTimeOf(this.getValues(), Point.read(arguments), epsilon);
	},

	getParameterOf: '#getTimeOf',

	getNearestLocation: function() {
		var point = Point.read(arguments),
			values = this.getValues(),
			t = Curve.getNearestTime(values, point),
			pt = Curve.getPoint(values, t);
		return new CurveLocation(this, t, pt, null, point.getDistance(pt));
	},

	getNearestPoint: function() {
		var loc = this.getNearestLocation.apply(this, arguments);
		return loc ? loc.getPoint() : loc;
	}

},
new function() {
	var methods = ['getPoint', 'getTangent', 'getNormal', 'getWeightedTangent',
		'getWeightedNormal', 'getCurvature'];
	return Base.each(methods,
		function(name) {
			this[name + 'At'] = function(location, _isTime) {
				var values = this.getValues();
				return Curve[name](values, _isTime ? location
						: Curve.getTimeAt(values, location));
			};

			this[name + 'AtTime'] = function(time) {
				return Curve[name](this.getValues(), time);
			};
		}, {
			statics: {
				_evaluateMethods: methods
			}
		}
	);
},
new function() {

	function getLengthIntegrand(v) {
		var x0 = v[0], y0 = v[1],
			x1 = v[2], y1 = v[3],
			x2 = v[4], y2 = v[5],
			x3 = v[6], y3 = v[7],

			ax = 9 * (x1 - x2) + 3 * (x3 - x0),
			bx = 6 * (x0 + x2) - 12 * x1,
			cx = 3 * (x1 - x0),

			ay = 9 * (y1 - y2) + 3 * (y3 - y0),
			by = 6 * (y0 + y2) - 12 * y1,
			cy = 3 * (y1 - y0);

		return function(t) {
			var dx = (ax * t + bx) * t + cx,
				dy = (ay * t + by) * t + cy;
			return Math.sqrt(dx * dx + dy * dy);
		};
	}

	function getIterations(a, b) {
		return Math.max(2, Math.min(16, Math.ceil(Math.abs(b - a) * 32)));
	}

	function evaluate(v, t, type, normalized) {
		if (t == null || t < 0 || t > 1)
			return null;
		var x0 = v[0], y0 = v[1],
			x1 = v[2], y1 = v[3],
			x2 = v[4], y2 = v[5],
			x3 = v[6], y3 = v[7],
			isZero = Numerical.isZero;
		if (isZero(x1 - x0) && isZero(y1 - y0)) {
			x1 = x0;
			y1 = y0;
		}
		if (isZero(x2 - x3) && isZero(y2 - y3)) {
			x2 = x3;
			y2 = y3;
		}
		var cx = 3 * (x1 - x0),
			bx = 3 * (x2 - x1) - cx,
			ax = x3 - x0 - cx - bx,
			cy = 3 * (y1 - y0),
			by = 3 * (y2 - y1) - cy,
			ay = y3 - y0 - cy - by,
			x, y;
		if (type === 0) {
			x = t === 0 ? x0 : t === 1 ? x3
					: ((ax * t + bx) * t + cx) * t + x0;
			y = t === 0 ? y0 : t === 1 ? y3
					: ((ay * t + by) * t + cy) * t + y0;
		} else {
			var tMin = 1e-8,
				tMax = 1 - tMin;
			if (t < tMin) {
				x = cx;
				y = cy;
			} else if (t > tMax) {
				x = 3 * (x3 - x2);
				y = 3 * (y3 - y2);
			} else {
				x = (3 * ax * t + 2 * bx) * t + cx;
				y = (3 * ay * t + 2 * by) * t + cy;
			}
			if (normalized) {
				if (x === 0 && y === 0 && (t < tMin || t > tMax)) {
					x = x2 - x1;
					y = y2 - y1;
				}
				var len = Math.sqrt(x * x + y * y);
				if (len) {
					x /= len;
					y /= len;
				}
			}
			if (type === 3) {
				var x2 = 6 * ax * t + 2 * bx,
					y2 = 6 * ay * t + 2 * by,
					d = Math.pow(x * x + y * y, 3 / 2);
				x = d !== 0 ? (x * y2 - y * x2) / d : 0;
				y = 0;
			}
		}
		return type === 2 ? new Point(y, -x) : new Point(x, y);
	}

	return { statics: {

		classify: function(v) {

			var x0 = v[0], y0 = v[1],
				x1 = v[2], y1 = v[3],
				x2 = v[4], y2 = v[5],
				x3 = v[6], y3 = v[7],
				a1 = x0 * (y3 - y2) + y0 * (x2 - x3) + x3 * y2 - y3 * x2,
				a2 = x1 * (y0 - y3) + y1 * (x3 - x0) + x0 * y3 - y0 * x3,
				a3 = x2 * (y1 - y0) + y2 * (x0 - x1) + x1 * y0 - y1 * x0,
				d3 = 3 * a3,
				d2 = d3 - a2,
				d1 = d2 - a2 + a1,
				l = Math.sqrt(d1 * d1 + d2 * d2 + d3 * d3),
				s = l !== 0 ? 1 / l : 0,
				isZero = Numerical.isZero,
				serpentine = 'serpentine';
			d1 *= s;
			d2 *= s;
			d3 *= s;

			function type(type, t1, t2) {
				var hasRoots = t1 !== undefined,
					t1Ok = hasRoots && t1 > 0 && t1 < 1,
					t2Ok = hasRoots && t2 > 0 && t2 < 1;
				if (hasRoots && (!(t1Ok || t2Ok)
						|| type === 'loop' && !(t1Ok && t2Ok))) {
					type = 'arch';
					t1Ok = t2Ok = false;
				}
				return {
					type: type,
					roots: t1Ok || t2Ok
							? t1Ok && t2Ok
								? t1 < t2 ? [t1, t2] : [t2, t1]
								: [t1Ok ? t1 : t2]
							: null
				};
			}

			if (isZero(d1)) {
				return isZero(d2)
						? type(isZero(d3) ? 'line' : 'quadratic')
						: type(serpentine, d3 / (3 * d2));
			}
			var d = 3 * d2 * d2 - 4 * d1 * d3;
			if (isZero(d)) {
				return type('cusp', d2 / (2 * d1));
			}
			var f1 = d > 0 ? Math.sqrt(d / 3) : Math.sqrt(-d),
				f2 = 2 * d1;
			return type(d > 0 ? serpentine : 'loop',
					(d2 + f1) / f2,
					(d2 - f1) / f2);
		},

		getLength: function(v, a, b, ds) {
			if (a === undefined)
				a = 0;
			if (b === undefined)
				b = 1;
			if (Curve.isStraight(v)) {
				var c = v;
				if (b < 1) {
					c = Curve.subdivide(c, b)[0];
					a /= b;
				}
				if (a > 0) {
					c = Curve.subdivide(c, a)[1];
				}
				var dx = c[6] - c[0],
					dy = c[7] - c[1];
				return Math.sqrt(dx * dx + dy * dy);
			}
			return Numerical.integrate(ds || getLengthIntegrand(v), a, b,
					getIterations(a, b));
		},

		getTimeAt: function(v, offset, start) {
			if (start === undefined)
				start = offset < 0 ? 1 : 0;
			if (offset === 0)
				return start;
			var abs = Math.abs,
				epsilon = 1e-12,
				forward = offset > 0,
				a = forward ? start : 0,
				b = forward ? 1 : start,
				ds = getLengthIntegrand(v),
				rangeLength = Curve.getLength(v, a, b, ds),
				diff = abs(offset) - rangeLength;
			if (abs(diff) < epsilon) {
				return forward ? b : a;
			} else if (diff > epsilon) {
				return null;
			}
			var guess = offset / rangeLength,
				length = 0;
			function f(t) {
				length += Numerical.integrate(ds, start, t,
						getIterations(start, t));
				start = t;
				return length - offset;
			}
			return Numerical.findRoot(f, ds, start + guess, a, b, 32,
					1e-12);
		},

		getPoint: function(v, t) {
			return evaluate(v, t, 0, false);
		},

		getTangent: function(v, t) {
			return evaluate(v, t, 1, true);
		},

		getWeightedTangent: function(v, t) {
			return evaluate(v, t, 1, false);
		},

		getNormal: function(v, t) {
			return evaluate(v, t, 2, true);
		},

		getWeightedNormal: function(v, t) {
			return evaluate(v, t, 2, false);
		},

		getCurvature: function(v, t) {
			return evaluate(v, t, 3, false).x;
		},

		getPeaks: function(v) {
			var x0 = v[0], y0 = v[1],
				x1 = v[2], y1 = v[3],
				x2 = v[4], y2 = v[5],
				x3 = v[6], y3 = v[7],
				ax =     -x0 + 3 * x1 - 3 * x2 + x3,
				bx =  3 * x0 - 6 * x1 + 3 * x2,
				cx = -3 * x0 + 3 * x1,
				ay =     -y0 + 3 * y1 - 3 * y2 + y3,
				by =  3 * y0 - 6 * y1 + 3 * y2,
				cy = -3 * y0 + 3 * y1,
				tMin = 1e-8,
				tMax = 1 - tMin,
				roots = [];
			Numerical.solveCubic(
					9 * (ax * ax + ay * ay),
					9 * (ax * bx + by * ay),
					2 * (bx * bx + by * by) + 3 * (cx * ax + cy * ay),
					(cx * bx + by * cy),
					roots, tMin, tMax);
			return roots.sort();
		}
	}};
},
new function() {

	function addLocation(locations, include, c1, t1, c2, t2, overlap) {
		var excludeStart = !overlap && c1.getPrevious() === c2,
			excludeEnd = !overlap && c1 !== c2 && c1.getNext() === c2,
			tMin = 1e-8,
			tMax = 1 - tMin;
		if (t1 !== null && t1 >= (excludeStart ? tMin : 0) &&
			t1 <= (excludeEnd ? tMax : 1)) {
			if (t2 !== null && t2 >= (excludeEnd ? tMin : 0) &&
				t2 <= (excludeStart ? tMax : 1)) {
				var loc1 = new CurveLocation(c1, t1, null, overlap),
					loc2 = new CurveLocation(c2, t2, null, overlap);
				loc1._intersection = loc2;
				loc2._intersection = loc1;
				if (!include || include(loc1)) {
					CurveLocation.insert(locations, loc1, true);
				}
			}
		}
	}

	function addCurveIntersections(v1, v2, c1, c2, locations, include, flip,
			recursion, calls, tMin, tMax, uMin, uMax) {
		if (++calls >= 4096 || ++recursion >= 40)
			return calls;
		var fatLineEpsilon = 1e-9,
			q0x = v2[0], q0y = v2[1], q3x = v2[6], q3y = v2[7],
			getSignedDistance = Line.getSignedDistance,
			d1 = getSignedDistance(q0x, q0y, q3x, q3y, v2[2], v2[3]),
			d2 = getSignedDistance(q0x, q0y, q3x, q3y, v2[4], v2[5]),
			factor = d1 * d2 > 0 ? 3 / 4 : 4 / 9,
			dMin = factor * Math.min(0, d1, d2),
			dMax = factor * Math.max(0, d1, d2),
			dp0 = getSignedDistance(q0x, q0y, q3x, q3y, v1[0], v1[1]),
			dp1 = getSignedDistance(q0x, q0y, q3x, q3y, v1[2], v1[3]),
			dp2 = getSignedDistance(q0x, q0y, q3x, q3y, v1[4], v1[5]),
			dp3 = getSignedDistance(q0x, q0y, q3x, q3y, v1[6], v1[7]),
			hull = getConvexHull(dp0, dp1, dp2, dp3),
			top = hull[0],
			bottom = hull[1],
			tMinClip,
			tMaxClip;
		if (d1 === 0 && d2 === 0
				&& dp0 === 0 && dp1 === 0 && dp2 === 0 && dp3 === 0
			|| (tMinClip = clipConvexHull(top, bottom, dMin, dMax)) == null
			|| (tMaxClip = clipConvexHull(top.reverse(), bottom.reverse(),
				dMin, dMax)) == null)
			return calls;
		var tMinNew = tMin + (tMax - tMin) * tMinClip,
			tMaxNew = tMin + (tMax - tMin) * tMaxClip;
		if (Math.max(uMax - uMin, tMaxNew - tMinNew) < fatLineEpsilon) {
			var t = (tMinNew + tMaxNew) / 2,
				u = (uMin + uMax) / 2;
			addLocation(locations, include,
					flip ? c2 : c1, flip ? u : t,
					flip ? c1 : c2, flip ? t : u);
		} else {
			v1 = Curve.getPart(v1, tMinClip, tMaxClip);
			var uDiff = uMax - uMin;
			if (tMaxClip - tMinClip > 0.8) {
				if (tMaxNew - tMinNew > uDiff) {
					var parts = Curve.subdivide(v1, 0.5),
						t = (tMinNew + tMaxNew) / 2;
					calls = addCurveIntersections(
							v2, parts[0], c2, c1, locations, include, !flip,
							recursion, calls, uMin, uMax, tMinNew, t);
					calls = addCurveIntersections(
							v2, parts[1], c2, c1, locations, include, !flip,
							recursion, calls, uMin, uMax, t, tMaxNew);
				} else {
					var parts = Curve.subdivide(v2, 0.5),
						u = (uMin + uMax) / 2;
					calls = addCurveIntersections(
							parts[0], v1, c2, c1, locations, include, !flip,
							recursion, calls, uMin, u, tMinNew, tMaxNew);
					calls = addCurveIntersections(
							parts[1], v1, c2, c1, locations, include, !flip,
							recursion, calls, u, uMax, tMinNew, tMaxNew);
				}
			} else {
				if (uDiff === 0 || uDiff >= fatLineEpsilon) {
					calls = addCurveIntersections(
							v2, v1, c2, c1, locations, include, !flip,
							recursion, calls, uMin, uMax, tMinNew, tMaxNew);
				} else {
					calls = addCurveIntersections(
							v1, v2, c1, c2, locations, include, flip,
							recursion, calls, tMinNew, tMaxNew, uMin, uMax);
				}
			}
		}
		return calls;
	}

	function getConvexHull(dq0, dq1, dq2, dq3) {
		var p0 = [ 0, dq0 ],
			p1 = [ 1 / 3, dq1 ],
			p2 = [ 2 / 3, dq2 ],
			p3 = [ 1, dq3 ],
			dist1 = dq1 - (2 * dq0 + dq3) / 3,
			dist2 = dq2 - (dq0 + 2 * dq3) / 3,
			hull;
		if (dist1 * dist2 < 0) {
			hull = [[p0, p1, p3], [p0, p2, p3]];
		} else {
			var distRatio = dist1 / dist2;
			hull = [
				distRatio >= 2 ? [p0, p1, p3]
				: distRatio <= 0.5 ? [p0, p2, p3]
				: [p0, p1, p2, p3],
				[p0, p3]
			];
		}
		return (dist1 || dist2) < 0 ? hull.reverse() : hull;
	}

	function clipConvexHull(hullTop, hullBottom, dMin, dMax) {
		if (hullTop[0][1] < dMin) {
			return clipConvexHullPart(hullTop, true, dMin);
		} else if (hullBottom[0][1] > dMax) {
			return clipConvexHullPart(hullBottom, false, dMax);
		} else {
			return hullTop[0][0];
		}
	}

	function clipConvexHullPart(part, top, threshold) {
		var px = part[0][0],
			py = part[0][1];
		for (var i = 1, l = part.length; i < l; i++) {
			var qx = part[i][0],
				qy = part[i][1];
			if (top ? qy >= threshold : qy <= threshold) {
				return qy === threshold ? qx
						: px + (threshold - py) * (qx - px) / (qy - py);
			}
			px = qx;
			py = qy;
		}
		return null;
	}

	function getCurveLineIntersections(v, px, py, vx, vy) {
		var isZero = Numerical.isZero;
		if (isZero(vx) && isZero(vy)) {
			var t = Curve.getTimeOf(v, new Point(px, py));
			return t === null ? [] : [t];
		}
		var angle = Math.atan2(-vy, vx),
			sin = Math.sin(angle),
			cos = Math.cos(angle),
			rv = [],
			roots = [];
		for (var i = 0; i < 8; i += 2) {
			var x = v[i] - px,
				y = v[i + 1] - py;
			rv.push(
				x * cos - y * sin,
				x * sin + y * cos);
		}
		Curve.solveCubic(rv, 1, 0, roots, 0, 1);
		return roots;
	}

	function addCurveLineIntersections(v1, v2, c1, c2, locations, include,
			flip) {
		var x1 = v2[0], y1 = v2[1],
			x2 = v2[6], y2 = v2[7],
			roots = getCurveLineIntersections(v1, x1, y1, x2 - x1, y2 - y1);
		for (var i = 0, l = roots.length; i < l; i++) {
			var t1 = roots[i],
				p1 = Curve.getPoint(v1, t1),
				t2 = Curve.getTimeOf(v2, p1);
			if (t2 !== null) {
				addLocation(locations, include,
						flip ? c2 : c1, flip ? t2 : t1,
						flip ? c1 : c2, flip ? t1 : t2);
			}
		}
	}

	function addLineIntersection(v1, v2, c1, c2, locations, include) {
		var pt = Line.intersect(
				v1[0], v1[1], v1[6], v1[7],
				v2[0], v2[1], v2[6], v2[7]);
		if (pt) {
			addLocation(locations, include,
					c1, Curve.getTimeOf(v1, pt),
					c2, Curve.getTimeOf(v2, pt));
		}
	}

	function getCurveIntersections(v1, v2, c1, c2, locations, include) {
		var epsilon = 1e-12,
			min = Math.min,
			max = Math.max;

		if (max(v1[0], v1[2], v1[4], v1[6]) + epsilon >
			min(v2[0], v2[2], v2[4], v2[6]) &&
			min(v1[0], v1[2], v1[4], v1[6]) - epsilon <
			max(v2[0], v2[2], v2[4], v2[6]) &&
			max(v1[1], v1[3], v1[5], v1[7]) + epsilon >
			min(v2[1], v2[3], v2[5], v2[7]) &&
			min(v1[1], v1[3], v1[5], v1[7]) - epsilon <
			max(v2[1], v2[3], v2[5], v2[7])) {
			var overlaps = getOverlaps(v1, v2);
			if (overlaps) {
				for (var i = 0; i < 2; i++) {
					var overlap = overlaps[i];
					addLocation(locations, include,
							c1, overlap[0],
							c2, overlap[1], true);
				}
			} else {
				var straight1 = Curve.isStraight(v1),
					straight2 = Curve.isStraight(v2),
					straight = straight1 && straight2,
					flip = straight1 && !straight2,
					before = locations.length;
				(straight
					? addLineIntersection
					: straight1 || straight2
						? addCurveLineIntersections
						: addCurveIntersections)(
							flip ? v2 : v1, flip ? v1 : v2,
							flip ? c2 : c1, flip ? c1 : c2,
							locations, include, flip,
							0, 0, 0, 1, 0, 1);
				if (!straight || locations.length === before) {
					for (var i = 0; i < 4; i++) {
						var t1 = i >> 1,
							t2 = i & 1,
							i1 = t1 * 6,
							i2 = t2 * 6,
							p1 = new Point(v1[i1], v1[i1 + 1]),
							p2 = new Point(v2[i2], v2[i2 + 1]);
						if (p1.isClose(p2, epsilon)) {
							addLocation(locations, include,
									c1, t1,
									c2, t2);
						}
					}
				}
			}
		}
		return locations;
	}

	function getSelfIntersection(v1, c1, locations, include) {
		var info = Curve.classify(v1);
		if (info.type === 'loop') {
			var roots = info.roots;
			addLocation(locations, include,
					c1, roots[0],
					c1, roots[1]);
		}
	  return locations;
	}

	function getIntersections(curves1, curves2, include, matrix1, matrix2,
			_returnFirst) {
		var epsilon = 1e-7,
			self = !curves2;
		if (self)
			curves2 = curves1;
		var length1 = curves1.length,
			length2 = curves2.length,
			values1 = new Array(length1),
			values2 = self ? values1 : new Array(length2),
			locations = [];

		for (var i = 0; i < length1; i++) {
			values1[i] = curves1[i].getValues(matrix1);
		}
		if (!self) {
			for (var i = 0; i < length2; i++) {
				values2[i] = curves2[i].getValues(matrix2);
			}
		}
		var boundsCollisions = CollisionDetection.findCurveBoundsCollisions(
				values1, values2, epsilon);
		for (var index1 = 0; index1 < length1; index1++) {
			var curve1 = curves1[index1],
				v1 = values1[index1];
			if (self) {
				getSelfIntersection(v1, curve1, locations, include);
			}
			var collisions1 = boundsCollisions[index1];
			if (collisions1) {
				for (var j = 0; j < collisions1.length; j++) {
					if (_returnFirst && locations.length)
						return locations;
					var index2 = collisions1[j];
					if (!self || index2 > index1) {
						var curve2 = curves2[index2],
							v2 = values2[index2];
						getCurveIntersections(
								v1, v2, curve1, curve2, locations, include);
					}
				}
			}
		}
		return locations;
	}

	function getOverlaps(v1, v2) {

		function getSquaredLineLength(v) {
			var x = v[6] - v[0],
				y = v[7] - v[1];
			return x * x + y * y;
		}

		var abs = Math.abs,
			getDistance = Line.getDistance,
			timeEpsilon = 1e-8,
			geomEpsilon = 1e-7,
			straight1 = Curve.isStraight(v1),
			straight2 = Curve.isStraight(v2),
			straightBoth = straight1 && straight2,
			flip = getSquaredLineLength(v1) < getSquaredLineLength(v2),
			l1 = flip ? v2 : v1,
			l2 = flip ? v1 : v2,
			px = l1[0], py = l1[1],
			vx = l1[6] - px, vy = l1[7] - py;
		if (getDistance(px, py, vx, vy, l2[0], l2[1], true) < geomEpsilon &&
			getDistance(px, py, vx, vy, l2[6], l2[7], true) < geomEpsilon) {
			if (!straightBoth &&
				getDistance(px, py, vx, vy, l1[2], l1[3], true) < geomEpsilon &&
				getDistance(px, py, vx, vy, l1[4], l1[5], true) < geomEpsilon &&
				getDistance(px, py, vx, vy, l2[2], l2[3], true) < geomEpsilon &&
				getDistance(px, py, vx, vy, l2[4], l2[5], true) < geomEpsilon) {
				straight1 = straight2 = straightBoth = true;
			}
		} else if (straightBoth) {
			return null;
		}
		if (straight1 ^ straight2) {
			return null;
		}

		var v = [v1, v2],
			pairs = [];
		for (var i = 0; i < 4 && pairs.length < 2; i++) {
			var i1 = i & 1,
				i2 = i1 ^ 1,
				t1 = i >> 1,
				t2 = Curve.getTimeOf(v[i1], new Point(
					v[i2][t1 ? 6 : 0],
					v[i2][t1 ? 7 : 1]));
			if (t2 != null) {
				var pair = i1 ? [t1, t2] : [t2, t1];
				if (!pairs.length ||
					abs(pair[0] - pairs[0][0]) > timeEpsilon &&
					abs(pair[1] - pairs[0][1]) > timeEpsilon) {
					pairs.push(pair);
				}
			}
			if (i > 2 && !pairs.length)
				break;
		}
		if (pairs.length !== 2) {
			pairs = null;
		} else if (!straightBoth) {
			var o1 = Curve.getPart(v1, pairs[0][0], pairs[1][0]),
				o2 = Curve.getPart(v2, pairs[0][1], pairs[1][1]);
			if (abs(o2[2] - o1[2]) > geomEpsilon ||
				abs(o2[3] - o1[3]) > geomEpsilon ||
				abs(o2[4] - o1[4]) > geomEpsilon ||
				abs(o2[5] - o1[5]) > geomEpsilon)
				pairs = null;
		}
		return pairs;
	}

	function getTimesWithTangent(v, tangent) {
		var x0 = v[0], y0 = v[1],
			x1 = v[2], y1 = v[3],
			x2 = v[4], y2 = v[5],
			x3 = v[6], y3 = v[7],
			normalized = tangent.normalize(),
			tx = normalized.x,
			ty = normalized.y,
			ax = 3 * x3 - 9 * x2 + 9 * x1 - 3 * x0,
			ay = 3 * y3 - 9 * y2 + 9 * y1 - 3 * y0,
			bx = 6 * x2 - 12 * x1 + 6 * x0,
			by = 6 * y2 - 12 * y1 + 6 * y0,
			cx = 3 * x1 - 3 * x0,
			cy = 3 * y1 - 3 * y0,
			den = 2 * ax * ty - 2 * ay * tx,
			times = [];
		if (Math.abs(den) < Numerical.CURVETIME_EPSILON) {
			var num = ax * cy - ay * cx,
				den = ax * by - ay * bx;
			if (den != 0) {
				var t = -num / den;
				if (t >= 0 && t <= 1) times.push(t);
			}
		} else {
			var delta = (bx * bx - 4 * ax * cx) * ty * ty +
				(-2 * bx * by + 4 * ay * cx + 4 * ax * cy) * tx * ty +
				(by * by - 4 * ay * cy) * tx * tx,
				k = bx * ty - by * tx;
			if (delta >= 0 && den != 0) {
				var d = Math.sqrt(delta),
					t0 = -(k + d) / den,
					t1 = (-k + d) / den;
				if (t0 >= 0 && t0 <= 1) times.push(t0);
				if (t1 >= 0 && t1 <= 1) times.push(t1);
			}
		}
		return times;
	}

	return {
		getIntersections: function(curve) {
			var v1 = this.getValues(),
				v2 = curve && curve !== this && curve.getValues();
			return v2 ? getCurveIntersections(v1, v2, this, curve, [])
					  : getSelfIntersection(v1, this, []);
		},

		statics: {
			getOverlaps: getOverlaps,
			getIntersections: getIntersections,
			getCurveLineIntersections: getCurveLineIntersections,
			getTimesWithTangent: getTimesWithTangent
		}
	};
});

var CurveLocation = Base.extend({
	_class: 'CurveLocation',

	initialize: function CurveLocation(curve, time, point, _overlap, _distance) {
		if (time >= 0.99999999) {
			var next = curve.getNext();
			if (next) {
				time = 0;
				curve = next;
			}
		}
		this._setCurve(curve);
		this._time = time;
		this._point = point || curve.getPointAtTime(time);
		this._overlap = _overlap;
		this._distance = _distance;
		this._intersection = this._next = this._previous = null;
	},

	_setPath: function(path) {
		this._path = path;
		this._version = path ? path._version : 0;
	},

	_setCurve: function(curve) {
		this._setPath(curve._path);
		this._curve = curve;
		this._segment = null;
		this._segment1 = curve._segment1;
		this._segment2 = curve._segment2;
	},

	_setSegment: function(segment) {
		var curve = segment.getCurve();
		if (curve) {
			this._setCurve(curve);
		} else {
			this._setPath(segment._path);
			this._segment1 = segment;
			this._segment2 = null;
		}
		this._segment = segment;
		this._time = segment === this._segment1 ? 0 : 1;
		this._point = segment._point.clone();
	},

	getSegment: function() {
		var segment = this._segment;
		if (!segment) {
			var curve = this.getCurve(),
				time = this.getTime();
			if (time === 0) {
				segment = curve._segment1;
			} else if (time === 1) {
				segment = curve._segment2;
			} else if (time != null) {
				segment = curve.getPartLength(0, time)
					< curve.getPartLength(time, 1)
						? curve._segment1
						: curve._segment2;
			}
			this._segment = segment;
		}
		return segment;
	},

	getCurve: function() {
		var path = this._path,
			that = this;
		if (path && path._version !== this._version) {
			this._time = this._offset = this._curveOffset = this._curve = null;
		}

		function trySegment(segment) {
			var curve = segment && segment.getCurve();
			if (curve && (that._time = curve.getTimeOf(that._point)) != null) {
				that._setCurve(curve);
				return curve;
			}
		}

		return this._curve
			|| trySegment(this._segment)
			|| trySegment(this._segment1)
			|| trySegment(this._segment2.getPrevious());
	},

	getPath: function() {
		var curve = this.getCurve();
		return curve && curve._path;
	},

	getIndex: function() {
		var curve = this.getCurve();
		return curve && curve.getIndex();
	},

	getTime: function() {
		var curve = this.getCurve(),
			time = this._time;
		return curve && time == null
			? this._time = curve.getTimeOf(this._point)
			: time;
	},

	getParameter: '#getTime',

	getPoint: function() {
		return this._point;
	},

	getOffset: function() {
		var offset = this._offset;
		if (offset == null) {
			offset = 0;
			var path = this.getPath(),
				index = this.getIndex();
			if (path && index != null) {
				var curves = path.getCurves();
				for (var i = 0; i < index; i++)
					offset += curves[i].getLength();
			}
			this._offset = offset += this.getCurveOffset();
		}
		return offset;
	},

	getCurveOffset: function() {
		var offset = this._curveOffset;
		if (offset == null) {
			var curve = this.getCurve(),
				time = this.getTime();
			this._curveOffset = offset = time != null && curve
					&& curve.getPartLength(0, time);
		}
		return offset;
	},

	getIntersection: function() {
		return this._intersection;
	},

	getDistance: function() {
		return this._distance;
	},

	divide: function() {
		var curve = this.getCurve(),
			res = curve && curve.divideAtTime(this.getTime());
		if (res) {
			this._setSegment(res._segment1);
		}
		return res;
	},

	split: function() {
		var curve = this.getCurve(),
			path = curve._path,
			res = curve && curve.splitAtTime(this.getTime());
		if (res) {
			this._setSegment(path.getLastSegment());
		}
		return  res;
	},

	equals: function(loc, _ignoreOther) {
		var res = this === loc;
		if (!res && loc instanceof CurveLocation) {
			var c1 = this.getCurve(),
				c2 = loc.getCurve(),
				p1 = c1._path,
				p2 = c2._path;
			if (p1 === p2) {
				var abs = Math.abs,
					epsilon = 1e-7,
					diff = abs(this.getOffset() - loc.getOffset()),
					i1 = !_ignoreOther && this._intersection,
					i2 = !_ignoreOther && loc._intersection;
				res = (diff < epsilon
						|| p1 && abs(p1.getLength() - diff) < epsilon)
					&& (!i1 && !i2 || i1 && i2 && i1.equals(i2, true));
			}
		}
		return res;
	},

	toString: function() {
		var parts = [],
			point = this.getPoint(),
			f = Formatter.instance;
		if (point)
			parts.push('point: ' + point);
		var index = this.getIndex();
		if (index != null)
			parts.push('index: ' + index);
		var time = this.getTime();
		if (time != null)
			parts.push('time: ' + f.number(time));
		if (this._distance != null)
			parts.push('distance: ' + f.number(this._distance));
		return '{ ' + parts.join(', ') + ' }';
	},

	isTouching: function() {
		var inter = this._intersection;
		if (inter && this.getTangent().isCollinear(inter.getTangent())) {
			var curve1 = this.getCurve(),
				curve2 = inter.getCurve();
			return !(curve1.isStraight() && curve2.isStraight()
					&& curve1.getLine().intersect(curve2.getLine()));
		}
		return false;
	},

	isCrossing: function() {
		var inter = this._intersection;
		if (!inter)
			return false;
		var t1 = this.getTime(),
			t2 = inter.getTime(),
			tMin = 1e-8,
			tMax = 1 - tMin,
			t1Inside = t1 >= tMin && t1 <= tMax,
			t2Inside = t2 >= tMin && t2 <= tMax;
		if (t1Inside && t2Inside)
			return !this.isTouching();
		var c2 = this.getCurve(),
			c1 = c2 && t1 < tMin ? c2.getPrevious() : c2,
			c4 = inter.getCurve(),
			c3 = c4 && t2 < tMin ? c4.getPrevious() : c4;
		if (t1 > tMax)
			c2 = c2.getNext();
		if (t2 > tMax)
			c4 = c4.getNext();
		if (!c1 || !c2 || !c3 || !c4)
			return false;

		var offsets = [];

		function addOffsets(curve, end) {
			var v = curve.getValues(),
				roots = Curve.classify(v).roots || Curve.getPeaks(v),
				count = roots.length,
				offset = Curve.getLength(v,
					end && count ? roots[count - 1] : 0,
					!end && count ? roots[0] : 1);
			offsets.push(count ? offset : offset / 32);
		}

		function isInRange(angle, min, max) {
			return min < max
					? angle > min && angle < max
					: angle > min || angle < max;
		}

		if (!t1Inside) {
			addOffsets(c1, true);
			addOffsets(c2, false);
		}
		if (!t2Inside) {
			addOffsets(c3, true);
			addOffsets(c4, false);
		}
		var pt = this.getPoint(),
			offset = Math.min.apply(Math, offsets),
			v2 = t1Inside ? c2.getTangentAtTime(t1)
					: c2.getPointAt(offset).subtract(pt),
			v1 = t1Inside ? v2.negate()
					: c1.getPointAt(-offset).subtract(pt),
			v4 = t2Inside ? c4.getTangentAtTime(t2)
					: c4.getPointAt(offset).subtract(pt),
			v3 = t2Inside ? v4.negate()
					: c3.getPointAt(-offset).subtract(pt),
			a1 = v1.getAngle(),
			a2 = v2.getAngle(),
			a3 = v3.getAngle(),
			a4 = v4.getAngle();
		return !!(t1Inside
				? (isInRange(a1, a3, a4) ^ isInRange(a2, a3, a4)) &&
				  (isInRange(a1, a4, a3) ^ isInRange(a2, a4, a3))
				: (isInRange(a3, a1, a2) ^ isInRange(a4, a1, a2)) &&
				  (isInRange(a3, a2, a1) ^ isInRange(a4, a2, a1)));
	},

	hasOverlap: function() {
		return !!this._overlap;
	}
}, Base.each(Curve._evaluateMethods, function(name) {
	var get = name + 'At';
	this[name] = function() {
		var curve = this.getCurve(),
			time = this.getTime();
		return time != null && curve && curve[get](time, true);
	};
}, {
	preserve: true
}),
new function() {

	function insert(locations, loc, merge) {
		var length = locations.length,
			l = 0,
			r = length - 1;

		function search(index, dir) {
			for (var i = index + dir; i >= -1 && i <= length; i += dir) {
				var loc2 = locations[((i % length) + length) % length];
				if (!loc.getPoint().isClose(loc2.getPoint(),
						1e-7))
					break;
				if (loc.equals(loc2))
					return loc2;
			}
			return null;
		}

		while (l <= r) {
			var m = (l + r) >>> 1,
				loc2 = locations[m],
				found;
			if (merge && (found = loc.equals(loc2) ? loc2
					: (search(m, -1) || search(m, 1)))) {
				if (loc._overlap) {
					found._overlap = found._intersection._overlap = true;
				}
				return found;
			}
		var path1 = loc.getPath(),
			path2 = loc2.getPath(),
			diff = path1 !== path2
				? path1._id - path2._id
				: (loc.getIndex() + loc.getTime())
				- (loc2.getIndex() + loc2.getTime());
			if (diff < 0) {
				r = m - 1;
			} else {
				l = m + 1;
			}
		}
		locations.splice(l, 0, loc);
		return loc;
	}

	return { statics: {
		insert: insert,

		expand: function(locations) {
			var expanded = locations.slice();
			for (var i = locations.length - 1; i >= 0; i--) {
				insert(expanded, locations[i]._intersection, false);
			}
			return expanded;
		}
	}};
});

var PathItem = Item.extend({
	_class: 'PathItem',
	_selectBounds: false,
	_canScaleStroke: true,
	beans: true,

	initialize: function PathItem() {
	},

	statics: {
		create: function(arg) {
			var data,
				segments,
				compound;
			if (Base.isPlainObject(arg)) {
				segments = arg.segments;
				data = arg.pathData;
			} else if (Array.isArray(arg)) {
				segments = arg;
			} else if (typeof arg === 'string') {
				data = arg;
			}
			if (segments) {
				var first = segments[0];
				compound = first && Array.isArray(first[0]);
			} else if (data) {
				compound = (data.match(/m/gi) || []).length > 1
						|| /z\s*\S+/i.test(data);
			}
			var ctor = compound ? CompoundPath : Path;
			return new ctor(arg);
		}
	},

	_asPathItem: function() {
		return this;
	},

	isClockwise: function() {
		return this.getArea() >= 0;
	},

	setClockwise: function(clockwise) {
		if (this.isClockwise() != (clockwise = !!clockwise))
			this.reverse();
	},

	setPathData: function(data) {

		var parts = data && data.match(/[mlhvcsqtaz][^mlhvcsqtaz]*/ig),
			coords,
			relative = false,
			previous,
			control,
			current = new Point(),
			start = new Point();

		function getCoord(index, coord) {
			var val = +coords[index];
			if (relative)
				val += current[coord];
			return val;
		}

		function getPoint(index) {
			return new Point(
				getCoord(index, 'x'),
				getCoord(index + 1, 'y')
			);
		}

		this.clear();

		for (var i = 0, l = parts && parts.length; i < l; i++) {
			var part = parts[i],
				command = part[0],
				lower = command.toLowerCase();
			coords = part.match(/[+-]?(?:\d*\.\d+|\d+\.?)(?:[eE][+-]?\d+)?/g);
			var length = coords && coords.length;
			relative = command === lower;
			if (previous === 'z' && !/[mz]/.test(lower))
				this.moveTo(current);
			switch (lower) {
			case 'm':
			case 'l':
				var move = lower === 'm';
				for (var j = 0; j < length; j += 2) {
					this[move ? 'moveTo' : 'lineTo'](current = getPoint(j));
					if (move) {
						start = current;
						move = false;
					}
				}
				control = current;
				break;
			case 'h':
			case 'v':
				var coord = lower === 'h' ? 'x' : 'y';
				current = current.clone();
				for (var j = 0; j < length; j++) {
					current[coord] = getCoord(j, coord);
					this.lineTo(current);
				}
				control = current;
				break;
			case 'c':
				for (var j = 0; j < length; j += 6) {
					this.cubicCurveTo(
							getPoint(j),
							control = getPoint(j + 2),
							current = getPoint(j + 4));
				}
				break;
			case 's':
				for (var j = 0; j < length; j += 4) {
					this.cubicCurveTo(
							/[cs]/.test(previous)
									? current.multiply(2).subtract(control)
									: current,
							control = getPoint(j),
							current = getPoint(j + 2));
					previous = lower;
				}
				break;
			case 'q':
				for (var j = 0; j < length; j += 4) {
					this.quadraticCurveTo(
							control = getPoint(j),
							current = getPoint(j + 2));
				}
				break;
			case 't':
				for (var j = 0; j < length; j += 2) {
					this.quadraticCurveTo(
							control = (/[qt]/.test(previous)
									? current.multiply(2).subtract(control)
									: current),
							current = getPoint(j));
					previous = lower;
				}
				break;
			case 'a':
				for (var j = 0; j < length; j += 7) {
					this.arcTo(current = getPoint(j + 5),
							new Size(+coords[j], +coords[j + 1]),
							+coords[j + 2], +coords[j + 4], +coords[j + 3]);
				}
				break;
			case 'z':
				this.closePath(1e-12);
				current = start;
				break;
			}
			previous = lower;
		}
	},

	_canComposite: function() {
		return !(this.hasFill() && this.hasStroke());
	},

	_contains: function(point) {
		var winding = point.isInside(
				this.getBounds({ internal: true, handle: true }))
					? this._getWinding(point)
					: {};
		return winding.onPath || !!(this.getFillRule() === 'evenodd'
				? winding.windingL & 1 || winding.windingR & 1
				: winding.winding);
	},

	getIntersections: function(path, include, _matrix, _returnFirst) {
		var self = this === path || !path,
			matrix1 = this._matrix._orNullIfIdentity(),
			matrix2 = self ? matrix1
				: (_matrix || path._matrix)._orNullIfIdentity();
		return self || this.getBounds(matrix1).intersects(
				path.getBounds(matrix2), 1e-12)
				? Curve.getIntersections(
						this.getCurves(), !self && path.getCurves(), include,
						matrix1, matrix2, _returnFirst)
				: [];
	},

	getCrossings: function(path) {
		return this.getIntersections(path, function(inter) {
			return inter.isCrossing();
		});
	},

	getNearestLocation: function() {
		var point = Point.read(arguments),
			curves = this.getCurves(),
			minDist = Infinity,
			minLoc = null;
		for (var i = 0, l = curves.length; i < l; i++) {
			var loc = curves[i].getNearestLocation(point);
			if (loc._distance < minDist) {
				minDist = loc._distance;
				minLoc = loc;
			}
		}
		return minLoc;
	},

	setColor: function(c){
		this.strokeColor = c;
		this.fillColor = c;
	},
	getColor: function(){
		return this.fillColor || this.strokeColor;
	},
	getNearestPoint: function() {
		var loc = this.getNearestLocation.apply(this, arguments);
		return loc ? loc.getPoint() : loc;
	},

	interpolate: function(from, to, factor) {
		var isPath = !this._children,
			name = isPath ? '_segments' : '_children',
			itemsFrom = from[name],
			itemsTo = to[name],
			items = this[name];
		if (!itemsFrom || !itemsTo || itemsFrom.length !== itemsTo.length) {
			throw new Error('Invalid operands in interpolate() call: ' +
					from + ', ' + to);
		}
		var current = items.length,
			length = itemsTo.length;
		if (current < length) {
			var ctor = isPath ? Segment : Path;
			for (var i = current; i < length; i++) {
				this.add(new ctor());
			}
		} else if (current > length) {
			this[isPath ? 'removeSegments' : 'removeChildren'](length, current);
		}
		for (var i = 0; i < length; i++) {
			items[i].interpolate(itemsFrom[i], itemsTo[i], factor);
		}
		if (isPath) {
			this.setClosed(from._closed);
			this._changed(9);
		}
	},

	compare: function(path) {
		var ok = false;
		if (path) {
			var paths1 = this._children || [this],
				paths2 = path._children ? path._children.slice() : [path],
				length1 = paths1.length,
				length2 = paths2.length,
				matched = [],
				count = 0;
			ok = true;
			var boundsOverlaps = CollisionDetection.findItemBoundsCollisions(paths1, paths2, Numerical.GEOMETRIC_EPSILON);
			for (var i1 = length1 - 1; i1 >= 0 && ok; i1--) {
				var path1 = paths1[i1];
				ok = false;
				var pathBoundsOverlaps = boundsOverlaps[i1];
				if (pathBoundsOverlaps) {
					for (var i2 = pathBoundsOverlaps.length - 1; i2 >= 0 && !ok; i2--) {
						if (path1.compare(paths2[pathBoundsOverlaps[i2]])) {
							if (!matched[pathBoundsOverlaps[i2]]) {
								matched[pathBoundsOverlaps[i2]] = true;
								count++;
							}
							ok = true;
						}
					}
				}
			}
			ok = ok && count === length2;
		}
		return ok;
	},

});

var Path = PathItem.extend({
	_class: 'Path',
	_serializeFields: {
		segments: [],
		closed: false,
		tips: 'none',
		tipsLoc: 'none'
	},

	initialize: function Path(arg) {
		this._closed = false;
		this._segments = [];
		this._version = 0;
		this._tips= 'none';
		this._tipsLoc= 'end';
		this._tipsShape= null;
		this._tipsAngle= 0;
		this._vertexDraggable=false;
		this. _hitSegment=null;
		this.duration = 0;
		this._svg = null;
		var args = arguments,
			segments = Array.isArray(arg)
			? typeof arg[0] === 'object'
				? arg
				: args
			: arg && (arg.size === undefined && (arg.x !== undefined
					|| arg.point !== undefined))
				? args
				: null;
		if (segments && segments.length > 0) {
			this.setSegments(segments);
		} else {
			this._curves = undefined;
			this._segmentSelection = 0;
			if (!segments && typeof arg === 'string') {
				this.setPathData(arg);
				arg = null;
			}
		}
		this._initialize(!segments && arg);
	},
	resetPathData: function(pathDataStr){
		this._closed = false;
		this._segments = [];
		this._curves = undefined;
		this._segmentSelection = 0;
		if( pathDataStr )
			this.setPathData(pathDataStr);
	},
	write: function(timeline, duration, offset,  doneCallback) {
		this._write0(timeline, duration, offset,   true, doneCallback);
	},

	unwrite: function(timeline, duration, offset,  doneCallback) {
		this._write0(timeline, duration, offset,   false, doneCallback);
	},

	_write0: function(timeline, duration, offset, create, doneCallback) {
		var that = this;
		this.duration = duration;
		timeline.add({
				targets : this,
				progressFunc : function(progress){
					 that._progress = create ? progress : 1 - progress;
					 that._changed(41);
				}.bind(this),
				duration : duration,
				complete: doneCallback
		   }, offset);
		return true;
	 },

	start: function(duration, startAniTime, repeat, doneCallback) {
		if( this.path_animator && this.getUpdater( this.path_animator.id) != null){
			return false;
		}
		var that = this;
		this.duration = duration;
		startAniTime = startAniTime || 0;
		repeat = repeat || false;
		if( !this.path_animator || this.getUpdater( this.path_animator.id) == null){
			this.path_animator = new Updater({
				host : this,
				func : function(e, progress){
					 that._progress = progress;
					 that._changed(9);
				},
				duration : that.duration,
				startAniTime:  startAniTime,
				repeat :  repeat,
				doneCallback: doneCallback
		   });
		   this.addUpdater( this.path_animator );
		}
		this.path_animator.resume(  );
		return true;
	 },
	resume: function() {
		if( this.path_animator )
			this.path_animator.resume();
	},
	 pause: function() {
		 if( this.path_animator )
			 this.path_animator.pause();
	 },
	_equals: function(item) {
		return this._closed === item._closed
				&& Base.equals(this._segments, item._segments);
	},

	copyContent: function(source) {
		this.setSegments(source._segments);
		this._closed = source._closed;
	},

	_changed: function _changed(flags) {
		_changed.base.call(this, flags);
		if (flags & 8) {
			this._length = this._area = undefined;
			if (flags & 32) {
				this._version++;
			} else if (this._curves) {
			   for (var i = 0, l = this._curves.length; i < l; i++)
					this._curves[i]._changed();
			}
		} else if (flags & 64) {
			this._bounds = undefined;
		}
	},

	getStyle: function() {
		var parent = this._parent;
		return (parent instanceof CompoundPath ? parent : this)._style;
	},

	setTips: function(tips){
		if( this._tips == tips )
			return;
		if( tips )
			this._tips = tips;
		this._setTips2( this.length );
	},
	_setTips2: function(offset){
		var point = this.getPointAt(offset), tips = this._tips,
			tipcolor = this._style.fillColor || this._style.strokeColor,
			ws = this._style.strokeWidth;
		if( ws == 1 ) ws = 4;
		else if( ws == 2 ) ws = 6;
		else if( ws == 3 ) ws = 8;
		else ws = ws* 2;
		if( tips == 'none' ){
			if( this._tipsShape != null )
				this._tipsShape.remove();
			this._tipsShape = null;
			return;
		} else if( tips == 'arrow' ){
			var ps = 3, tangent = this.getTangentAt(offset), angle = tangent.angle - 30;
			var radius2 = ws;
			this._tipsShape = new Path.RegularPolygon({
				center: point,
				sides: ps,
				radius: radius2});
			this._tipsShape.rotate( angle );
			this._tipsShape.strokeColor = tipcolor;
			this._tipsShape.fillColor = tipcolor;
			this._tipsAngle = angle;

		} else if( tips == 'square' ){
			var ps = 4;
			var radius2 = ws;
			this._tipsShape = new Path.RegularPolygon({
				center: point,
				sides: ps,
				radius: radius2});
			this._tipsShape.strokeColor = tipcolor;
			this._tipsShape.fillColor = tipcolor;
		} else if( tips == 'circle' ){
			this._tipsShape = new Path.Circle({
				center: point,
				radius: ws,
				strokeColor: tipcolor,
				fillColor: tipcolor
			});
		} else if( tips == 'star' ){
			var ps = 8;
			var radius1 = ws/2;
			var radius2 = ws;
			this._tipsShape = new Path.Star({
				center: point,
				points: ps,
				radius1: radius1,
				radius2: radius2
			});
			this._tipsShape.strokeColor = tipcolor;
			this._tipsShape.fillColor = tipcolor;
		} else if( tips == 'polygon' ){
			var ps = 5;
			var radius2 = ws;
			this._tipsShape = new Path.RegularPolygon({
				center: point,
				sides: ps,
				radius: radius2
			});
			this._tipsShape.strokeColor = tipcolor;
			this._tipsShape.fillColor = tipcolor;
		}
		this._tipsShape.visible = false;
	},

	_sync_tip_locs: function( ){
		var offset = this.length,point = this.getPointAt(offset), tips = this._tips;
		if( tips == 'none' || !this._tipsShape ){
		   return;
		}
		this._tipsShape.position = point;
		if( tips == 'arrow' ){
		   var ps = 3, tangent = this.getTangentAt(offset), angle = tangent.angle - 30;
		   this._tipsShape.rotate( angle - this._tipsAngle );
		   this._tipsAngle = angle;
		}
   },

	getTips: function(){
		return this._tips;
	},

	setTipsLoc: function(tipsLoc){
		if( this._tipsLoc == tipsLoc )
			return;
		this._tipsLoc = tipsLoc;
	},

	getTipsLoc: function(){
		return this._tipsLoc;
	},

	setVertexDraggable: function(draggable){
		if( this._vertexDraggable == draggable ) return;
		this._vertexDraggable = draggable;
		this._hitSegment = null;
		var project = this._project, that = this;
		function onMouseDown(event) {
			that._hitSegment  = null;
			var hitResult = project.hitTest(event.point,  {
				segments: true,
				stroke: true,
				fill: true,
				tolerance: 10
				});
			if (!hitResult || hitResult.item != that )
				return;
			if (hitResult.type == 'segment') {
				that._hitSegment = hitResult.segment;
			} else if (hitResult.type == 'stroke') {
			}
		}

		function onMouseMove(event) {
			project.activeLayer.selected = false;
			if (event.item)
				event.item.selected = true;
		}
		function onMouseDrag(event) {
			if (that._hitSegment) {
				that._hitSegment._point.x += event.delta.x;
				that._hitSegment._point.y += event.delta.y;
				that._changed(41);
			}
		}
		if( draggable ){
			that.on('mousemove', onMouseMove);
			that.on('mousedrag', onMouseDrag);
			that.on('mousedown', onMouseDown);
		} else {
			that.off('mousemove', onMouseMove);
			that.off('mousedrag', onMouseDrag);
			that.off('mousedown', onMouseDown);
		}
	},
	isVertexDraggable: function(){
		return this._vertexDraggable;
	},
	getSegments: function() {
		return this._segments;
	},

	setSegments: function(segments) {
		var fullySelected = this.isFullySelected(),
			length = segments && segments.length;
		this._segments.length = 0;
		this._segmentSelection = 0;
		this._curves = undefined;
		if (length) {
			var last = segments[length - 1];
			if (typeof last === 'boolean') {
				this.setClosed(last);
				length--;
			}
			this._add(Segment.readList(segments, 0, {}, length));
		}
		if (fullySelected)
			this.setFullySelected(true);
	},

	getFirstSegment: function() {
		return this._segments[0];
	},

	getLastSegment: function() {
		return this._segments[this._segments.length - 1];
	},

	getCurves: function() {
		var curves = this._curves,
			segments = this._segments;
		if (!curves) {
			var length = this._countCurves();
			curves = this._curves = new Array(length);
			for (var i = 0; i < length; i++)
				curves[i] = new Curve(this, segments[i],
					segments[i + 1] || segments[0]);
		}
		return curves;
	},

	getFirstCurve: function() {
		return this.getCurves()[0];
	},

	getLastCurve: function() {
		var curves = this.getCurves();
		return curves[curves.length - 1];
	},

	isClosed: function() {
		return this._closed;
	},

	setClosed: function(closed) {
		if (this._closed != (closed = !!closed)) {
			this._closed = closed;
			if (this._curves) {
				var length = this._curves.length = this._countCurves();
				if (closed)
					this._curves[length - 1] = new Curve(this,
						this._segments[length - 1], this._segments[0]);
			}
			this._changed(41);
		}
	}
}, {
	beans: true,

	getPathData: function(_matrix, _precision) {
		var segments = this._segments,
			length = segments.length,
			f = new Formatter(_precision),
			coords = new Array(6),
			first = true,
			curX, curY,
			prevX, prevY,
			inX, inY,
			outX, outY,
			parts = [];

		function addSegment(segment, skipLine) {
			segment._transformCoordinates(_matrix, coords);
			curX = coords[0];
			curY = coords[1];
			if (first) {
				parts.push('M' + f.pair(curX, curY));
				first = false;
			} else {
				inX = coords[2];
				inY = coords[3];
				if (inX === curX && inY === curY
						&& outX === prevX && outY === prevY) {
					if (!skipLine) {
						var dx = curX - prevX,
							dy = curY - prevY;
						parts.push(
							  dx === 0 ? 'v' + f.number(dy)
							: dy === 0 ? 'h' + f.number(dx)
							: 'l' + f.pair(dx, dy));
					}
				} else {
					parts.push('c' + f.pair(outX - prevX, outY - prevY)
							 + ' ' + f.pair( inX - prevX,  inY - prevY)
							 + ' ' + f.pair(curX - prevX, curY - prevY));
				}
			}
			prevX = curX;
			prevY = curY;
			outX = coords[4];
			outY = coords[5];
		}

		if (!length)
			return '';

		for (var i = 0; i < length; i++)
			addSegment(segments[i]);
		if (this._closed && length > 0) {
			addSegment(segments[0], true);
			parts.push('z');
		}
		return parts.join('');
	},

	isEmpty: function() {
		return !this._segments.length;
	},

	_transformContent: function(matrix) {
		var segments = this._segments,
			coords = new Array(6);
		for (var i = 0, l = segments.length; i < l; i++)
			segments[i]._transformCoordinates(matrix, coords, true);
		return true;
	},

	_add: function(segs, index) {
		var segments = this._segments,
			curves = this._curves,
			amount = segs.length,
			append = index == null,
			index = append ? segments.length : index;
		for (var i = 0; i < amount; i++) {
			var segment = segs[i];
			if (segment._path)
				segment = segs[i] = segment.clone();
			segment._path = this;
			segment._index = index + i;
			if (segment._selection)
				this._updateSelection(segment, 0, segment._selection);
		}
		if (append) {
			Base.push(segments, segs);
		} else {
			segments.splice.apply(segments, [index, 0].concat(segs));
			for (var i = index + amount, l = segments.length; i < l; i++)
				segments[i]._index = i;
		}
		if (curves) {
			var total = this._countCurves(),
				start = index > 0 && index + amount - 1 === total ? index - 1
					: index,
				insert = start,
				end = Math.min(start + amount, total);
			if (segs._curves) {
				curves.splice.apply(curves, [start, 0].concat(segs._curves));
				insert += segs._curves.length;
			}
			for (var i = insert; i < end; i++)
				curves.splice(i, 0, new Curve(this, null, null));
			this._adjustCurves(start, end);
		}
		this._changed(41);
		return segs;
	},

	_adjustCurves: function(start, end) {
		var segments = this._segments,
			curves = this._curves,
			curve;
		for (var i = start; i < end; i++) {
			curve = curves[i];
			curve._path = this;
			curve._segment1 = segments[i];
			curve._segment2 = segments[i + 1] || segments[0];
			curve._changed();
		}
		if (curve = curves[this._closed && !start ? segments.length - 1
				: start - 1]) {
			curve._segment2 = segments[start] || segments[0];
			curve._changed();
		}
		if (curve = curves[end]) {
			curve._segment1 = segments[end];
			curve._changed();
		}
	},

	_countCurves: function() {
		var length = this._segments.length;
		return !this._closed && length > 0 ? length - 1 : length;
	},

	add: function(segment1 ) {
		var args = arguments;
		return args.length > 1 && typeof segment1 !== 'number'
			? this._add(Segment.readList(args))
			: this._add([ Segment.read(args) ])[0];
	},

	insertExtraSegments: function(numPoints){
		if( numPoints <= 0 ) return;
		var that = this, newpoints = [], i = 0, curves = that.getCurves().slice(), cur_curve;
		if( curves.length == 0 ) return;
		while( i < numPoints ){
			curves.sort((a, b) => b.length - a.length);
			cur_curve = curves[0];
			var offset = that.getOffsetOf(cur_curve.point1) + cur_curve.length/2;
			var newpoint = that.getPointAt(offset);
			var tangent =  that.getTangentAt(offset);
			if( newpoint ){
				that.insert(cur_curve.index+1, new Segment(newpoint));
			}
			else
				that.insert(cur_curve.index+1, new Segment( cur_curve.point1 ));
			newpoints.push(newpoint);
			curves.splice(0,1);
			var cc = that.getCurves();
			curves.push( cc[cur_curve.index] )
			curves.push( cc[cur_curve.index+1] )
			i++;
		}
		return newpoints;
	},

	insert: function(index, segment1 ) {
		var args = arguments;
		return args.length > 2 && typeof segment1 !== 'number'
			? this._add(Segment.readList(args, 1), index)
			: this._add([ Segment.read(args, 1) ], index)[0];
	},

	addSegment: function() {
		return this._add([ Segment.read(arguments) ])[0];
	},

	insertSegment: function(index ) {
		return this._add([ Segment.read(arguments, 1) ], index)[0];
	},

	addSegments: function(segments) {
		return this._add(Segment.readList(segments));
	},

	insertSegments: function(index, segments) {
		return this._add(Segment.readList(segments), index);
	},

	removeSegment: function(index) {
		return this.removeSegments(index, index + 1)[0] || null;
	},

	removeSegments: function(start, end, _includeCurves) {
		start = start || 0;
		end = Base.pick(end, this._segments.length);
		var segments = this._segments,
			curves = this._curves,
			count = segments.length,
			removed = segments.splice(start, end - start),
			amount = removed.length;
		if (!amount)
			return removed;
		for (var i = 0; i < amount; i++) {
			var segment = removed[i];
			if (segment._selection)
				this._updateSelection(segment, segment._selection, 0);
			segment._index = segment._path = null;
		}
		for (var i = start, l = segments.length; i < l; i++)
			segments[i]._index = i;
		if (curves) {
			var index = start > 0 && end === count + (this._closed ? 1 : 0)
					? start - 1
					: start,
				curves = curves.splice(index, amount);
			for (var i = curves.length - 1; i >= 0; i--)
				curves[i]._path = null;
			if (_includeCurves)
				removed._curves = curves.slice(1);
			this._adjustCurves(index, index);
		}
		this._changed(41);
		return removed;
	},

	clear: '#removeSegments',

	hasHandles: function() {
		var segments = this._segments;
		for (var i = 0, l = segments.length; i < l; i++) {
			if (segments[i].hasHandles())
				return true;
		}
		return false;
	},

	clearHandles: function() {
		var segments = this._segments;
		for (var i = 0, l = segments.length; i < l; i++)
			segments[i].clearHandles();
	},

	getLength: function() {
		if (this._length == null) {
			var curves = this.getCurves(),
				length = 0;
			for (var i = 0, l = curves.length; i < l; i++)
				length += curves[i].getLength();
			this._length = length;
		}
		return this._length;
	},

	getArea: function() {
		var area = this._area;
		if (area == null) {
			var segments = this._segments,
				closed = this._closed;
			area = 0;
			for (var i = 0, l = segments.length; i < l; i++) {
				var last = i + 1 === l;
				area += Curve.getArea(Curve.getValues(
						segments[i], segments[last ? 0 : i + 1],
						null, last && !closed));
			}
			this._area = area;
		}
		return area;
	},

	isFullySelected: function() {
		var length = this._segments.length;
		return this.isSelected() && length > 0 && this._segmentSelection
				=== length * 7;
	},

	setFullySelected: function(selected) {
		if (selected)
			this._selectSegments(true);
		this.setSelected(selected);
	},

	setSelection: function setSelection(selection) {
		if (!(selection & 1))
			this._selectSegments(false);
		setSelection.base.call(this, selection);
	},

	_selectSegments: function(selected) {
		var segments = this._segments,
			length = segments.length,
			selection = selected ? 7 : 0;
		this._segmentSelection = selection * length;
		for (var i = 0; i < length; i++)
			segments[i]._selection = selection;
	},

	_updateSelection: function(segment, oldSelection, newSelection) {
		segment._selection = newSelection;
		var selection = this._segmentSelection += newSelection - oldSelection;
		if (selection > 0)
			this.setSelected(true);
	},

	divideAt: function(location) {
		var loc = this.getLocationAt(location),
			curve;
		return loc && (curve = loc.getCurve().divideAt(loc.getCurveOffset()))
				? curve._segment1
				: null;
	},

	cloneSubPath: function(start_offset, end_offset){
		var loc0 = this.getLocationAt(start_offset), index0 = loc0 && loc0.index, time0 = loc0 && loc0.time,
			loc1 = this.getLocationAt(end_offset), index1 = loc1 && loc1.index, time1 = loc1 && loc1.time,
			tMin = 1e-8,
			tMax = 1 - tMin;
		if (time0 > tMax) {
			index0++;
			time0 = 0;
		}
		if (time1 > tMax) {
			index1++;
			time1 = 0;
		}
		var path = new Path(Item.NO_INSERT);
		 path.insertAbove(this);
		path.copyAttributes(this);
		var segments = this._segments, selength = segments.length,  curves = this._curves;
		for(var i = index0; i <= index1 ; i++){
			var seg = segments[i].clone();
			seg._index = i - index0 ;
			seg._path = path;
			path.add(seg)
		}
		if( (curves.length == segments.length) && (index1 == curves.length-1) ){
			var seg = segments[0].clone();
			seg._index = index1 - index0 +1 ;
			seg._path = path;
			path.add(seg);
		} else {
			if( segments.length > index1 +1 ){
				var seg = segments[index1+1].clone();
				seg._index = index1 - index0 +1 ;
				seg._path = path;
				path.add(seg);
			}
		}

		path._changed(41);
		var offset = 0;
		for(var i = 0; i < index0; i++){
			offset += curves[i].length;
		}
		var path2 = path.splitAt(end_offset - offset);
		if( path2 )  path2.remove();
		var path3 = path.splitAt(start_offset - offset );
		path.remove();
		return path3;
	},

	splitAt: function(location) {
		var loc = this.getLocationAt(location),
			index = loc && loc.index,
			time = loc && loc.time,
			tMin = 1e-8,
			tMax = 1 - tMin;
		if (time > tMax) {
			index++;
			time = 0;
		}
		var curves = this.getCurves();
		if (index >= 0 && index < curves.length) {
			if (time >= tMin) {
				curves[index++].divideAtTime(time);
			}
			var segs = this.removeSegments(index, this._segments.length, true),
				path;
			if (this._closed) {
				this.setClosed(false);
				path = this;
			} else {
				path = new Path(Item.NO_INSERT);
				path.insertAbove(this);
				path.copyAttributes(this);
			}
			path._add(segs, 0);
			this.addSegment(segs[0]);
			return path;
		}
		return null;
	},

	split: function(index, time) {
		var curve,
			location = time === undefined ? index
				: (curve = this.getCurves()[index])
					&& curve.getLocationAtTime(time);
		return location != null ? this.splitAt(location) : null;
	},

	join: function(path, tolerance) {
		var epsilon = tolerance || 0;
		if (path && path !== this) {
			var segments = path._segments,
				last1 = this.getLastSegment(),
				last2 = path.getLastSegment();
			if (!last2)
				return this;
			if (last1 && last1._point.isClose(last2._point, epsilon))
				path.reverse();
			var first2 = path.getFirstSegment();
			if (last1 && last1._point.isClose(first2._point, epsilon)) {
				last1.setHandleOut(first2._handleOut);
				this._add(segments.slice(1));
			} else {
				var first1 = this.getFirstSegment();
				if (first1 && first1._point.isClose(first2._point, epsilon))
					path.reverse();
				last2 = path.getLastSegment();
				if (first1 && first1._point.isClose(last2._point, epsilon)) {
					first1.setHandleIn(last2._handleIn);
					this._add(segments.slice(0, segments.length - 1), 0);
				} else {
					this._add(segments.slice());
				}
			}
			if (path._closed)
				this._add([segments[0]]);
			path.remove();
		}
		var first = this.getFirstSegment(),
			last = this.getLastSegment();
		if (first !== last && first._point.isClose(last._point, epsilon)) {
			first.setHandleIn(last._handleIn);
			last.remove();
			this.setClosed(true);
		}
		return this;
	},

	reduce: function(options) {
		var curves = this.getCurves(),
			simplify = options && options.simplify,
			tolerance = simplify ? 1e-7 : 0;
		for (var i = curves.length - 1; i >= 0; i--) {
			var curve = curves[i];
			if (!curve.hasHandles() && (!curve.hasLength(tolerance)
					|| simplify && curve.isCollinear(curve.getNext())))
				curve.remove();
		}
		return this;
	},

	reverse: function() {
		this._segments.reverse();
		for (var i = 0, l = this._segments.length; i < l; i++) {
			var segment = this._segments[i];
			var handleIn = segment._handleIn;
			segment._handleIn = segment._handleOut;
			segment._handleOut = handleIn;
			segment._index = i;
		}
		this._curves = null;
		this._changed(9);
	},

	flatten: function(flatness) {
		var flattener = new PathFlattener(this, flatness || 0.25, 256, true),
			parts = flattener.parts,
			length = parts.length,
			segments = [];
		for (var i = 0; i < length; i++) {
			segments.push(new Segment(parts[i].curve.slice(0, 2)));
		}
		if (!this._closed && length > 0) {
			segments.push(new Segment(parts[length - 1].curve.slice(6)));
		}
		this.setSegments(segments);
	},

	simplify: function(tolerance) {
		var segments = new PathFitter(this).fit(tolerance || 2.5);
		if (segments)
			this.setSegments(segments);
		return !!segments;
	},

	smooth: function(options) {
		var that = this,
			opts = options || {},
			type = opts.type || 'asymmetric',
			segments = this._segments,
			length = segments.length,
			closed = this._closed;

		function getIndex(value, _default) {
			var index = value && value.index;
			if (index != null) {
				var path = value.path;
				if (path && path !== that)
					throw new Error(value._class + ' ' + index + ' of ' + path
							+ ' is not part of ' + that);
				if (_default && value instanceof Curve)
					index++;
			} else {
				index = typeof value === 'number' ? value : _default;
			}
			return Math.min(index < 0 && closed
					? index % length
					: index < 0 ? index + length : index, length - 1);
		}

		var loop = closed && opts.from === undefined && opts.to === undefined,
			from = getIndex(opts.from, 0),
			to = getIndex(opts.to, length - 1);

		if (from > to) {
			if (closed) {
				from -= length;
			} else {
				var tmp = from;
				from = to;
				to = tmp;
			}
		}
		if (/^(?:asymmetric|continuous)$/.test(type)) {
			var asymmetric = type === 'asymmetric',
				min = Math.min,
				amount = to - from + 1,
				n = amount - 1,
				padding = loop ? min(amount, 4) : 1,
				paddingLeft = padding,
				paddingRight = padding,
				knots = [];
			if (!closed) {
				paddingLeft = min(1, from);
				paddingRight = min(1, length - to - 1);
			}
			n += paddingLeft + paddingRight;
			if (n <= 1)
				return;
			for (var i = 0, j = from - paddingLeft; i <= n; i++, j++) {
				knots[i] = segments[(j < 0 ? j + length : j) % length]._point;
			}

			var x = knots[0]._x + 2 * knots[1]._x,
				y = knots[0]._y + 2 * knots[1]._y,
				f = 2,
				n_1 = n - 1,
				rx = [x],
				ry = [y],
				rf = [f],
				px = [],
				py = [];
			for (var i = 1; i < n; i++) {
				var internal = i < n_1,
					a = internal ? 1 : asymmetric ? 1 : 2,
					b = internal ? 4 : asymmetric ? 2 : 7,
					u = internal ? 4 : asymmetric ? 3 : 8,
					v = internal ? 2 : asymmetric ? 0 : 1,
					m = a / f;
				f = rf[i] = b - m;
				x = rx[i] = u * knots[i]._x + v * knots[i + 1]._x - m * x;
				y = ry[i] = u * knots[i]._y + v * knots[i + 1]._y - m * y;
			}

			px[n_1] = rx[n_1] / rf[n_1];
			py[n_1] = ry[n_1] / rf[n_1];
			for (var i = n - 2; i >= 0; i--) {
				px[i] = (rx[i] - px[i + 1]) / rf[i];
				py[i] = (ry[i] - py[i + 1]) / rf[i];
			}
			px[n] = (3 * knots[n]._x - px[n_1]) / 2;
			py[n] = (3 * knots[n]._y - py[n_1]) / 2;

			for (var i = paddingLeft, max = n - paddingRight, j = from;
					i <= max; i++, j++) {
				var segment = segments[j < 0 ? j + length : j],
					pt = segment._point,
					hx = px[i] - pt._x,
					hy = py[i] - pt._y;
				if (loop || i < max)
					segment.setHandleOut(hx, hy);
				if (loop || i > paddingLeft)
					segment.setHandleIn(-hx, -hy);
			}
		} else {
			for (var i = from; i <= to; i++) {
				segments[i < 0 ? i + length : i].smooth(opts,
						!loop && i === from, !loop && i === to);
			}
		}
	},

	toShape: function(insert) {
		if (!this._closed)
			return null;

		var segments = this._segments,
			type,
			size,
			radius,
			topCenter;

		function isCollinear(i, j) {
			var seg1 = segments[i],
				seg2 = seg1.getNext(),
				seg3 = segments[j],
				seg4 = seg3.getNext();
			return seg1._handleOut.isZero() && seg2._handleIn.isZero()
					&& seg3._handleOut.isZero() && seg4._handleIn.isZero()
					&& seg2._point.subtract(seg1._point).isCollinear(
						seg4._point.subtract(seg3._point));
		}

		function isOrthogonal(i) {
			var seg2 = segments[i],
				seg1 = seg2.getPrevious(),
				seg3 = seg2.getNext();
			return seg1._handleOut.isZero() && seg2._handleIn.isZero()
					&& seg2._handleOut.isZero() && seg3._handleIn.isZero()
					&& seg2._point.subtract(seg1._point).isOrthogonal(
						seg3._point.subtract(seg2._point));
		}

		function isArc(i) {
			var seg1 = segments[i],
				seg2 = seg1.getNext(),
				handle1 = seg1._handleOut,
				handle2 = seg2._handleIn,
				kappa = 0.5522847498307936;
			if (handle1.isOrthogonal(handle2)) {
				var pt1 = seg1._point,
					pt2 = seg2._point,
					corner = new Line(pt1, handle1, true).intersect(
							new Line(pt2, handle2, true), true);
				return corner && Numerical.isZero(handle1.getLength() /
						corner.subtract(pt1).getLength() - kappa)
					&& Numerical.isZero(handle2.getLength() /
						corner.subtract(pt2).getLength() - kappa);
			}
			return false;
		}

		function getDistance(i, j) {
			return segments[i]._point.getDistance(segments[j]._point);
		}

		if (!this.hasHandles() && segments.length === 4
				&& isCollinear(0, 2) && isCollinear(1, 3) && isOrthogonal(1)) {
			type = Shape.Rectangle;
			size = new Size(getDistance(0, 3), getDistance(0, 1));
			topCenter = segments[1]._point.add(segments[2]._point).divide(2);
		} else if (segments.length === 8 && isArc(0) && isArc(2) && isArc(4)
				&& isArc(6) && isCollinear(1, 5) && isCollinear(3, 7)) {
			type = Shape.Rectangle;
			size = new Size(getDistance(1, 6), getDistance(0, 3));
			radius = size.subtract(new Size(getDistance(0, 7),
					getDistance(1, 2))).divide(2);
			topCenter = segments[3]._point.add(segments[4]._point).divide(2);
		} else if (segments.length === 4
				&& isArc(0) && isArc(1) && isArc(2) && isArc(3)) {
			if (Numerical.isZero(getDistance(0, 2) - getDistance(1, 3))) {
				type = Shape.Circle;
				radius = getDistance(0, 2) / 2;
			} else {
				type = Shape.Ellipse;
				radius = new Size(getDistance(2, 0) / 2, getDistance(3, 1) / 2);
			}
			topCenter = segments[1]._point;
		}

		if (type) {
			var center = this.getPosition(true),
				shape = new type({
					center: center,
					size: size,
					radius: radius,
					insert: false
				});
			shape.copyAttributes(this, true);
			shape._matrix.prepend(this._matrix);
			shape.rotate(topCenter.subtract(center).getAngle() + 90);
			if (insert === undefined || insert)
				shape.insertAbove(this);
			return shape;
		}
		return null;
	},

	toPath: '#clone',

	compare: function compare(path) {
		if (!path || path instanceof CompoundPath)
			return compare.base.call(this, path);
		var curves1 = this.getCurves(),
			curves2 = path.getCurves(),
			length1 = curves1.length,
			length2 = curves2.length;
		if (!length1 || !length2) {
			return length1 == length2;
		}
		var v1 = curves1[0].getValues(),
			values2 = [],
			pos1 = 0, pos2,
			end1 = 0, end2;
		for (var i = 0; i < length2; i++) {
			var v2 = curves2[i].getValues();
			values2.push(v2);
			var overlaps = Curve.getOverlaps(v1, v2);
			if (overlaps) {
				pos2 = !i && overlaps[0][0] > 0 ? length2 - 1 : i;
				end2 = overlaps[0][1];
				break;
			}
		}
		var abs = Math.abs,
			epsilon = 1e-8,
			v2 = values2[pos2],
			start2;
		while (v1 && v2) {
			var overlaps = Curve.getOverlaps(v1, v2);
			if (overlaps) {
				var t1 = overlaps[0][0];
				if (abs(t1 - end1) < epsilon) {
					end1 = overlaps[1][0];
					if (end1 === 1) {
						v1 = ++pos1 < length1 ? curves1[pos1].getValues() : null;
						end1 = 0;
					}
					var t2 = overlaps[0][1];
					if (abs(t2 - end2) < epsilon) {
						if (!start2)
							start2 = [pos2, t2];
						end2 = overlaps[1][1];
						if (end2 === 1) {
							if (++pos2 >= length2)
								pos2 = 0;
							v2 = values2[pos2] || curves2[pos2].getValues();
							end2 = 0;
						}
						if (!v1) {
							return start2[0] === pos2 && start2[1] === end2;
						}
						continue;
					}
				}
			}
			break;
		}
		return false;
	},

	_hitTestSelf: function(point, options, viewMatrix, strokeMatrix) {
		var that = this,
			style = this.getStyle(),
			segments = this._segments,
			numSegments = segments.length,
			tipShape = this._tipsShape,
			closed = this._closed,
			tolerancePadding = options._tolerancePadding,
			strokePadding = tolerancePadding,
			join, cap, miterLimit,
			area, loc, res,
			hitStroke = options.stroke && style.hasStroke(),
			hitFill = options.fill && style.hasFill(),
			hitCurves = options.curves,
			strokeRadius = hitStroke
					? style.getStrokeWidth() / 2
					: hitFill && options.tolerance > 0 || hitCurves
						? 0 : null;
		if (strokeRadius !== null) {
			if (strokeRadius > 0) {
				join = style.getStrokeJoin();
				cap = style.getStrokeCap();
				miterLimit = style.getMiterLimit();
				strokePadding = strokePadding.add(
					Path._getStrokePadding(strokeRadius, strokeMatrix));
			} else {
				join = cap = 'round';
			}
		}

		function isCloseEnough(pt, padding) {
			return point.subtract(pt).divide(padding).length <= 1;
		}

		function checkSegmentPoint(seg, pt, name) {
			if (!options.selected || pt.isSelected()) {
				var anchor = seg._point;
				if (pt !== anchor)
					pt = pt.add(anchor);
				if (isCloseEnough(pt, strokePadding)) {
					return new HitResult(name, that, {
						segment: seg,
						point: pt
					});
				}
			}
		}

		function checkSegmentPoints(seg, ends) {
			return (ends || options.segments)
				&& checkSegmentPoint(seg, seg._point, 'segment')
				|| (!ends && options.handles) && (
					checkSegmentPoint(seg, seg._handleIn, 'handle-in') ||
					checkSegmentPoint(seg, seg._handleOut, 'handle-out'));
		}

		function addToArea(point) {
			area.add(point);
		}

		function checkSegmentStroke(segment) {
			var isJoin = closed || segment._index > 0
					&& segment._index < numSegments - 1;
			if ((isJoin ? join : cap) === 'round') {
				return isCloseEnough(segment._point, strokePadding);
			} else {
				area = new Path({ internal: true, closed: true });
				if (isJoin) {
					if (!segment.isSmooth()) {
						Path._addBevelJoin(segment, join, strokeRadius,
							   miterLimit, null, strokeMatrix, addToArea, true);
					}
				} else if (cap === 'square') {
					Path._addSquareCap(segment, cap, strokeRadius, null,
							strokeMatrix, addToArea, true);
				}
				if (!area.isEmpty()) {
					var loc;
					return area.contains(point)
						|| (loc = area.getNearestLocation(point))
							&& isCloseEnough(loc.getPoint(), tolerancePadding);
				}
			}
		}

		if (options.ends && !options.segments && !closed) {
			if (res = checkSegmentPoints(segments[0], true)
					|| checkSegmentPoints(segments[numSegments - 1], true))
				return res;
		} else if (options.segments || options.handles) {
			for (var i = 0; i < numSegments; i++)
				if (res = checkSegmentPoints(segments[i]))
					return res;
		}

		if( tipShape ){
			var r = tipShape._hitTestSelf(point, options, viewMatrix, strokeMatrix);
			if( r != null ){
				r.type = 'segment';
				r.item = that;
				if( options.segments ){
					r.segments = that.segments[numSegments - 1]
				}
				return r;
			}
		}
		if (strokeRadius !== null) {
			loc = this.getNearestLocation(point);
			if (loc) {
				var time = loc.getTime();
				if (time === 0 || time === 1 && numSegments > 1) {
					if (!checkSegmentStroke(loc.getSegment()))
						loc = null;
				} else if (!isCloseEnough(loc.getPoint(), strokePadding)) {
					loc = null;
				}
			}
			if (!loc && join === 'miter' && numSegments > 1) {
				for (var i = 0; i < numSegments; i++) {
					var segment = segments[i];
					if (point.getDistance(segment._point)
							<= miterLimit * strokeRadius
							&& checkSegmentStroke(segment)) {
						loc = segment.getLocation();
						break;
					}
				}
			}
		}
		return !loc && hitFill && this._contains(point)
				|| loc && !hitStroke && !hitCurves
					? new HitResult('fill', this)
					: loc
						? new HitResult(hitStroke ? 'stroke' : 'curve', this, {
							location: loc,
							point: loc.getPoint()
						})
						: null;
	}

}, Base.each(Curve._evaluateMethods,
	function(name) {
		this[name + 'At'] = function(offset) {
			var loc = this.getLocationAt(offset);
			return loc && loc[name]();
		};
	},
{
	beans: false,

	getLocationOf: function(point, epsilon) {
		var point = Point.read(arguments),
			curves = this.getCurves();
		for (var i = 0, l = curves.length; i < l; i++) {
			var loc = curves[i].getLocationOf(point, epsilon);
			if (loc)
				return loc;
		}
		return null;
	},

	getOffsetOf: function(point, epsilon) {
		var loc = this.getLocationOf(point, epsilon);
		if( loc ) return loc.getOffset();
		if( epsilon ){
			var p = this.getNearestPoint(point);
			if( point.getDistance(p) > epsilon )
				return null;
			loc = this.getLocationOf(p);
			return loc ? loc.getOffset() : null;
		}
		return  null;
	},

	getLocationAt: function(offset) {
		if (typeof offset === 'number') {
			var curves = this.getCurves(),
				length = 0;
			for (var i = 0, l = curves.length; i < l; i++) {
				var start = length,
					curve = curves[i];
				length += curve.getLength();
				if (length > offset) {
					return curve.getLocationAt(offset - start);
				}
			}
			if (curves.length > 0 && offset <= this.getLength()) {
				return new CurveLocation(curves[curves.length - 1], 1);
			}
		} else if (offset && offset.getPath && offset.getPath() === this) {
			return offset;
		}
		return null;
	},

	getOffsetsWithTangent: function() {
		var tangent = Point.read(arguments);
		if (tangent.isZero()) {
			return [];
		}

		var offsets = [];
		var curveStart = 0;
		var curves = this.getCurves();
		for (var i = 0, l = curves.length; i < l; i++) {
			var curve = curves[i];
			var curveTimes = curve.getTimesWithTangent(tangent);
			for (var j = 0, m = curveTimes.length; j < m; j++) {
				var offset = curveStart + curve.getOffsetAtTime(curveTimes[j]);
				if (offsets.indexOf(offset) < 0) {
					offsets.push(offset);
				}
			}
			curveStart += curve.length;
		}
		return offsets;
	}
}),
new function() {

	function drawHandles(ctx, segments, matrix, size) {
		if (size <= 0) return;

		var half = size / 2,
			miniSize = size - 2,
			miniHalf = half - 1,
			coords = new Array(6),
			pX, pY;

		function drawHandle(index) {
			var hX = coords[index],
				hY = coords[index + 1];
			if (pX != hX || pY != hY) {
				ctx.beginPath();
				ctx.moveTo(pX, pY);
				ctx.lineTo(hX, hY);
				ctx.stroke();
				ctx.beginPath();
				ctx.arc(hX, hY, half, 0, Math.PI * 2, true);
				ctx.fill();
			}
		}

		for (var i = 0, l = segments.length; i < l; i++) {
			var segment = segments[i],
				selection = segment._selection;
			segment._transformCoordinates(matrix, coords);
			pX = coords[0];
			pY = coords[1];
			if (selection & 2)
				drawHandle(2);
			if (selection & 4)
				drawHandle(4);
			ctx.fillRect(pX - half, pY - half, size, size);
			if (miniSize > 0 && !(selection & 1)) {
				var fillStyle = ctx.fillStyle;
				ctx.fillStyle = '#ffffff';
				ctx.fillRect(pX - miniHalf, pY - miniHalf, miniSize, miniSize);
				ctx.fillStyle = fillStyle;
			}
		}
	}
	function drawSegments(ctx, path, matrix) {
		var segments = path._segments,
			length = segments.length,
			coords = new Array(6),
			first = true,
			curX, curY,
			prevX, prevY,
			inX, inY,
			outX, outY,
			totalLen, progress, accLen, hasprogress = path.duration > 0 && path.progress >= 0;
		if( hasprogress ){
			totalLen = path.length; progress = path.progress * totalLen; accLen = 0;
		}

		function drawPartialCurve(curve, drawLength){
			var preLoc =  curve.getLocationAt(0);
			ctx.moveTo(preLoc.point.x, preLoc.point.y);
			var step = parseInt(drawLength) / 100 +1;
			for(var i = 1; i <= drawLength; i+=step){
				var curLoc = curve.getLocationAt(i);
				ctx.lineTo(curLoc.point.x, curLoc.point.y);
				preLoc = curLoc;
			}
		}

		function drawSegment(segment) {
			if (matrix) {
				segment._transformCoordinates(matrix, coords);
				curX = coords[0];
				curY = coords[1];
			} else {
				var point = segment._point;
				curX = point._x;
				curY = point._y;
			}
			if (first) {
				ctx.moveTo(curX, curY);
				first = false;
			} else {
				if (matrix) {
					inX = coords[2];
					inY = coords[3];
				} else {
					var handle = segment._handleIn;
					inX = curX + handle._x;
					inY = curY + handle._y;
				}
				if (inX === curX && inY === curY
						&& outX === prevX && outY === prevY) {
					ctx.lineTo(curX, curY);
				} else {
					ctx.bezierCurveTo(outX, outY, inX, inY, curX, curY);
				}
			}
			prevX = curX;
			prevY = curY;
			if (matrix) {
				outX = coords[4];
				outY = coords[5];
			} else {
				var handle = segment._handleOut;
				outX = prevX + handle._x;
				outY = prevY + handle._y;
			}
		}

		if( !hasprogress ){
			for (var i = 0; i < length; i++)
				drawSegment(segments[i]);
			if (path._closed && length > 0)
				drawSegment(segments[0]);
		} else {
			ctx.beginPath();
			for (var i = 0, l = path._curves.length; i < l; i++){
				var c = path._curves[i];
				if( accLen + c.length <= progress ){
					drawSegment(c.segment1);
					drawSegment(c.segment2);
					accLen += c.length;
				}
				else {
					drawPartialCurve(c, progress - accLen );
					break;
				}
			}
			if (path._closed)
				ctx.closePath();
		}
	}

	return {
		_draw: function(ctx, param, viewMatrix, strokeMatrix) {
			if( this._svg ){
				this._svg.position = this.position;
				this._svg._style = this.getStyle();
				this._svg._draw(ctx, param, viewMatrix, strokeMatrix);
				return;
			}
			var dontStart = param.dontStart,
				dontPaint = param.dontFinish || param.clip,
				style = this.getStyle(),
				hasFill = style.hasFill(),
				hasStroke = style.hasStroke(),
				dashArray = style.getDashArray(),
				dashLength = !mpaper.support.nativeDash && hasStroke
						&& dashArray && dashArray.length;

			if( this.duration > 0 && this.progress >= 0 ){
				drawSegments(ctx, this, strokeMatrix);
				 this._setStyles(ctx, param, viewMatrix);
				if (hasFill) {
					ctx.fill(style.getFillRule());
					ctx.shadowColor = 'rgba(0,0,0,0)';
				}
				if (hasStroke) {
					ctx.stroke();
				}

				if( this._tipsShape ){
					var totalLen = this.length; progress = this.progress * totalLen;
					this._setTips2(progress);
					this._tipsShape._draw(ctx, param, viewMatrix, strokeMatrix)
				}
				return;
			}

			if (!dontStart)
				ctx.beginPath();

			if (hasFill || hasStroke && !dashLength || dontPaint) {
				drawSegments(ctx, this, strokeMatrix);
				if (this._closed)
					ctx.closePath();
			}

			function getOffset(i) {
				return dashArray[((i % dashLength) + dashLength) % dashLength];
			}

			if (!dontPaint && (hasFill || hasStroke)) {
				this._setStyles(ctx, param, viewMatrix);
				if (hasFill) {
					ctx.fill(style.getFillRule());
					ctx.shadowColor = 'rgba(0,0,0,0)';
				}
				if (hasStroke) {
					if (dashLength) {
						if (!dontStart)
							ctx.beginPath();
						var flattener = new PathFlattener(this, 0.25, 32, false,
								strokeMatrix),
							length = flattener.length,
							from = -style.getDashOffset(), to,
							i = 0;
						while (from > 0) {
							from -= getOffset(i--) + getOffset(i--);
						}
						while (from < length) {
							to = from + getOffset(i++);
							if (from > 0 || to > 0)
								flattener.drawPart(ctx,
										Math.max(from, 0), Math.max(to, 0));
							from = to + getOffset(i++);
						}
					}
					ctx.stroke();
				}

				if( this._tipsShape ){
					this. _sync_tip_locs();
					this._tipsShape._draw(ctx, param, viewMatrix, strokeMatrix)
				}
			}
			this._draw_decro(ctx, param, viewMatrix, strokeMatrix);
		},

		toPointPath: function( step){
			var r = new PointPath(),  length = this.length, acc = 0, step = Math.abs(step) || 4, pos;
			while ( acc+ step <  length ){
				pos = this.getPointAt(acc);
				if( pos ){
					r.data.push(pos.x);
					r.data.push(pos.y);
				}
				acc += step;
			}
			r.strokeColor = this.strokeColor;
			r.strokeWidth = this.strokeWidth;
			r.fillColor = this.fillColor;
			r.closed = this.closed;
			return r;
		},
		doHomotopy: function(timeline, homotopy, duration, offset, doneCallback){
			var that = this;
			var start = function(){
				if( that._svg  ) return;
					that._svg = new PointPath2( );
					var len = that._segments.length;
					for(var i = 0; i < len; i++){
					   that._svg.add( that._segments[i].clone());
					}
					if( len < 20 ){
						that._svg.insertExtraSegments(20- len);
					}
					that._svg.strokeColor = that.strokeColor;
					that._svg.strokeWidth = that.strokeWidth;
					that._svg.fillColor = that.fillColor;
					that._svg.closed = that.closed;
					 that._svg.homotopy =  homotopy;
					 that._svg.setTime(0);
			};
			timeline.add({
				targets : that,
				progressFunc : function(progress){
					if( !that._svg ){
						start();
					}
					 that._svg.setTime( progress * duration );
					 that._changed(9);
				}.bind(that),
				duration : duration,
				complete: function(){
					if( doneCallback ) doneCallback();
					that._svg = null;
				}.bind(that)
		   }, offset);
		},
		 morphingTo: function(timeline, target, duration, offset,  finishCallback){
			if( target._class == 'Path' )  return this._morphingTo2(timeline, target,duration, offset, finishCallback);
			if( target._class != 'CompoundPath' ) {
				console.log( 'not a path ,nor compound path');
				if( finishCallback ) finishCallback();
				return;
			}
			var tc = target._children, tcount = tc.length, fs = 0;
			var added = [], t;
			var callback = function(){
				fs++;
				if( fs == tcount ) {
				   if(finishCallback) finishCallback();
				   added.forEach( e => { if(e) e.remove(); })
				   target.showing(0.1);
				}
			}
			this._morphingTo2(timeline, tc[0],duration, offset,  callback);
			for(var i = 1; i < tcount; i++){
				t = this.clone();
				added.push( t );
				t._morphingTo2(timeline, tc[i], duration, '==',   callback);
			}
		 },

		_morphingTo2: function(timeline, target, duration,  offset,  finishCallback){
			var compound;
			if( target._class == 'CompoundPath' ){
				compound = target;
				target = target.getLongestPath();
			}
			var that = this, from_segs = that.segments.length, to_segs = target.segments.length;
			that._svgFrom = that.clone();
			that._svgTo = target.clone();
			if( from_segs < 20 && to_segs < 20 ){
				that._svgFrom.insertExtraSegments( 20 - from_segs );
				that. _svgTo.insertExtraSegments( 20 - to_segs );
			} else if( from_segs < to_segs ){
				that._svgFrom.insertExtraSegments( to_segs - from_segs );
			} else if( from_segs > to_segs ){
				that._svgTo.insertExtraSegments( from_segs - to_segs );
			}
			that. _svgFrom.visible = false;
			that. _svgTo.visible = false;
			that._svg = new Path(Item.NO_INSERT);
			var thatpos = that.position.clone() , started = false;
			var start = function(){
				if( started ) return;
				started = true;
				that.addToViewIfNot();
			};
			var options = {
				targets : this,
				begin: function(){
				   start();
				}.bind(this),
				progressFunc : function( progress){
					if( !started ) start();
					that._svg.resetPathData("");
					that._svg.interpolate( that._svgFrom, that. _svgTo, progress);
					that._svg.position = target.position.__subtract(thatpos).__multiply(progress).__add(thatpos);
					that.position = that._svg.position;
					var from_style = that._style, to_style= target._style, ffcolor = from_style.getFillColor(),
						tfcolor = to_style.getFillColor(), fscolor = from_style.getStrokeColor(), tscolor = to_style.getStrokeColor();
					if( tfcolor && ffcolor )
						that._svg.fillColor = tfcolor.__subtract(ffcolor).__multiply(progress).__add(ffcolor);
					else if ( tfcolor )
					   that._svg.fillColor = tfcolor;
					if( tscolor && fscolor )
						that._svg.strokeColor = tscolor.__subtract(fscolor).__multiply(progress).__add(fscolor);
					else if( tscolor )
						that._svg.strokeColor = tscolor;
				}.bind(that),
				duration :  duration,
				repeat : false,
				complete: function(){
					if(  that._svgFrom ){ that. _svgFrom.remove(); that. _svgFrom = null; }
					if(  that._svgTo ){ that._svgTo.remove(); that._svgTo = null; }
					if( finishCallback ){   finishCallback();   }
					{
						that.hiding(   function(){
							if( that._svg ) that._svg.remove();
							that._svg = null;
							that.remove();
						}  );
						target.showing(0.1);
					}
				}.bind(this)
		   };
		   if( timeline ) timeline.add(options, offset);
		   else
			 anime(options);
		},

		_draw_decro: function(ctx, param, viewMatrix, strokeMatrix) {

		},

		_drawSelected: function(ctx, matrix) {
			ctx.beginPath();
			drawSegments(ctx, this, matrix);
			ctx.stroke();
			drawHandles(ctx, this._segments, matrix, mpaper.settings.handleSize);
		}
	};
},
new function() {
	function getCurrentSegment(that) {
		var segments = that._segments;
		if (!segments.length)
			throw new Error('Use a moveTo() command first');
		return segments[segments.length - 1];
	}

	return {
		moveTo: function() {
			var segments = this._segments;
			if (segments.length === 1)
				this.removeSegment(0);
			if (!segments.length)
				this._add([ new Segment(Point.read(arguments)) ]);
		},

		moveBy: function() {
			throw new Error('moveBy() is unsupported on Path items.');
		},

		lineTo: function() {
			this._add([ new Segment(Point.read(arguments)) ]);
		},

		cubicCurveTo: function() {
			var args = arguments,
				handle1 = Point.read(args),
				handle2 = Point.read(args),
				to = Point.read(args),
				current = getCurrentSegment(this);
			current.setHandleOut(handle1.subtract(current._point));
			this._add([ new Segment(to, handle2.subtract(to)) ]);
		},

		quadraticCurveTo: function() {
			var args = arguments,
				handle = Point.read(args),
				to = Point.read(args),
				current = getCurrentSegment(this)._point;
			this.cubicCurveTo(
				handle.add(current.subtract(handle).multiply(1 / 3)),
				handle.add(to.subtract(handle).multiply(1 / 3)),
				to
			);
		},

		curveTo: function() {
			var args = arguments,
				through = Point.read(args),
				to = Point.read(args),
				t = Base.pick(Base.read(args), 0.5),
				t1 = 1 - t,
				current = getCurrentSegment(this)._point,
				handle = through.subtract(current.multiply(t1 * t1))
					.subtract(to.multiply(t * t)).divide(2 * t * t1);
			if (handle.isNaN())
				throw new Error(
					'Cannot put a curve through points with parameter = ' + t);
			this.quadraticCurveTo(handle, to);
		},

		arcTo: function() {
			var args = arguments,
				abs = Math.abs,
				sqrt = Math.sqrt,
				current = getCurrentSegment(this),
				from = current._point,
				to = Point.read(args),
				through,
				peek = Base.peek(args),
				clockwise = Base.pick(peek, true),
				center, extent, vector, matrix;
			if (typeof clockwise === 'boolean') {
				var middle = from.add(to).divide(2),
				through = middle.add(middle.subtract(from).rotate(
						clockwise ? -90 : 90));
			} else if (Base.remain(args) <= 2) {
				through = to;
				to = Point.read(args);
			} else if (!from.equals(to)) {
				var radius = Size.read(args),
					isZero = Numerical.isZero;
				if (isZero(radius.width) || isZero(radius.height))
					return this.lineTo(to);
				var rotation = Base.read(args),
					clockwise = !!Base.read(args),
					large = !!Base.read(args),
					middle = from.add(to).divide(2),
					pt = from.subtract(middle).rotate(-rotation),
					x = pt.x,
					y = pt.y,
					rx = abs(radius.width),
					ry = abs(radius.height),
					rxSq = rx * rx,
					rySq = ry * ry,
					xSq = x * x,
					ySq = y * y;
				var factor = sqrt(xSq / rxSq + ySq / rySq);
				if (factor > 1) {
					rx *= factor;
					ry *= factor;
					rxSq = rx * rx;
					rySq = ry * ry;
				}
				factor = (rxSq * rySq - rxSq * ySq - rySq * xSq) /
						(rxSq * ySq + rySq * xSq);
				if (abs(factor) < 1e-12)
					factor = 0;
				if (factor < 0)
					throw new Error(
							'Cannot create an arc with the given arguments');
				center = new Point(rx * y / ry, -ry * x / rx)
						.multiply((large === clockwise ? -1 : 1) * sqrt(factor))
						.rotate(rotation).add(middle);
				matrix = new Matrix().translate(center).rotate(rotation)
						.scale(rx, ry);
				vector = matrix._inverseTransform(from);
				extent = vector.getDirectedAngle(matrix._inverseTransform(to));
				if (!clockwise && extent > 0)
					extent -= 360;
				else if (clockwise && extent < 0)
					extent += 360;
			}
			if (through) {
				var l1 = new Line(from.add(through).divide(2),
							through.subtract(from).rotate(90), true),
					l2 = new Line(through.add(to).divide(2),
							to.subtract(through).rotate(90), true),
					line = new Line(from, to),
					throughSide = line.getSide(through);
				center = l1.intersect(l2, true);
				if (!center) {
					if (!throughSide)
						return this.lineTo(to);
					throw new Error(
							'Cannot create an arc with the given arguments');
				}
				vector = from.subtract(center);
				extent = vector.getDirectedAngle(to.subtract(center));
				var centerSide = line.getSide(center, true);
				if (centerSide === 0) {
					extent = throughSide * abs(extent);
				} else if (throughSide === centerSide) {
					extent += extent < 0 ? 360 : -360;
				}
			}
			if (extent) {
				var epsilon = 1e-5,
					ext = abs(extent),
					count = ext >= 360
						? 4
						: Math.ceil((ext - epsilon) / 90),
					inc = extent / count,
					half = inc * Math.PI / 360,
					z = 4 / 3 * Math.sin(half) / (1 + Math.cos(half)),
					segments = [];
				for (var i = 0; i <= count; i++) {
					var pt = to,
						out = null;
					if (i < count) {
						out = vector.rotate(90).multiply(z);
						if (matrix) {
							pt = matrix._transformPoint(vector);
							out = matrix._transformPoint(vector.add(out))
									.subtract(pt);
						} else {
							pt = center.add(vector);
						}
					}
					if (!i) {
						current.setHandleOut(out);
					} else {
						var _in = vector.rotate(-90).multiply(z);
						if (matrix) {
							_in = matrix._transformPoint(vector.add(_in))
									.subtract(pt);
						}
						segments.push(new Segment(pt, _in, out));
					}
					vector = vector.rotate(inc);
				}
				this._add(segments);
			}
		},

		lineBy: function() {
			var to = Point.read(arguments),
				current = getCurrentSegment(this)._point;
			this.lineTo(current.add(to));
		},

		curveBy: function() {
			var args = arguments,
				through = Point.read(args),
				to = Point.read(args),
				parameter = Base.read(args),
				current = getCurrentSegment(this)._point;
			this.curveTo(current.add(through), current.add(to), parameter);
		},

		cubicCurveBy: function() {
			var args = arguments,
				handle1 = Point.read(args),
				handle2 = Point.read(args),
				to = Point.read(args),
				current = getCurrentSegment(this)._point;
			this.cubicCurveTo(current.add(handle1), current.add(handle2),
					current.add(to));
		},

		quadraticCurveBy: function() {
			var args = arguments,
				handle = Point.read(args),
				to = Point.read(args),
				current = getCurrentSegment(this)._point;
			this.quadraticCurveTo(current.add(handle), current.add(to));
		},

		arcBy: function() {
			var args = arguments,
				current = getCurrentSegment(this)._point,
				point = current.add(Point.read(args)),
				clockwise = Base.pick(Base.peek(args), true);
			if (typeof clockwise === 'boolean') {
				this.arcTo(point, clockwise);
			} else {
				this.arcTo(point, current.add(Point.read(args)));
			}
		},

		closePath: function(tolerance) {
			this.setClosed(true);
			this.join(this, tolerance);
		}
	};
}, {

	_getBounds: function(matrix, options) {
		var method = options.handle
				? 'getHandleBounds'
				: options.stroke
				? 'getStrokeBounds'
				: 'getBounds';
		return Path[method](this._segments, this._closed, this, matrix, options);
	},

statics: {
	getBounds: function(segments, closed, path, matrix, options, strokePadding) {
		var first = segments[0];
		if (!first)
			return new Rectangle();
		var coords = new Array(6),
			prevCoords = first._transformCoordinates(matrix, new Array(6)),
			min = prevCoords.slice(0, 2),
			max = min.slice(),
			roots = new Array(2);

		function processSegment(segment) {
			segment._transformCoordinates(matrix, coords);
			for (var i = 0; i < 2; i++) {
				Curve._addBounds(
					prevCoords[i],
					prevCoords[i + 4],
					coords[i + 2],
					coords[i],
					i, strokePadding ? strokePadding[i] : 0, min, max, roots);
			}
			var tmp = prevCoords;
			prevCoords = coords;
			coords = tmp;
		}

		for (var i = 1, l = segments.length; i < l; i++)
			processSegment(segments[i]);
		if (closed)
			processSegment(first);
		return new Rectangle(min[0], min[1], max[0] - min[0], max[1] - min[1]);
	},

	getStrokeBounds: function(segments, closed, path, matrix, options) {
		var style = path.getStyle(),
			stroke = style.hasStroke(),
			strokeWidth = style.getStrokeWidth(),
			strokeMatrix = stroke && path._getStrokeMatrix(matrix, options),
			strokePadding = stroke && Path._getStrokePadding(strokeWidth,
				strokeMatrix),
			bounds = Path.getBounds(segments, closed, path, matrix, options,
				strokePadding);
		if (!stroke)
			return bounds;
		var strokeRadius = strokeWidth / 2,
			join = style.getStrokeJoin(),
			cap = style.getStrokeCap(),
			miterLimit = style.getMiterLimit(),
			joinBounds = new Rectangle(new Size(strokePadding));

		function addPoint(point) {
			bounds = bounds.include(point);
		}

		function addRound(segment) {
			bounds = bounds.unite(
					joinBounds.setCenter(segment._point.transform(matrix)));
		}

		function addJoin(segment, join) {
			if (join === 'round' || segment.isSmooth()) {
				addRound(segment);
			} else {
				Path._addBevelJoin(segment, join, strokeRadius, miterLimit,
						matrix, strokeMatrix, addPoint);
			}
		}

		function addCap(segment, cap) {
			if (cap === 'round') {
				addRound(segment);
			} else {
				Path._addSquareCap(segment, cap, strokeRadius, matrix,
						strokeMatrix, addPoint);
			}
		}

		var length = segments.length - (closed ? 0 : 1);
		if (length > 0) {
			for (var i = 1; i < length; i++) {
				addJoin(segments[i], join);
			}
			if (closed) {
				addJoin(segments[0], join);
			} else {
				addCap(segments[0], cap);
				addCap(segments[segments.length - 1], cap);
			}
		}
		return bounds;
	},

	_getStrokePadding: function(radius, matrix) {
		if (!matrix)
			return [radius, radius];
		var hor = new Point(radius, 0).transform(matrix),
			ver = new Point(0, radius).transform(matrix),
			phi = hor.getAngleInRadians(),
			a = hor.getLength(),
			b = ver.getLength();
		var sin = Math.sin(phi),
			cos = Math.cos(phi),
			tan = Math.tan(phi),
			tx = Math.atan2(b * tan, a),
			ty = Math.atan2(b, tan * a);
		return [Math.abs(a * Math.cos(tx) * cos + b * Math.sin(tx) * sin),
				Math.abs(b * Math.sin(ty) * cos + a * Math.cos(ty) * sin)];
	},

	_addBevelJoin: function(segment, join, radius, miterLimit, matrix,
			strokeMatrix, addPoint, isArea) {
		var curve2 = segment.getCurve(),
			curve1 = curve2.getPrevious(),
			point = curve2.getPoint1().transform(matrix),
			normal1 = curve1.getNormalAtTime(1).multiply(radius)
				.transform(strokeMatrix),
			normal2 = curve2.getNormalAtTime(0).multiply(radius)
				.transform(strokeMatrix),
				angle = normal1.getDirectedAngle(normal2);
		if (angle < 0 || angle >= 180) {
			normal1 = normal1.negate();
			normal2 = normal2.negate();
		}
		if (isArea)
			addPoint(point);
		addPoint(point.add(normal1));
		if (join === 'miter') {
			var corner = new Line(point.add(normal1),
					new Point(-normal1.y, normal1.x), true
				).intersect(new Line(point.add(normal2),
					new Point(-normal2.y, normal2.x), true
				), true);
			if (corner && point.getDistance(corner) <= miterLimit * radius) {
				addPoint(corner);
			}
		}
		addPoint(point.add(normal2));
	},

	_addSquareCap: function(segment, cap, radius, matrix, strokeMatrix,
			addPoint, isArea) {
		var point = segment._point.transform(matrix),
			loc = segment.getLocation(),
			normal = loc.getNormal()
					.multiply(loc.getTime() === 0 ? radius : -radius)
					.transform(strokeMatrix);
		if (cap === 'square') {
			if (isArea) {
				addPoint(point.subtract(normal));
				addPoint(point.add(normal));
			}
			point = point.add(normal.rotate(-90));
		}
		addPoint(point.add(normal));
		addPoint(point.subtract(normal));
	},

	getHandleBounds: function(segments, closed, path, matrix, options) {
		var style = path.getStyle(),
			stroke = options.stroke && style.hasStroke(),
			strokePadding,
			joinPadding;
		if (stroke) {
			var strokeMatrix = path._getStrokeMatrix(matrix, options),
				strokeRadius = style.getStrokeWidth() / 2,
				joinRadius = strokeRadius;
			if (style.getStrokeJoin() === 'miter')
				joinRadius = strokeRadius * style.getMiterLimit();
			if (style.getStrokeCap() === 'square')
				joinRadius = Math.max(joinRadius, strokeRadius * Math.SQRT2);
			strokePadding = Path._getStrokePadding(strokeRadius, strokeMatrix);
			joinPadding = Path._getStrokePadding(joinRadius, strokeMatrix);
		}
		var coords = new Array(6),
			x1 = Infinity,
			x2 = -x1,
			y1 = x1,
			y2 = x2;
		for (var i = 0, l = segments.length; i < l; i++) {
			var segment = segments[i];
			segment._transformCoordinates(matrix, coords);
			for (var j = 0; j < 6; j += 2) {
				var padding = !j ? joinPadding : strokePadding,
					paddingX = padding ? padding[0] : 0,
					paddingY = padding ? padding[1] : 0,
					x = coords[j],
					y = coords[j + 1],
					xn = x - paddingX,
					xx = x + paddingX,
					yn = y - paddingY,
					yx = y + paddingY;
				if (xn < x1) x1 = xn;
				if (xx > x2) x2 = xx;
				if (yn < y1) y1 = yn;
				if (yx > y2) y2 = yx;
			}
		}
		return new Rectangle(x1, y1, x2 - x1, y2 - y1);
	}
}});

Path.inject({ statics: new function() {

	var kappa = 0.5522847498307936,
		ellipseSegments = [
			new Segment([-1, 0], [0, kappa ], [0, -kappa]),
			new Segment([0, -1], [-kappa, 0], [kappa, 0 ]),
			new Segment([1, 0], [0, -kappa], [0, kappa ]),
			new Segment([0, 1], [kappa, 0 ], [-kappa, 0])
		];

	function createPath(segments, closed, args) {
		var props = Base.getNamed(args),
			path = new Path(props && props.insert == false && Item.NO_INSERT);
		path._add(segments);
		path._closed = closed;
		return path.set(props, { insert: false });
	}

	function createEllipse(center, radius, args) {
		var segments = new Array(4);
		for (var i = 0; i < 4; i++) {
			var segment = ellipseSegments[i];
			segments[i] = new Segment(
				segment._point.multiply(radius).add(center),
				segment._handleIn.multiply(radius),
				segment._handleOut.multiply(radius)
			);
		}
		return createPath(segments, true, args);
	}

	return {
		Line: function() {
			var args = arguments;
			return createPath([
				new Segment(Point.readNamed(args, 'from')),
				new Segment(Point.readNamed(args, 'to'))
			], false, args);
		},

		PolyLine: function() {
			var args = arguments, data = Item.getNamed(args, 'data'),
			closed = !!Item.getNamed(args, 'closed'), points = [];
			for(var i = 0; i < data.length; i+=2){
				points.push(new Segment(new Point(data[i], data[i+1])));
			}
			return createPath(points, closed, args);
		},

		Circle: function() {
			var args = arguments,
				center = Point.readNamed(args, 'center'),
				radius = Base.readNamed(args, 'radius');
			return createEllipse(center, new Size(radius), args);
		},

		Annulus: function(params) {
			var args = arguments,
				center = Point.readNamed(args, 'center'),
				inner_radius  = Base.readNamed(args, 'inner_radius'),
				outer_radius  = Base.readNamed(args, 'outer_radius') ,
				inner_color  = params.inner_color ,
				ese = ellipseSegments;

				if( inner_color ){
					var c1 = createEllipse(center, new Size(inner_radius),args);
					c1.fillColor = inner_color;
					var c2 = createEllipse(center, new Size(outer_radius),args);
					c2.fillColor = params.fillColor || params.strokeColor;
					var group = new Group();
					group.addChild(c2);
					group.addChild(c1);
					group.setColor = function(inner, color){
					   (inner? c1 : c2).fillColor = color;
					};
					return group;
				}
				var segments = [];
				for (var i = 0; i < 4; i++) {
					var segment = ese[i];
					segments[i] = new Segment(
						segment._point.multiply(inner_radius).add(center),
						segment._handleIn.multiply(inner_radius),
						segment._handleOut.multiply(inner_radius)
					);
				}
				segments[4] = new Segment(
					ese[0]._point.multiply(inner_radius).add(center),
					ese[0]._handleIn.multiply(inner_radius),
					ese[0]._handleOut.multiply(inner_radius)
				);
				segments[5] = new Segment(  ese[0]._point.multiply(inner_radius).add(center)  );
				segments[6] = new Segment(  ese[0]._point.multiply(outer_radius).add(center)  );
				segments[ 7] = new Segment(
					ese[0]._point.multiply(outer_radius).add(center),
					ese[0]._handleOut.multiply(outer_radius),
					ese[0]._handleIn.multiply(outer_radius),
				);
				for (var i = 0; i < 4; i++) {
					var segment = ese[ 3- i];
					segments[i+8] = new Segment(
						segment._point.multiply(outer_radius).add(center),
						segment._handleOut.multiply(outer_radius),
						segment._handleIn.multiply(outer_radius),
					);
				}
				segments[11] = new Segment(
					ese[0]._point.multiply(outer_radius).add(center),
					ese[0]._handleOut.multiply(outer_radius),
					ese[0]._handleIn.multiply(outer_radius),
				);

				segments[12] = new Segment(  ese[0]._point.multiply(outer_radius).add(center)  );
				segments[13] = new Segment(  ese[0]._point.multiply(inner_radius).add(center)  );

				return createPath(segments, true, args);

		},

		Rectangle: function() {
			var args = arguments,
				rect = Rectangle.readNamed(args, 'rectangle'),
				radius = Size.readNamed(args, 'radius', 0,
						{ readNull: true }),
				bl = rect.getBottomLeft(true),
				tl = rect.getTopLeft(true),
				tr = rect.getTopRight(true),
				br = rect.getBottomRight(true),
				segments;
			if (!radius || radius.isZero()) {
				segments = [
					new Segment(bl),
					new Segment(tl),
					new Segment(tr),
					new Segment(br)
				];
			} else {
				radius = Size.min(radius, rect.getSize(true).divide(2));
				var rx = radius.width,
					ry = radius.height,
					hx = rx * kappa,
					hy = ry * kappa;
				segments = [
					new Segment(bl.add(rx, 0), null, [-hx, 0]),
					new Segment(bl.subtract(0, ry), [0, hy]),
					new Segment(tl.add(0, ry), null, [0, -hy]),
					new Segment(tl.add(rx, 0), [-hx, 0], null),
					new Segment(tr.subtract(rx, 0), null, [hx, 0]),
					new Segment(tr.add(0, ry), [0, -hy], null),
					new Segment(br.subtract(0, ry), null, [0, hy]),
					new Segment(br.subtract(rx, 0), [hx, 0])
				];
			}
			return createPath(segments, true, args);
		},

		RoundRectangle: '#Rectangle',

		Ellipse: function() {
			var args = arguments,
				ellipse = Shape._readEllipse(args);
			return createEllipse(ellipse.center, ellipse.radius, args);
		},

		Oval: '#Ellipse',

		Arc: function() {
			var args = arguments,
				from = Point.readNamed(args, 'from'),
				through = Point.readNamed(args, 'through'),
				to = Point.readNamed(args, 'to'),
				props = Base.getNamed(args),
				path = new Path(props && props.insert == false
						&& Item.NO_INSERT);
			path.moveTo(from);
			path.arcTo(through, to);
			return path.set(props);
		},

		RegularPolygon: function() {
			var args = arguments,
				center = Point.readNamed(args, 'center'),
				sides = Base.readNamed(args, 'sides'),
				radius = Base.readNamed(args, 'radius'),
				step = 360 / sides,
				three = sides % 3 === 0,
				vector = new Point(0, three ? -radius : radius),
				offset = three ? -1 : 0.5,
				segments = new Array(sides);
			for (var i = 0; i < sides; i++)
				segments[i] = new Segment(center.add(
					vector.rotate((i + offset) * step)));
			return createPath(segments, true, args);
		},

		Star: function() {
			var args = arguments,
				center = Point.readNamed(args, 'center'),
				points = Base.readNamed(args, 'points') * 2,
				radius1 = Base.readNamed(args, 'radius1'),
				radius2 = Base.readNamed(args, 'radius2'),
				step = 360 / points,
				vector = new Point(0, -1),
				segments = new Array(points);
			for (var i = 0; i < points; i++)
				segments[i] = new Segment(center.add(vector.rotate(step * i)
						.multiply(i % 2 ? radius2 : radius1)));
			return createPath(segments, true, args);
		},
		Tex: function(props){
			var  project =  props.project || mpaper.project,
				 content = props.content, scale = props.scale || 10,
				 position = props.position || project._view.center;
			var item = project.importLatex(content);
			item.scale(scale);
			item.position = position;
			return item;
		},
		  Text: function(props){
			var  project =  props.project || mpaper.project,
				 content = props.content, scale = props.scale || 10,
				 position = props.position || project._view.center;
				 content = '\\text{' + content + '}';
			var item = project.importLatex(content);
			item.scale(scale);
			item.position = position;
			return item;
		},
	};
}});

var CompoundPath = PathItem.extend({
	_class: 'CompoundPath',
	_serializeFields: {
		children: []
	},
	beans: true,

	initialize: function CompoundPath(arg) {
		this._children = [];
		this._topIndex = -1;
		this._namedChildren = {};
		if (!this._initialize(arg)) {
			if (typeof arg === 'string') {
				this.setPathData(arg);
			} else {
				this.addChildren(Array.isArray(arg) ? arg : arguments);
			}
		}
	},

	insertChildren: function insertChildren(index, items) {
		var list = items,
			first = list[0];
		if (first && typeof first[0] === 'number')
			list = [list];
		for (var i = items.length - 1; i >= 0; i--) {
			var item = list[i];
			if (list === items && !(item instanceof Path))
				list = Base.slice(list);
			if (Array.isArray(item)) {
				list[i] = new Path({ segments: item, insert: false });
			} else if (item instanceof CompoundPath) {
				list.splice.apply(list, [i, 1].concat(item.removeChildren()));
				item.remove();
			}
		}
		return insertChildren.base.call(this, index, list);
	},

	reduce: function reduce(options) {
		var children = this._children;
		for (var i = children.length - 1; i >= 0; i--) {
			var path = children[i].reduce(options);
			if (path.isEmpty())
				path.remove();
		}
		if (!children.length) {
			var path = new Path(Item.NO_INSERT);
			path.copyAttributes(this);
			path.insertAbove(this);
			this.remove();
			return path;
		}
		return reduce.base.call(this);
	},

	isClosed: function() {
		var children = this._children;
		for (var i = 0, l = children.length; i < l; i++) {
			if (!children[i]._closed)
				return false;
		}
		return true;
	},

	setClosed: function(closed) {
		var children = this._children;
		for (var i = 0, l = children.length; i < l; i++) {
			children[i].setClosed(closed);
		}
	},

	getFirstSegment: function() {
		var first = this.getFirstChild();
		return first && first.getFirstSegment();
	},

	getLastSegment: function() {
		var last = this.getLastChild();
		return last && last.getLastSegment();
	},

	getCurves: function() {
		var children = this._children,
			curves = [];
		for (var i = 0, l = children.length; i < l; i++) {
			Base.push(curves, children[i].getCurves());
		}
		return curves;
	},

	getLongestPath: function(){
		var children = this._children, selectedPath, longest = 0;
		for (var i = 0, l = children.length; i < l; i++) {
			 if( children[i].length > longest ){
				 longest = children[i].length;
				 selectedPath = children[i];
			 }
		}
		return selectedPath;
	},

	doHomotopy: function(timeline, homotopy, duration, offset, doneCallback){
		var children = this._children, length = children.length;
		children[0]. doHomotopy(timeline, homotopy, duration, offset, doneCallback);
		for (var i = 1, l = children.length; i < l; i++)
			children[i]. doHomotopy(timeline, homotopy, duration, '==', doneCallback);
	},
	morphingTo: function(timeline, target, duration, offset,  finishCallback){
		var that = this, cc = this._children.slice(0), ccount = cc.length,
			tcount, tc;
		if( target._class == 'CompoundPath' ) tc = target._children.slice(0);
		else tc = [target];
		tcount = tc.length;
		that.visible = false;
		cc.forEach(e =>{
			if( !e.strokeColor ) e.strokeColor = this.strokeColor;
			if( !e.fillColor ) e.fillColor = this.fillColor;
		})
		var to_more = ccount < tcount, temp = to_more ? cc : tc, diff =  Math.abs(ccount - tcount),
			added=[];
		if( diff > 0 ){
			var temp = ccount < tcount ? cc : tc, last = temp[temp.length-1], t;
			for(var i = diff; i > 0; i--) {
			   t =  last.clone();
				temp.push(  tc );
				added.push( t )
			}
		}
		var count = Math.max(ccount, tcount), fs=0;
		var callback = function(){
			fs++;
			if( fs == count ){
			   if( finishCallback) finishCallback();
				that.hiding(true)  ;
				added.forEach(e =>{  e.remove(true);  });
				cc.forEach( e => {  e.remove(); })
				target.showing(0.1);
			}
		}
		cc[0].morphingTo(timeline, tc[0], duration, offset, callback) ;

		for(var k = 1; k < count; k++){
			cc[k].morphingTo(timeline, tc[k], duration, '==', callback) ;
		}
	},
	getFirstCurve: function() {
		var first = this.getFirstChild();
		return first && first.getFirstCurve();
	},

	getLastCurve: function() {
		var last = this.getLastChild();
		return last && last.getLastCurve();
	},

	getArea: function() {
		var children = this._children,
			area = 0;
		for (var i = 0, l = children.length; i < l; i++)
			area += children[i].getArea();
		return area;
	},

	destroyContent: function(){
		var children = this._children;
		for (var i = children.length-1;  i >=0; i--){
			children[i].removeSegments();
			children[i].remove();
		}
		this._children = [];
		this._topIndex = -1;
		this._namedChildren = {};
	},
	write: function(timeline, duration, offset,  doneCallback) {
		this._write0(timeline, duration, offset,   true, doneCallback);
	},
	unwrite: function(timeline, duration, offset, doneCallback) {
		this._write0(timeline, duration, offset,   false, doneCallback);
	},
	_write0: function(timeline, duration, offset, create, doneCallback) {
		var len = this.getLength(),  cs = this._children, count = cs.length;
		if( count == 0 ) return;
		var  cdur, clen ;
		clen = cs[0].getLength(), cdur = duration * clen / len;
		cs[0].write( timeline, cdur, offset,  create, doneCallback);
		for(var i = 1; i < count; i++){
			var c = cs[i], clen = c.getLength(), cdur = duration * clen / len;
			c.write(timeline, cdur, undefined,  create, doneCallback) ;
		}
	},

	start: function(duration, offset, repeat, doneCallback ) {
		var len = this.getLength(),  cs = this._children, count = cs.length;
		if( count == 0 ) return;
		var  cdur, clen, acc;
		clen = cs[0].getLength(), cdur = duration * clen / len, acc = offset;
		cs[0].start(  cdur, offset,  repeat, doneCallback);
		for(var i = 1; i < count; i++){
			var c = cs[i], clen = c.getLength(), cdur = duration * clen / len;
			acc += cdur;
			c.start(  cdur, acc,  repeat, doneCallback) ;
		}
	},

	pause: function(){
		var children = this._children;
		for (var i = children.length-1;  i >=0; i--){
			children[i].pause();
		}
	},
	resume: function(){
		var children = this._children;
		for (var i = children.length-1;  i >=0; i--){
			children[i].resume();
		}
	},

	cloneSubPath: function(start_offset, end_offset){
		var len = this.getLength(),  children = this._children, accLen = 0;
		var r = new CompoundPath();
		 for (var i = 0, l = children.length; i < l; i++){
			var c = children[i], clen = c.getLength(), accLen_e = accLen + clen ;
			if( accLen_e < start_offset ) { accLen = accLen_e; continue; }
			if( accLen > end_offset ) { break; }
			var start_offset_adjust = accLen_e >= end_offset ? start_offset-accLen : 0;
			if( accLen_e >= end_offset ){
				r.addChild( c.cloneSubPath(start_offset_adjust, end_offset-accLen) );
				break;
			} else {
				r.addChild(  c.cloneSubPath(start_offset_adjust, clen)  )
				accLen = accLen_e;
				continue;
			}
		 }
		 return r;
	},
	getLength: function() {
		var children = this._children,
			length = 0;
		for (var i = 0, l = children.length; i < l; i++)
			length += children[i].getLength();
		return length;
	},

	getLocationOf: function(point, epsilon){
		var children = this._children, curveLoc = null;
		for (var i = 0, l = children.length; i < l; i++){
			curveLoc =  children[i].getLocationOf(point, epsilon);
		   if( curveLoc != null ){
			curveLoc.indexOfSubpath = i;
			   return curveLoc;
		   }
		}
		return curveLoc;
	},

	getOffsetOf: function(point, epsilon){
		var children = this._children, curPath = null, curveLoc = null, accLen = 0;
		for (var i = 0, l = children.length; i < l; i++){
			curPath = children[i];
			curveLoc =  curPath.getOffsetOf(point, epsilon);
		   if( curveLoc != null ){
			   accLen += curveLoc
			   return accLen;
		   } else {
				accLen += curPath.length;
		   }
		}
		return -1;
	},
	getSubpathAndLocByOffset: function(offset){
		var children = this._children, curPath,  accLen = 0;
		for (var i = 0, l = children.length; i < l; i++){
			curPath = children[i];
			if( accLen + curPath.length <= offset ){
				return [curPath, offset - accLen];
			}
			accLen + curPath.length;
		}
		return null;
	},

	getLocationAt: function(offset){
		var f = this.getSubpathAndLocByOffset(offset);
		return f == null ? nulll : f[0].getLocationAt(f[1]);
	},

	getPointAt: function(offset){
		var f = this.getSubpathAndLocByOffset(offset);
		return f == null ? nulll : f[0].getPointAt(f[1]);
	},

	getTangentAt: function(offset){
		var f = this.getSubpathAndLocByOffset(offset);
		return f == null ? nulll : f[0].getTangentAt(f[1]);
	},

	getNormalAt: function(offset){
		var f = this.getSubpathAndLocByOffset(offset);
		return f == null ? nulll : f[0].getNormalAt(f[1]);
	},

	getWeightedTangentAt: function(offset){
		var f = this.getSubpathAndLocByOffset(offset);
		return f == null ? nulll : f[0].getWeightedTangentAt(f[1]);
	},
	getWeightedNormalAt: function(offset){
		var f = this.getSubpathAndLocByOffset(offset);
		return f == null ? nulll : f[0].getWeightedNormalAt(f[1]);
	},
	getCurvatureAt: function(offset){
		var f = this.getSubpathAndLocByOffset(offset);
		return f == null ? nulll : f[0].getCurvatureAt(f[1]);
	},
	getOffsetsWithTangent: function(tangent){
		var children = this._children, curPath,  r = [], r0;
		for (var i = 0, l = children.length; i < l; i++){
			curPath = children[i];
			r0 = curPath.getOffsetsWithTangent(tangent);
			if( r0 != null && r0.length > 0){
				r0.array.forEach(element => {
					r.push(element);
				});
			}
		}
		return r;
	},

	getPathData: function(_matrix, _precision) {
		var children = this._children,
			paths = [];
		for (var i = 0, l = children.length; i < l; i++) {
			var child = children[i],
				mx = child._matrix;
			paths.push(child.getPathData(_matrix && !mx.isIdentity()
					? _matrix.appended(mx) : _matrix, _precision));
		}
		return paths.join('');
	},

	_hitTestChildren: function _hitTestChildren(point, options, viewMatrix) {
		return _hitTestChildren.base.call(this, point,
				options.class === Path || options.type === 'path' ? options
					: Base.set({}, options, { fill: false }),
				viewMatrix);
	},

	_draw: function(ctx, param, viewMatrix, strokeMatrix) {
		var children = this._children;
		if (!children.length)
			return;

		param = param.extend({ dontStart: true, dontFinish: true });
		ctx.beginPath();
		for (var i = 0, l = children.length; i < l; i++)
			children[i].draw(ctx, param, strokeMatrix);

		if (!param.clip) {
			this._setStyles(ctx, param, viewMatrix);
			var style = this._style;
			if (style.hasFill()) {
				ctx.fill(style.getFillRule());
				ctx.shadowColor = 'rgba(0,0,0,0)';
			}
			if (style.hasStroke())
				ctx.stroke();
		}
	},

	_drawSelected: function(ctx, matrix, selectionItems) {
		var children = this._children;
		for (var i = 0, l = children.length; i < l; i++) {
			var child = children[i],
				mx = child._matrix;
			if (!selectionItems[child._id]) {
				child._drawSelected(ctx, mx.isIdentity() ? matrix
						: matrix.appended(mx));
			}
		}
	}
},
new function() {
	function getCurrentPath(that, check) {
		var children = that._children;
		if (check && !children.length)
			throw new Error('Use a moveTo() command first');
		return children[children.length - 1];
	}

	return Base.each(['lineTo', 'cubicCurveTo', 'quadraticCurveTo', 'curveTo',
			'arcTo', 'lineBy', 'cubicCurveBy', 'quadraticCurveBy', 'curveBy',
			'arcBy'],
		function(key) {
			this[key] = function() {
				var path = getCurrentPath(this, true);
				path[key].apply(path, arguments);
			};
		}, {
			moveTo: function() {
				var current = getCurrentPath(this),
					path = current && current.isEmpty() ? current
							: new Path(Item.NO_INSERT);
				if (path !== current)
					this.addChild(path);
				path.moveTo.apply(path, arguments);
			},

			moveBy: function() {
				var current = getCurrentPath(this, true),
					last = current && current.getLastSegment(),
					point = Point.read(arguments);
				this.moveTo(last ? point.add(last._point) : point);
			},

			closePath: function(tolerance) {
				getCurrentPath(this, true).closePath(tolerance);
			}
		}
	);
}, Base.each(['reverse', 'flatten', 'simplify', 'smooth'], function(key) {
	this[key] = function(param) {
		var children = this._children,
			res;
		for (var i = 0, l = children.length; i < l; i++) {
			res = children[i][key](param) || res;
		}
		return res;
	};
}, {}));

PathItem.inject(new function() {
	var min = Math.min,
		max = Math.max,
		abs = Math.abs,
		operators = {
			unite:     { '1': true, '2': true },
			intersect: { '2': true },
			subtract:  { '1': true },
			exclude:   { '1': true, '-1': true }
		};

	function getPaths(path) {
		return path._children || [path];
	}

	function preparePath(path, resolve) {
		var res = path
			.clone(false)
			.reduce({ simplify: true })
			.transform(null, true, true);
		if (resolve) {
			var paths = getPaths(res);
			for (var i = 0, l = paths.length; i < l; i++) {
				var path = paths[i];
				if (!path._closed && !path.isEmpty()) {
					path.closePath(1e-12);
					path.getFirstSegment().setHandleIn(0, 0);
					path.getLastSegment().setHandleOut(0, 0);
				}
			}
			res = res
				.resolveCrossings()
				.reorient(res.getFillRule() === 'nonzero', true);
		}
		return res;
	}

	function createResult(paths, simplify, path1, path2, options) {
		var result = new CompoundPath(Item.NO_INSERT);
		result.addChildren(paths, true);
		result = result.reduce({ simplify: simplify });
		if (!(options && options.insert == false)) {
			result.insertAbove(path2 && path1.isSibling(path2)
					&& path1.getIndex() < path2.getIndex() ? path2 : path1);
		}
		result.copyAttributes(path1, true);
		return result;
	}

	function filterIntersection(inter) {
		return inter.hasOverlap() || inter.isCrossing();
	}

	function traceBoolean(path1, path2, operation, options) {
		if (options && (options.trace == false || options.stroke) &&
				/^(subtract|intersect)$/.test(operation))
			return splitBoolean(path1, path2, operation);
		var _path1 = preparePath(path1, true),
			_path2 = path2 && path1 !== path2 && preparePath(path2, true),
			operator = operators[operation];
		operator[operation] = true;
		if (_path2 && (operator.subtract || operator.exclude)
				^ (_path2.isClockwise() ^ _path1.isClockwise()))
			_path2.reverse();
		var crossings = divideLocations(CurveLocation.expand(
				_path1.getIntersections(_path2, filterIntersection))),
			paths1 = getPaths(_path1),
			paths2 = _path2 && getPaths(_path2),
			segments = [],
			curves = [],
			paths;

		function collectPaths(paths) {
			for (var i = 0, l = paths.length; i < l; i++) {
				var path = paths[i];
				Base.push(segments, path._segments);
				Base.push(curves, path.getCurves());
				path._overlapsOnly = true;
			}
		}

		function getCurves(indices) {
			var list = [];
			for (var i = 0, l = indices && indices.length; i < l; i++) {
				list.push(curves[indices[i]]);
			}
			return list;
		}

		if (crossings.length) {
			collectPaths(paths1);
			if (paths2)
				collectPaths(paths2);

			var curvesValues = new Array(curves.length);
			for (var i = 0, l = curves.length; i < l; i++) {
				curvesValues[i] = curves[i].getValues();
			}
			var curveCollisions = CollisionDetection.findCurveBoundsCollisions(
					curvesValues, curvesValues, 0, true);
			var curveCollisionsMap = {};
			for (var i = 0; i < curves.length; i++) {
				var curve = curves[i],
					id = curve._path._id,
					map = curveCollisionsMap[id] = curveCollisionsMap[id] || {};
				map[curve.getIndex()] = {
					hor: getCurves(curveCollisions[i].hor),
					ver: getCurves(curveCollisions[i].ver)
				};
			}

			for (var i = 0, l = crossings.length; i < l; i++) {
				propagateWinding(crossings[i]._segment, _path1, _path2,
						curveCollisionsMap, operator);
			}
			for (var i = 0, l = segments.length; i < l; i++) {
				var segment = segments[i],
					inter = segment._intersection;
				if (!segment._winding) {
					propagateWinding(segment, _path1, _path2,
							curveCollisionsMap, operator);
				}
				if (!(inter && inter._overlap))
					segment._path._overlapsOnly = false;
			}
			paths = tracePaths(segments, operator);
		} else {
			paths = reorientPaths(
					paths2 ? paths1.concat(paths2) : paths1.slice(),
					function(w) {
						return !!operator[w];
					});
		}
		return createResult(paths, true, path1, path2, options);
	}

	function splitBoolean(path1, path2, operation) {
		var _path1 = preparePath(path1),
			_path2 = preparePath(path2),
			crossings = _path1.getIntersections(_path2, filterIntersection),
			subtract = operation === 'subtract',
			divide = operation === 'divide',
			added = {},
			paths = [];

		function addPath(path) {
			if (!added[path._id] && (divide ||
					_path2.contains(path.getPointAt(path.getLength() / 2))
						^ subtract)) {
				paths.unshift(path);
				return added[path._id] = true;
			}
		}

		for (var i = crossings.length - 1; i >= 0; i--) {
			var path = crossings[i].split();
			if (path) {
				if (addPath(path))
					path.getFirstSegment().setHandleIn(0, 0);
				_path1.getLastSegment().setHandleOut(0, 0);
			}
		}
		addPath(_path1);
		return createResult(paths, false, path1, path2);
	}

	function linkIntersections(from, to) {
		var prev = from;
		while (prev) {
			if (prev === to)
				return;
			prev = prev._previous;
		}
		while (from._next && from._next !== to)
			from = from._next;
		if (!from._next) {
			while (to._previous)
				to = to._previous;
			from._next = to;
			to._previous = from;
		}
	}

	function clearCurveHandles(curves) {
		for (var i = curves.length - 1; i >= 0; i--)
			curves[i].clearHandles();
	}

	function reorientPaths(paths, isInside, clockwise) {
		var length = paths && paths.length;
		if (length) {
			var lookup = Base.each(paths, function (path, i) {
					this[path._id] = {
						container: null,
						winding: path.isClockwise() ? 1 : -1,
						index: i
					};
				}, {}),
				sorted = paths.slice().sort(function (a, b) {
					return abs(b.getArea()) - abs(a.getArea());
				}),
				first = sorted[0];
			var collisions = CollisionDetection.findItemBoundsCollisions(sorted,
					null, Numerical.GEOMETRIC_EPSILON);
			if (clockwise == null)
				clockwise = first.isClockwise();
			for (var i = 0; i < length; i++) {
				var path1 = sorted[i],
					entry1 = lookup[path1._id],
					containerWinding = 0,
					indices = collisions[i];
				if (indices) {
					var point = null;
					for (var j = indices.length - 1; j >= 0; j--) {
						if (indices[j] < i) {
							point = point || path1.getInteriorPoint();
							var path2 = sorted[indices[j]];
							if (path2.contains(point)) {
								var entry2 = lookup[path2._id];
								containerWinding = entry2.winding;
								entry1.winding += containerWinding;
								entry1.container = entry2.exclude
									? entry2.container : path2;
								break;
							}
						}
					}
				}
				if (isInside(entry1.winding) === isInside(containerWinding)) {
					entry1.exclude = true;
					paths[entry1.index] = null;
				} else {
					var container = entry1.container;
					path1.setClockwise(
							container ? !container.isClockwise() : clockwise);
				}
			}
		}
		return paths;
	}

	function divideLocations(locations, include, clearLater) {
		var results = include && [],
			tMin = 1e-8,
			tMax = 1 - tMin,
			clearHandles = false,
			clearCurves = clearLater || [],
			clearLookup = clearLater && {},
			renormalizeLocs,
			prevCurve,
			prevTime;

		function getId(curve) {
			return curve._path._id + '.' + curve._segment1._index;
		}

		for (var i = (clearLater && clearLater.length) - 1; i >= 0; i--) {
			var curve = clearLater[i];
			if (curve._path)
				clearLookup[getId(curve)] = true;
		}

		for (var i = locations.length - 1; i >= 0; i--) {
			var loc = locations[i],
				time = loc._time,
				origTime = time,
				exclude = include && !include(loc),
				curve = loc._curve,
				segment;
			if (curve) {
				if (curve !== prevCurve) {
					clearHandles = !curve.hasHandles()
							|| clearLookup && clearLookup[getId(curve)];
					renormalizeLocs = [];
					prevTime = null;
					prevCurve = curve;
				} else if (prevTime >= tMin) {
					time /= prevTime;
				}
			}
			if (exclude) {
				if (renormalizeLocs)
					renormalizeLocs.push(loc);
				continue;
			} else if (include) {
				results.unshift(loc);
			}
			prevTime = origTime;
			if (time < tMin) {
				segment = curve._segment1;
			} else if (time > tMax) {
				segment = curve._segment2;
			} else {
				var newCurve = curve.divideAtTime(time, true);
				if (clearHandles)
					clearCurves.push(curve, newCurve);
				segment = newCurve._segment1;
				for (var j = renormalizeLocs.length - 1; j >= 0; j--) {
					var l = renormalizeLocs[j];
					l._time = (l._time - time) / (1 - time);
				}
			}
			loc._setSegment(segment);
			var inter = segment._intersection,
				dest = loc._intersection;
			if (inter) {
				linkIntersections(inter, dest);
				var other = inter;
				while (other) {
					linkIntersections(other._intersection, inter);
					other = other._next;
				}
			} else {
				segment._intersection = dest;
			}
		}
		if (!clearLater)
			clearCurveHandles(clearCurves);
		return results || locations;
	}

	function getWinding(point, curves, dir, closed, dontFlip) {
		var curvesList = Array.isArray(curves)
			? curves
			: curves[dir ? 'hor' : 'ver'];
		var ia = dir ? 1 : 0,
			io = ia ^ 1,
			pv = [point.x, point.y],
			pa = pv[ia],
			po = pv[io],
			windingEpsilon = 1e-9,
			qualityEpsilon = 1e-6,
			paL = pa - windingEpsilon,
			paR = pa + windingEpsilon,
			windingL = 0,
			windingR = 0,
			pathWindingL = 0,
			pathWindingR = 0,
			onPath = false,
			onAnyPath = false,
			quality = 1,
			roots = [],
			vPrev,
			vClose;

		function addWinding(v) {
			var o0 = v[io + 0],
				o3 = v[io + 6];
			if (po < min(o0, o3) || po > max(o0, o3)) {
				return;
			}
			var a0 = v[ia + 0],
				a1 = v[ia + 2],
				a2 = v[ia + 4],
				a3 = v[ia + 6];
			if (o0 === o3) {
				if (a0 < paR && a3 > paL || a3 < paR && a0 > paL) {
					onPath = true;
				}
				return;
			}
			var t =   po === o0 ? 0
					: po === o3 ? 1
					: paL > max(a0, a1, a2, a3) || paR < min(a0, a1, a2, a3)
					? 1
					: Curve.solveCubic(v, io, po, roots, 0, 1) > 0
						? roots[0]
						: 1,
				a =   t === 0 ? a0
					: t === 1 ? a3
					: Curve.getPoint(v, t)[dir ? 'y' : 'x'],
				winding = o0 > o3 ? 1 : -1,
				windingPrev = vPrev[io] > vPrev[io + 6] ? 1 : -1,
				a3Prev = vPrev[ia + 6];
			if (po !== o0) {
				if (a < paL) {
					pathWindingL += winding;
				} else if (a > paR) {
					pathWindingR += winding;
				} else {
					onPath = true;
				}
				if (a > pa - qualityEpsilon && a < pa + qualityEpsilon)
					quality /= 2;
			} else {
				if (winding !== windingPrev) {
					if (a0 < paL) {
						pathWindingL += winding;
					} else if (a0 > paR) {
						pathWindingR += winding;
					}
				} else if (a0 != a3Prev) {
					if (a3Prev < paR && a > paR) {
						pathWindingR += winding;
						onPath = true;
					} else if (a3Prev > paL && a < paL) {
						pathWindingL += winding;
						onPath = true;
					}
				}
				quality /= 4;
			}
			vPrev = v;
			return !dontFlip && a > paL && a < paR
					&& Curve.getTangent(v, t)[dir ? 'x' : 'y'] === 0
					&& getWinding(point, curves, !dir, closed, true);
		}

		function handleCurve(v) {
			var o0 = v[io + 0],
				o1 = v[io + 2],
				o2 = v[io + 4],
				o3 = v[io + 6];
			if (po <= max(o0, o1, o2, o3) && po >= min(o0, o1, o2, o3)) {
				var a0 = v[ia + 0],
					a1 = v[ia + 2],
					a2 = v[ia + 4],
					a3 = v[ia + 6],
					monoCurves = paL > max(a0, a1, a2, a3) ||
								 paR < min(a0, a1, a2, a3)
							? [v] : Curve.getMonoCurves(v, dir),
					res;
				for (var i = 0, l = monoCurves.length; i < l; i++) {
					if (res = addWinding(monoCurves[i]))
						return res;
				}
			}
		}

		for (var i = 0, l = curvesList.length; i < l; i++) {
			var curve = curvesList[i],
				path = curve._path,
				v = curve.getValues(),
				res;
			if (!i || curvesList[i - 1]._path !== path) {
				vPrev = null;
				if (!path._closed) {
					vClose = Curve.getValues(
							path.getLastCurve().getSegment2(),
							curve.getSegment1(),
							null, !closed);
					if (vClose[io] !== vClose[io + 6]) {
						vPrev = vClose;
					}
				}

				if (!vPrev) {
					vPrev = v;
					var prev = path.getLastCurve();
					while (prev && prev !== curve) {
						var v2 = prev.getValues();
						if (v2[io] !== v2[io + 6]) {
							vPrev = v2;
							break;
						}
						prev = prev.getPrevious();
					}
				}
			}

			if (res = handleCurve(v))
				return res;

			if (i + 1 === l || curvesList[i + 1]._path !== path) {
				if (vClose && (res = handleCurve(vClose)))
					return res;
				if (onPath && !pathWindingL && !pathWindingR) {
					pathWindingL = pathWindingR = path.isClockwise(closed) ^ dir
							? 1 : -1;
				}
				windingL += pathWindingL;
				windingR += pathWindingR;
				pathWindingL = pathWindingR = 0;
				if (onPath) {
					onAnyPath = true;
					onPath = false;
				}
				vClose = null;
			}
		}
		windingL = abs(windingL);
		windingR = abs(windingR);
		return {
			winding: max(windingL, windingR),
			windingL: windingL,
			windingR: windingR,
			quality: quality,
			onPath: onAnyPath
		};
	}

	function propagateWinding(segment, path1, path2, curveCollisionsMap,
			operator) {
		var chain = [],
			start = segment,
			totalLength = 0,
			winding;
		do {
			var curve = segment.getCurve();
			if (curve) {
				var length = curve.getLength();
				chain.push({ segment: segment, curve: curve, length: length });
				totalLength += length;
			}
			segment = segment.getNext();
		} while (segment && !segment._intersection && segment !== start);
		var offsets = [0.5, 0.25, 0.75],
			winding = { winding: 0, quality: -1 },
			tMin = 1e-3,
			tMax = 1 - tMin;
		for (var i = 0; i < offsets.length && winding.quality < 0.5; i++) {
			var length = totalLength * offsets[i];
			for (var j = 0, l = chain.length; j < l; j++) {
				var entry = chain[j],
					curveLength = entry.length;
				if (length <= curveLength) {
					var curve = entry.curve,
						path = curve._path,
						parent = path._parent,
						operand = parent instanceof CompoundPath ? parent : path,
						t = Numerical.clamp(curve.getTimeAt(length), tMin, tMax),
						pt = curve.getPointAtTime(t),
						dir = abs(curve.getTangentAtTime(t).y) < Math.SQRT1_2;
					var wind = null;
					if (operator.subtract && path2) {
						var otherPath = operand === path1 ? path2 : path1,
							pathWinding = otherPath._getWinding(pt, dir, true);
						if (operand === path1 && pathWinding.winding ||
							operand === path2 && !pathWinding.winding) {
							if (pathWinding.quality < 1) {
								continue;
							} else {
								wind = { winding: 0, quality: 1 };
							}
						}
					}
					wind =  wind || getWinding(
							pt, curveCollisionsMap[path._id][curve.getIndex()],
							dir, true);
					if (wind.quality > winding.quality)
						winding = wind;
					break;
				}
				length -= curveLength;
			}
		}
		for (var j = chain.length - 1; j >= 0; j--) {
			chain[j].segment._winding = winding;
		}
	}

	function tracePaths(segments, operator) {
		var paths = [],
			starts;

		function isValid(seg) {
			var winding;
			return !!(seg && !seg._visited && (!operator
					|| operator[(winding = seg._winding || {}).winding]
						&& !(operator.unite && winding.winding === 2
							&& winding.windingL && winding.windingR)));
		}

		function isStart(seg) {
			if (seg) {
				for (var i = 0, l = starts.length; i < l; i++) {
					if (seg === starts[i])
						return true;
				}
			}
			return false;
		}

		function visitPath(path) {
			var segments = path._segments;
			for (var i = 0, l = segments.length; i < l; i++) {
				segments[i]._visited = true;
			}
		}

		function getCrossingSegments(segment, collectStarts) {
			var inter = segment._intersection,
				start = inter,
				crossings = [];
			if (collectStarts)
				starts = [segment];

			function collect(inter, end) {
				while (inter && inter !== end) {
					var other = inter._segment,
						path = other && other._path;
					if (path) {
						var next = other.getNext() || path.getFirstSegment(),
							nextInter = next._intersection;
						if (other !== segment && (isStart(other)
							|| isStart(next)
							|| next && (isValid(other) && (isValid(next)
								|| nextInter && isValid(nextInter._segment))))
						) {
							crossings.push(other);
						}
						if (collectStarts)
							starts.push(other);
					}
					inter = inter._next;
				}
			}

			if (inter) {
				collect(inter);
				while (inter && inter._previous)
					inter = inter._previous;
				collect(inter, start);
			}
			return crossings;
		}

		segments.sort(function(seg1, seg2) {
			var inter1 = seg1._intersection,
				inter2 = seg2._intersection,
				over1 = !!(inter1 && inter1._overlap),
				over2 = !!(inter2 && inter2._overlap),
				path1 = seg1._path,
				path2 = seg2._path;
			return over1 ^ over2
					? over1 ? 1 : -1
					: !inter1 ^ !inter2
						? inter1 ? 1 : -1
						: path1 !== path2
							? path1._id - path2._id
							: seg1._index - seg2._index;
		});

		for (var i = 0, l = segments.length; i < l; i++) {
			var seg = segments[i],
				valid = isValid(seg),
				path = null,
				finished = false,
				closed = true,
				branches = [],
				branch,
				visited,
				handleIn;
			if (valid && seg._path._overlapsOnly) {
				var path1 = seg._path,
					path2 = seg._intersection._segment._path;
				if (path1.compare(path2)) {
					if (path1.getArea())
						paths.push(path1.clone(false));
					visitPath(path1);
					visitPath(path2);
					valid = false;
				}
			}
			while (valid) {
				var first = !path,
					crossings = getCrossingSegments(seg, first),
					other = crossings.shift(),
					finished = !first && (isStart(seg) || isStart(other)),
					cross = !finished && other;
				if (first) {
					path = new Path(Item.NO_INSERT);
					branch = null;
				}
				if (finished) {
					if (seg.isFirst() || seg.isLast())
						closed = seg._path._closed;
					seg._visited = true;
					break;
				}
				if (cross && branch) {
					branches.push(branch);
					branch = null;
				}
				if (!branch) {
					if (cross)
						crossings.push(seg);
					branch = {
						start: path._segments.length,
						crossings: crossings,
						visited: visited = [],
						handleIn: handleIn
					};
				}
				if (cross)
					seg = other;
				if (!isValid(seg)) {
					path.removeSegments(branch.start);
					for (var j = 0, k = visited.length; j < k; j++) {
						visited[j]._visited = false;
					}
					visited.length = 0;
					do {
						seg = branch && branch.crossings.shift();
						if (!seg || !seg._path) {
							seg = null;
							branch = branches.pop();
							if (branch) {
								visited = branch.visited;
								handleIn = branch.handleIn;
							}
						}
					} while (branch && !isValid(seg));
					if (!seg)
						break;
				}
				var next = seg.getNext();
				path.add(new Segment(seg._point, handleIn,
						next && seg._handleOut));
				seg._visited = true;
				visited.push(seg);
				seg = next || seg._path.getFirstSegment();
				handleIn = next && next._handleIn;
			}
			if (finished) {
				if (closed) {
					path.getFirstSegment().setHandleIn(handleIn);
					path.setClosed(closed);
				}
				if (path.getArea() !== 0) {
					paths.push(path);
				}
			}
		}
		return paths;
	}

	return {
		_getWinding: function(point, dir, closed) {
			return getWinding(point, this.getCurves(), dir, closed);
		},

		unite: function(path, options) {
			return traceBoolean(this, path, 'unite', options);
		},

		intersect: function(path, options) {
			return traceBoolean(this, path, 'intersect', options);
		},

		subtract: function(path, options) {
			return traceBoolean(this, path, 'subtract', options);
		},

		exclude: function(path, options) {
			return traceBoolean(this, path, 'exclude', options);
		},

		divide: function(path, options) {
			return options && (options.trace == false || options.stroke)
					? splitBoolean(this, path, 'divide')
					: createResult([
						this.subtract(path, options),
						this.intersect(path, options)
					], true, this, path, options);
		},

		resolveCrossings: function() {
			var children = this._children,
				paths = children || [this];

			function hasOverlap(seg, path) {
				var inter = seg && seg._intersection;
				return inter && inter._overlap && inter._path === path;
			}

			var hasOverlaps = false,
				hasCrossings = false,
				intersections = this.getIntersections(null, function(inter) {
					return inter.hasOverlap() && (hasOverlaps = true) ||
							inter.isCrossing() && (hasCrossings = true);
				}),
				clearCurves = hasOverlaps && hasCrossings && [];
			intersections = CurveLocation.expand(intersections);
			if (hasOverlaps) {
				var overlaps = divideLocations(intersections, function(inter) {
					return inter.hasOverlap();
				}, clearCurves);
				for (var i = overlaps.length - 1; i >= 0; i--) {
					var overlap = overlaps[i],
						path = overlap._path,
						seg = overlap._segment,
						prev = seg.getPrevious(),
						next = seg.getNext();
					if (hasOverlap(prev, path) && hasOverlap(next, path)) {
						seg.remove();
						prev._handleOut._set(0, 0);
						next._handleIn._set(0, 0);
						if (prev !== seg && !prev.getCurve().hasLength()) {
							next._handleIn.set(prev._handleIn);
							prev.remove();
						}
					}
				}
			}
			if (hasCrossings) {
				divideLocations(intersections, hasOverlaps && function(inter) {
					var curve1 = inter.getCurve(),
						seg1 = inter.getSegment(),
						other = inter._intersection,
						curve2 = other._curve,
						seg2 = other._segment;
					if (curve1 && curve2 && curve1._path && curve2._path)
						return true;
					if (seg1)
						seg1._intersection = null;
					if (seg2)
						seg2._intersection = null;
				}, clearCurves);
				if (clearCurves)
					clearCurveHandles(clearCurves);
				paths = tracePaths(Base.each(paths, function(path) {
					Base.push(this, path._segments);
				}, []));
			}
			var length = paths.length,
				item;
			if (length > 1 && children) {
				if (paths !== children)
					this.setChildren(paths);
				item = this;
			} else if (length === 1 && !children) {
				if (paths[0] !== this)
					this.setSegments(paths[0].removeSegments());
				item = this;
			}
			if (!item) {
				item = new CompoundPath(Item.NO_INSERT);
				item.addChildren(paths);
				item = item.reduce();
				item.copyAttributes(this);
				this.replaceWith(item);
			}
			return item;
		},

		reorient: function(nonZero, clockwise) {
			var children = this._children;
			if (children && children.length) {
				this.setChildren(reorientPaths(this.removeChildren(),
						function(w) {
							return !!(nonZero ? w : w & 1);
						},
						clockwise));
			} else if (clockwise !== undefined) {
				this.setClockwise(clockwise);
			}
			return this;
		},

		getInteriorPoint: function() {
			var bounds = this.getBounds(),
				point = bounds.getCenter(true);
			if (!this.contains(point)) {
				var curves = this.getCurves(),
					y = point.y,
					intercepts = [],
					roots = [];
				for (var i = 0, l = curves.length; i < l; i++) {
					var v = curves[i].getValues(),
						o0 = v[1],
						o1 = v[3],
						o2 = v[5],
						o3 = v[7];
					if (y >= min(o0, o1, o2, o3) && y <= max(o0, o1, o2, o3)) {
						var monoCurves = Curve.getMonoCurves(v);
						for (var j = 0, m = monoCurves.length; j < m; j++) {
							var mv = monoCurves[j],
								mo0 = mv[1],
								mo3 = mv[7];
							if ((mo0 !== mo3) &&
								(y >= mo0 && y <= mo3 || y >= mo3 && y <= mo0)){
								var x = y === mo0 ? mv[0]
									: y === mo3 ? mv[6]
									: Curve.solveCubic(mv, 1, y, roots, 0, 1)
										=== 1
										? Curve.getPoint(mv, roots[0]).x
										: (mv[0] + mv[6]) / 2;
								intercepts.push(x);
							}
						}
					}
				}
				if (intercepts.length > 1) {
					intercepts.sort(function(a, b) { return a - b; });
					point.x = (intercepts[0] + intercepts[1]) / 2;
				}
			}
			return point;
		}
	};
});

var PathFlattener = Base.extend({
	_class: 'PathFlattener',

	initialize: function(path, flatness, maxRecursion, ignoreStraight, matrix) {
		var curves = [],
			parts = [],
			length = 0,
			minSpan = 1 / (maxRecursion || 32),
			segments = path._segments,
			segment1 = segments[0],
			segment2;

		function addCurve(segment1, segment2) {
			var curve = Curve.getValues(segment1, segment2, matrix);
			curves.push(curve);
			computeParts(curve, segment1._index, 0, 1);
		}

		function computeParts(curve, index, t1, t2) {
			if ((t2 - t1) > minSpan
					&& !(ignoreStraight && Curve.isStraight(curve))
					&& !Curve.isFlatEnough(curve, flatness || 0.25)) {
				var halves = Curve.subdivide(curve, 0.5),
					tMid = (t1 + t2) / 2;
				computeParts(halves[0], index, t1, tMid);
				computeParts(halves[1], index, tMid, t2);
			} else {
				var dx = curve[6] - curve[0],
					dy = curve[7] - curve[1],
					dist = Math.sqrt(dx * dx + dy * dy);
				if (dist > 0) {
					length += dist;
					parts.push({
						offset: length,
						curve: curve,
						index: index,
						time: t2,
					});
				}
			}
		}

		for (var i = 1, l = segments.length; i < l; i++) {
			segment2 = segments[i];
			addCurve(segment1, segment2);
			segment1 = segment2;
		}
		if (path._closed)
			addCurve(segment2 || segment1, segments[0]);
		this.curves = curves;
		this.parts = parts;
		this.length = length;
		this.index = 0;
	},

	_get: function(offset) {
		var parts = this.parts,
			length = parts.length,
			start,
			i, j = this.index;
		for (;;) {
			i = j;
			if (!j || parts[--j].offset < offset)
				break;
		}
		for (; i < length; i++) {
			var part = parts[i];
			if (part.offset >= offset) {
				this.index = i;
				var prev = parts[i - 1],
					prevTime = prev && prev.index === part.index ? prev.time : 0,
					prevOffset = prev ? prev.offset : 0;
				return {
					index: part.index,
					time: prevTime + (part.time - prevTime)
						* (offset - prevOffset) / (part.offset - prevOffset)
				};
			}
		}
		return {
			index: parts[length - 1].index,
			time: 1
		};
	},

	drawPart: function(ctx, from, to) {
		var start = this._get(from),
			end = this._get(to);
		for (var i = start.index, l = end.index; i <= l; i++) {
			var curve = Curve.getPart(this.curves[i],
					i === start.index ? start.time : 0,
					i === end.index ? end.time : 1);
			if (i === start.index)
				ctx.moveTo(curve[0], curve[1]);
			ctx.bezierCurveTo.apply(ctx, curve.slice(2));
		}
	}
}, Base.each(Curve._evaluateMethods,
	function(name) {
		this[name + 'At'] = function(offset) {
			var param = this._get(offset);
			return Curve[name](this.curves[param.index], param.time);
		};
	}, {})
);

var PathFitter = Base.extend({
	initialize: function(path) {
		var points = this.points = [],
			segments = path._segments,
			closed = path._closed;
		for (var i = 0, prev, l = segments.length; i < l; i++) {
			var point = segments[i].point;
			if (!prev || !prev.equals(point)) {
				points.push(prev = point.clone());
			}
		}
		if (closed) {
			points.unshift(points[points.length - 1]);
			points.push(points[1]);
		}
		this.closed = closed;
	},

	fit: function(error) {
		var points = this.points,
			length = points.length,
			segments = null;
		if (length > 0) {
			segments = [new Segment(points[0])];
			if (length > 1) {
				this.fitCubic(segments, error, 0, length - 1,
						points[1].subtract(points[0]),
						points[length - 2].subtract(points[length - 1]));
				if (this.closed) {
					segments.shift();
					segments.pop();
				}
			}
		}
		return segments;
	},

	fitCubic: function(segments, error, first, last, tan1, tan2) {
		var points = this.points;
		if (last - first === 1) {
			var pt1 = points[first],
				pt2 = points[last],
				dist = pt1.getDistance(pt2) / 3;
			this.addCurve(segments, [pt1, pt1.add(tan1.normalize(dist)),
					pt2.add(tan2.normalize(dist)), pt2]);
			return;
		}
		var uPrime = this.chordLengthParameterize(first, last),
			maxError = Math.max(error, error * error),
			split,
			parametersInOrder = true;
		for (var i = 0; i <= 4; i++) {
			var curve = this.generateBezier(first, last, uPrime, tan1, tan2);
			var max = this.findMaxError(first, last, curve, uPrime);
			if (max.error < error && parametersInOrder) {
				this.addCurve(segments, curve);
				return;
			}
			split = max.index;
			if (max.error >= maxError)
				break;
			parametersInOrder = this.reparameterize(first, last, uPrime, curve);
			maxError = max.error;
		}
		var tanCenter = points[split - 1].subtract(points[split + 1]);
		this.fitCubic(segments, error, first, split, tan1, tanCenter);
		this.fitCubic(segments, error, split, last, tanCenter.negate(), tan2);
	},

	addCurve: function(segments, curve) {
		var prev = segments[segments.length - 1];
		prev.setHandleOut(curve[1].subtract(curve[0]));
		segments.push(new Segment(curve[3], curve[2].subtract(curve[3])));
	},

	generateBezier: function(first, last, uPrime, tan1, tan2) {
		var epsilon = 1e-12,
			abs = Math.abs,
			points = this.points,
			pt1 = points[first],
			pt2 = points[last],
			C = [[0, 0], [0, 0]],
			X = [0, 0];

		for (var i = 0, l = last - first + 1; i < l; i++) {
			var u = uPrime[i],
				t = 1 - u,
				b = 3 * u * t,
				b0 = t * t * t,
				b1 = b * t,
				b2 = b * u,
				b3 = u * u * u,
				a1 = tan1.normalize(b1),
				a2 = tan2.normalize(b2),
				tmp = points[first + i]
					.subtract(pt1.multiply(b0 + b1))
					.subtract(pt2.multiply(b2 + b3));
			C[0][0] += a1.dot(a1);
			C[0][1] += a1.dot(a2);
			C[1][0] = C[0][1];
			C[1][1] += a2.dot(a2);
			X[0] += a1.dot(tmp);
			X[1] += a2.dot(tmp);
		}

		var detC0C1 = C[0][0] * C[1][1] - C[1][0] * C[0][1],
			alpha1,
			alpha2;
		if (abs(detC0C1) > epsilon) {
			var detC0X = C[0][0] * X[1]    - C[1][0] * X[0],
				detXC1 = X[0]    * C[1][1] - X[1]    * C[0][1];
			alpha1 = detXC1 / detC0C1;
			alpha2 = detC0X / detC0C1;
		} else {
			var c0 = C[0][0] + C[0][1],
				c1 = C[1][0] + C[1][1];
			alpha1 = alpha2 = abs(c0) > epsilon ? X[0] / c0
							: abs(c1) > epsilon ? X[1] / c1
							: 0;
		}

		var segLength = pt2.getDistance(pt1),
			eps = epsilon * segLength,
			handle1,
			handle2;
		if (alpha1 < eps || alpha2 < eps) {
			alpha1 = alpha2 = segLength / 3;
		} else {
			var line = pt2.subtract(pt1);
			handle1 = tan1.normalize(alpha1);
			handle2 = tan2.normalize(alpha2);
			if (handle1.dot(line) - handle2.dot(line) > segLength * segLength) {
				alpha1 = alpha2 = segLength / 3;
				handle1 = handle2 = null;
			}
		}

		return [pt1,
				pt1.add(handle1 || tan1.normalize(alpha1)),
				pt2.add(handle2 || tan2.normalize(alpha2)),
				pt2];
	},

	reparameterize: function(first, last, u, curve) {
		for (var i = first; i <= last; i++) {
			u[i - first] = this.findRoot(curve, this.points[i], u[i - first]);
		}
		for (var i = 1, l = u.length; i < l; i++) {
			if (u[i] <= u[i - 1])
				return false;
		}
		return true;
	},

	findRoot: function(curve, point, u) {
		var curve1 = [],
			curve2 = [];
		for (var i = 0; i <= 2; i++) {
			curve1[i] = curve[i + 1].subtract(curve[i]).multiply(3);
		}
		for (var i = 0; i <= 1; i++) {
			curve2[i] = curve1[i + 1].subtract(curve1[i]).multiply(2);
		}
		var pt = this.evaluate(3, curve, u),
			pt1 = this.evaluate(2, curve1, u),
			pt2 = this.evaluate(1, curve2, u),
			diff = pt.subtract(point),
			df = pt1.dot(pt1) + diff.dot(pt2);
		return Numerical.isMachineZero(df) ? u : u - diff.dot(pt1) / df;
	},

	evaluate: function(degree, curve, t) {
		var tmp = curve.slice();
		for (var i = 1; i <= degree; i++) {
			for (var j = 0; j <= degree - i; j++) {
				tmp[j] = tmp[j].multiply(1 - t).add(tmp[j + 1].multiply(t));
			}
		}
		return tmp[0];
	},

	chordLengthParameterize: function(first, last) {
		var u = [0];
		for (var i = first + 1; i <= last; i++) {
			u[i - first] = u[i - first - 1]
					+ this.points[i].getDistance(this.points[i - 1]);
		}
		for (var i = 1, m = last - first; i <= m; i++) {
			u[i] /= u[m];
		}
		return u;
	},

	findMaxError: function(first, last, curve, u) {
		var index = Math.floor((last - first + 1) / 2),
			maxDist = 0;
		for (var i = first + 1; i < last; i++) {
			var P = this.evaluate(3, curve, u[i - first]);
			var v = P.subtract(this.points[i]);
			var dist = v.x * v.x + v.y * v.y;
			if (dist >= maxDist) {
				maxDist = dist;
				index = i;
			}
		}
		return {
			error: maxDist,
			index: index
		};
	}
});

 var R9Line = Path.extend({
	_class: 'R9Line',
	initialize: function R9Line(arg) {
		Path.apply(this, arguments);
		if( !this.fillColor ) this.fillColor = this._project.getBuiltInColor('fillColor');
		if( !this.strokeColor ) this.strokeColor = this._project.getBuiltInColor('strokeColor');
	},

	getVector : function(){
		return  this.getEnd().__subtract(this.getStart());
	},

	getStart: function(){
	   return this.getFirstSegment().point;
	},
	 getEnd: function(){
		return this.getLastSegment().point;
	 },

	 put_start_and_end_on: function(start, end){
		if( start && start._class == 'Point' )
			this.getFirstSegment().point = start;
		if(  end && end._class == 'Point' )
			this.getLastSegment().point = end;
	 },

	 get_projection: function(point){
		 return this.getNearestPoint(point);
	 },

	 setPostionControl_start: function(shape){
		var that = this;
		this.addUpdater(function(){
			var c = shape.position;
			if( !c.equals( that.getFirstSegment().point )){
				that.getFirstSegment().point = c;
			}
		});
	 },

	setPostionControl_end: function(shape){
		var that = this;
		this.addUpdater(function(){
			var c = shape.position;
			if( !c.equals( that.getLastSegment().point )){
				that.getLastSegment().point = c;
			}
		});
	},

});

 var R9DashLine = R9Line.extend({
	_class: 'R9DashLine',
	initialize: function R9DashLine(arg) {
		R9Line.apply(this, arguments);
		this.dashArray = [1, 2];
	},

});

 var R9TangentLine = R9Line.extend({
	_class: 'R9TangentLine',
	initialize: function R9TangentLine(arg) {
		var args = arguments;
		R9Line.apply(this, args);
		this.host = arg.host || null;
		this.point = new Point(arg.point);
		this.t_len = arg.t_len ?  arg.t_len  : 50;
		var offset = this.host.getOffsetOf( this.point ),
			vector = this.host.getTangentAt(offset),
			from = this.point.__add( vector.normalize(this.t_len) ),
			to =  this.point.__add(  vector.rotate(180).normalize(this.t_len) );
		this._add([ new Segment(from),  new Segment(to)]);
		this.indicator = new Path.Circle({
			center: this.point,
			radius: 2,
			fillColor: 'red'
		});
		if( typeof arg.vertexDraggable  != 'undefined' ){
			this.setVertexDraggable( !!arg.vertexDraggable );
		}
	},
	_adjust: function(left){
		var offset = this.host.getOffsetOf( this.point ), gap = 1;
		offset = left ? offset + gap : offset - gap;
		this.point = this.host.getPointAt(offset);
		var vector = this.host.getTangentAt(offset),
		   from = this.point.__add( vector.normalize(this.t_len) ),
		   to =  this.point.__add(  vector.rotate(180).normalize(this.t_len) );
		this.removeSegments();
		this._add([ new Segment(from),  new Segment(to)]);
		this.indicator.position = this.point;
	},

	setVertexDraggable: function(draggable){
		if( this._vertexDraggable == draggable ) return;
		this._vertexDraggable = draggable;
		this._hitSegment = null;
		var project = this._project, that = this, left = false;
		function onMouseDown(event) {
			that._hitSegment  = null;
			var hitResult = project.hitTest(event.point,  {
				segments: true,
				stroke: true,
				fill: true,
				tolerance: 10
				});
			if (!hitResult || hitResult.item != that )
				return;
			if (hitResult.type == 'segment') {
				that._hitSegment = hitResult.segment;
				that. left = that._hitSegment == that.firstSegment;
			} else if (hitResult.type == 'stroke') {
			}
		}

		function onMouseMove(event) {
			project.activeLayer.selected = false;
			if (event.item)
				event.item.selected = true;
		}
		function onMouseDrag(event) {
			if (that._hitSegment) {
				that._adjust(that.left);
				that._changed(41);
			}
		}
		if( draggable ){
			that.on('mousemove', onMouseMove);
			that.on('mousedrag', onMouseDrag);
			that.on('mousedown', onMouseDown);
		} else {
			that.off('mousemove', onMouseMove);
			that.off('mousedrag', onMouseDrag);
			that.off('mousedown', onMouseDown);
		}
	},
});

 var R9Angle = Path.extend({
	_class: 'R9Angle',
	initialize: function R9Angle(arg) {
		var args = arguments;
		Path.apply(this, args);
		this.vertexControl = null;
		this.fromControl = null;
		this.toControl = null;
		this.label = null;
		this.show_arrow = false;
		this.angle_path = null;
		if( typeof arg.vertex.type != 'undefined' ){
			this.vertexControl =  new PositionControl(arg.vertex);
			this.vertex = this.vertexControl.getPosition();
		} else {
			this.vertex =  new Point(arg.vertex);
		}
		if( typeof arg.from.type != 'undefined' ){
			this.fromControl =  new PositionControl(arg.from);
			this.from = this.fromControl.getPosition();
		} else {
			this.from =  new Point(arg.from);
		}
		if( typeof arg.to.type != 'undefined' ){
			this.toControl =  new PositionControl(arg.to);
			this.to = this.toControl.getPosition();
		} else {
			this.to =  new Point(arg.to);
		}
		this.show_arrow = typeof arg.show_arrow == 'undefined' ?  false : !!arg.show_arrow;
		var radius = 25, threshold = 10, vector_f = this.from.__subtract( this.vertex ) ,
		vector_t = this.to.__subtract( this.vertex ), center = this.vertex,
		angle = vector_t.angle - vector_f.angle;
		if (vector_f.length < radius + threshold || vector_t.length < radius + threshold  )
			return;

		var f2 = vector_f.normalize(radius);
		var through = f2.rotate( angle / 2);
		var t2 = f2.rotate(angle);
		var end = center.__add( t2 );

		this.moveTo(center.__add( f2 ));
		this.arcTo(center.__add(through), end);

		if( this.show_arrow && Math.abs( angle) >15){
			var arrowVector = t2.normalize(7.5).rotate( angle < 0 ? -90 : 90);
			this.angle_path = new Path([
				end .__add( arrowVector.rotate(135) ),
				end,
				end .__add( arrowVector.rotate(-135) )
			  ]);
			this.angle_path.strokeColor = this.strokeColor;
		}
		var show_label = typeof arg.show_label == 'undefined' ?  false : !!arg.show_label;
		if (show_label) {
			this.label = new PointText(center.__add( through.normalize(radius + 10) ).__add( new Point(0, 3)));
			this.label.content = Math.floor(angle * 100) / 100 + '\xb0';
			this.label.fillColor = this.strokeColor;
		}
		var dash = typeof arg.dash == 'undefined' ?  true : !!arg.dash;
		if( dash ){
			this.dashArray = [1, 2];
			if( this.angle_path )
				this.angle_path.dashArray = [1, 2];
		}

		if( this.fromControl != null || this.toControl != null || this.vertexControl != null ){
			var that = this;
			this.addUpdater(function(){
				var changed = false;
				if( that.fromControl != null ){
					var f = that.fromControl.getPosition();
					if( !f.equals( that.from)){
						that.from = f; changed = true;
					}
				}
				if(that.toControl != null){
					var f = that.toControl.getPosition();
					if( !f.equals( that.frotom)){
						that.to = f; changed = true;
					}
				}
				if(that.vertexControl != null){
					var f = that.vertexControl.getPosition();
					if( !f.equals( that.vertex)){
						that.vertex = f; changed = true;
					}
				}
				if(! changed ) return;
				that.adjust();
			});
		}
	},
	adjust: function(){
		var radius = 25, threshold = 10, vector_f = this.from.__subtract( this.vertex ) ,
		vector_t = this.to.__subtract( this.vertex ), center = this.vertex,
		angle = vector_t.angle - vector_f.angle;
		if (vector_f.length < radius + threshold || vector_t.length < radius + threshold  )
			return;

		var f2 = vector_f.normalize(radius);
		var through = f2.rotate( angle / 2);
		var t2 = f2.rotate(angle);
		var end = center.__add( t2 );

		this.removeSegments();
		this.moveTo(center.__add( f2 ));
		this.arcTo(center.__add(through), end);

		if( this.show_arrow && Math.abs( angle) >15){
			var arrowVector = t2.normalize(7.5).rotate( angle < 0 ? -90 : 90);
			this.angle_path.removeSegments();
			this.angle_path.addSegments([
				 new Segment(end .__add( arrowVector.rotate(135) )),
				 new Segment( end ),
				 new Segment(end .__add( arrowVector.rotate(-135) ))
			  ]);
		}
		 if (this.label != null) {
			this.label.position = (center.__add( through.normalize(radius + 10) ).__add( new Point(0, 3)));
			this.label.content = Math.floor(angle * 100) / 100 + '\xb0';
		}
	}
});

 var TracedPath = Path.extend({
	_class: 'TracedPath',
	initialize: function TracedPath(arg) {
		Path.apply(this, arguments);
		if( typeof this.tail_time == 'undefined')
			this.tail_time = 0;
		else
			this.time = 1;
		this.addUpdater(this._update_path.bind(this));
	},

	_update_path: function(evnt){
		var that = this, f = that.traced_func, np;
		if( typeof f == 'function') np = f();
		else if( f instanceof Item) np = f.position;
		else return;
		var ls = this.lastSegment, same = ls && ls.point.equals(np);
		if(!same)
			that.addSegment(new Segment(np));
		if( that.tail_time ){
			that.time += evnt.delta;
			if( that.segments.length > 0 && that.time - 1 > that.tail_time ){
				that.removeSegment(0);
			}
		}
	}
});
var PointPath2 = Path.extend({
	_class: 'PointPath2',
	initialize: function PointPath2(arg) {
		Path.apply(this, arguments);
		this._time = 0;
		this.homotopy = null;
	},
	setTime: function(time){
		this._time = time;
		if( this.homotopy == null ) return;
		var segments = this._segments, t, p, dx, dy;
		for (var i = 0, l = segments.length; i < l; i++) {
			t = segments[i];
			p = this.homotopy(t.point.x, t.point.y,  time);
			t.point._set(p[0], p[1], true);
			if( t.handleIn ){
			}
			if( t.handleOut ){
			}
			t._changed();
		}
	},
	getTime: function(){
		return this._time;
	}

});
var PointPath = Item.extend({
	_class: 'PointPath',
	initialize: function PointPath(arg) {
		this._initialize(arg);
		this.data = [];
		this._time = 0;
		this.homotopy = null;
		this.closed = false;
	},
	setTime: function(t){
		this._time = t;
	},
	getTime: function(){
		return this._time;
	},
	_draw: function(ctx, param, viewMatrix) {
		var data = this.data, count = data.length;
		if( count == 0 ) return;
		this._setStyles(ctx, param, viewMatrix);
		ctx.beginPath();
		if( this.homotopy ){
			var d = this.homotopy(data[0], data[1], this._time);
			ctx.moveTo(d[0], d[1]);
			for(var i = 2; i < count; i+=2){
				d = this.homotopy(data[i], data[i+1], this._time);
				ctx.lineTo(d[0], d[1]);
			}
		} else {
			ctx.moveTo(data[0], data[1]);
			for(var i = 2; i < count; i+=2){
				ctx.lineTo(data[i], data[i+1]);
			}
		}
		ctx.stroke();
		if( this.closed)
		   ctx.fill();
	},
});
var TracedPathLite = PointPath.extend({
	_class: 'TracedPathLite',
	initialize: function TracedPathLite(arg) {
		PointPath.apply(this, arguments);
		if( typeof this.tail_time == 'undefined')
			this.tail_time = 0;
		else
			this.time = 1;
		this.data = [];
		this.addUpdater(this._update_path.bind(this));
	},

	_update_path: function(evnt){
		var that = this, f = that.traced_func, np,
			data = this.data, count =  data.length, lx, ly, same=false;
		if( typeof f == 'function') np = f();
		else if( f instanceof Item) np = f.position;
		else return;
		if( count > 0 ){
			lx =  data[count-2];
			ly =  data[count-1];
			same =  np.x == lx && np.y == ly  ;
		}
		if(!same){
			data.push(np.x);
			data.push(np.y);
		}
		if( that.tail_time ){
			that.time += evnt.delta;
			if( data.length > 1 && that.time - 1 > that.tail_time ){
				data.splice(0,2);
			}
		}
	}
});

var LinearBase = Base.extend({
	_class: 'LinearBase',

	initialize: function LinearBase(scale_factor ) {
		this.scale_factor = scale_factor || 1.0;
	},
	scale_it: function(value){
		if( Array.isArray(value) ){
			var that = this;
			return value.map( a => that.scale_factor * a );
		}
		if( value._class == 'Point' ){
			return new Point( value.x * this.scale_factor, value.y * this.scale_factor );
		}
		return  this.scale_factor * value;
	},
	inverse_scale: function(value){
		if( Array.isArray(value)  ){
			var that = this;
			return value.map( a => a / that.scale_factor   );
		}
		if( value._class == 'Point' ){
			return new Point( value.x / this.scale_factor, value.y / this.scale_factor );
		}
		return value / this.scale_factor;
	},
	get_custom_labels: function(){  }
});

var LogBase = Base.extend({
	_class: 'LogBase',

	initialize: function LogBase(base, custom_labels) {
		this.base = base || 1.0;
		this.custom_labels = custom_labels || [];
	},
	scale_it: function(value){
		if(  Array.isArray(value)  ){
			var that = this;
			return value.map( a => that.base**a  );
		}
		if( value._class == 'Point' ){
			return new Point( this.base** value.x  , this.base** value.y  );
		}
		return  this.base**value;
	},
	inverse_scale: function(value){
		if( value <= 0 )
			return null;
		if( Array.isArray(value) ){
			var that = this;
			return value.map( a => Math.log(arguments) / Math.log(that.base)   );
		}
		if( value._class == 'Point' ){
			return new Point( Math.log(value.x) / Math.log(this.base)  , Math.log(value.y) / Math.log(this.base) );
		}
		value = Math.log(value) / Math.log(this.base);
		return value;
	},
	get_custom_labels: function(){

	}
});

var NumberLine = R9Line.extend({
	_class: 'NumberLine',

	initialize: function NumberLine(params) {
		var args = arguments;
		R9Line.apply(this, args);
		this._add([ new Segment(params.from),  new Segment(params.to)]);
		this.include_tip =  typeof params.include_tip == 'undefined' ? true : params.include_tip ;
		if ( this.include_tip ){
			this.setTips('arrow');
		}
		this.font_size = params.font_size || 16;
		this. numbers_to_exclude =  params. numbers_to_exclude || [];
		this. numbers_to_include =  params. numbers_to_include || [];
		this. n_t_i_color = params.numbers_to_include_color;
		this. numbers_with_elongated_ticks  =  params. numbers_with_elongated_ticks || [];

		this.x_range = params.x_range;
		this.x_min = this.x_range[0];
		this.x_max = this.x_range[1];
		this.x_val_step = this.x_range[2];

		this.dynamic_step_value = params.dynamic_step_value || false;
		this.fixed_step_length = params.fixed_step_length || false;
		this.value_scaling = params.value_scaling ||  new LinearBase();
		this.decimal_number_config = params.decimal_number_config  ;
		if( !this.decimal_number_config ) {
			this. decimal_number_config = {
				num_decimal_places : this.decimal_places_from_step(),
		   }
		}
		this.include_ticks =  typeof params.include_ticks == 'undefined' ? true : params.include_ticks ;
		this.exclude_origin_tick = params.exclude_origin_tick ||  false;
		this.numberColor = params.numberColor  ;
		this.tick_length = params.tick_length || 6;
		this.include_label =  typeof params.include_label == 'undefined' ? true : params.include_label ;
		this.label_direction = typeof params.label_direction == 'undefined' ? true : params.label_direction ;
		this.cached_length = this.length;
		this._first_tick_shift  = 0;
		this.p2v = 0;
		var p2v =  this.get_adjusted_render_space_range() / (this.x_max - this.x_min);
		this.adjust_ticks_by_scale_and_pos(p2v);

		this._registeredDotes = [];
	},
	_copyExtraAttr: function(source, excludeMatrix){
		this.include_tip = source.include_tip;
		this.font_size = source.font_size ;
		this. numbers_to_exclude =  source. numbers_to_exclude  ;
		this. numbers_to_include =  source. numbers_to_include ;
		this. n_t_i_color = source.numbers_to_include_color;
		this. numbers_with_elongated_ticks  =  source. numbers_with_elongated_ticks  ;
		this.x_range = source.x_range;
		this.x_min = source.x_min ;
		this.x_max = source.x_max ;
		this.x_val_step = source.x_val_step ;
		this.dynamic_step_value = source.dynamic_step_value  ;
		this.fixed_step_length = source.fixed_step_length  ;
		this.value_scaling = source.value_scaling  ;
		this.decimal_number_config = source.decimal_number_config  ;
		this. decimal_number_config =  source.decimal_number_config;
		this.include_ticks =  source.include_ticks ;
		this.exclude_origin_tick = source.exclude_origin_tick  ;
		this.numberColor = source.numberColor  ;
		this.tick_length = source.tick_length  ;
		this.include_label =  source.include_label ;
		this.label_direction = source.label_direction ;
		this.cached_length = source.cached_length;
		this._first_tick_shift  = source._first_tick_shift;
		this.p2v = source.p2v;
		this._registeredDotes = source._registeredDotes;
		this.stepLen = source.stepLen;
	 },

	get_x_range:function(){
		return [this.x_min, this.x_max, this.x_val_step] ;
	},

	registerDote: function(value, color, radius){
		var that = this;
		var dot   =  new Path.Circle({
			center: that.getGlobalRenderPosByValue(value),
			radius:  radius || 4,
			fillColor: color || 'red'
		});
		dot.data_value = value;
		this._registeredDotes.push(dot);
		return dot;
	},
	unregisterDot: function(value){
		var that = this;
		that._registeredDotes = that._registeredDotes.filter(e => e.data_value != value);
	},

	update_registered_dots: function(){
		var that = this;
		that._registeredDotes.array.forEach(e => {
			e.position = that.getGlobalRenderPosByValue(e.data_value);
		});
	},
	shift_by: function(delta, keep_tick_value){
		if( delta == 0 ) return;
		var  value_delta = delta * this.value2pix();
		this.x_min += value_delta;
		this.x_max = this.x_min + this.get_adjusted_render_space_range() * this.value2pix();

		if( typeof keep_tick_value == 'undefined' || keep_tick_value == null){
			var cur_shift = this._first_tick_shift + delta;
			var leftover =  cur_shift - parseInt( cur_shift / this.stepLen )  * this.stepLen;
			if( leftover < 0)
				leftover = this.stepLen + leftover;
			this._first_tick_shift = leftover;
		} else {

			var fix_tick_pos = (keep_tick_value - this.x_min) * this.p2v;
			this._first_tick_shift = fix_tick_pos  - parseInt(parseInt(fix_tick_pos)/this.stepLen) * this.stepLen
		}
	},

	decimal_places_from_step : function(){
		var  step_as_str =  this.x_val_step + '',
		pos = step_as_str.indexOf('.');
		var v =  pos < 0 ? 0 : step_as_str.length - pos -1;
		return this.dynamic_step_value ? (Math.max(1,v)) : v;
	},
	get_adjusted_render_space_range : function(){
		return ( this.include_tip ? this.length -20 : this.length) ;
	},

	value2pix : function(){
		return  1 / this.p2v;
	},
	pix2value : function(){
		return  this.p2v;
	},

	getValueByGlobalRenderPos: function(pos){
		var pos2 = this.getNearestPoint(pos),  offset = this.getOffsetOf(pos2);
		return this.x_min + offset * this.value2pix();
	},
	getGlobalRenderPosByValue: function(avalue){
		var offset = (avalue - this.x_min) * this.pix2value();
		return this.getPointAt(offset) ;
	},

	adjust_ticks_by_scale_and_pos: function(p2v, fix_tick_value){
		 if( this.p2v == p2v ) return;
		 var old_p2v = this.p2v;
		 this.p2v = p2v;
		 if( this.dynamic_step_value ){
			this.x_val_step = Numerical.calcuateStepLength( this.p2v );
			this.stepLen =  (this.x_val_step * this.p2v);
		 } else {
			this.stepLen =  (this.x_val_step * this.p2v);
		 }
		 if( old_p2v == 0) return;

		 if( typeof fix_tick_value == 'undefined' || fix_tick_value == null)
			 return;
		 if( fix_tick_value < this.x_min || fix_tick_value > this.x_max ){
			 return;
		 }
		 var fix_tick_pos = (fix_tick_value - this.x_min) * old_p2v;
		 this._first_tick_shift = fix_tick_pos  - parseInt(parseInt(fix_tick_pos)/this.stepLen) * this.stepLen
		 this.x_min = fix_tick_value - fix_tick_pos * this.value2pix();
		 this.x_max = this.x_min + this.get_adjusted_render_space_range()  * this.value2pix();
	},

	get_ticks_global_range: function(){
		var poses = [];
		var netLength = this.get_adjusted_render_space_range()  ;
		poses.push( this.localToGlobal( this.getPointAt(0) ));
		poses.push( this.localToGlobal( this.getPointAt(netLength) ));
		return poses;
	},

	get_ticks_global_pos: function(){
		var poses = [];
		var netLength = this.get_adjusted_render_space_range()  ;
		var stepLen =  this.stepLen   ;
		if( stepLen <= 0 ){
			return poses;
		}
		var accLen = this._first_tick_shift;
		while (accLen <  netLength + 2 ){
			poses.push( this.localToGlobal( this.getPointAt(accLen) ));
			accLen += stepLen;
		}
		return poses;
	},

	_draw_decro: function(ctx, param, viewMatrix) {
		var parms = this.arguments;
		this._setStyles(ctx, param, viewMatrix);
		var netLength = this.get_adjusted_render_space_range() ;

		if( this.cached_length != this.length ){
			this.cached_length = this.length;
			if( this.fixed_step_length ){
			   this.x_max = this.x_min + netLength / this.p2v;
			} else {
				var pp2v =  netLength / (this.x_max - this.x_min);
				if( pp2v != this.p2v ){
					 this.adjust_ticks_by_scale_and_pos(pp2v);
				}
			}
		}
		if( !this.include_label && !this.include_ticks )
			return

		var stepLen =  this.stepLen ,
			style = this._style, font_size = this.font_size,
			stroke = style.stroke  ;
		if( stepLen <= 0 ){
			return;
		}
		ctx.font =  "normal " + font_size + "px sans-serif";
		ctx.textAlign = style.getJustification();
		var accLen = this._first_tick_shift,  cur_v = this.x_min + this._first_tick_shift * this.value2pix(), tick_length = this.tick_length,
		vector = this.getVector(), v1 = vector.normalize(tick_length),  v2 = vector.normalize(font_size), mlen, step;
		ctx.lineWidth = 1;
		while (accLen <  netLength + 2 ){
			 ctx.strokeStyle = stroke;
			 mlen = this.mark_value_on_axis(ctx, accLen, cur_v, v1, v2, stroke, this.numberColor,  this.include_ticks, true);
			 step =  mlen + 5 < stepLen ? 1 : 2;
			 accLen += stepLen * step;
			 cur_v += this.x_val_step * step;
		}
		if( this.numbers_to_include && this.numbers_to_include.length > 0){
			for(var i in this.numbers_to_include){
				var cur_v = this.numbers_to_include[i];
				accLen = ( cur_v - this.x_min ) * this.p2v;
				ctx.strokeStyle = stroke;
				this.mark_value_on_axis(ctx, accLen, cur_v, v1, v2, this.n_t_i_color || this.numberColor || stroke,
					 this.n_t_i_color || this.numberColor, true, false);
			}
		}
	} ,
	mark_value_on_axis: function(ctx, accLen, cur_v, v1, v2, color1, color2, showmarker, tick_or_dot ){
		if( accLen === null )
			 accLen = ( cur_v - this.x_min ) * this.p2v;
		var rotate = this.label_direction ? -90 : 90;
		var pos = this.getPointAt(accLen), to = pos.__add( v1.rotate(rotate)  ),
			to_2 = pos.__add( v2.rotate(-rotate) );
		if( color1 ){
			ctx.strokeStyle = color1;
			ctx.fillStyle = color1;
		}
		if(showmarker){
			if( tick_or_dot ){
				ctx.beginPath();
				ctx.moveTo(pos.x, pos.y);
				ctx.lineTo(to.x, to.y);
				ctx.stroke();
			} else {
				var radius = this._style.strokeWidth || 2;
				ctx.beginPath();
				ctx.arc( pos.x, pos.y, radius, 0, Math.PI*2, true );
				ctx.fill();
			}
		}
		if( !this.include_label || (this.exclude_origin_tick && cur_v == 0)
				|| ( this.numbers_to_exclude && this.numbers_to_exclude.indexOf( cur_v) >= 0 ) ){
			return 0;
		} else {
			if( color2 ){
				ctx.strokeStyle = color2;
				ctx.fillStyle = color2;
			}
			var v =  Math.round(cur_v) === cur_v ? cur_v : cur_v .toFixed(this.decimal_number_config.num_decimal_places);

			var label_width =  ctx.measureText(v+'').width ;
			ctx.lineWidth = 1;
			ctx.strokeText(v +'', to_2.x - label_width/2, to_2.y);
			ctx.fillText(v +'', to_2.x - label_width/2, to_2.y);
			return label_width;
		}
	}

});
var CoordinateSystem = Item.extend({
	_class: 'CoordinateSystem',

	initialize: function CoordinateSystem(axis_x, axis_y,    show_grid, show_grid_color) {
		this._initialize( );
		this._axis = [];
		this._axis[0] = axis_x;
		this._axis[1] = axis_y;
		this.show_grid = show_grid;
		this.show_grid_color = show_grid_color || this._project.getBuiltInColor('color1') || 'black';
		var that = this;
		var ticks_x_range = axis_x.get_ticks_global_range();
		this.x_min = ticks_x_range[0].x;
		this.x_max = ticks_x_range[1].x;
		var ticks_y_range = axis_y.get_ticks_global_range();
		this.y_min = ticks_y_range[1].y;
		this.y_max = ticks_y_range[0].y;
		this._registeredDotes = [];
		this._registeredFuncs = [];
	},
	_copyExtraAttr2: function(source, excludeMatrix){
	},

	_copyExtraAttr: function(source, excludeMatrix){
		this._axis = source._axis;
		this.show_grid = source.show_grid;
		this.show_grid_color = source.show_grid_color  ;
		this.x_min = source.x_min;
		this.x_max = source.x_max;
		 this.y_min = source.y_min;
		this.y_max = source.y_max;
		this._registeredDotes = source._registeredDotes;
		this._registeredFuncs = source._registeredFuncs;
		this._copyExtraAttr2(source, excludeMatrix);
	},

	_draw: function(ctx, param, viewMatrix) {
		var that = this, axis_x = this._axis[0], axis_y = this._axis[1];
		if( that.show_grid ){
			var ticks_on_x = axis_x.get_ticks_global_pos();
			var ticks_on_y = axis_y.get_ticks_global_pos();
			ctx.strokeStyle = this.show_grid_color;
			ctx.fillStyle = this.show_grid_color;
			ctx.strokeWidth = 1;
			ticks_on_x.forEach(function(value, index) {
				 ctx.beginPath();
				ctx.moveTo( value.x, that.y_min);
				ctx.lineTo( value.x, that.y_max);
				ctx.stroke();
			});
			ticks_on_y.forEach(function(value, index) {
				 ctx.beginPath();
				ctx.moveTo( that.x_min, value.y );
				ctx.lineTo( that.x_max, value.y );
				ctx.stroke();
		   });
		}
	},

	_getBounds: function(matrix, options) {
		var that = this, rect = new Rectangle(that.x_min, that.y_min, that.x_max - that.x_min, that.y_max - that.y_min);
		return matrix ? matrix._transformBounds(rect, rect) : rect;
	},

	registerFunctionCurve: function( funcCurve ){
	   this._registeredFuncs.push(funcCurve);
	},

	unregisterFunctionCurve: function( funcCurve ){
		this._registeredFuncs = this._registeredFuncs.filter(
			e =>  e != funcCurve
		)
	},
	update_registered_funcs: function(){
		var that = this;
		that._registeredFuncs.forEach(e => {
			 e.generate_points();
		});
	},
	update_registered: function(){
		 this.update_registered_dots();
		 this.update_registered_funcs();
	},

	registerDote: function(x_value, y_value, color, radius){
		var that = this;
		var dot   =  new Path.Circle({
			center: that.getGlobalRenderPosByValue(x_value, y_value),
			radius:  radius || 4,
			fillColor: color || 'red'
		});
		this._project._activeLayer.addChild(dot, true);
		dot.data_value = new Point(x_value, y_value);
		this._registeredDotes.push(dot);
		return dot;
	},
	unregisterDot: function(x_value, y_value){
		var that = this;
		that._registeredDotes = that._registeredDotes.filter(e => e.data_value.x != x_value && e.data_value.y != y_value );
	},

	update_registered_dots: function(){
		var that = this;
		that._registeredDotes.forEach(e => {
			e.position = that.getGlobalRenderPosByValue(e.data_value.x, e.data_value.y);
		});
	},

	adjust_ticks_by_scale_and_pos: function(is_axis_x, p2v, fix_tick_value){
		if( p2v <=0 ) return;
		if( is_axis_x ){
			var axis =  this.getAxis_X();
			axis.adjust_ticks_by_scale_and_pos(p2v, fix_tick_value);
			var ticks_x_range = axis.get_ticks_global_range();
			this.x_min = ticks_x_range[0].x;
			this.x_max = ticks_x_range[1].x;
		} else {
			var axis =  this.getAxis_Y();
			axis.adjust_ticks_by_scale_and_pos(p2v, fix_tick_value);
			var ticks_y_range = axis.get_ticks_global_range();
			this.y_min = ticks_y_range[1].y;
			this.y_max = ticks_y_range[0].y;
		}
		this.update_registered();
	},

   shift_space: function(x_change, y_change){
		if( x_change == 0 && y_change == 0 ) return;
		if( x_change != 0 ){
			var axis =  this.getAxis_X();
			axis.shift_by(-x_change, 0);
			this.getAxis_Y().position.x += x_change;
		}
		if( y_change != 0 ){
			var axis =  this.getAxis_Y();
			axis.shift_by(y_change, 0);
			this.getAxis_X().position.y += y_change;
		}
		var ticks_x_range = this.getAxis_X().get_ticks_global_range();
		this.x_min = ticks_x_range[0].x;
		this.x_max = ticks_x_range[1].x;
		var ticks_y_range = this.getAxis_Y().get_ticks_global_range();
		this.y_min = ticks_y_range[1].y;
		this.y_max = ticks_y_range[0].y;
		this.update_registered();
	},
	getValueByGlobalRenderPos: function(x, y){
		 var xv = this.getValueByGlobalRenderPos_X( x);
		 var yv = this.getValueByGlobalRenderPos_Y( y);
		 return [xv, yv];
	},
	getValueByGlobalRenderPos_X: function(v){
		var axis = this.getAxis_X();
		return axis.x_min + (v - axis.getPointAt(0).x) *axis.value2pix();
	},
	getValueByGlobalRenderPos_Y: function(v){
		var axis = this.getAxis_XY();
		return axis.x_min + (v - axis.getPointAt(0).x) *axis.value2pix();
	},
	getGlobalRenderPosByValue: function(x, y){
		  var xloc = this.getGlobalRenderPosByValue_X( x )
		  var yloc = this.getGlobalRenderPosByValue_Y( y ) ;
		  return [xloc, yloc];
	},
	getGlobalRenderPosByValue_X: function(v){
		var axis = this.getAxis_X();
		return axis.getPointAt(0) .x + (v - axis.x_min) * axis.pix2value();
	},
	getGlobalRenderPosByValue_Y: function(v){
		var axis = this.getAxis_Y();
		return axis.getPointAt(0) .y - (v - axis.x_min) * axis.pix2value();
	},

	setShow_grid: function(show){
		this.show_grid = show;
	},
	setShow_grid_color: function(color){
		 this.show_grid_color = color;
	},
	getAxis_X: function(){
		return this._axis[0];
	},
	getAxis_Y: function(){
		return this._axis[1];
	},
	getOrigin_render: function(){
		return  this.getGlobalRenderPosByValue(0,0);
	},
	createLineToAxis: function(is_axis_x, pos_x, pos_y, color, dash){
		 var dot1 = this.registerDote(pos_x, pos_y);
		 var dot2 = is_axis_x ? this.registerDote(pos_x, 0) :  this.registerDote(0, pos_y);
		 var line = new R9Line( dot1.position, dot2.position);
		 line.strokeWidth = 1;
		 color = color || this.strokeColor || 'black';
		 line.strokeColor = color;
		 if( dash ) line.dashArray = [1, 2];
		 line.setPostionControl_start(dot1);
		 line.setPostionControl_end(dot2);
		 return line;
	}
});
  var CoordinateSystemUnit = Group.extend({
	_class: 'CoordinateSystemUnit',

	initialize: function CoordinateSystemUnit( coordsystem ) {
		this.space = coordsystem;
		Group.apply(this, arguments);
		this._addAllChildren();
	},
	_addAllChildren:function(){
		this.removeChildren();
		var that = this, space = that.space, list = [space, space._axis[0], space._axis[1]];
		list.forEach(c => {
			c.remove();
			that.addChild(c);
		});;
		space._registeredDotes.forEach(c => {
			c.remove();
			that.addChild(c);
		});;
		space._registeredFuncs.forEach(c => {
			c.remove();
			that.addChild(c);
		});
	},

	registerFunctionCurve: function( funcCurve ){
		this.space ._registeredFuncs.push(funcCurve);
		funcCurve.remove();
		this.addChild( funcCurve );
	 },
	 unregisterFunctionCurve: function( funcCurve ){
		this.space.unregisterFunctionCurve( funcCurve );
		funcCurve.remove();
	 },

	 update_registered_funcs: function(){
		 this.space .update_registered_funcs();
	 },
	 update_registered: function(){
		this.space.update_registered();
	 },
	 registerDote: function(x_value, y_value, color, radius){
		 var dot = this.space.registerDote( x_value, y_value, color, radius );
		 dot.remove();
		 this.addChild( dot );
		 return dot;
	 },
	 unregisterDot: function(x_value, y_value){
		var dot = this.space._registeredDotes( x_value, y_value );
		if( dot != null ){
			dot.remove();
		}
		return dot;
	 },
	 update_registered_dots: function(){
		this.space.update_registered_dots();
	 },
	_copyExtraAttr: function(source, excludeMatrix){
	},
	getGlobalRenderPosByValue: function(x, y){
	   return this.space.getGlobalRenderPosByValue(x,y);
	},
	getGlobalRenderPosByValue_X: function(v){
		return this.space.getGlobalRenderPosByValue_X(v);
	},
	getGlobalRenderPosByValue_Y: function(v){
		return this.space.getGlobalRenderPosByValue_Y(v);
	},
	getValueByGlobalRenderPos: function(x, y){
		return this.space.getValueByGlobalRenderPos(x,y);
	},
	getValueByGlobalRenderPos_X: function(v){
		return this.space.getValueByGlobalRenderPos_X(v);
	},
	getValueByGlobalRenderPos_Y: function(v){
		return this.space.getValueByGlobalRenderPos_Y(v);
	},
});
var BarChart = CoordinateSystem.extend({
	_class: 'BarChart',

	initialize: function BarChart( axis_x, axis_y, values, bar_names,  bar_name_size, bar_colors,
		 bar_width, bar_fill_opacity , duration) {
		CoordinateSystem.call(this, axis_x, axis_y, false);
		var that = this;
		this.values = values;
		this.bar_names = bar_names;
		this.bar_colors = bar_colors || [];
		this.bar_width = bar_width;
		this. bar_name_size =  bar_name_size || 20;
		this.bar_fill_opacity = bar_fill_opacity || 0.5;

		if( this.bar_width <= 0 ){
			var xw = axis_x.length; numbars = values.length * (Array.isArray(values[0]) ?  values[0].length : 1);
			this.bar_width = xw/(numbars*2);
		}
		var bn_size = Array.isArray(values[0]) ? values[0].length : values.length;
		if( this.bar_colors.length < bn_size ){
			var hue = Math.random() * 360, bc_size = this.bar_colors.length ;
			var b_color = bc_size > 0 ? this.bar_colors[bc_size-1] : 'pink';
			hue = (new Color(b_color).hue + 40) % 360;
			for(var i = bc_size; i < bn_size; i++){
				var lightness = (Math.random() - 0.5) * 0.4 + 0.4;
				this.bar_colors.push( new Color({ hue: hue, saturation: 1, lightness: lightness , alpha: this.bar_fill_opacity}).toCSS() );
			}
		}

		this.rects = [];
		this.value_labels = [];
		if(  mpaper.settings.insertItems )
			this.changeValue(values, duration);
	},
	_animForShowing: function(duration, offset){
		this.visible = true;
	   this.changeValue(this.values, duration  , offset);
	},
	changeValue: function( newValues, duration, offset){
		var that = this, firstTime = that.rects.length == 0, colors = that.bar_colors, values = that.values, two_dim = Array.isArray(values[0]),
		axis_x = that._axis[0], axis_y = that._axis[1],
		lables = that.bar_names, bar_width = that.bar_width, bar_fill_opacity = that.bar_fill_opacity,
		bar_clusters = values.length, x_r_width = axis_x.length,
		bar_cluster_width = x_r_width / (bar_clusters+1), pos = 0, bar_name_size = that.bar_name_size,
		 y_zero_render = that.getGlobalRenderPosByValue_Y(0), x_min_render = that.getGlobalRenderPosByValue_X(axis_x.x_min);
		 duration = duration * 1.0 / bar_clusters || 0;
		var index = 0, timeline;
		if( duration > 0 ) timeline =  anime.timeline({   autoplay: false  });
		offset = '==';
		while( pos <  bar_clusters){
			var c_center_x = x_min_render + (pos+1) * bar_cluster_width;
			var c_data_o = values[pos], c_data_n = newValues[pos];
			if( !Array.isArray(c_data_o) ) {
				c_data_o = [c_data_o];
				c_data_n = [c_data_n];
			}
			var numc = c_data_o.length, c_w = numc * bar_width, xoffset = c_center_x - c_w/2;
			for(var i = 0; i < numc; i++){
				var cc_data_o = c_data_o[i], cc_data_n = c_data_n[i],  x_render = xoffset + i * bar_width;
				if( cc_data_o == cc_data_n && !firstTime ){
					index++;
					continue;
				}
				var color = numc == 1 ? colors[pos] : colors[i];
				var y_render = that.getGlobalRenderPosByValue_Y(cc_data_n);

				var rectangle = cc_data_n> 0 ?  new Rectangle({  topLeft: [x_render, y_render],
												  bottomRight: [x_render + bar_width, y_zero_render]})
												  :
												  new Rectangle({  topLeft: [x_render, y_zero_render],
													bottomRight: [x_render + bar_width, y_render]});
				if( firstTime ){
					var  rect = new Path.Rectangle({
						rectangle: rectangle,
						radius:  0,
						strokeColor: color,
						fillColor:  color
					});
					that.rects.push(rect);
					if( duration > 0 ){
					   var tween = RU.tweenSize( rect, new Rectangle({  topLeft: [x_render, cc_data_n>0? y_zero_render-1 : y_zero_render+1],
							bottomRight: [x_render + bar_width, y_zero_render]}), rect.bounds , duration);
						timeline.add(tween, offset);
					}
				} else {
					var orect = that.rects[index];
					if( duration > 0 ){
						var tween = RU.tweenSize(orect, orect.bounds, rectangle,   duration);
						timeline.add(tween, offset);
					} else {
						orect.bounds.point = rectangle.point;
						orect.bounds.size = rectangle.size;
					}
				}
				var y_t_render = cc_data_n > 0 ? y_render - bar_name_size/2  : y_render + bar_name_size/2 ;
				if( firstTime ){
					var text = new DecimalNumber({
						point: [x_render , y_t_render],
						number:  cc_data_n,
						fillColor: color,
						fontFamily: 'Courier New',
						fontWeight: 'bold',
						fontSize:  bar_name_size
					});
					text.position = new Point(x_render , y_t_render);
					that.value_labels.push( text );
					if( duration > 0 ){
						text.changeValue(0, cc_data_n, duration);
					}
				} else {
					var otext = that.value_labels[index];
					otext.changeValue(0, cc_data_n, duration);
					if( duration > 0 ){
						var tween = RU.tweenPosition(otext, otext.position, new Point(x_render , y_t_render),   duration);
						timeline.add(tween, offset);
					} else {
						orect.position =  new Point(x_render , y_t_render);
					}
				}
				index++;
			}
			pos++;
		}
		if( timeline ) timeline.play();
		this.values = newValues;
	},
	_copyExtraAttr2: function(source, excludeMatrix){
		this.values = source.values;
		this.bar_names = source.bar_names;
		this.bar_colors = source.bar_colors  ;
		this.bar_width = source.bar_width;
		this.bar_fill_opacity = source.bar_fill_opacity;
	},

	_draw: function(ctx, param, viewMatrix) {
		if( ! this.bar_names || this.bar_names.length == 0 ) return;
		var that = this, axis_x = this._axis[0],  colors = that.bar_colors,
		 values = that.values,
		axis_x = that._axis[0],  bar_name_size = that.bar_name_size,
		labels = that.bar_names,
		bar_clusters = values.length, x_r_width = axis_x.length,
		bar_cluster_width = x_r_width / (bar_clusters+1), pos = 0,
		 y_zero_render = that.getGlobalRenderPosByValue_Y(0),
		 x_min_render = that.getGlobalRenderPosByValue_X(axis_x.x_min);
		while( pos <  bar_clusters){
			var c_center_x = x_min_render + (pos+1) * bar_cluster_width;
			var c_data = values[pos], label = labels[pos];
			var cc_data = Array.isArray(c_data)? c_data[0] : c_data;
			var y_pos_render = cc_data >= 0 ? y_zero_render + bar_name_size  : y_zero_render - bar_name_size/2 ;
			var color = Array.isArray(c_data) ? colors[0] : colors[pos];
			var label_width =  ctx.measureText(label).width / 2;
			ctx.lineWidth = 1;
			ctx.strokeStyle = color;
			ctx.fillStyle = color;
			ctx.font = bar_name_size + "px Courier New";
			ctx.strokeText(label, c_center_x  - label_width, y_pos_render);
			ctx.fillText(label, c_center_x - label_width, y_pos_render);
			pos++;
		}
	},
});

  var  BarChartUnit = Group.extend({
	_class: ' BarChartUnit',

	initialize: function  BarChartUnit( coordsystem ) {
		this.space = coordsystem;
		Group.apply(this, arguments);
		this._addAllChildren();
	},
	_addAllChildren:function(){
		this.removeChildren();
		var that = this, space = that.space, list = [space, space._axis[0], space._axis[1]];
		list.forEach(c => {
			c.remove();
			that.addChild(c);
		});;
		space.rects.forEach(c => {
			c.remove();
			that.addChild(c);
		});;
		space.value_labels.forEach(c => {
			c.remove();
			that.addChild(c);
		});
	},
	changeValue: function( newValues, duration){
		 this.space.changeValue(newValues, duration)
	},
	_animForShowing: function(duration, offset){
		this.visible = true;
		this.space._animForShowing( duration || 1, offset);
	},
});

 var Table = Group.extend({
	_class: 'Table',
	initialize: function Table(params) {
		this.row_labels  = params.row_labels || [];
		this.col_labels = params.col_labels || [];
		this.top_left_entry  = params.top_left_entry || null;
		this.v_buff = params.v_buff || 0;
		this.h_buff = params.h_buff || 0;
		this.include_outer_lines  = params.include_outer_lines || false;
		this.add_background_rectangles_to_entries  = params.add_background_rectangles_to_entries || false;
		this.cell_bg_color = params.cell_bg_color || null;
		this.background_rectangle_color = params.background_rectangle_color || null;
		this.col_config = params.col_config || {};
		this.row_config  = params.row_config || {};
		this.text_config  = params.text_config || {};
		this.line_config = params.line_config || {};
		this.col_lines = [];
		this.row_lines = [];
		this.data_cells = [];
		this.row_label_cells = [];
		this.col_label_cells = [];
		this.top_left_cell = null;
		this.bgrect = null;
		Group.apply(this, arguments);
		this. _initialize(params);

		if( typeof this.area  == 'undefined' ){
			this.area = new Rectangle(0,0, this.data[0].length * 50 +50,  this.data.length * 50 + 50);
		} else if( this.area._class != 'Rectangle' ){
			this.area = new Rectangle(this.area);
		}

		this.createTable();
	},
	createTable: function(){
		var lineColor = this.line_config.strokeColor || this._style.strokeColor ||  'black',
			strokeWidth = this.line_config.strokeWidth || this._style.strokeWidth ||  1,
			x = this.area.x, y = this.area.y, w = this.area.width, h = this.area.height,
			data = this.data, numcols = data[0].length, numrows = data.length;

		if( this.include_outer_lines || this.background_rectangle_color != null){
			this.bgrect = new Path.Rectangle(this.area);
			if( this.include_outer_lines ){
				this.bgrect.strokeColor = lineColor;
				this.bgrect.strokeWidth = strokeWidth;
			} else {
				this.bgrect.strokeWidth = 0;
			}
			if( this.background_rectangle_color != null ){
				this.bgrect.fillColor = this.background_rectangle_color;
			}
			this.bgrect.remove();
			this.addChild(this.bgrect);
		}
		var accx = x, avg_cw = w / (numcols+1), aline;
		for(var i = 0; i < numcols ; i++){
			 accx += this.col_config.length>0? w * this.col_config[i] : avg_cw;
			 aline = new R9Line( [accx, y], [accx, y+h]);
			 aline.strokeColor = lineColor;
			 aline.strokeWidth = strokeWidth;
			 this.col_lines[i] = aline;
			 aline.remove();
			 this.addChild(aline);
		}
		var accy = y, avg_ch = h / (numrows+1);
		for(var i = 0; i < numrows  ; i++){
			accy += this.row_config.length>0? h * this.row_config[i] : avg_ch;
			aline = new R9Line( [x, accy], [x + w, accy]);
			aline.strokeColor = lineColor;
			aline.strokeWidth = strokeWidth;
			this.row_lines[i] = aline;
			aline.remove();
			this.addChild(aline);
	   }
	   var textColor = this.text_config.strokeColor || this._style.strokeColor ||  'black',
		   fontSize = this.text_config.fontSize || this._style.fontSize || 20;
		if( this.top_left_entry ){
			var tobj = this.__addTextObj(this.top_left_entry , textColor, null, fontSize, 0,0);
			this.top_left_cell = tobj;
		}
		if( this.row_labels.length > 0 ){
			for(var i = 0; i < this.row_labels.length; i++){
				var tobj = this.__addTextObj(this.row_labels[i], textColor, null, fontSize, i+1,0);
				this.row_label_cells[i] = tobj;
			}
		}
		if( this.col_labels.length > 0 ){
			for(var i = 0; i < this.col_labels.length; i++){
				var tobj = this.__addTextObj(this.col_labels[i], textColor, null, fontSize, 0, i+1);
				this.col_label_cells[i] = tobj;
			}
		}
		for(var i = 0; i < numrows; i++){
			this.data_cells[i] = [];
			for(var j = 0; j < numcols; j++){
				var tobj = this.__addTextObj(data[i][j], textColor, this.cell_bg_color, fontSize, i+1, j+1);
				this.data_cells[i][j] = tobj;
			}
		}
	},

	__addTextObj: function(data, textColor, cellcolor, fontSize, row, col){
		var r = this._getCellSize(row, col);
		var tobj = new StyledText({
			strokeColor: textColor,
			fillColor: textColor,
			justification: 'center',
			fontSize: fontSize,
			bgColor: cellcolor,
			content:  data
		});
	   if( cellcolor ){
		   var  strokeWidth = this.line_config.strokeWidth || this._style.strokeWidth ||  1;
		   tobj.adjustXOffsetByNewWidth(r.width - strokeWidth * 2 -4)
		   tobj.adjustYOffsetByNewHeight(r.height - strokeWidth * 2 -4)
	   }
		tobj.position =  r.center;
		tobj.remove();
		this.addChild(tobj);
		return tobj;
	},
	_getCellSize:function( row, col){
		var x = this.area.x, y = this.area.y, w = this.area.width, h = this.area.height,
			numcols = this.data[0].length, numrows = this.data.length;
		var xl = col ==0? x : this.col_lines[col-1].position.x;
		var xr = col == numcols ? x+w : this.col_lines[col].position.x;
		var yt = row==0? y : this.row_lines[row-1].position.y;
		var yb = row== numrows ? y+h: this.row_lines[row].position.y;
		return new Rectangle(xl, yt, xr - xl , yb - yt );
	},

	_change_row_label:function(color){
		this.row_label_cells.array.forEach(e => {
			e.strokeColor = color;
		});
	},
	_change_col_label:function(color){
		this.col_label_cells.array.forEach(e => {
			e.strokeColor = color;
		});
	},

	_copyExtraAttr: function(source, excludeMatrix){
		this.num_rects =  source.num_rects  ;
		this.row_labels  = source.row_labels ;
		this.col_labels = source.col_labels  ;
		this.top_left_entry  = source.top_left_entry  ;
		this.v_buff = source.v_buff  ;
		this.h_buff = source.h_buff  ;
		this.include_outer_lines  = source.include_outer_lines ;
		this.add_background_rectangles_to_entries  = source.add_background_rectangles_to_entries ;
		this.cell_bg_color = source.cell_bg_color;
		this.include_background_rectangle = source.include_background_rectangle ;
		this.background_rectangle_color = source.background_rectangle_color  ;
		this.col_config = source.col_config ;
		this.row_config  = source.row_config  ;
		this.line_config = source.line_config  ;
	},
	_draw_decro: function(ctx, param, viewMatrix, strokeMatrix) {

	},
});

var NumericTable = Table.extend({
	_class: 'NumericTable',
	initialize: function NumericTable(params) {
		this.fixed = params.fixed || 0;
		this.color_rules = params.color_rules || [];
		Table.apply(this, arguments);
	},

	add_color_rule:function(start, end, color){
		this.color_rules.push({
			vstart: start,
			vend: end,
			color: color
		});
	},
	get_color_by_rule:function(value, default_color){
	   var rules = this.color_rules;
	   if( rules.length == 0 ) return default_color;
	   for(var i in rules ){
		   var r = rules[i];
		   if( r.vstart == null || typeof r.vstart == 'undefined'){
			   if( r.vend >= value ) return r.color;
		   }
		   else if( r.vend == null || typeof r.vend == 'undefined'){
			   if( r.vstart <= value ) return r.color;
		   } else {
			   if( r.vstart <= value && r.vend >= value ) return r.color;
		   }
	   }
	   return default_color;
	},
	__addTextObj: function(data, textColor, cellcolor, fontSize, row, col){
		var r = this._getCellSize(row, col), tobj;
		if( row == 0 || col == 0 ){
			tobj = new StyledText({
				strokeColor: textColor,
				fillColor: textColor,
				justification: 'center',
				fontSize: fontSize,
				bgColor: cellcolor,
				content:  data
			});
		} else {
			textColor = this.get_color_by_rule(data, textColor);
			tobj = new DecimalNumber({
				strokeColor: textColor,
				fillColor: textColor,
				justification: 'center',
				fontSize: fontSize,
				bgColor: cellcolor,
				num_decimal_places: this.fixed,
				number:  data
			});
		}
	   if( cellcolor ){
		   var  strokeWidth = this.line_config.strokeWidth || this._style.strokeWidth ||  1;
		   tobj.adjustXOffsetByNewWidth(r.width - strokeWidth * 2 -4)
		   tobj.adjustYOffsetByNewHeight(r.height - strokeWidth * 2 -4)
	   }
		tobj.position =  r.center;
		tobj.remove();
		this.addChild(tobj);
		return tobj;
	},
});
Table.inject({ statics: new function() {

	function _createTable(axis_x, axis_y,  origin_render, show_grid, show_grid_color, asGroup) {
	}

	return {
		SimpleTable: function(params) {
			params.x_range = [0,10];
			params.show_grid = false;
			var axies = _createTwoAxis(params);
			axies[0].include_label = false;
			axies[0].include_ticks = false;

			var chart = new  BarChart(axies[0], axies[1],
					params.values,
					params.bar_names || [],
					params.bar_name_size || 24,
					params.bar_colors || [],
					params.bar_width || 0,
					params.bar_fill_opacity || 0.5,
					params.duration || 0
				);
			return new BarChartUnit(chart);
		},
	};
}});

CoordinateSystem.inject({ statics: new function() {

	function _createCoordinateSystem(axis_x, axis_y,  origin_render, show_grid, show_grid_color, asGroup) {
		var cs = new CoordinateSystem(axis_x, axis_y,  origin_render, show_grid, show_grid_color);
		return asGroup ? new CoordinateSystemUnit(cs) : cs;
	}

	function _createTwoAxis(params){
		var render = params.render,  x = render[0], y = render[1], width = render[2], height = render[3],
		x_range = params.x_range, y_range = params.y_range, strokeWidth = params.strokeWidth || 2,
		strokeColor = params.strokeColor || mpaper.project.getBuiltInColor('strokeColor') || 'black',
		include_tip = typeof params.include_tip == 'undefined' ? true : params.include_tip ;
		include_label = typeof params.include_label == 'undefined' ? true : params.include_label ,
		show_grid = params.show_grid || false, grid_color = params.grid_color || strokeColor,
		exclude_origin_tick = params.exclude_origin_tick || false;
		var adjust = include_tip ?  20 : 0;
		var x_axis_y_pos =     (y_range[1] - 0) /  (y_range[1] - y_range[0])  * (height-adjust) + adjust;
		var y_axis_x_pos =   (0 - x_range[0]   ) /  (x_range[1] - x_range[0]) * (width-adjust) ;
		var x_axis_line = new NumberLine({
			from: [x, y + x_axis_y_pos],
			to: [x + width, y + x_axis_y_pos],
			x_range:x_range,
			include_tip:include_tip,
			include_label:include_label,
			strokeWidth: strokeWidth,
			strokeColor:strokeColor,
			exclude_origin_tick: exclude_origin_tick
		});
		var y_axis_line = new NumberLine({
			from: [x + y_axis_x_pos, y+height],
			to: [x+ y_axis_x_pos, y],
			x_range:y_range,
			include_tip:include_tip,
			include_label:include_label,
			strokeWidth: strokeWidth,
			label_direction: false,
			strokeColor:strokeColor,
			exclude_origin_tick:exclude_origin_tick
		});
		return  [x_axis_line, y_axis_line];
	}

	function _ByRenderAreaAndAxies(asGroup, params) {
		var  strokeColor = params.strokeColor || mpaper.project.getBuiltInColor('strokeColor')  ,
			show_grid = params.show_grid || false,
			 grid_color = params.grid_color || strokeColor;
		var axies = _createTwoAxis(params);
		return _createCoordinateSystem(axies[0], axies[1],   show_grid, grid_color, asGroup);
	}

	return {
		ByRenderAreaAndAxies: function(params) {
			 return _ByRenderAreaAndAxies(true, params);
		},
		ByAxiesFullScreen: function(project, param){
			param.render = [0,0, project.configuration.frame_width, project.configuration.frame_height ];
			var space =  _ByRenderAreaAndAxies(false, param);
			if( param.draggable_origin ){
				var dot  =  space.registerDote(0,0);
				dot.on('mousedrag', function(event){
					space.shift_space(event.delta.x , event.delta.y);
				});
			}
			if( param.draggable_x_dot &&  param.draggable_x_dot > 0 && param.draggable_x_dot < param.x_range[1] ){
				var dv_x = param.draggable_x_dot, dot2  =  space.registerDote(dv_x,0);
			   space.getAxis_X().dynamic_step_value = true;
			   if( space.getAxis_X().decimal_number_config.num_decimal_places == 0 )
				   space.getAxis_X().decimal_number_config.num_decimal_places = 1;
				dot2.on('mousedrag', function(event){
					if( event.delta.x != 0 ) {
						var origin = space.getOrigin_render(), one = dot2.position, new_pos = one.x + event.delta.x;
						if( (new_pos  - origin[0]) > 1 )
							space.adjust_ticks_by_scale_and_pos(true, (new_pos  - origin[0])/ dv_x, 0) ;
					};
				});
			}
			if( param.draggable_y_dot &&  param.draggable_y_dot > 0 && param.draggable_y_dot < param.y_range[1]  ){
				var dv_y = param.draggable_y_dot,  dot3  =  space.registerDote(0,dv_y);
				space.getAxis_Y().dynamic_step_value = true;
				if( space.getAxis_Y().decimal_number_config.num_decimal_places == 0 )
					space.getAxis_Y().decimal_number_config.num_decimal_places = 1;
				dot3.on('mousedrag', function(event){
					if( event.delta.y != 0 ) {
						var origin = space.getOrigin_render(), one = dot3.position, new_pos = one.y + event.delta.y;
						if( (origin[1] - new_pos) > 2)
							space.adjust_ticks_by_scale_and_pos(false, (origin[1] - new_pos)/dv_y, 0) ;
					};
				});
			}
			return new CoordinateSystemUnit(space);
		},

		createBarChart: function(params) {
			params.x_range = [0,10];
			params.show_grid = false;
			var axies = _createTwoAxis(params);
			axies[0].include_label = false;
			axies[0].include_ticks = false;

			var chart = new  BarChart(axies[0], axies[1],
					params.values,
					params.bar_names || [],
					params.bar_name_size || 24,
					params.bar_colors || [],
					params.bar_width || 0,
					params.bar_fill_opacity || 0.5,
					params.duration || 0
				);
			return new BarChartUnit(chart);
		},
	};
}});

 var R9Function = CompoundPath.extend({
	_class: 'R9Function',
	initialize: function R9Function(arg) {
		Path.apply(this, arguments);
		CompoundPath.apply(this, arguments);
		if( typeof this.t_range == 'undefined')
			this.t_range =  this.coord_system.space.getAxis_X().get_x_range();
		if( this.t_range.length == 2){
			var d = ( this.t_range[1] - this.t_range[0] ) / 500;
			d = Math.max(0.01, d);
			this.t_range.push(d);
		}
		if( typeof this.is_param_func == 'undefined')  this.is_param_func = true;
		if( typeof this.use_smoothing == 'undefined')  this.use_smoothing = true;
		if( typeof this.discontinuities == 'undefined') this.discontinuities = [];
		if( typeof this.dt == 'undefined') this.dt = 1e-08;

		this.coord_system.registerFunctionCurve(this);
	},
	_copyExtraAttr: function(source, excludeMatrix){
		this.t_range = source.t_range;
		this.is_param_func = source.is_param_func;
		this.discontinuities = source.discontinuities;
		this.dt = source.dt;
		this.coord_system = source.coord_system;
	 },
	get_func: function(){
		return this.func;
	},
   get_point_from_func: function(t){
	   var v = this.func(t);
	   if( Array.isArray(v)) return v;
	   return [t, v];
   },

	get_value_y_from_value_x: function(x, asif_param_func){
		if( this.is_param_func || asif_param_func ){
			var space = this.coord_system;
			var r = this.get_render_y_from_render_x(space.getGlobalRenderPosByValue_X(x));
			return r.map( e =>  space.getValueByGlobalRenderPos_Y(e) );
		}
		return [this.func(x)];
	},

   get_render_y_from_render_x: function(render_x,asif_param_func){
		if( this.is_param_func || asif_param_func){
			var  h = this.project.configuration.frame_height;
			var path = new Path( );
			path.add(new Point(render_x, 0));
			path.add(new Point(render_x, h));
		   var iss = path.getIntersections(this);
		   var result = [];
		   for (var i = 0; i < iss.length; i++) {
			   result.push( iss[i].point.y )
		   }
		   return result;
		}
		var x_value = this.coord_system.getValueByGlobalRenderPos_X(render_x);
		var y_value = this.func(x_value);
		var y_render = this.coord_system.getGlobalRenderPosByValue_Y( y_value );
		return [ y_render ];
   },

   _calculated_data_ranges: function(){
		var that = this, space = that.coord_system, x_min = that.t_range[0], x_max = that.t_range[1], dt = that.dt;
		if( this.discontinuities.length == 0 )
		   return  [x_min, x_max] ;
		var r = [x_min];
		this.discontinuities.forEach(e => {
			r.push( e - dt );
			r.push( e + dt );
		});
		r.push( x_max );
		return r;
   },
   generate_points: function(){
	   var that = this, space = that.coord_system.space, x_min, x_max, t_step = that.t_range[2];
	   var cur_path, cur_v, output, cur_pos;
	   this.destroyContent();
	   var ranges = this._calculated_data_ranges();
	   for(var i = 0, l = ranges.length; i< l; i+=2){
			x_min = ranges[i]; x_max = ranges[i+1]; cur_v = x_min;
			cur_path = new Path();
			cur_path.strokeColor = that.strokeColor;
			cur_path.strokeWidth = that.strokeWidth;
			while(cur_v <= x_max){
				 output = this.scale_func ? this.scale_func.scale_it(this.func(cur_v)) : this.func(cur_v);
				 if( output == null ) continue;
				 if( !Array.isArray(output))
					cur_pos = space. getGlobalRenderPosByValue(cur_v, output );
				 else
					cur_pos = space. getGlobalRenderPosByValue(output[0], output[1]);
				cur_path.add( new Segment(cur_pos) );
				cur_v += t_step;
			} ;
			if( this.use_smoothing ){
				cur_path.smooth();
			}
			this.addChild(cur_path);
	   }
	   return this;
   }
});

 var SVGFunction = R9Function.extend({
	_class: 'SVGFunction',
	initialize: function SVGFunction(arg) {
		R9Function.apply(this, arguments);
		this.path_data = arg.path_data;
		var x_min = this.t_range[0], x_max = this.t_range[1];
		var that = this, space = that.coord_system;
		this.func = function( t ){
			 var r = that.length / (x_max - x_min) ;
			 var p =  that.getPointAt( t * r );
			 p = this.scale_func ? this.scale_func.scale_it(p) : p;
			 return space. getValueByGlobalRenderPos(p.x, p.y);
		}
	},
	generate_points: function(){
		this.destroyContent();
		if( this.keep_svg_unmapped ){
			this.pathData = this.path_data;
			return;
		}
		var that = this, space = that.coord_system.space,  t_step = that.t_range[2] , cur_v,  cur_pos;
		var temp_path = new CompoundPath({pathData: that.path_data});
		temp_path.visible = false;
		var children = temp_path._children, length = 0;
		for (var i = 0, l = children.length; i < l; i++){
			 var t_path = children[i], len = t_path.length, cur_v = 0;
			 var path = new Path();
			 while( cur_v <= len ){
				var p =  t_path.getPointAt( cur_v );
				p = this.scale_func ? this.scale_func.scale_it(p) : p;
				cur_pos = space. getGlobalRenderPosByValue(p.x, p.y);
				path.addSegment(new Segment(cur_pos));
				cur_v += t_step;
			 }
			 that.addChild(path);
		}
		temp_path.remove();
		return this;
	}
});

 var LinearFunction = R9Function.extend({
	_class: 'LinearFunction',
	initialize: function LinearFunction(arg) {
		R9Function.apply(this, arguments);
		this.is_param_func = false;
	},
	generate_points: function(){
		this.destroyContent();
		var that = this, space = that.coord_system.space, x_min = that.t_range[0], x_max = that.t_range[1] ;
		var cur_y = this.func(x_min);
		cur_y = this.scale_func ? this.scale_func.scale_it(cur_y) : cur_y;
		var cur_pos = space. getGlobalRenderPosByValue(x_min, cur_y );
		var path = new Path();
		path.add( new Segment(cur_pos) );
		cur_y = this.func(x_max);
		cur_y = this.scale_func ? this.scale_func.scale_it(cur_y) : cur_y;
		cur_pos = space. getGlobalRenderPosByValue(x_max, cur_y );
		path.add( new Segment(cur_pos) );
		this.addChild( path );
		path.strokeWidth = this.strokeWidth;
		path.strokeColor = this.strokeColor;
		return this;
	}
});

 var EllipseFunction = SVGFunction.extend({
	_class: 'CircleFunction',
	initialize: function CircleFunction(arg) {
		SVGFunction.apply(this, arguments);
		if( Array.isArray(this.radius) ){
			if( this.radius.length == 1 )
				this.radius.push( this.radius[0] );
		} else {
			this.radius = [ this.radius, this.radius ];
		}
	},
	generate_points: function(){
		this.destroyContent();
		var that = this, space = that.coord_system.space, center = that.center, radius = that.radius ;
		center = this.scale_func ? this.scale_func.scale_it(center) : center;
		radius = this.scale_func ? this.scale_func.scale_it(radius) : radius;

		center = space. getGlobalRenderPosByValue(center[0], center[1]);
		var r_x = space.getAxis_X().pix2value() * radius[0];
		var r_y = space.getAxis_Y().pix2value() * radius[1];
		var path = new Path.Ellipse({
			center: center,
			radius: [r_x, r_y],
			strokeColor:  that.strokeColor,
			strokeWidth: that.strokeWidth
		});
		this.addChild( path );
		return this;
	}
});
R9Function.inject({ statics: new function() {

	function createR9Function(axis_x, axis_y,  origin_render, show_grid, show_grid_color) {
		 return cs;
	}

	return {
		Linear: function(params) {
			 var f = new LinearFunction(params);
			 f.generate_points();
			 return f;
		},
		Circle: function(params) {
		  var f = new EllipseFunction(params);
		  f.generate_points();
		  return f;
		},
		Ellipse: function(params) {
		  var f = new EllipseFunction(params);
		  f.generate_points();
		  return f;
		},
		SVG: function(params) {
		  var f = new SVGFunction(params);
		  f.generate_points();
		  return f;
		},
		ParameterFunc: function(params) {
			var f = new R9Function(params);
			f.generate_points();
			return f;
	   },

	};
}});

 var AreaUnderCurve = Path.extend({
	_class: 'AreaUnderCurve',
	initialize: function AreaUnderCurve(arg) {
		Path.apply(this, arguments);
		this.num_rects =  this.num_rects   ?  this.num_rects : 0;
		this.colors = [];
		this.createShapes();
	},
	_copyExtraAttr: function(source, excludeMatrix){
		this.num_rects =  source.num_rects  ;
		this.colors = source.colors;
	},
	createShapes: function(){
		this.resetPathData('');
		var that = this, space = that.space, curve = that.curve, start_x = that.start_x, end_x = that.end_x,
			num_rects = that.num_rects;
		var    start_x_r = space.getGlobalRenderPosByValue_X(start_x),
			end_x_r = space.getGlobalRenderPosByValue_X(end_x),
			start_y_r = curve.get_render_y_from_render_x(start_x_r, true)[0],

			end_y_r = curve.get_render_y_from_render_x(end_x_r, true)[0],
			y_zero_r = space.getGlobalRenderPosByValue_Y(0);

		var offset_s = curve.getOffsetOf(new Point(start_x_r,start_y_r),1),
			offset_e = curve.getOffsetOf(new Point(end_x_r,end_y_r),1),
			partial_curve = curve. cloneSubPath(offset_s, offset_e),
			path = partial_curve.children[0], segments = path.segments;
		that.add(new Segment(start_x_r, y_zero_r));
		segments.forEach(e => {
			that.add( e );
		});
		that.add(new Segment(end_x_r, y_zero_r));
		that.closed = true;
		var curves = that.getCurves();
		curves[0].clearHandles();
		curves[curves.length-2].clearHandles();
		curves[curves.length-1].clearHandles();

		if( that.colors.length < num_rects ){
			var hue = Math.random() * 360;
			if( that._style && that._style.fillColor )
				hue = (that._style.fillColor.hue + 40) % 360;
			for(var i = that.colors.length; i < num_rects; i++){
				var lightness = (Math.random() - 0.5) * 0.4 + 0.4;
				that.colors[i]  = new Color({ hue: hue, saturation: 1, lightness: lightness , alpha: 0.6}).toCSS();
			}
		}
	},
	_draw_decro: function(ctx, param, viewMatrix, strokeMatrix) {
		var that = this, space = that.space, curve = that.curve, start_x = that.start_x, end_x = that.end_x,
		num_rects = that.num_rects;
		if( num_rects <= 0 ) return;
		var  start_x_r = space.getGlobalRenderPosByValue_X(start_x),
		  end_x_r = space.getGlobalRenderPosByValue_X(end_x),
		  y_zero_r = space.getGlobalRenderPosByValue_Y(0), x_gap = (end_x - start_x) / num_rects,
		   rect_w = (end_x_r - start_x_r)/num_rects;
		 var prev_y = curve.get_value_y_from_value_x(start_x)[0],
			 prev_y_r = space.getGlobalRenderPosByValue_Y(prev_y),
			 prev_x_r = start_x_r,
			 cur_y, cur_y_r, cur_x = start_x, cur_x_r,  cy;
		for(var i = 1; i <= num_rects; i++){
			cur_x += x_gap;
			cur_x_r =  prev_x_r + rect_w;
			cur_y = curve.get_value_y_from_value_x(cur_x)[0];
			cur_y_r = space.getGlobalRenderPosByValue_Y(cur_y);
			cy = Math.abs(prev_y_r - y_zero_r) < Math.abs(cur_y_r - y_zero_r) ? prev_y_r : cur_y_r;
			if( cur_y * prev_y > 0){
				ctx.fillStyle= that.colors[i-1];
				if( cur_y > 0 )
					ctx.fillRect( prev_x_r, cy, rect_w, Math.abs(cy - y_zero_r))
				else
					ctx.fillRect( prev_x_r, y_zero_r, rect_w, Math.abs(cy - y_zero_r))
			}

			prev_x_r = cur_x_r;
			prev_y = cur_y;
			prev_y_r = cur_y_r;
		}

	},
	setPostionControl: function( ){
	   if( this.dot_left ) return;
	   var that = this, space = that.space, curve = that.curve, start_x = that.start_x, end_x = that.end_x;
	   this.dot_left = space.registerDote(  start_x, 0);
	   this.dot_right = space.registerDote( end_x, 0);

	   this.dot_left.on('mousedrag', function(event){
			if( event.delta.x != 0 ) {
				if( that.dot_left.position.x + event.delta.x >= that.dot_right.position.x)
					return;
				that.dot_left.position.x  += event.delta.x;
				that.start_x = space.getValueByGlobalRenderPos_X(that.dot_left.position.x);
				that.dot_left.data_value.x =  that.start_x;
				that.createShapes();
			};
		});
		this.dot_right.on('mousedrag', function(event){
			if( event.delta.x != 0 ) {
				if( that.dot_right.position.x + event.delta.x <= that.dot_left.position.x)
					return;
				that.dot_right.position.x  += event.delta.x;
				that.end_x = space.getValueByGlobalRenderPos_X(that.dot_right.position.x);
				that.dot_right.data_value.x =  that.end_x;
				that.createShapes();
			};
		});
	 },
});
  var PopupMenu = Group.extend({
	_class: 'PopupMenu',

	initialize: function PopupMenu( params ) {
		this.cornerRadius = params.cornerRadius || 4;
		this.menuItems = [];
		Group.apply(this, arguments);
		this. _initialize(params);
		this.addorder = params.addorder || true;
		this.colnum = params.colnum || 1;
		this.margin = params.margin || 5;
		this.cellheight = params.fontSize || 18;
		this.cellwidth = 10;
		this.checked = params.checked || false;
		this.corner = params.corner || 0;
		this.title = params.title || '';
		this.borderColor = this.borderColor || this._project.getBuiltInColor('color1') || this.strokeColor;
		this.keyColor = this.keyColor || this._project.getBuiltInColor('bgColor1') || this.fillColor;
		this.keyTextColor = this.keyTextColor || this._project.getBuiltInColor('textColor') || this.strokeColor;
		this.keyboardColor = this.keyboardColor || this._project.getBuiltInColor('bgColor2') || this.fillColor;
		if( this.autoClose == 'undefined' )
			this.autoClose = true;
	},
	_copyExtraAttr: function(source, excludeMatrix){
		this. cornerRadius = source.cornerRadius;
		this. menuItems = source.menuItems;
		this. addorder = source.addorder;
		this. colnum = source.colnum;
		this.margin = source.margin;
		this.cellheight = source.cellheight;
		this.cellwidth = source.cellwidth;
		this.checked = source.checked;
		this.corner = source.corner;
		this.keyColor = source.keyColor;
		this.keyTextColor = source.keyTextColor;
	 },

	addMenuItems: function(title, keyList, callback, userobj){
		var that = this;
		that.title = title;
		if( Array.isArray(keyList[0]) ){
			that.colnum = keyList[0].length;
		}
		keyList.forEach(cell => {
			if( typeof cell.forEach == 'function')
				cell.forEach(c => {    that.addMenuTextItem(c, callback, '',  userobj);   });
			else
				that.addMenuTextItem(cell, callback, '', userobj);
		});
	},

	addMenuTextItem: function( content,  callback, iconName, userobj) {
		var text =  content, style = this._style;
		 if( this.addorder  ){
			 text = Formatter.instance.toAbcOrder(this.menuItems.length) + ": " + content;
		 }
		var textNode = new StyledText({
		   content:   text,
		   fontSize: style.fontSize || this.fontSize || 16 ,
		   fillColor :   this.keyTextColor,
		   strokeColor : this.keyTextColor,
		   borderColor: this.borderColor || 'white',
		   bgColor: this.keyColor || 'white',
		   textXOffset:10,
		   textYOffset:3,
		   corner: this.corner,
			});
		this.addMenuItem(  textNode,  content, callback, iconName, userobj);
	},

	addMenuItem: function( textNode, content,callback,  iconName, userobj) {
		var that = this, bd = that.bounds.clone(), tnode_bd = textNode.bounds.clone();
		if( !bd.width ) bd.width = 0;
		if( !bd.height ) bd.height = 0;
		var gap= this.margin,  colnum = this.colnum ;
		var tw = parseFloat(tnode_bd.width + ( iconName ? 30 : 0) );
		this.cellwidth = Math.max( this.cellwidth, tw);
		this.cellheight = Math.max( this.cellheight, tnode_bd.height);
		var curpos = 0,  curx = bd.x + gap, cury = bd.y + gap, curnode;

		if( that.title && !that.titleNode ){
			if( that.title instanceof Item ){
				that.titleNode = that.title;
			}
			else {
				that.titleNode = new StyledText({
					content:   that.title,
					fontSize:  that._style.fontSize || that.fontSize || 18,
					fillColor :   this.keyTextColor,
					strokeColor : this.keyTextColor,
					borderColor: this.borderColor || 'white',
					bgColor: this.keyColor || 'white',
					textXOffset:10,
					textYOffset:3,
					corner: this.corner,
					 });
			}
			that.addChild( that.titleNode );
			that.titleNode.bounds.x = curx;
			that.titleNode.bounds.y = cury;
			this.cellwidth = Math.max( this.cellwidth, that.titleNode.bounds.width);

		}
		if( that.titleNode ){
			that.titleNode.adjustXOffsetByNewWidth(this.cellwidth);
			cury += that.titleNode.bounds.height + gap;
		}

		textNode.remove();
		this.menuItems.push(textNode);
		this.addChild(textNode);
		var items = this.menuItems.length;
		while( curpos < items ){
			for(var i = 0; i < colnum && curpos < items; i++){
				curnode = this.menuItems[curpos];
				curnode.bounds.x = curx;
				curnode.bounds.y = cury;
				curnode.adjustXOffsetByNewWidth(this.cellwidth);
				curnode.adjustYOffsetByNewHeight(this.cellheight);
				curx += this.cellwidth + gap;
				curpos++;
			}
			curx = bd.x +  gap;
			cury += this.cellheight + gap;
		}
		textNode.on('click', function() {
			if( that.autoClose ) that.removeAllItems();
			 if(callback)
				callback(content, userobj);
		 });
		if( this.bgrect ){
			this.bgrect.remove();
		}
		var   items = this.menuItems ? this.menuItems.length : 0, rownum = Math.ceil(items / colnum),
		w = gap*2 + (colnum -1)* gap + this.cellwidth * colnum,
		h = gap*2 + (rownum-1)* gap + this.cellheight * rownum;
		if( that.titleNode ){
			w = Math.max(w, that.titleNode.bounds.width +2*gap);
			h += that.titleNode.bounds.height + gap;
		}
		this.bgrect = new Path.Rectangle({
				rectangle:{  topLeft: [bd.x, bd.y],
							 bottomRight: [bd.x +w, bd.y +h]},
				radius:  this.corner,
				strokeColor: this.borderColor ,
				fillColor: this.keyboardColor
			});
		this.insertChild(0, this.bgrect);
	},

	removeAllItems:   function( ) {
		var items = this.menuItems ;
		for(var i in items){
		  items[i].remove();
		}
		this.menuItems.length = 0;
		if(  this.bgrect  )
			this.bgrect.remove();
		this.remove();
	},
});
  var ChoiceProblem = PopupMenu.extend({
	_class: 'ChoiceProblem',
	initialize: function ChoiceProblem( params ) {
		this.autoClose = false;
		PopupMenu.apply(this, arguments);
		if( this.problem )
			this.setup( this.problem );
	},
	setup: function(data){
		var that = this;
		that._problem = data;
		that.title = that._problem.title;
		that._problem.options.forEach( e => {
			that.addMenuTextItem( e.content, function(){
				if( that.autoClose ) that.removeAllItems();
				else if( that.autoMarkAnswer ) that.markAnswer();

				if( e.feedback ) {
					that._project._studio.publish('global.message.notification',
					{ content : e.feedback, position: that.position, ani_type:10 });
				}
				else if( e.toScene ){
					that._project.showLayer( event.toScene );
				}
			})
		});
	},
	setProblem: function(data){
		this._problem = data;
	},
	getProblem: function(){
		return this._problem;
	},
	markAnswer: function(){
		var that = this;
		that._problem.options.forEach( e => {
			if( e.correct ) e.bgColor = that._project.getBuiltInColor('correctColor');
			else  e.bgColor = that._project.getBuiltInColor('wrongColor');
		});
	}
});

var TwoStateButton = Group.extend({
	_class: 'TwoStateButton',

	initialize: function TwoStateButton(params) {
		Group.apply(this, arguments);
		this._initialize(params);
		this.toggle = params.toggle || false;
		if( !this.state1_icon && this.state1_name ){
			this.state1_label = this._setupLabel( this.state1_name );
		}
		if( !this.state2_icon &&  this.state2_name ){
			this.state2_label = this._setupLabel( this.state2_name );
		}
		if( this.state1_icon ){
			this.state1_icon.remove();
		}
		if( this.state2_icon )
			this.state2_icon.remove();
		this.setState( this.cur_state || this.state1_name );
		var that = this;
		this.on(params.use_mouse_down ? 'mousedown' : 'click', function(e){
			if( !this.isDisabled() ){
				if( that.toggle )
					that.toggleState();
				else
					that.click_func( this.cur_state )
				e.stopPropagation();
				e.preventDefault();
			}
		});
	},
	toggleState: function(){
		this.setState( this.cur_state == this.state1_name ? this.state2_name : this.state1_name );
	},
	_setupLabel:function( text ){
		var txtColor = this.textColor || this._style && this._style.strokeColor  || this._style && this._style.fillColor ||'black';
		var bgColor = this.bgColor  || 'white';
		var label =  new StyledText({
			content:  text,
			fontSize:  this._style && this._style.fontSize || 20,
			fillColor : txtColor,
			strokeColor : txtColor,
			borderColor: txtColor,
			bgColor:  bgColor,
			textXOffset:5,
			textYOffset:2,
			corner: 2,
		});
		if( this.width ){
			label.adjustXOffsetByNewWidth(this.width);
		}
		if( this.height ){
			label.adjustYOffsetByNewHeight(this.height);
		}
		label.remove();
		return label;
	},
	_getBounds: function(matrix, options) {
		if( ! (this.width || this.state1_icon || this.state1_label ) )
			return new Rectangle();
		var w =this.width || this.state1_icon && this.state1_icon.bounds.width || this.state1_label.bounds.width,
			h =this.height || this.state1_icon && this.state1_icon.bounds.height || this.state1_label.bounds.height,
			rect = new Rectangle(0, 0, w, h);
		return matrix ? matrix._transformBounds(rect, rect) : rect;
	},
	isFocused: function(){
		return this._focused;
	},
	setFocused: function(focus){
		this._focused = focus;
	},

	isDisabled: function(){
		return this._disabled || false;
	},
	setDisabled: function(e){
		this._disabled = e;
		if( e ){
			if( !this._dis_fig ){
				var b = this.bounds;
				this._dis_fig =   new Path.Rectangle({
				   topLeft: b.topLeft,
				   bottomRight: b.bottomRight,
					radius: 2,
					strokeColor: 'rgba(250,250,250,0.6)',
					fillColor: 'rgba(250,250,250,0.6)',
				 });
			}
			if( this._cur_shape )
				this._dis_fig.position = this._cur_shape.position;
			this._dis_fig.visible = true;
			this.addChild(this._dis_fig);

		} else {
			if( this._dis_fig ){
				this._dis_fig.visible = false;
				this._dis_fig.remove();
			}
		}
		this._changed(9);
	},
	_get_cur_shape: function(state){
		return state === this.state1_name ?
		( this.state1_icon || this.state1_label) :
		( this.state2_icon || this.state2_label  );
	},

	setState: function(state){
		var that = this, willbe = that._get_cur_shape(state);
		if( that._cur_shape === willbe ) return;
		that.cur_state = state;
		if( that._cur_shape )
		   willbe.position = that._cur_shape.position;
		if( that._cur_shape && that.state1_icon && that.state2_icon ){
			that._cur_shape.morphingTo(null, willbe, 1.0, null, function(){
				 that._cur_shape.remove();
				 that._cur_shape = willbe;
				 that._cur_shape.visible = true;
				 that.addChild(that._cur_shape);
			});
		} else {
			if( that._cur_shape )
				that._cur_shape.remove();
			that._cur_shape = willbe;
			that._cur_shape.visible = true;
			that.addChild(that._cur_shape);
		}
		that._changed(9);
	},

	_copyExtraAttr2: function(source, excludeMatrix){
	},

	_copyExtraAttr: function(source, excludeMatrix){
		this.state1_name = source.state1_name;
		this.state1_icon = source.state1_icon;
		this.state2_name = source.state2_name;
		this.state2_icon = source.state2_icon;
		this._disabled = source._disabled;
		this.click_func = source.click_func;
		this.default_state = source.default_state;
		this.tooltip = source.tooltip;
		this._copyExtraAttr2(source, excludeMatrix);
	},
});

var TextItem = Item.extend({
	_class: 'TextItem',
	_applyMatrix: false,
	_canApplyMatrix: false,
	_serializeFields: {
		content: null
	},
	_boundsOptions: { stroke: false, handle: false },

	initialize: function TextItem(arg) {
		this._content = '';
		this._lines = [];
		var hasProps = arg && Base.isPlainObject(arg)
				&& arg.x === undefined && arg.y === undefined;
		this._initialize(hasProps && arg, !hasProps && Point.read(arguments));
		if( !this.fillColor && this.strokeColor )
			this.fillColor = this.strokeColor;
		if( !this.strokeColor && this.fillColor )
			this.strokeColor = this.fillColor;
	},

	_equals: function(item) {
		return this._content === item._content;
	},

	copyContent: function(source) {
		this.setContent(source._content);
	},

	getContent: function() {
		return this._content;
	},

	setContent: function(content) {
		this._content = '' + content;
		this._lines = this._content.split(/\r\n|\n|\r/mg);
		this._changed(521);
	},

	isEmpty: function() {
		return !this._content;
	},

	getCharacterStyle: '#getStyle',
	setCharacterStyle: '#setStyle',

	getParagraphStyle: '#getStyle',
	setParagraphStyle: '#setStyle',
	statics: {
		AUTO : 'auto',
		CENTER : 'center',
		CHANGE_KINETIC : 'Change.kinetic',
		CONTEXT_2D :'2d',
		DASH : '-',
		EMPTY_STRING : '',
		LEFT : 'left',
		TEXT : 'text',
		TEXT_UPPER : 'Text',
		MIDDLE : 'middle',
		NORMAL : 'normal',
		PX_SPACE : 'px ',
		SPACE : ' ',
		RIGHT : 'right',
		WORD : 'word',
		CHAR : 'char',
		NONE : 'none'
	}
});

var PointText = TextItem.extend({
	_class: 'PointText',

	initialize: function PointText() {
		TextItem.apply(this, arguments);
	},

	getPoint: function() {
		var point = this._matrix.getTranslation();
		return new LinkedPoint(point.x, point.y, this, 'setPoint');
	},

	setPoint: function() {
		var point = Point.read(arguments);
		this.translate(point.subtract(this._matrix.getTranslation()));
	},

	_draw: function(ctx, param, viewMatrix) {
		if (typeof this._content == 'undefined' || this._content.length == 0 )
			return;
		this._setStyles(ctx, param, viewMatrix);
		var lines = this._lines,
			style = this._style,
			hasFill = style.hasFill(),
			hasStroke = style.hasStroke(),
			leading = style.getLeading(),
			shadowColor = ctx.shadowColor;
		ctx.font = style.getFontStyle();
		ctx.textAlign = style.getJustification();
		for (var i = 0, l = lines.length; i < l; i++) {
			ctx.shadowColor = shadowColor;
			var line = lines[i];
			if (hasFill) {
				ctx.fillText(line, 0, 0);
				ctx.shadowColor = 'rgba(0,0,0,0)';
			}
			if (hasStroke)
				ctx.strokeText(line, 0, 0);
			ctx.translate(0, leading);
		}
	},

	_getBounds: function(matrix, options) {
		var style = this._style,
			lines = this._lines,
			numLines = lines.length,
			justification = style.getJustification(),
			leading = style.getLeading(),
			width = this.getView().getTextWidth(style.getFontStyle(), lines),
			x = 0;
		if (justification !== 'left')
			x -= width / (justification === 'center' ? 2: 1);
		var rect = new Rectangle(x,
					numLines ? - 0.75 * leading : 0,
					width, numLines * leading);
		return matrix ? matrix._transformBounds(rect, rect) : rect;
	}
});

 var StyledText = TextItem.extend({
	_class: 'StyledText',

	initialize: function StyledText(arg) {
		this._curFF=null;
		this._curFS=null;
		this._curFW=null;
		this._curStyle=null;
		this._defaultStroke=null;
		this._calculatedHeight=0;
		this.fontStyle= TextItem.NORMAL;
		this.fontVariant= TextItem.NORMAL;
		this.padding= 0;
		this.align= TextItem.LEFT;
		this.lineHeight= 1;
		this.r9textstyle= '';
		this._content= '';
		this.duration= 0;
		this.resumeAnimation= 1;
		this.animType=  'static';
		this. drawunderline=  false;
		this. expression=  '';
		this.penImageName=  '';
		this.fixed=  2;
		this._karaokaWidth=  0;
		this.userobj=  null;
		this.abOrder= '';
		this.mstyles= null;
		this. corner= 0;
		this. borderWidth= 0;
		this. textXOffset= 0;
		this. textYOffset= 0;
		this. textHeight=0;
		this.textWidth=0;
		this.borderColor= '';
		this.bgColor = '';
		this.glow= 0;
		this.gstart= 0;
		this.gend= 0;
		this.effectColor= '';
		this.correct= 0;
		this. textArr=[];
		this.line2height=[];
		if( !arg.fillColor && arg.strokeColor )
			arg.fillColor = arg.strokeColor;
		if( !arg.strokeColor && arg.fillColor )
			arg.strokeColor = arg.fillColor;
		TextItem.apply(this, arguments)
		if( !this.strokeColor ) this.strokeColor = mpaper.project.getBuiltInColor('textColor');
		if( !this.fillColor ) this.fillColor = mpaper.project.getBuiltInColor('textColor');

		this.partialText = this._content;
		this._setTextData();
		this._changed(521);
	},

	_copyExtraAttr: function(source, excludeMatrix){
		this._defaultStroke=source._defaultStroke;
		this._calculatedHeight=source._calculatedHeight;
		this.fontStyle=  source.fontStyle;
		this.fontVariant= source.fontVariant;
		this.padding= source.padding;
		this.align= source.align;
		this.lineHeight= source.lineHeight;
		this.r9textstyle= source.r9textstyle;
		this._content= source._content;
		this.duration= source.duration;
		this.resumeAnimation= source.resumeAnimation;
		this.animType= source.animType;
		this. drawunderline=  source.drawunderline;
		this. expression=  source.expression;
		this.penImageName=  source.penImageName;
		this.fixed=  source.fixed;
		this._karaokaWidth=  source._karaokaWidth;
		this.userobj=  source.userobj;
		this.abOrder= source.abOrder;
		this.mstyles= source.mstyles;
		this. corner= source.corner;
		this. borderWidth= source.borderWidth;
		this. textXOffset= source.textXOffset;
		this. textYOffset= source.textYOffset;
		this. textHeight= source.textHeight;
		this.textWidth= source.textWidth;
		this.borderColor= source.borderColor;
		this.bgColor = source.bgColor;
		this.glow= source.glow;
		this.gstart= source.gstart;
		this.gend= source.gend;
		this.effectColor= source.effectColor;
		this.correct= source.correct;
		this. textArr= source.textArr;
		this.line2height= source.line2height;
	},
	setTextData: function(data){
		this._content = data;
		this.partialText = data;
		this._setTextData();
		this._changed(521);
	 },

	_draw: function(ctx, param, viewMatrix) {
		if (! this._content)
			return;
		this._setStyles(ctx, param, viewMatrix);
	   this._draw2(ctx);

	},

	getdPoint: function() {
		var point = this._matrix.getTranslation();
		return new LinkedPoint(point.x, point.y, this, 'setPoint');
	},

	setPdoint: function() {
		var point = Point.read(arguments);
		this.translate(point.subtract(this._matrix.getTranslation()));
	},

	_getBounds: function(matrix, options) {
		var w =this.getWidth(), h = this.getHeight(),
		   px = this.getPaddingX(), py = this.getPaddingY() ;
		var rect = new Rectangle(0/2,0/2, w, h);
		return matrix ? matrix._transformBounds(rect, rect) : rect;
	},

	_addTextUnit : function(line, width, r9textstyle) {
		return this.textArr.push({
								 text : line,
								 width : width,
								 style : r9textstyle
								 });
	},

	_getLineHeightPx : function(r9textstyle){
		if(  r9textstyle && r9textstyle.math && r9textstyle.math.h ){
			return  parseInt(r9textstyle.math.h, 16)
		}
		if( r9textstyle &&  r9textstyle.rh   )
		   return r9textstyle.rh;
		else
		   return  this._style.getLeading();
	},

	_restore: function(){
		this._curFF = null;
		this._curFS = null;
		this._curFW = null;
		this._curStyle = null;
		this._defaultStroke = null;
		this.fontStyle = TextItem.NORMAL;
		this.fontVariant = TextItem.NORMAL;
	},

	write: function(timeline, duration, offset,  doneCallback) {
		this._write0(timeline, duration, offset,   true, doneCallback);
	},

	unwrite: function(timeline, duration, offset,  doneCallback) {
		this._write0(timeline, duration, offset,   false, doneCallback);
	},

	_write0: function(timeline, duration, offset, create, doneCallback) {
		var that = this;
		this.duration = duration;
		timeline.add({
				targets : this,
				progressFunc : function(progress){
					 that._progress = create ? progress : 1 - progress;
					 that._changed(41);
				}.bind(this),
				duration : duration,
				complete: function(){
					that.duration = 0;
					if( doneCallback ) doneCallback();
				}.bind(this)
		   }, offset);
		return true;
	 },

	_drawGlow : function(ctx, x, y ) {
		var w =this.getWidth(), h = this.getHeight();
		 ctx.save();
		 ctx.translate(w, -h/2);
		var gradient4 = ctx.createRadialGradient(0, 0, 0, 0, 0, h/2 );
		 gradient4.addColorStop(0, 'rgba(255,0,0, 0.6)');
		 gradient4.addColorStop(1, 'rgba(255,0,0,0)');
		ctx.fillStyle = gradient4;
		ctx.beginPath();
		ctx.arc(0, 0, h/2, 0, Math.PI *2, false);
		ctx.closePath();
		ctx.fill();

		ctx.restore();
   },
   adjustXOffsetByNewWidth: function(newWidth){
		var w = this.bounds.width, changes = (newWidth - w) /2;
		this.textXOffset += changes;
		this._changed(521);
   },
   adjustYOffsetByNewHeight: function(newHeight){
		var h = this.bounds.height, changes = (newHeight - h) /2;
		this.textYOffset += changes;
		this._changed(521);
   },
	getPaddingX : function() {
	   return this.padding + this.textXOffset ;
	},
	getPaddingY : function() {
		return this.padding  + this.textYOffset ;
	},
	getKaraokaWidth: function(){
		if(! this._karaokaWidth ) this._karaokaWidth = this._project._activeLayer.bounds.width;
		return this._karaokaWidth;
	},
	setKaraokaWidth: function(w){
		 this._karaokaWidth = w;
	},
	getWidth : function() {
		if( this.animType== 'karaoka' ){
			 return this.getKaraokaWidth();
		}
	   return  this.calculateTextWidth() + this.getPaddingX() * 2 ;
	},
	getNumLines: function(){
		return  this._content  .split(/\r\n|\n|\r/mg).length;
	},

	getHeight : function() {
		if( this._calculatedHeight <= 0 ){
			return   ( this.getNumLines() * this._getLineHeightPx())
					+ this.getPaddingY() * 2 ;
		} else {
			return this._calculatedHeight + this.getPaddingY() * 2 ;
		}
	},
	calculateTextWidth : function() {
		return this.textWidth;
	},
	_getFontWeight : function(){
		if ( this._curFW)
			return this._curFW;
		else
			return this._style.getFontWeight();
	},
	_getFontVariant : function(){
		if ( this._curFontVariant )
			return this._curFontVariant;
		else
			return this.fontVariant;
	},
	_getFontStyle : function(){
		if ( this._curFS ){
			var style = this._curFS;
			if( style === "bold" ){
				this._curFW = "bold";
			   return "normal";
			}
			return this._curFS;
		} else {
			var style = this.fontStyle
			if( style === "bold" ){
			   _curFW = "bold";
			   return "normal";
			}
			return style;
		}
	},
	_getFontFamily : function(){
		if ( this._curFF )
			return this._curFF;
		else
			return this._style.getFontFamily();
	},
	_calculateTextWidth : function(text) {
		return this.getView().getOneLineTextWidth(this._getContextFont(), text);
	},

	_getContextFont : function(fontsize) {
		return this._getFontStyle() + TextItem.SPACE + this._getFontVariant() + TextItem.SPACE + this._getFontWeight() + TextItem.SPACE
		+ ( typeof fontsize == 'undefined' ? this._style.getFontSize() : fontsize )+   TextItem.PX_SPACE + this._getFontFamily();
	},
	_getTextSize : function(text, r9textstyle) {
		if( typeof r9textstyle != "undefined" && r9textstyle.math ){
			return {
			   width : parseInt(r9textstyle.math.w, 16),
			   height : parseInt(r9textstyle.math.h, 16)
			};
		}
		var _context = this.getView()._context, fontSize = this._style.getFontSize(), metrics;
		_context.save();
		_context.font = this._getContextFont();
		metrics = _context.measureText(text);
		_context.restore();
		return {
			width : metrics.width,
			height :this._getLineHeightPx(r9textstyle)
		};
	},

	_drawBackground : function(ctx){
		var width = this.getWidth(), height = this.getHeight(),
		useBackground = this.borderColor || this.bgColor  ,
		 borderColor = this.borderColor, bgColor = this.bgColor,
		 corner = this.corner, borderWidth = this.borderWidth ;
		if( !useBackground )
			return;
		 ctx.save();
		if( borderWidth ) ctx.lineWidth = borderWidth;
		ctx.fillStyle = bgColor;
		ctx.strokeStyle = borderColor;
		 RU.r9_drawRounded(ctx, 0,0, width, height, corner);
		if( bgColor )   ctx.fill();
		if( borderColor )   ctx.stroke();
		 ctx.restore();
	},
	_setTextData : function() {
		if ( this.r9textstyle  ){
			try{
				return this._setTextData2();
			}catch(e){
				CoreUtils.r9_log_console(e);
				return this._setTextData1();
			}
		} else {
			return this._setTextData1();
		}
	},
	_setCurTexTStyle: function(s){
		if ( s.b ){
			this._curFW = "bold";
			this._curFS = null;
		} else if ( s.i ){
			this._curFS = "italic";
			this._curFW = "normal";
		}else {
			this._curFW = "normal";
			this._curFS = null;
		}
		if ( s.fontFamily )
			this._curFF = s.fontFamily;
		else
			this._curFF = this._getFontFamily();
	},
	_setTextData1 : function() {
		var lines = this.partialText.split(/\r\n|\n|\r/mg), fontSize = this._style.getFontSize(), textWidth = 0, lineHeightPx = this
		._getLineHeightPx(),    paddingX = this .getPaddingX() , paddingY = this .getPaddingY() ,
		 numLines = lines.length;
		this.textArr = [];
		this.line2height = [];
		for (var i = 0, max = lines.length; i < max; ++i) {
			var line = lines[i], lineWidth = this._calculateTextWidth(line);
			this._addTextUnit(line+ "\n", lineWidth);
			textWidth = Math.max(textWidth, lineWidth);
			this.line2height.push( lineHeightPx );
		}
		this.textHeight = numLines * lineHeightPx;
		this.textWidth = textWidth;
		this._calculatedHeight = this.textHeight ;
		var abOrder = this.abOrder;
		if( abOrder ){
			var orderw = this._getTextSize(abOrder).width;
			this.textWidth += orderw;
		}
	},

	_setTextData2 : function() {
		var text = this.partialText ,
		 animType = this.animType,
		 r9textstyle = this.r9textstyle ,
		 textWidth = 0,
		 totalHeightPx = 0 ;
		this.textArr = [];
		this.line2height = [];
		var maxLineHeight =  0,  line, lineWidth = 0;
		for (var i = 0; i < r9textstyle.length; i++) {
			var line =  r9textstyle[i].end < text.length -1 ? text.substring( r9textstyle[i].start, r9textstyle[i].end + 1) : text.substring( r9textstyle[i].start );
			this._setCurTexTStyle ( r9textstyle[i] ) ;
			var textSize = this._getTextSize(line, r9textstyle[i]);
			lineWidth += textSize.width;
			if( textSize.height > maxLineHeight )
				maxLineHeight = textSize.height;
			this._addTextUnit(line, textSize.width, r9textstyle[i]);
			textWidth = Math.max(textWidth, lineWidth);
			if ( line.indexOf("\n") >= 0 && animType != 4 ){
				lineWidth = 0;
				this.line2height.push(maxLineHeight);
				totalHeightPx += maxLineHeight;
				maxLineHeight = 0;
			}
		}
		if( maxLineHeight > 0 ){
			this.line2height.push(maxLineHeight);
			totalHeightPx += maxLineHeight;
		}
		this.textHeight = totalHeightPx;
		this.textWidth = textWidth;
		var abOrder = this.abOrder;
		if( abOrder ){
			var orderw = this._getTextSize(abOrder).width;
			this.textWidth += orderw;
		 }
		 this._restore();
	},

	_sceneFuncImpl : function(ctx, paintBgText, paintBorderOnly) {
		var  animType = this.animType, textHeight = this.textHeight, lineHeightPx = this._getLineHeightPx(),
		textArr = this.textArr, textArrLen = textArr.length, totalWidth = this
		.getWidth(), abOrder=this.abOrder ,  glow = this.glow , gstart = this.gstart , gend = this.gend ,
		pX = this.getPaddingX(), pY = this.getPaddingY(), n;

		this._drawBackground(ctx);
		var paintAll = this.partialText == this._content;

		ctx.font = this._getContextFont();
		ctx.textBaseline = TextItem.MIDDLE;
		ctx.textAlign = TextItem.LEFT;

		 ctx.save();
		ctx.translate(pX, 0);

		ctx.translate(0, pY  );

		if( abOrder ){
			var orderw = this._getTextSize(abOrder).width;
			ctx.strokeText(abOrder, 0,0);
			ctx.translate(orderw, 0);
		}
		if( animType == 'karaoka'){
			var kalaokoffset = this.kalaokoffset();
				ctx.translate(kalaokoffset , 0);
		}
		var _xoffset = 0;
		var rowIndex = 0;
		var newLineStart = false;
		var hasMedia = false;
		ctx.translate(0, this.line2height[0]/2);
		for (n = 0; n < textArrLen; n++) {
			var obj = textArr[n], text = obj.text, width = obj.width,  style = obj.style;
			this._curStyle = style ;
			hasMedia = false;
			var isNewLine = text.indexOf("\n") >= 0 && animType != 4;

			if(  newLineStart  && animType != 4){
				if( rowIndex > 0 )
					ctx.translate(0, this.line2height[rowIndex-1]/2);
				ctx.translate(- _xoffset, this.line2height[rowIndex]/2);
				_xoffset = 0;
				newLineStart = false;
			}

			if( isNewLine ) newLineStart = true;

			if ( style ){
				ctx.save();
				style.width = width;
				style.height = this.line2height[rowIndex];

				this._setCurTexTStyle( style );
				if( style.iconName){
					var imge  = this.getProject().getCacheImageByName(style.iconName);
					if( imge ){
						var iconwh = this._getTextSize("xx").width;
						var iconxof = Math.max(0, (width - iconwh)/2 );
						ctx.translate(iconxof, -iconwh/2);
						var params =  [imge,   0, 0, 32, 32, 0, 0, iconwh, iconwh];
						ctx.drawImage.apply(ctx, params);
						ctx.translate(-iconxof, iconwh/2);
						hasMedia = true;
					}
				}
				var fillcolorStr =  this._style.getFillColor().toCSS();
				var strokecolorStr = this._style.getStrokeColor().toCSS();
				if( paintBorderOnly ){
					fillcolorStr= 'rgba(0,0,0,0)';
				}
				if ( style.stroke ){
					ctx.strokeStyle = style.stroke  ;
					ctx.fillStyle =   style.stroke  ;
				} else if ( this._defaultStroke ) {
					ctx.strokeStyle = this._defaultStroke ;
					ctx.fillStyle =  this._defaultStroke  ;
				} else {
					ctx.strokeStyle =  strokecolorStr ;
					ctx.fillStyle = fillcolorStr  ;
				}
				if ( style.fontFamily )
					this._curFF = style.fontFamily;
				else
					this._curFF = this._getFontFamily();
				if ( style.sup )
					ctx.translate(0, - style.height /3);
				if ( style.sub )
					ctx.translate(0, + style.height /3);

				var strokeAlpha = this._style.getStrokeColor().alpha;
				var fillAlpha = this._style.getFillColor().alpha;
				if( paintBgText) {
					this._style.getStrokeColor().alpha = 0.3;
					ctx.strokeStyle = strokecolorStr;
					this._style.getFillColor().alpha = 0.3;
					ctx.fillStyle = fillcolorStr;
				}
				ctx.font = this._getContextFont();
				if( style.math ){
					var tXoff =  Math.max(0, (width - style.math.w)/2 );
					var tYoff = - style.math.h /2;
					r9_drawMathForm.call(this, style.math, tXoff, tYoff,
						ctx, fillcolorStr, strokecolorStr);
					hasMedia = true;
				}
				this.partialText = hasMedia ? "" : text;
				if( paintBorderOnly ){
					this.strokeWidth(1),
					this._strokeFunc(ctx);
				} else {
					this._strokeFunc(ctx);
				}
				ctx.restore();
				ctx.lineWidth = 1;
				if( paintBgText) {
					this._style.getStrokeColor().alpha = strokeAlpha;
					this._style.getFillColor().alpha = fillAlpha;
				}

				if ( isNewLine ){
					rowIndex ++;
				} else {
					ctx.translate(width, 0);
					_xoffset += width;
				}
			} else {
				 ctx.save();
				if (this.align ===  TextItem.RIGHT) {
					ctx.translate(totalWidth - width - pX * 2, 0);
				} else if (this.align ===  TextItem.CENTER) {
					ctx.translate((totalWidth - width - pX * 2) / 2, 0);
				}
				this._curFF = this._getFontFamily();
				var strokeAlpha = this._style.getStrokeColor().alpha;
				var fillAlpha = this._style.getFillColor().alpha;
				if( paintBgText) {
					this._style.getStrokeColor().alpha = 0.3;
					ctx.strokeStyle = this._style.getStrokeColor().toCSS();
					this._style.getFillColor().alpha = 0.3;
					ctx.fillStyle = this._style.getFillColor().toCSS();
				} else {
					ctx.strokeStyle = this._style.getStrokeColor().toCSS();
					ctx.fillStyle = this._style.getFillColor().toCSS();
				}
				this.partialText = text;
				this._strokeFunc(ctx);
				ctx.restore();
				if( paintBgText) {
					this._style.getStrokeColor().alpha = strokeAlpha;
					this._style.getFillColor().alpha = fillAlpha;
				}
				if( isNewLine ){
					rowIndex ++;
				}
			}
		}
		if( !paintAll ){
			if( glow )
			this._drawGlow(ctx, 0,0);
			this._drawPenFunc(ctx, 0,0);
		}
		ctx.restore();
		if( this.correct != 0){
			var cimge  = this.getProject().getCacheImageByName(this.correct > 0 ?"r9correct" : "r9wrong");
			if( cimge ){
				var params =  [cimge, this.getWidth()-28, this.getHeight()-24, 22, 22];
				ctx.drawImage.apply(ctx, params);
			}
		}
		if( this.selected  ){
			ctx. strokeStyle ='rgba(255,0,0,1)';
			ctx.beginPath();
			ctx.rect(0, 0, this.getWidth(), this.getHeight());
			ctx.closePath();
			ctx.stroke(this);
		}
	},
	needToPaint: function(){
		var duration = this.duration , content = this._content ,  total = content.length;
		return duration > 0 ? Math.ceil(total * this.progress ) : total;
	},
	getKaraokaTextWidth: function(){
		if(! this._karaokaTextWidth )
			this._karaokaTextWidth = this._calculateTextWidth(this._content);
		return this._karaokaTextWidth;
	},
	kalaokoffset: function(){
		var duration = this.duration , content = this._content , animType = this.animType , total = content.length;
		if( animType != 'karaoka' ) return 0;
		var fullTextWidth =  this.getKaraokaTextWidth(), window_w = this.getKaraokaWidth();
		return duration > 0 ?   (fullTextWidth +  window_w ) * (1-this.progress) - window_w : - fullTextWidth;
	},

	_draw2 : function(ctx) {
		var animType = this.animType, needToPaint = this.needToPaint(), duration = this.duration, content = this._content
		,    expression = this.expression ;
		if( expression ){
		   this. _setText( eval( expression ) );
		   var  r9vs = this.partialText;
			var r9v = Number(r9vs);
			if( !Number.isNaN( r9v) ){
				 r9vs = r9v.toFixed(this.fixed);
				 r9v = parseFloat(r9vs);
				  this. _setText( r9v + "");
			}
		   this._sceneFuncImpl(ctx, false, false);
		   return;
		}
		if( (  animType == 0 || duration <= 0 ) && (animType != 'karaoka')){
			this. _setText(  content);
			this._sceneFuncImpl(ctx, false, false);
			return;
		}
		if(  animType== 'karaoka' ){
			var kalaokoffset = this.kalaokoffset(), kalaoktextwidth = this.getKaraokaTextWidth();
			if( kalaokoffset > 0 ){
				var w_width =  this.getKaraokaWidth() || this.getWidth();
				var  diff =   w_width - kalaokoffset;
				if( diff <= 0 ){
					 return;
				} else {
					var showStr = parseInt(content.length * diff / kalaoktextwidth);
					this. _setText(content.substr(0, showStr));
				}
			} else {
				var  diff = - kalaokoffset;
				if( diff >= kalaoktextwidth)  return;
				else {
					var showStr = Math.ceil(  content.length * diff / kalaoktextwidth );
					this. _setText(content.substr(showStr));
				}
			}
			this._sceneFuncImpl(ctx, false, false);
			return;
		}
		if( animType == 'underline' ){
			this. _setText(content);
			this._sceneFuncImpl(ctx, false, false);
			this.drawunderline = true;
			if( needToPaint > 0){
				this. _setText(content.substr(0, needToPaint+1));
				this._sceneFuncImpl(ctx, false, false);
				this.drawunderline = false;
			}
			return;
		}
		if ( animType == 'manim'  &&  needToPaint < content.length ){
			if( needToPaint > 0){
				this. _setText(content.substr(0, needToPaint == 1? 1 : ( needToPaint == 2 ? 3 : needToPaint+3)));
				this._sceneFuncImpl(ctx, false, true);
				this. _setText(content.substr(0, needToPaint == 1 ? 0 : needToPaint));
				this._sceneFuncImpl(ctx, false, false);
			}
			return;
		}
		if ( animType == 'rewriting'  &&  needToPaint < content.length ){
			this. _setText(content);
			this._sceneFuncImpl(ctx, true, false);
		}
		if( needToPaint > 0 ){
			this. _setText(content.substr(0, needToPaint+1));
			this._sceneFuncImpl(ctx, false, false);
		}
	},
	_setText : function(text) {
		var str = CoreUtils._isString(text) ? text : text.toString();
		if( str == this.partialText ) return;
		this.partialText = str;
		this._setTextData();
		return this;
	},

	changeStyle : function(styleName) {
		var mstyles = this.mstyles();
		if( typeof mstyles == 'undefined' )
			return;
		for(var i in mstyles){
			if( CoreUtils._r9norm(mstyles[i].name) == CoreUtils._r9norm(styleName) ){
				this.r9textstyle =  mstyles[i].style  ;
				this._content = CoreUtils._r9norm(mstyles[i].text) ;
				break;
			}
		}
	},

	getMathInput : function() {
		var r9textstyle = this.r9textstyle ;
		if( r9textstyle && r9textstyle.length == 2 && r9textstyle[1].math)
			return r9textstyle[1].math;
		if( r9textstyle && r9textstyle.length == 1 && r9textstyle[0].math)
			return r9textstyle[0].math;
		return null;
	},

	_progress_imp : function(progress, options) {
		var duration = this.duration  ;
		this.setProgress( progress / duration );
	},
	_strokeFunc : function(ctx) {
		ctx = ctx || this.getView()._context;
		var lh = this._getLineHeightPx( );
		if( this.drawunderline ){
			 ctx.save();
			ctx.font = this._getContextFont();
			ctx.beginPath();
			ctx.moveTo(0,  lh/3);
			ctx.lineTo(this._calculateTextWidth(this.partialText), lh/3);
			ctx.stroke();
			ctx.restore();
			return;
		}
		ctx.lineWidth = 1;
		if( this.animType == 'manim' && this.partialText != this._content )
			ctx.strokeText(this.partialText, 0, 0);
		ctx.fillText(this.partialText, 0, 0);
		if ( ! this._curStyle )
			return;
		if ( this._curStyle.u ){
			ctx.beginPath();
			ctx.moveTo(0,   lh /3);
			ctx.lineTo(this._curStyle.width, lh/3);
			ctx.stroke();
		}
		if ( this._curStyle.strike ){
			ctx.beginPath();
			ctx.moveTo(0,    0);
			ctx.lineTo(this._curStyle.width,   0);
			ctx.stroke();
		}
	},
	_drawPenFunc : function(ctx, x, y ) {
		var pen  = this.penImageName ;
		if( pen && pen.length > 0 ){
		 var imge  = this.getProject().getCacheImageByName(pen);
		 if( imge ){
			  ctx.translate(x - imge.width/2, y + 10 );
			  var params =  [imge, 0, 0, imge.width, imge.height];
			  ctx.drawImage.apply(ctx, params);
			  ctx.translate(-x + imge.width/2, -y - 10 );
		 }
		}
	}
});

var LabeledDot = StyledText.extend({
	_class: 'LabeledDot',
	initialize: function LabeledDot(props) {
		StyledText.apply(this, arguments)
		this.bgColor = this.bgColor || this.fillColor || 'white';
		this.borderColor = this.borderColor || this.strokeColor || 'black';
	},
	useNextSymbol: function(){
		this.content = RU.nextSequenceSymbol(this.content || 'A');
	},
	_getBounds: function(matrix, options) {
			var w = this.textWidth , h = this.textHeight,     padding  = this.padding || 0,
			   radius = Math.sqrt(w* w + h*h);
			this.textXOffset = (radius -w)/2;
			this.textYOffset = (radius -h)/2;
			this.radius = radius/2;
			var rect = new Rectangle(0, 0, radius+padding*2, radius+padding*2);
			return matrix ? matrix._transformBounds(rect, rect) : rect;
	},
	_drawBackground : function(ctx){
		var w = this.getWidth(), h = this.getHeight(),
		 bc = this.borderColor, bgc = this.bgColor,
		 bw = this.borderWidth,  padding = this.padding || 0, radius = this.radius || Math.sqrt(w* w + h*h)/2;

	   ctx.save();
		if( bw ) ctx.lineWidth = bw;
		ctx.fillStyle = bgc;
		ctx.strokeStyle = bc;
			 ctx.beginPath();
			 ctx.arc(w/2, h/2, radius + padding , 0, 360);
		if( bgc )     ctx.fill();
		if( bc )   ctx.stroke();
		 ctx.restore();
	},
});

var DecimalNumber = StyledText.extend({
	_class: 'DecimalNumber',

	initialize: function DecimalNumber(params) {
		if( typeof params.number !== 'undefined')
			params.content = params.number;
		StyledText.apply(this, arguments);
		this.num_decimal_places = typeof params.num_decimal_places == 'undefined' ? 2 : params.num_decimal_places;
		this.include_sign = params.include_sign || false;
		this.group_with_commas = typeof params.group_with_commas == 'undefined' ? true : params.group_with_commas;
		this.digit_buff_per_font_unit = params.digit_buff_per_font_unit || 0.001;
		this.show_ellipsis = params.show_ellipsis || false;
		this.units = params.units;
		this.include_background_rectangle = params.include_background_rectangle || false;
		this. edge_to_fix = typeof params.edge_to_fix == 'undefined' ? Constants.LEFT : params.edge_to_fix;
		this._style.fontSize = typeof params.fontSize == 'undefined' ? 16 : params.fontSize;
		this.setValue(params.content||0);
	},
	_copyExtraAttr: function(source, excludeMatrix){
		this.num_decimal_places = source.num_decimal_places;
		this.include_sign = source.include_sign  ;
		this.group_with_commas = source.group_with_commas;
		this.digit_buff_per_font_unit = source.digit_buff_per_font_unit  ;
		this.show_ellipsis = source.show_ellipsis ;
		this.units = source.units;
		this.include_background_rectangle = source.include_background_rectangle ;
		this. edge_to_fix = source.edge_to_fix;
		this._style.fontSize = source._style.fontSize;
	},
	setValue: function(number){
		this.number = number;
		this._content = this.number.toFixed( this.num_decimal_places )
					   + (this.show_ellipsis? '...' : '') + (this.units? this.units : '');
		this._changed(521);
	},
	scale: function(scale){
		this._style.fontSize = this._style.fontSize * scale;
	},
	getValue: function(){
		return this.number;
	},
	increment_value: function(delta){
		 this.setValue( this.getValue() + delta);
	},
	_animForShowing: function(duration, offset){
		this.visible = true;
		this.changeValue(0, this.getValue, duration)
	},
	changeValue: function(from, to, duration){
		if( duration ){
			if( typeof from !== 'undefined' )
				this.setValue(from);
				anime({
				targets: this,
				value: to,
				duration: duration
			   } );
		} else {
			this.setValue(to);
		}
	}

});

var Integer = DecimalNumber.extend({
	_class: 'Integer',
	initialize: function Integer(params) {
		params.num_decimal_places = 0;
		DecimalNumber.apply(this, arguments);
	},
	getValue: function(){
		return parseInt(this.number);
	},
});

var Color = Base.extend(new function() {
	var types = {
		gray: ['gray'],
		rgb: ['red', 'green', 'blue'],
		hsb: ['hue', 'saturation', 'brightness'],
		hsl: ['hue', 'saturation', 'lightness'],
		gradient: ['gradient', 'origin', 'destination', 'highlight']
	};

	var componentParsers = {},
		namedColors = {
			transparent: [0, 0, 0, 0]
		},
		colorCtx;

	function fromCSS(string) {
		if( mpaper.project && mpaper.project.getBuiltInColor(string))
			string = mpaper.project.getBuiltInColor(string);
		var match = string.match(
				/^#([\da-f]{2})([\da-f]{2})([\da-f]{2})([\da-f]{2})?$/i
			) || string.match(
				/^#([\da-f])([\da-f])([\da-f])([\da-f])?$/i
			),
			type = 'rgb',
			components;
		if (match) {
			var amount = match[4] ? 4 : 3;
			components = new Array(amount);
			for (var i = 0; i < amount; i++) {
				var value = match[i + 1];
				components[i] = parseInt(value.length == 1
						? value + value : value, 16) / 255;
			}
		} else if (match = string.match(/^(rgb|hsl)a?\((.*)\)$/)) {
			type = match[1];
			components = match[2].trim().split(/[,\s]+/g);
			var isHSL = type === 'hsl';
			for (var i = 0, l = Math.min(components.length, 4); i < l; i++) {
				var component = components[i];
				var value = parseFloat(component);
				if (isHSL) {
					if (i === 0) {
						var unit = component.match(/([a-z]*)$/)[1];
						value *= ({
							turn: 360,
							rad: 180 / Math.PI,
							grad: 0.9
						}[unit] || 1);
					} else if (i < 3) {
						value /= 100;
					}
				} else if (i < 3) {
					value /= /%$/.test(component) ? 100 : 255;
				}
				components[i] = value;
			}
		} else {
			var color = namedColors[string];
			if (!color) {
				if (window) {
					if (!colorCtx) {
						colorCtx = CanvasProvider.getContext(1, 1);
						colorCtx.globalCompositeOperation = 'copy';
					}
					colorCtx.fillStyle = 'rgba(0,0,0,0)';
					colorCtx.fillStyle = string;
					colorCtx.fillRect(0, 0, 1, 1);
					var data = colorCtx.getImageData(0, 0, 1, 1).data;
					color = namedColors[string] = [
						data[0] / 255,
						data[1] / 255,
						data[2] / 255
					];
				} else {
					color = [0, 0, 0];
				}
			}
			components = color.slice();
		}
		return [type, components];
	}

	var hsbIndices = [
		[0, 3, 1],
		[2, 0, 1],
		[1, 0, 3],
		[1, 2, 0],
		[3, 1, 0],
		[0, 1, 2]
	];

	var converters = {
		'rgb-hsb': function(r, g, b) {
			var max = Math.max(r, g, b),
				min = Math.min(r, g, b),
				delta = max - min,
				h = delta === 0 ? 0
					:   ( max == r ? (g - b) / delta + (g < b ? 6 : 0)
						: max == g ? (b - r) / delta + 2
						:            (r - g) / delta + 4) * 60;
			return [h, max === 0 ? 0 : delta / max, max];
		},

		'hsb-rgb': function(h, s, b) {
			h = (((h / 60) % 6) + 6) % 6;
			var i = Math.floor(h),
				f = h - i,
				i = hsbIndices[i],
				v = [
					b,
					b * (1 - s),
					b * (1 - s * f),
					b * (1 - s * (1 - f))
				];
			return [v[i[0]], v[i[1]], v[i[2]]];
		},

		'rgb-hsl': function(r, g, b) {
			var max = Math.max(r, g, b),
				min = Math.min(r, g, b),
				delta = max - min,
				achromatic = delta === 0,
				h = achromatic ? 0
					:   ( max == r ? (g - b) / delta + (g < b ? 6 : 0)
						: max == g ? (b - r) / delta + 2
						:            (r - g) / delta + 4) * 60,
				l = (max + min) / 2,
				s = achromatic ? 0 : l < 0.5
						? delta / (max + min)
						: delta / (2 - max - min);
			return [h, s, l];
		},

		'hsl-rgb': function(h, s, l) {
			h = (((h / 360) % 1) + 1) % 1;
			if (s === 0)
				return [l, l, l];
			var t3s = [ h + 1 / 3, h, h - 1 / 3 ],
				t2 = l < 0.5 ? l * (1 + s) : l + s - l * s,
				t1 = 2 * l - t2,
				c = [];
			for (var i = 0; i < 3; i++) {
				var t3 = t3s[i];
				if (t3 < 0) t3 += 1;
				if (t3 > 1) t3 -= 1;
				c[i] = 6 * t3 < 1
					? t1 + (t2 - t1) * 6 * t3
					: 2 * t3 < 1
						? t2
						: 3 * t3 < 2
							? t1 + (t2 - t1) * ((2 / 3) - t3) * 6
							: t1;
			}
			return c;
		},

		'rgb-gray': function(r, g, b) {
			return [r * 0.2989 + g * 0.587 + b * 0.114];
		},

		'gray-rgb': function(g) {
			return [g, g, g];
		},

		'gray-hsb': function(g) {
			return [0, 0, g];
		},

		'gray-hsl': function(g) {
			return [0, 0, g];
		},

		'gradient-rgb': function() {
			return [];
		},

		'rgb-gradient': function() {
			return [];
		}

	};

	return Base.each(types, function(properties, type) {
		componentParsers[type] = [];
		Base.each(properties, function(name, index) {
			var part = Base.capitalize(name),
				hasOverlap = /^(hue|saturation)$/.test(name),
				parser = componentParsers[type][index] = type === 'gradient'
					? name === 'gradient'
						? function(value) {
							var current = this._components[0];
							value = Gradient.read(
								Array.isArray(value)
									? value
									: arguments, 0, { readNull: true }
							);
							if (current !== value) {
								if (current)
									current._removeOwner(this);
								if (value)
									value._addOwner(this);
							}
							return value;
						}
						: function() {
							return Point.read(arguments, 0, {
									readNull: name === 'highlight',
									clone: true
							});
						}
					: function(value) {
						return value == null || isNaN(value) ? 0 : +value;
					};
			this['get' + part] = function() {
				return this._type === type
					|| hasOverlap && /^hs[bl]$/.test(this._type)
						? this._components[index]
						: this._convert(type)[index];
			};

			this['set' + part] = function(value) {
				if (this._type !== type
						&& !(hasOverlap && /^hs[bl]$/.test(this._type))) {
					this._components = this._convert(type);
					this._properties = types[type];
					this._type = type;
				}
				this._components[index] = parser.call(this, value);
				this._changed();
			};
		}, this);
	}, {
		_class: 'Color',
		_readIndex: true,

		initialize: function Color(arg) {
			var args = arguments,
				reading = this.__read,
				read = 0,
				type,
				components,
				alpha,
				values;
			if (Array.isArray(arg)) {
				args = arg;
				arg = args[0];
			}
			var argType = arg != null && typeof arg;
			if (argType === 'string' && arg in types) {
				type = arg;
				arg = args[1];
				if (Array.isArray(arg)) {
					components = arg;
					alpha = args[2];
				} else {
					if (reading)
						read = 1;
					args = Base.slice(args, 1);
					argType = typeof arg;
				}
			}
			if (!components) {
				values = argType === 'number'
						? args
						: argType === 'object' && arg.length != null
							? arg
							: null;
				if (values) {
					if (!type)
						type = values.length >= 3
								? 'rgb'
								: 'gray';
					var length = types[type].length;
					alpha = values[length];
					if (reading) {
						read += values === arguments
							? length + (alpha != null ? 1 : 0)
							: 1;
					}
					if (values.length > length)
						values = Base.slice(values, 0, length);
				} else if (argType === 'string') {
					var converted = fromCSS(arg);
					type = converted[0];
					components = converted[1];
					if (components.length === 4) {
						alpha = components[3];
						components.length--;
					}
				} else if (argType === 'object') {
					if (arg.constructor === Color) {
						type = arg._type;
						components = arg._components.slice();
						alpha = arg._alpha;
						if (type === 'gradient') {
							for (var i = 1, l = components.length; i < l; i++) {
								var point = components[i];
								if (point)
									components[i] = point.clone();
							}
						}
					} else if (arg.constructor === Gradient) {
						type = 'gradient';
						values = args;
					} else {
						type = 'hue' in arg
							? 'lightness' in arg
								? 'hsl'
								: 'hsb'
							: 'gradient' in arg || 'stops' in arg
									|| 'radial' in arg
								? 'gradient'
								: 'gray' in arg
									? 'gray'
									: 'rgb';
						var properties = types[type],
							parsers = componentParsers[type];
						this._components = components = [];
						for (var i = 0, l = properties.length; i < l; i++) {
							var value = arg[properties[i]];
							if (value == null && !i && type === 'gradient'
									&& 'stops' in arg) {
								value = {
									stops: arg.stops,
									radial: arg.radial
								};
							}
							value = parsers[i].call(this, value);
							if (value != null)
								components[i] = value;
						}
						alpha = arg.alpha;
					}
				}
				if (reading && type)
					read = 1;
			}
			this._type = type || 'rgb';
			if (!components) {
				this._components = components = [];
				var parsers = componentParsers[this._type];
				for (var i = 0, l = parsers.length; i < l; i++) {
					var value = parsers[i].call(this, values && values[i]);
					if (value != null){
						components[i] = value;
						if( type == 'rgb' && value > 1 )  components[i] /= 255.0;
					}
				}
			}
			this._components = components;
			this._properties = types[this._type];
			this._alpha = alpha;
			if (reading)
				this.__read = read;
			return this;
		},

		set: '#initialize',

		_serialize: function(options, dictionary) {
			var components = this.getComponents();
			return Base.serialize(
					/^(gray|rgb)$/.test(this._type)
						? components
						: [this._type].concat(components),
					options, true, dictionary);
		},

		_changed: function() {
			this._canvasStyle = null;
			if (this._owner) {
				if (this._setter) {
					this._owner[this._setter](this);
				} else {
					this._owner._changed(129);
				}
			}
		},

		_convert: function(type) {
			var converter;
			return this._type === type
					? this._components.slice()
					: (converter = converters[this._type + '-' + type])
						? converter.apply(this, this._components)
						: converters['rgb-' + type].apply(this,
							converters[this._type + '-rgb'].apply(this,
								this._components));
		},

		convert: function(type) {
			return new Color(type, this._convert(type), this._alpha);
		},

		getType: function() {
			return this._type;
		},

		setType: function(type) {
			this._components = this._convert(type);
			this._properties = types[type];
			this._type = type;
		},

		getComponents: function() {
			var components = this._components.slice();
			if (this._alpha != null)
				components.push(this._alpha);
			return components;
		},

		getAlpha: function() {
			return this._alpha != null ? this._alpha : 1;
		},

		setAlpha: function(alpha) {
			this._alpha = alpha == null ? null : Math.min(Math.max(alpha, 0), 1);
			this._changed();
		},

		hasAlpha: function() {
			return this._alpha != null;
		},

		equals: function(color) {
			var col = Base.isPlainValue(color, true)
					? Color.read(arguments)
					: color;
			return col === this || col && this._class === col._class
					&& this._type === col._type
					&& this.getAlpha() === col.getAlpha()
					&& Base.equals(this._components, col._components)
					|| false;
		},

		toString: function() {
			var properties = this._properties,
				parts = [],
				isGradient = this._type === 'gradient',
				f = Formatter.instance;
			for (var i = 0, l = properties.length; i < l; i++) {
				var value = this._components[i];
				if (value != null)
					parts.push(properties[i] + ': '
							+ (isGradient ? value : f.number(value)));
			}
			if (this._alpha != null)
				parts.push('alpha: ' + f.number(this._alpha));
			return '{ ' + parts.join(', ') + ' }';
		},

		toCSS: function(hex) {
			var components = this._convert('rgb'),
				alpha = hex || this._alpha == null ? 1 : this._alpha;
			function convert(val) {
				return Math.round((val < 0 ? 0 : val > 1 ? 1 : val) * 255);
			}
			components = [
				convert(components[0]),
				convert(components[1]),
				convert(components[2])
			];
			if (alpha < 1)
				components.push(alpha < 0 ? 0 : alpha);
			return hex
					? '#' + ((1 << 24) + (components[0] << 16)
						+ (components[1] << 8)
						+ components[2]).toString(16).slice(1)
					: (components.length == 4 ? 'rgba(' : 'rgb(')
						+ components.join(',') + ')';
		},

		toCanvasStyle: function(ctx, matrix) {
			if (this._canvasStyle)
				return this._canvasStyle;
			if (this._type !== 'gradient')
				return this._canvasStyle = this.toCSS();
			var components = this._components,
				gradient = components[0],
				stops = gradient._stops,
				origin = components[1],
				destination = components[2],
				highlight = components[3],
				inverse = matrix && matrix.inverted(),
				canvasGradient;
			if (inverse) {
				origin = inverse._transformPoint(origin);
				destination = inverse._transformPoint(destination);
				if (highlight)
					highlight = inverse._transformPoint(highlight);
			}
			if (gradient._radial) {
				var radius = destination.getDistance(origin);
				if (highlight) {
					var vector = highlight.subtract(origin);
					if (vector.getLength() > radius)
						highlight = origin.add(vector.normalize(radius - 0.1));
				}
				var start = highlight || origin;
				canvasGradient = ctx.createRadialGradient(start.x, start.y,
						0, origin.x, origin.y, radius);
			} else {
				canvasGradient = ctx.createLinearGradient(origin.x, origin.y,
						destination.x, destination.y);
			}
			for (var i = 0, l = stops.length; i < l; i++) {
				var stop = stops[i],
					offset = stop._offset;
				canvasGradient.addColorStop(
						offset == null ? i / (l - 1) : offset,
						stop._color.toCanvasStyle());
			}
			return this._canvasStyle = canvasGradient;
		},

		transform: function(matrix) {
			if (this._type === 'gradient') {
				var components = this._components;
				for (var i = 1, l = components.length; i < l; i++) {
					var point = components[i];
					matrix._transformPoint(point, point, true);
				}
				this._changed();
			}
		},

		morphingTo: function(to, progress){
			var r = ( to.red - this.red ) * progress + this.red,
				g = ( to.green - this.green ) * progress + this.green,
				b = ( to.blue - this.blue ) * progress + this.blue,
				a = ( to.alpha - this.alpha ) * progress + this.alpha;
			return new Color(r,g,b,a);
		},

		statics: {
			_types: types,

			random: function() {
				var random = Math.random;
				return new Color(random(), random(), random());
			},

			_setOwner: function(color, owner, setter) {
				if (color) {
					if (color._owner && owner && color._owner !== owner) {
						color = color.clone();
					}
					if (!color._owner ^ !owner) {
						color._owner = owner || null;
						color._setter = setter || null;
					}
				}
				return color;
			}
		}
	});
},
new function() {
	var operators = {
		add: function(a, b) {
			return a + b;
		},

		subtract: function(a, b) {
			return a - b;
		},

		multiply: function(a, b) {
			return a * b;
		},

		divide: function(a, b) {
			return a / b;
		}
	};

	return Base.each(operators, function(operator, name) {
		this[name] = function(color) {
			color = Color.read(arguments);
			var type = this._type,
				components1 = this._components,
				components2 = color._convert(type);
			for (var i = 0, l = components1.length; i < l; i++)
				components2[i] = operator(components1[i], components2[i]);
			return new Color(type, components2,
					this._alpha != null
							? operator(this._alpha, color.getAlpha())
							: null);
		};
	}, {
	});
});

var Gradient = Base.extend({
	_class: 'Gradient',

	initialize: function Gradient(stops, radial) {
		this._id = UID.get();
		if (stops && Base.isPlainObject(stops)) {
			this.set(stops);
			stops = radial = null;
		}
		if (this._stops == null) {
			this.setStops(stops || ['white', 'black']);
		}
		if (this._radial == null) {
			this.setRadial(typeof radial === 'string' && radial === 'radial'
					|| radial || false);
		}
	},

	_serialize: function(options, dictionary) {
		return dictionary.add(this, function() {
			return Base.serialize([this._stops, this._radial],
					options, true, dictionary);
		});
	},

	_changed: function() {
		for (var i = 0, l = this._owners && this._owners.length; i < l; i++) {
			this._owners[i]._changed();
		}
	},

	_addOwner: function(color) {
		if (!this._owners)
			this._owners = [];
		this._owners.push(color);
	},

	_removeOwner: function(color) {
		var index = this._owners ? this._owners.indexOf(color) : -1;
		if (index != -1) {
			this._owners.splice(index, 1);
			if (!this._owners.length)
				this._owners = undefined;
		}
	},

	clone: function() {
		var stops = [];
		for (var i = 0, l = this._stops.length; i < l; i++) {
			stops[i] = this._stops[i].clone();
		}
		return new Gradient(stops, this._radial);
	},

	getStops: function() {
		return this._stops;
	},

	setStops: function(stops) {
		if (stops.length < 2) {
			throw new Error(
					'Gradient stop list needs to contain at least two stops.');
		}
		var _stops = this._stops;
		if (_stops) {
			for (var i = 0, l = _stops.length; i < l; i++)
				_stops[i]._owner = undefined;
		}
		_stops = this._stops = GradientStop.readList(stops, 0, { clone: true });
		for (var i = 0, l = _stops.length; i < l; i++)
			_stops[i]._owner = this;
		this._changed();
	},

	getRadial: function() {
		return this._radial;
	},

	setRadial: function(radial) {
		this._radial = radial;
		this._changed();
	},

	equals: function(gradient) {
		if (gradient === this)
			return true;
		if (gradient && this._class === gradient._class) {
			var stops1 = this._stops,
				stops2 = gradient._stops,
				length = stops1.length;
			if (length === stops2.length) {
				for (var i = 0; i < length; i++) {
					if (!stops1[i].equals(stops2[i]))
						return false;
				}
				return true;
			}
		}
		return false;
	}
});

var GradientStop = Base.extend({
	_class: 'GradientStop',

	initialize: function GradientStop(arg0, arg1) {
		var color = arg0,
			offset = arg1;
		if (typeof arg0 === 'object' && arg1 === undefined) {
			if (Array.isArray(arg0) && typeof arg0[0] !== 'number') {
				color = arg0[0];
				offset = arg0[1];
			} else if ('color' in arg0 || 'offset' in arg0
					|| 'rampPoint' in arg0) {
				color = arg0.color;
				offset = arg0.offset || arg0.rampPoint || 0;
			}
		}
		this.setColor(color);
		this.setOffset(offset);
	},

	clone: function() {
		return new GradientStop(this._color.clone(), this._offset);
	},

	_serialize: function(options, dictionary) {
		var color = this._color,
			offset = this._offset;
		return Base.serialize(offset == null ? [color] : [color, offset],
				options, true, dictionary);
	},

	_changed: function() {
		if (this._owner)
			this._owner._changed(129);
	},

	getOffset: function() {
		return this._offset;
	},

	setOffset: function(offset) {
		this._offset = offset;
		this._changed();
	},

	getRampPoint: '#getOffset',
	setRampPoint: '#setOffset',

	getColor: function() {
		return this._color;
	},

	setColor: function() {
		Color._setOwner(this._color, null);
		this._color = Color._setOwner(Color.read(arguments, 0), this,
				'setColor');
		this._changed();
	},

	equals: function(stop) {
		return stop === this || stop && this._class === stop._class
				&& this._color.equals(stop._color)
				&& this._offset == stop._offset
				|| false;
	}
});

var Style = Base.extend(new function() {
	var itemDefaults = {
		fillColor: null,
		fillRule: 'nonzero',
		strokeColor: null,
		strokeWidth: 1,
		strokeCap: 'butt',
		strokeJoin: 'miter',
		strokeScaling: true,
		miterLimit: 10,
		dashOffset: 0,
		dashArray: [],
		shadowColor: null,
		shadowBlur: 0,
		shadowOffset: new Point(),
		selectedColor: null
	},
	groupDefaults = Base.set({}, itemDefaults, {
		fontFamily: 'sans-serif',
		fontWeight: 'normal',
		fontSize: 18,
		leading: null,
		justification: 'left',
		textBaseline: 'middle'
	}),
	textDefaults = Base.set({}, groupDefaults, {
		fillColor: new Color()
	}),
	layerDefaults = Base.set({}, textDefaults, {
		sceneBgColor: new Color([255,255,255,1])
	}),
	flags = {
		strokeWidth: 193,
		strokeCap: 193,
		strokeJoin: 193,
		strokeScaling: 201,
		miterLimit: 193,
		fontFamily: 9,
		fontWeight: 9,
		fontSize: 9,
		font: 9,
		leading: 9,
		justification: 9,
		textBaseline: 9,
		sceneBgColor: 137,
	},
	item = {
		beans: true
	},
	fields = {
		_class: 'Style',
		beans: true,

		initialize: function Style(style, _owner, _project) {
			this._values = {};
			this._owner = _owner;
			this._project = _owner && _owner._project || _project
					|| mpaper.project;
			this._defaults = !_owner || _owner instanceof Group ? (!_owner || _owner instanceof Layer? layerDefaults:groupDefaults)
					: _owner instanceof TextItem ? textDefaults
					: itemDefaults;
			if (style)
				this.set(style);
		}
	};

	Base.each(layerDefaults, function(value, key) {
		var isColor = /Color$/.test(key),
			isPoint = key === 'shadowOffset',
			part = Base.capitalize(key),
			flag = flags[key],
			set = 'set' + part,
			get = 'get' + part;

		fields[set] = function(value) {
			var owner = this._owner,
				children = owner && owner._children,
				applyToChildren = children && children.length > 0
					&& !(owner instanceof CompoundPath);
			if (applyToChildren) {
				for (var i = 0, l = children.length; i < l; i++)
					children[i]._style[set](value);
			}
			if ((key === 'selectedColor' || !applyToChildren)
					&& key in this._defaults) {
				var old = this._values[key];
				if (old !== value) {
					if (isColor) {
						if (old) {
							Color._setOwner(old, null);
							old._canvasStyle = null;
						}
						if (value && value.constructor === Color) {
							value = Color._setOwner(value, owner,
									applyToChildren && set);
						}
					}
					this._values[key] = value;
					if (owner)
						owner._changed(flag || 129);
				}
			}
		};

		fields[get] = function(_dontMerge) {
			var owner = this._owner,
				children = owner && owner._children,
				applyToChildren = children && children.length > 0
					&& !(owner instanceof CompoundPath),
				value;
			if (applyToChildren && !_dontMerge) {
				for (var i = 0, l = children.length; i < l; i++) {
					var childValue = children[i]._style[get]();
					if (!i) {
						value = childValue;
					} else if (!Base.equals(value, childValue)) {
						return undefined;
					}
				}
			} else if (key in this._defaults) {
				var value = this._values[key];
				if (value === undefined) {
					value = this._defaults[key];
					if (value && value.clone) {
						value = value.clone();
					}
				} else {
					var ctor = isColor ? Color : isPoint ? Point : null;
					if (ctor && !(value && value.constructor === ctor)) {
						this._values[key] = value = ctor.read([value], 0,
								{ readNull: true, clone: true });
					}
				}
			}
			if (value && isColor) {
				value = Color._setOwner(value, owner, applyToChildren && set);
			}
			return value;
		};

		item[get] = function(_dontMerge) {
			return this._style[get](_dontMerge);
		};

		item[set] = function(value) {
			this._style[set](value);
		};
	});

	Base.each({
		Font: 'FontFamily',
		WindingRule: 'FillRule'
	}, function(value, key) {
		var get = 'get' + key,
			set = 'set' + key;
		fields[get] = item[get] = '#get' + value;
		fields[set] = item[set] = '#set' + value;
	});

	Item.inject(item);
	return fields;
}, {
	set: function(style) {
		var isStyle = style instanceof Style,
			values = isStyle ? style._values : style;
		if (values) {
			for (var key in values) {
				if (key in this._defaults) {
					var value = values[key];
					this[key] = value && isStyle && value.clone
							? value.clone() : value;
				}
			}
		}
	},

	equals: function(style) {
		function compare(style1, style2, secondary) {
			var values1 = style1._values,
				values2 = style2._values,
				defaults2 = style2._defaults;
			for (var key in values1) {
				var value1 = values1[key],
					value2 = values2[key];
				if (!(secondary && key in values2) && !Base.equals(value1,
						value2 === undefined ? defaults2[key] : value2))
					return false;
			}
			return true;
		}

		return style === this || style && this._class === style._class
				&& compare(this, style)
				&& compare(style, this, true)
				|| false;
	},

	_dispose: function() {
		var color;
		color = this.getFillColor();
		if (color) color._canvasStyle = null;
		color = this.getStrokeColor();
		if (color) color._canvasStyle = null;
		color = this.getShadowColor();
		if (color) color._canvasStyle = null;
	},

	hasFill: function() {
		var color = this.getFillColor();
		return !!color && color.alpha > 0;
	},

	hasStroke: function() {
		var color = this.getStrokeColor();
		return !!color && color.alpha > 0 && this.getStrokeWidth() > 0;
	},

	hasShadow: function() {
		var color = this.getShadowColor();
		return !!color && color.alpha > 0 && (this.getShadowBlur() > 0
				|| !this.getShadowOffset().isZero());
	},

	getView: function() {
		return this._project._view;
	},

	getFontStyle: function() {
		var fontSize = this.getFontSize();
		return this.getFontWeight()
				+ ' ' + fontSize + (/[a-z]/i.test(fontSize + '') ? ' ' : 'px ')
				+ this.getFontFamily();
	},

	getFont: '#getFontFamily',
	setFont: '#setFontFamily',

	getLeading: function getLeading() {
		var leading = getLeading.base.call(this),
			fontSize = this.getFontSize();
		if (/pt|em|%|px/.test(fontSize))
			fontSize = this.getView().getPixelSize(fontSize);
		return leading != null ? leading : fontSize * 1.2;
	}

});
Style.inject({ statics: new function() {
	var name2style =  {
		'dark' : {
			sceneBgColor: 'rgba(0,0,0,1)',
			strokeColor: 'rgba(255,255,255,1)',
			fillColor: 'rgba( 255,255,255,1)',
			pointColor: 'rgba( 255,0,0,1)',
			textColor: 'rgba( 255,255,255,1)',
			correctColor : 'rgba(0,173,0,1)',
			wrongColor: 'rgba( 255,36,36,1)',
			bgColor1: 'rgba( 80,179,226,0.5)',
			bgColor2: 'rgba( 128,236,85,0.5)',
			color1: 'rgba( 80,179,226,1)',
			color2: 'rgba( 128,236,85,1)',
			color3: 'rgba( 0,221,225,0.6)',
		},
		'light' : {
			sceneBgColor: 'rgba( 255,255,255,1)',
			strokeColor: 'rgba( 0,0,0,1)',
			fillColor: 'rgba( 0,0,0,1)',
			pointColor: 'rgba( 255,0,0,1)',
			textColor: 'rgba( 51,93,148,1)',
			correctColor : 'rgba(0,173,0,1)',
			wrongColor: 'rgba( 255,36,36,1)',
			bgColor1: 'rgba( 22,22,22,1)',
			bgColor2: 'rgba( 128,236,85,1)',
			color1: 'rgba( 79,138,216,0.8)',
			color2: 'rgba( 79,138,216,0.8)',
			color3: 'rgba( 79,138,216,0.8)',
		},
	};
	return {
		getBuiltinStyle: function(styleName, project) {
			var s = name2style[styleName];
			if( s ){
				return new Style( s, null, project)
			}
			return null;
		},
		getBuiltinColors: function(styleName, project) {
			return name2style[styleName];
		},
	};
}});

var DomElement = new function() {
	function handlePrefix(el, name, set, value) {
		var prefixes = ['', 'webkit', 'moz', 'Moz', 'ms', 'o'],
			suffix = name[0].toUpperCase() + name.substring(1);
		for (var i = 0; i < 6; i++) {
			var prefix = prefixes[i],
				key = prefix ? prefix + suffix : name;
			if (key in el) {
				if (set) {
					el[key] = value;
				} else {
					return el[key];
				}
				break;
			}
		}
	}

	return {
		getStyles: function(el) {
			var doc = el && el.nodeType !== 9 ? el.ownerDocument : el,
				view = doc && doc.defaultView;
			return view && view.getComputedStyle(el, '');
		},

		getBounds: function(el, viewport) {
			var doc = el.ownerDocument,
				body = doc.body,
				html = doc.documentElement,
				rect;
			try {
				rect = el.getBoundingClientRect();
			} catch (e) {
				rect = { left: 0, top: 0, width: 0, height: 0 };
			}
			var x = rect.left - (html.clientLeft || body.clientLeft || 0),
				y = rect.top - (html.clientTop || body.clientTop || 0);
			if (!viewport) {
				var view = doc.defaultView;
				x += view.pageXOffset || html.scrollLeft || body.scrollLeft;
				y += view.pageYOffset || html.scrollTop || body.scrollTop;
			}
			return new Rectangle(x, y, rect.width, rect.height);
		},

		getViewportBounds: function(el) {
			var doc = el.ownerDocument,
				view = doc.defaultView,
				html = doc.documentElement;
			return new Rectangle(0, 0,
				view.innerWidth || html.clientWidth,
				view.innerHeight || html.clientHeight
			);
		},

		getOffset: function(el, viewport) {
			return DomElement.getBounds(el, viewport).getPoint();
		},

		getSize: function(el) {
			return DomElement.getBounds(el, true).getSize();
		},

		isInvisible: function(el) {
			return DomElement.getSize(el).equals(new Size(0, 0));
		},

		isInView: function(el) {
			return !DomElement.isInvisible(el)
					&& DomElement.getViewportBounds(el).intersects(
						DomElement.getBounds(el, true));
		},

		isInserted: function(el) {
			return document.body.contains(el);
		},

		getPrefixed: function(el, name) {
			return el && handlePrefix(el, name);
		},

		setPrefixed: function(el, name, value) {
			if (typeof name === 'object') {
				for (var key in name)
					handlePrefix(el, key, true, name[key]);
			} else {
				handlePrefix(el, name, true, value);
			}
		}
	};
};

var DomEvent = {
	add: function(el, events) {
		if (el) {
			for (var type in events) {
				var func = events[type],
					parts = type.split(/[\s,]+/g);
				for (var i = 0, l = parts.length; i < l; i++) {
					var name = parts[i];
					var options = (
						el === document
						&& (name === 'touchstart' || name === 'touchmove')
					) ? { passive: false } : false;
					el.addEventListener(name, func, options);
				}
			}
		}
	},

	remove: function(el, events) {
		if (el) {
			for (var type in events) {
				var func = events[type],
					parts = type.split(/[\s,]+/g);
				for (var i = 0, l = parts.length; i < l; i++)
					el.removeEventListener(parts[i], func, false);
			}
		}
	},

	getPoint: function(event) {
		var pos = event.targetTouches
				? event.targetTouches.length
					? event.targetTouches[0]
					: event.changedTouches[0]
				: event;
		return new Point(
			pos.pageX || pos.clientX + document.documentElement.scrollLeft,
			pos.pageY || pos.clientY + document.documentElement.scrollTop
		);
	},

	getTarget: function(event) {
		return event.target || event.srcElement;
	},

	getRelatedTarget: function(event) {
		return event.relatedTarget || event.toElement;
	},

	getOffset: function(event, target) {
		return DomEvent.getPoint(event).subtract(DomElement.getOffset(
				target || DomEvent.getTarget(event)));
	}
};

DomEvent.requestAnimationFrame = new function() {
	var nativeRequest = DomElement.getPrefixed(window, 'requestAnimationFrame'),
		requested = false,
		callbacks = [],
		timer;

	function handleCallbacks() {
		var functions = callbacks;
		callbacks = [];
		for (var i = 0, l = functions.length; i < l; i++)
			functions[i]();
		requested = nativeRequest && callbacks.length;
		if (requested)
			nativeRequest(handleCallbacks);
	}

	return function(callback) {
		callbacks.push(callback);
		if (nativeRequest) {
			if (!requested) {
				nativeRequest(handleCallbacks);
				requested = true;
			}
		} else if (!timer) {
			timer = setInterval(handleCallbacks, 1000 / 60);
		}
	};
};

var View = Base.extend(Emitter, {
	_class: 'View',

	initialize: function View(project, element) {

		function getSize(name) {
			return element[name] || parseInt(element.getAttribute(name), 10);
		}

		function getCanvasSize() {
			var size = DomElement.getSize(element);
			return size.isNaN() || size.isZero()
					? new Size(getSize('width'), getSize('height'))
					: size;
		}

		var size;
		if (window && element) {
			this._id = element.getAttribute('id');
			if (this._id == null)
				element.setAttribute('id', this._id = 'mpaper-view-' + View._id++);
			DomEvent.add(element, this._viewEvents);
			var none = 'none';
			DomElement.setPrefixed(element.style, {
				userDrag: none,
				userSelect: none,
				touchCallout: none,
				contentZooming: none,
				tapHighlightColor: 'rgba(0,0,0,0)'
			});

			if (PaperScope.hasAttribute(element, 'resize')) {
				var that = this;
				DomEvent.add(window, this._windowEvents = {
					resize: function() {
						that.setViewSize(getCanvasSize());
					}
				});
			}

			size = getCanvasSize();

			if (PaperScope.hasAttribute(element, 'stats')
					&& typeof Stats !== 'undefined') {
				this._stats = new Stats();
				var stats = this._stats.domElement,
					style = stats.style,
					offset = DomElement.getOffset(element);
				style.position = 'absolute';
				style.left = offset.x + 'px';
				style.top = offset.y + 'px';
				document.body.appendChild(stats);
			}
		} else {
			size = new Size(element);
			element = null;
		}
		this._project = project;
		this._scope = project._scope;
		this._element = element;
		if (!this._pixelRatio)
			this._pixelRatio = window && window.devicePixelRatio || 1;
		this._setElementSize(size.width, size.height);
		this._viewSize = size;
		View._views.push(this);
		View._viewsById[this._id] = this;
		(this._matrix = new Matrix())._owner = this;
		if (!View._focused)
			View._focused = this;
		this._frameItems = {};
		this._frameItemCount = 0;
		this._itemEvents = { native: {}, virtual: {} };
		this._autoUpdate = !mpaper.agent.node;
		this._needsUpdate = false;
	},

	remove: function() {
		if (!this._project)
			return false;
		if (View._focused === this)
			View._focused = null;
		View._views.splice(View._views.indexOf(this), 1);
		delete View._viewsById[this._id];
		var project = this._project;
		if (project._view === this)
			project._view = null;
		DomEvent.remove(this._element, this._viewEvents);
		DomEvent.remove(window, this._windowEvents);
		this._element = this._project = null;
		this.off('frame');
		this._animate = false;
		this._frameItems = {};
		return true;
	},

	_events: Base.each(
		Item._itemHandlers.concat(['onResize', 'onKeyDown', 'onKeyUp']),
		function(name) {
			this[name] = {};
		}, {
			onFrame: {
				install: function() {
					this.play();
				},
				uninstall: function() {
					this.pause();
				}
			}
		}
	),

	_animate: false,
	_time: 0,
	_count: 0,

	getAutoUpdate: function() {
		return this._autoUpdate;
	},

	setAutoUpdate: function(autoUpdate) {
		this._autoUpdate = autoUpdate;
		if (autoUpdate)
			this.requestUpdate();
	},

	update: function() {
	},

	draw: function() {
		this.update();
	},

	requestUpdate: function() {
		if (!this._requested) {
			var that = this;
			anime.engine(function() {
				that._requested = false;
				if (that._animate) {
					that.requestUpdate();
					var element = that._element;
					if ((!DomElement.getPrefixed(document, 'hidden')
							|| PaperScope.getAttribute(element, 'keepalive')
								=== 'true') && DomElement.isInView(element)) {
						that._handleFrame();
					}
				}
				if (that._autoUpdate)
					that.update();
			});
			this._requested = true;
		}
	},

	play: function() {
		this._animate = true;
		this.requestUpdate();
	},

	pause: function() {
		this._animate = false;
		this._last = 0;
	},

	_handleFrame: function() {
		mpaper = this._scope;
		var now = Date.now() / 1000,
			delta = this._last ? now - this._last : 0;
		this._last = now;
		this.emit('frame', new Base({
			delta: delta,
			time: this._time += delta,
			count: this._count++
		}));
		if (this._stats)
			this._stats.update();
	},

	_animateItem: function(item, animate) {
		var items = this._frameItems;
		if (animate) {
			items[item._id] = {
				item: item,
				time: 0,
				count: 0
			};
			if (++this._frameItemCount === 1)
				this.on('frame', this._handleFrameItems);
		} else {
			delete items[item._id];
			if (--this._frameItemCount === 0) {
				this.off('frame', this._handleFrameItems);
			}
		}
	},

	_handleFrameItems: function(event) {
		for (var i in this._frameItems) {
			var entry = this._frameItems[i];
			entry.item.emit('frame', new Base(event, {
				time: entry.time += event.delta,
				count: entry.count++
			}));
		}
	},

	_changed: function() {
		this._project._changed(4097);
		this._bounds = this._decomposed = undefined;
	},

	getElement: function() {
		return this._element;
	},

	getPixelRatio: function() {
		return this._pixelRatio;
	},

	getResolution: function() {
		return this._pixelRatio * 72;
	},

	getViewSize: function() {
		var size = this._viewSize;
		return new LinkedSize(size.width, size.height, this, 'setViewSize');
	},

	setViewSize: function() {
		var size = Size.read(arguments),
			delta = size.subtract(this._viewSize);
		if (delta.isZero())
			return;
		this._setElementSize(size.width, size.height);
		this._viewSize.set(size);
		this._changed();
		this.emit('resize', { size: size, delta: delta });
		if (this._autoUpdate) {
			this.update();
		}
	},

	_setElementSize: function(width, height) {
		var element = this._element;
		if (element) {
			if (element.width !== width)
				element.width = width;
			if (element.height !== height)
				element.height = height;
		}
	},

	getBounds: function() {
		if (!this._bounds)
			this._bounds = this._matrix.inverted()._transformBounds(
					new Rectangle(new Point(), this._viewSize));
		return this._bounds;
	},

	getSize: function() {
		return this.getBounds().getSize();
	},

	isVisible: function() {
		return DomElement.isInView(this._element);
	},

	isInserted: function() {
		return DomElement.isInserted(this._element);
	},

	getPixelSize: function(size) {
		var element = this._element,
			pixels;
		if (element) {
			var parent = element.parentNode,
				temp = document.createElement('div');
			temp.style.fontSize = size;
			parent.appendChild(temp);
			pixels = parseFloat(DomElement.getStyles(temp).fontSize);
			parent.removeChild(temp);
		} else {
			pixels = parseFloat(pixels);
		}
		return pixels;
	},

	getTextWidth: function(font, lines) {
		return 0;
	}
}, Base.each(['rotate', 'scale', 'shear', 'skew'], function(key) {
	var rotate = key === 'rotate';
	this[key] = function() {
		var args = arguments,
			value = (rotate ? Base : Point).read(args),
			center = Point.read(args, 0, { readNull: true });
		return this.transform(new Matrix()[key](value,
				center || this.getCenter(true)));
	};
}, {
	_decompose: function() {
		return this._decomposed || (this._decomposed = this._matrix.decompose());
	},

	translate: function() {
		var mx = new Matrix();
		return this.transform(mx.translate.apply(mx, arguments));
	},

	getCenter: function() {
		return this.getBounds().getCenter();
	},

	setCenter: function() {
		var center = Point.read(arguments);
		this.translate(this.getCenter().subtract(center));
	},

	getZoom: function() {
		var scaling = this._decompose().scaling;
		return (scaling.x + scaling.y) / 2;
	},

	setZoom: function(zoom) {
		this.transform(new Matrix().scale(zoom / this.getZoom(),
			this.getCenter()));
	},

	getRotation: function() {
		return this._decompose().rotation;
	},

	setRotation: function(rotation) {
		var current = this.getRotation();
		if (current != null && rotation != null) {
			this.rotate(rotation - current);
		}
	},

	getScaling: function() {
		var scaling = this._decompose().scaling;
		return new LinkedPoint(scaling.x, scaling.y, this, 'setScaling');
	},

	setScaling: function() {
		var current = this.getScaling(),
			scaling = Point.read(arguments, 0, { clone: true, readNull: true });
		if (current && scaling) {
			this.scale(scaling.x / current.x, scaling.y / current.y);
		}
	},

	getMatrix: function() {
		return this._matrix;
	},

	setMatrix: function() {
		var matrix = this._matrix;
		matrix.set.apply(matrix, arguments);
	},

	transform: function(matrix) {
		this._matrix.append(matrix);
	},

	scrollBy: function() {
		this.translate(Point.read(arguments).negate());
	}
}), {

	projectToView: function() {
		return this._matrix._transformPoint(Point.read(arguments));
	},

	viewToProject: function() {
		return this._matrix._inverseTransform(Point.read(arguments));
	},

	getEventPoint: function(event) {
		return this.viewToProject(DomEvent.getOffset(event, this._element));
	},

}, {
	statics: {
		_views: [],
		_viewsById: {},
		_id: 0,

		create: function(project, element) {
			if (document && typeof element === 'string')
				element = document.getElementById(element);
			var ctor = window ? CanvasView : View;
			return new ctor(project, element);
		}
	}
},
new function() {
	if (!window)
		return;
	var prevFocus,
		tempFocus,
		dragging = false,
		mouseDown = false;

	function getView(event) {
		var target = DomEvent.getTarget(event);
		return target.getAttribute && View._viewsById[
				target.getAttribute('id')];
	}

	function updateFocus() {
		var view = View._focused;
		if (!view || !view.isVisible()) {
			for (var i = 0, l = View._views.length; i < l; i++) {
				if ((view = View._views[i]).isVisible()) {
					View._focused = tempFocus = view;
					break;
				}
			}
		}
	}

	function handleMouseMove(view, event, point) {
		view._handleMouseEvent('mousemove', event, point);
	}

	var navigator = window.navigator,
		mousedown, mousemove, mouseup;
	if (navigator.pointerEnabled || navigator.msPointerEnabled) {
		mousedown = 'pointerdown MSPointerDown';
		mousemove = 'pointermove MSPointerMove';
		mouseup = 'pointerup pointercancel MSPointerUp MSPointerCancel';
	} else {
		mousedown = 'touchstart';
		mousemove = 'touchmove';
		mouseup = 'touchend touchcancel';
		if (!('ontouchstart' in window && navigator.userAgent.match(
				/mobile|tablet|ip(ad|hone|od)|android|silk/i))) {
			mousedown += ' mousedown';
			mousemove += ' mousemove';
			mouseup += ' mouseup';
		}
	}

	var viewEvents = {},
		docEvents = {
			mouseout: function(event) {
				var view = View._focused,
					target = DomEvent.getRelatedTarget(event);
				if (view && (!target || target.nodeName === 'HTML')) {
					var offset = DomEvent.getOffset(event, view._element),
						x = offset.x,
						abs = Math.abs,
						ax = abs(x),
						max = 1 << 25,
						diff = ax - max;
					offset.x = abs(diff) < ax ? diff * (x < 0 ? -1 : 1) : x;
					handleMouseMove(view, event, view.viewToProject(offset));
				}
			},

			scroll: updateFocus
		};

	viewEvents[mousedown] = function(event) {
		var view = View._focused = getView(event);
		if (!dragging) {
			dragging = true;
			view._handleMouseEvent('mousedown', event);
		}
	};

	docEvents[mousemove] = function(event) {
		var view = View._focused;
		if (!mouseDown) {
			var target = getView(event);
			if (target) {
				if (view !== target) {
					if (view)
						handleMouseMove(view, event);
					if (!prevFocus)
						prevFocus = view;
					view = View._focused = tempFocus = target;
				}
			} else if (tempFocus && tempFocus === view) {
				if (prevFocus && !prevFocus.isInserted())
					prevFocus = null;
				view = View._focused = prevFocus;
				prevFocus = null;
				updateFocus();
			}
		}
		if (view)
			handleMouseMove(view, event);
	};

	docEvents[mousedown] = function() {
		mouseDown = true;
	};

	docEvents[mouseup] = function(event) {
		var view = View._focused;
		if (view && dragging)
			view._handleMouseEvent('mouseup', event);
		mouseDown = dragging = false;
	};

	DomEvent.add(document, docEvents);

	DomEvent.add(window, {
		load: updateFocus
	});

	var called = false,
		prevented = false,
		fallbacks = {
			doubleclick: 'click',
			mousedrag: 'mousemove'
		},
		wasInView = false,
		overView,
		downPoint,
		lastPoint,
		downItem,
		overItem,
		dragItem,
		clickItem,
		clickTime,
		dblClick;

	function emitMouseEvent(obj, target, type, event, point, prevPoint,
			stopItem) {
		var stopped = false,
			mouseEvent;

		function emit(obj, type) {
			if(  type == 'mousedrag'  ) {
				if(   dragItem == obj  ) {
				   if(  point && prevPoint ){
						if( obj instanceof Item && obj.draggable ){
							var dif = point.subtract(prevPoint);
							obj.position  =  obj.position.__add(dif);
							return true;
						}
					}
				}
			}

			if (obj.responds(type)) {
				if (!mouseEvent) {
					mouseEvent = new MouseEvent(type, event, point,
							target || obj,
							prevPoint ? point.subtract(prevPoint) : null);
				}
				if (obj.emit(type, mouseEvent)) {
					called = true;
					if (mouseEvent.prevented)
						prevented = true;
					if (mouseEvent.stopped)
						return stopped = true;
				}
			} else {
				var fallback = fallbacks[type];
				if (fallback)
					return emit(obj, fallback);
			}
		}

		while (obj && obj !== stopItem) {
			if (emit(obj, type))
				break;
			obj = obj._parent;
		}
		return stopped;
	}

	function emitMouseEvents(view, hitItem, type, event, point, prevPoint) {
		view._project.removeOn(type);
		prevented = called = false;
		return (dragItem && emitMouseEvent(dragItem, null, type, event,
					point, prevPoint)
			|| hitItem && hitItem !== dragItem
				&& !hitItem.isDescendant(dragItem)
				&& emitMouseEvent(hitItem, null, type === 'mousedrag' ?
					'mousemove' : type, event, point, prevPoint, dragItem)
			|| emitMouseEvent(view, dragItem || hitItem || view, type, event,
					point, prevPoint));
	}

	var itemEventsMap = {
		mousedown: {
			mousedown: 1,
			mousedrag: 1,
			click: 1,
			doubleclick: 1
		},
		mouseup: {
			mouseup: 1,
			mousedrag: 1,
			click: 1,
			doubleclick: 1
		},
		mousemove: {
			mousedrag: 1,
			mousemove: 1,
			mouseenter: 1,
			mouseleave: 1
		}
	};

	return {
		_viewEvents: viewEvents,

		_handleMouseEvent: function(type, event, point) {
			var itemEvents = this._itemEvents,
				hitItems = itemEvents.native[type],
				nativeMove = type === 'mousemove',
				tool = this._scope.tool,
				view = this;

			function responds(type) {
				return itemEvents.virtual[type] || view.responds(type)
						|| tool && tool.responds(type);
			}

			if (nativeMove && dragging )
				type = 'mousedrag';
			if (!point)
				point = this.getEventPoint(event);

			var inView = this.getBounds().contains(point),
				hit = (hitItems || type == 'mousedrag') && inView && view._project.hitTest(point, {
					tolerance: 0,
					fill: true,
					stroke: true
				}),
				hitItem = hit && hit.item || null,
				handle = false,
				mouse = {};
			mouse[type.substr(5)] = true;

			if (hitItems && hitItem !== overItem) {
				if (overItem) {
					emitMouseEvent(overItem, null, 'mouseleave', event, point);
				}
				if (hitItem) {
					emitMouseEvent(hitItem, null, 'mouseenter', event, point);
				}
				overItem = hitItem;
			}
			if (wasInView ^ inView) {
				emitMouseEvent(this, null, inView ? 'mouseenter' : 'mouseleave',
						event, point);
				overView = inView ? this : null;
				handle = true;
			}
			if ((inView || mouse.drag) && !point.equals(lastPoint)) {
				emitMouseEvents(this, hitItem, nativeMove ? type : 'mousemove',
						event, point, lastPoint);
				handle = true;
			}
			wasInView = inView;
			if (  mouse.drag && inView ){
				dblClick = hitItem === clickItem
					&& (Date.now() - clickTime < 300);
				downItem = clickItem = hitItem;

				if (!prevented && hitItem) {
					if( hitItem instanceof Item && hitItem.draggable )
						dragItem = hitItem;
				}
				downPoint = point;
				emitMouseEvents(this, hitItem, type, event, point, downPoint);
			}
			else if (   mouse.down && inView || mouse.up && downPoint) {
				emitMouseEvents(this, hitItem, type, event, point, downPoint);
				if (mouse.down || mouse.drag) {
					dblClick = hitItem === clickItem
						&& (Date.now() - clickTime < 300);
					downItem = clickItem = hitItem;

					if (!prevented && hitItem) {
						var item = hitItem;
						while (item && !item.responds('mousedrag'))
						   item = item._parent;
						if (item)
						   dragItem = hitItem;
					}
					downPoint = point;
				} else if (mouse.up) {
					if (!prevented && hitItem === downItem) {
						clickTime = Date.now();
						emitMouseEvents(this, hitItem, dblClick ? 'doubleclick'
								: 'click', event, point, downPoint);
						dblClick = false;
					}
					downItem = dragItem = null;
				}
				wasInView = false;
				handle = true;
			}
			lastPoint = point;
			if (handle && tool) {
				called = tool._handleMouseEvent(type, event, point, mouse)
					|| called;
			}

			if (
				event.cancelable !== false
				&& (called && !mouse.move || mouse.down && responds('mouseup'))
			) {
				event.preventDefault();
			}
		},

		_handleKeyEvent: function(type, event, key, character) {
			var scope = this._scope,
				tool = scope.tool,
				keyEvent;

			function emit(obj) {
				if (obj.responds(type)) {
					mpaper = scope;
					obj.emit(type, keyEvent = keyEvent
							|| new KeyEvent(type, event, key, character));
				}
			}

			if (this.isVisible()) {
				emit(this);
				if (tool && tool.responds(type))
					emit(tool);
			}
		},

		_countItemEvent: function(type, sign) {
			var itemEvents = this._itemEvents,
				native = itemEvents.native,
				virtual = itemEvents.virtual;
			for (var key in itemEventsMap) {
				native[key] = (native[key] || 0)
						+ (itemEventsMap[key][type] || 0) * sign;
			}
			virtual[type] = (virtual[type] || 0) + sign;
		},

		statics: {
			updateFocus: updateFocus,

			_resetState: function() {
				dragging = mouseDown = called = wasInView = false;
				prevFocus = tempFocus = overView = downPoint = lastPoint =
					downItem = overItem = dragItem = clickItem = clickTime =
					dblClick = null;
			}
		}
	};
});

var CanvasView = View.extend({
	_class: 'CanvasView',

	initialize: function CanvasView(project, canvas) {
		if (!(canvas instanceof window.HTMLCanvasElement)) {
			var size = Size.read(arguments, 1);
			if (size.isZero())
				throw new Error(
						'Cannot create CanvasView with the provided argument: '
						+ Base.slice(arguments, 1));
			canvas = CanvasProvider.getCanvas(size);
		}
		var ctx = this._context = canvas.getContext('2d');
		ctx.save();
		this._pixelRatio = 1;
		if (!/^off|false$/.test(PaperScope.getAttribute(canvas, 'hidpi'))) {
			var deviceRatio = window.devicePixelRatio || 1,
				backingStoreRatio = DomElement.getPrefixed(ctx,
						'backingStorePixelRatio') || 1;
			this._pixelRatio = deviceRatio / backingStoreRatio;
		}
		View.call(this, project, canvas);
		this._needsUpdate = true;
	},

	remove: function remove() {
		this._context.restore();
		return remove.base.call(this);
	},

	_setElementSize: function _setElementSize(width, height) {
		var pixelRatio = this._pixelRatio;
		_setElementSize.base.call(this, width * pixelRatio, height * pixelRatio);
		if (pixelRatio !== 1) {
			var element = this._element,
				ctx = this._context;
			if (!PaperScope.hasAttribute(element, 'resize')) {
				var style = element.style;
				style.width = width + 'px';
				style.height = height + 'px';
			}
			ctx.restore();
			ctx.save();
			ctx.scale(pixelRatio, pixelRatio);
		}
	},

	getContext: function() {
		return this._context;
	},

	getPixelSize: function getPixelSize(size) {
		var agent = mpaper.agent,
			pixels;
		if (agent && agent.firefox) {
			pixels = getPixelSize.base.call(this, size);
		} else {
			var ctx = this._context,
				prevFont = ctx.font;
			ctx.font = size + ' serif';
			pixels = parseFloat(ctx.font);
			ctx.font = prevFont;
		}
		return pixels;
	},

	getTextWidth: function(font, lines) {
		var ctx = this._context,
			prevFont = ctx.font,
			width = 0;
		ctx.font = font;
		for (var i = 0, l = lines.length; i < l; i++)
			width = Math.max(width, ctx.measureText(lines[i]).width);
		ctx.font = prevFont;
		return width;
	},
	getOneLineTextWidth: function(font, line ) {
		var ctx = this._context,
			prevFont = ctx.font,
			width = 0;
		if( font )
			ctx.font = font;
		 width = Math.max(width, ctx.measureText(line).width);
		ctx.font = prevFont;
		return width;
	},
	update: function() {
		if (!this._needsUpdate)
			return false;
		var project = this._project,
			ctx = this._context,
			size = this._viewSize;
		ctx.clearRect(0, 0, size.width + 1, size.height + 1);
		if (project)
			project.draw(ctx, this._matrix, this._pixelRatio);
		this._needsUpdate = false;
		return true;
	}
});

var Event = Base.extend({
	_class: 'Event',

	initialize: function Event(event) {
		this.event = event;
		this.type = event && event.type;
	},

	prevented: false,
	stopped: false,

	preventDefault: function() {
		this.prevented = true;
		this.event.preventDefault();
	},

	stopPropagation: function() {
		this.stopped = true;
		this.event.stopPropagation();
	},

	stop: function() {
		this.stopPropagation();
		this.preventDefault();
	},

	getTimeStamp: function() {
		return this.event.timeStamp;
	},

	getModifiers: function() {
		return Key.modifiers;
	}
});

var KeyEvent = Event.extend({
	_class: 'KeyEvent',

	initialize: function KeyEvent(type, event, key, character) {
		this.type = type;
		this.event = event;
		this.key = key;
		this.character = character;
	},

	toString: function() {
		return "{ type: '" + this.type
				+ "', key: '" + this.key
				+ "', character: '" + this.character
				+ "', modifiers: " + this.getModifiers()
				+ " }";
	}
});

var Key = new function() {
	var keyLookup = {
			'\t': 'tab',
			' ': 'space',
			'\b': 'backspace',
			'\x7f': 'delete',
			'Spacebar': 'space',
			'Del': 'delete',
			'Win': 'meta',
			'Esc': 'escape'
		},

		charLookup = {
			'tab': '\t',
			'space': ' ',
			'enter': '\r'
		},

		keyMap = {},
		charMap = {},
		metaFixMap,
		downKey,

		modifiers = new Base({
			shift: false,
			control: false,
			alt: false,
			meta: false,
			capsLock: false,
			space: false
		}).inject({
			option: {
				get: function() {
					return this.alt;
				}
			},

			command: {
				get: function() {
					var agent = mpaper && mpaper.agent;
					return agent && agent.mac ? this.meta : this.control;
				}
			}
		});

	function getKey(event) {
		var key = event.key || event.keyIdentifier;
		key = /^U\+/.test(key)
				? String.fromCharCode(parseInt(key.substr(2), 16))
				: /^Arrow[A-Z]/.test(key) ? key.substr(5)
				: key === 'Unidentified'  || key === undefined
					? String.fromCharCode(event.keyCode)
					: key;
		return keyLookup[key] ||
				(key.length > 1 ? Base.hyphenate(key) : key.toLowerCase());
	}

	function handleKey(down, key, character, event) {
		var type = down ? 'keydown' : 'keyup',
			view = View._focused,
			name;
		keyMap[key] = down;
		if (down) {
			charMap[key] = character;
		} else {
			delete charMap[key];
		}
		if (key.length > 1 && (name = Base.camelize(key)) in modifiers) {
			modifiers[name] = down;
			var agent = mpaper && mpaper.agent;
			if (name === 'meta' && agent && agent.mac) {
				if (down) {
					metaFixMap = {};
				} else {
					for (var k in metaFixMap) {
						if (k in charMap)
							handleKey(false, k, metaFixMap[k], event);
					}
					metaFixMap = null;
				}
			}
		} else if (down && metaFixMap) {
			metaFixMap[key] = character;
		}
		if (view) {
			view._handleKeyEvent(down ? 'keydown' : 'keyup', event, key,
					character);
		}
	}

	DomEvent.add(document, {
		keydown: function(event) {
			var key = getKey(event),
				agent = mpaper && mpaper.agent;
			if (key.length > 1 || agent && (agent.chrome && (event.altKey
						|| agent.mac && event.metaKey
						|| !agent.mac && event.ctrlKey))) {
				handleKey(true, key,
						charLookup[key] || (key.length > 1 ? '' : key), event);
			} else {
				downKey = key;
			}
		},

		keypress: function(event) {
			if (downKey) {
				var key = getKey(event),
					code = event.charCode,
					character = code >= 32 ? String.fromCharCode(code)
						: key.length > 1 ? '' : key;
				if (key !== downKey) {
					key = character.toLowerCase();
				}
				handleKey(true, key, character, event);
				downKey = null;
			}
		},

		keyup: function(event) {
			var key = getKey(event);
			if (key in charMap)
				handleKey(false, key, charMap[key], event);
		}
	});

	DomEvent.add(window, {
		blur: function(event) {
			for (var key in charMap)
				handleKey(false, key, charMap[key], event);
		}
	});

	return {
		modifiers: modifiers,

		isDown: function(key) {
			return !!keyMap[key];
		}
	};
};

var MouseEvent = Event.extend({
	_class: 'MouseEvent',

	initialize: function MouseEvent(type, event, point, target, delta) {
		this.type = type;
		this.event = event;
		this.point = point;
		this.target = target;
		this.delta = delta;
	},

	toString: function() {
		return "{ type: '" + this.type
				+ "', point: " + this.point
				+ ', target: ' + this.target
				+ (this.delta ? ', delta: ' + this.delta : '')
				+ ', modifiers: ' + this.getModifiers()
				+ ' }';
	}
});

var ToolEvent = Event.extend({
	_class: 'ToolEvent',
	_item: null,

	initialize: function ToolEvent(tool, type, event) {
		this.tool = tool;
		this.type = type;
		this.event = event;
	},

	_choosePoint: function(point, toolPoint) {
		return point ? point : toolPoint ? toolPoint.clone() : null;
	},

	getPoint: function() {
		return this._choosePoint(this._point, this.tool._point);
	},

	setPoint: function(point) {
		this._point = point;
	},

	getLastPoint: function() {
		return this._choosePoint(this._lastPoint, this.tool._lastPoint);
	},

	setLastPoint: function(lastPoint) {
		this._lastPoint = lastPoint;
	},

	getDownPoint: function() {
		return this._choosePoint(this._downPoint, this.tool._downPoint);
	},

	setDownPoint: function(downPoint) {
		this._downPoint = downPoint;
	},

	getMiddlePoint: function() {
		if (!this._middlePoint && this.tool._lastPoint) {
			return this.tool._point.add(this.tool._lastPoint).divide(2);
		}
		return this._middlePoint;
	},

	setMiddlePoint: function(middlePoint) {
		this._middlePoint = middlePoint;
	},

	getDelta: function() {
		return !this._delta && this.tool._lastPoint
				? this.tool._point.subtract(this.tool._lastPoint)
				: this._delta;
	},

	setDelta: function(delta) {
		this._delta = delta;
	},

	getCount: function() {
		return this.tool[/^mouse(down|up)$/.test(this.type)
				? '_downCount' : '_moveCount'];
	},

	setCount: function(count) {
		this.tool[/^mouse(down|up)$/.test(this.type) ? 'downCount' : 'count']
			= count;
	},

	getItem: function() {
		if (!this._item) {
			var result = this.tool._scope.project.hitTest(this.getPoint());
			if (result) {
				var item = result.item,
					parent = item._parent;
				while (/^(Group|CompoundPath)$/.test(parent._class)) {
					item = parent;
					parent = parent._parent;
				}
				this._item = item;
			}
		}
		return this._item;
	},

	setItem: function(item) {
		this._item = item;
	},

	toString: function() {
		return '{ type: ' + this.type
				+ ', point: ' + this.getPoint()
				+ ', count: ' + this.getCount()
				+ ', modifiers: ' + this.getModifiers()
				+ ' }';
	}
});

var Tool = PaperScopeItem.extend({
	_class: 'Tool',
	_list: 'tools',
	_reference: 'tool',
	_events: ['onMouseDown', 'onMouseUp', 'onMouseDrag', 'onMouseMove',
			'onActivate', 'onDeactivate', 'onEditOptions', 'onKeyDown',
			'onKeyUp'],

	initialize: function Tool(props) {
		PaperScopeItem.call(this);
		this._moveCount = -1;
		this._downCount = -1;
		this.set(props);
	},
	setStudio: function(studio){
		this._studio = studio;
	},
	getStudio: function(){
		return this._studio;
	},

	getMinDistance: function() {
		return this._minDistance;
	},

	setMinDistance: function(minDistance) {
		this._minDistance = minDistance;
		if (minDistance != null && this._maxDistance != null
				&& minDistance > this._maxDistance) {
			this._maxDistance = minDistance;
		}
	},

	getMaxDistance: function() {
		return this._maxDistance;
	},

	setMaxDistance: function(maxDistance) {
		this._maxDistance = maxDistance;
		if (this._minDistance != null && maxDistance != null
				&& maxDistance < this._minDistance) {
			this._minDistance = maxDistance;
		}
	},

	getFixedDistance: function() {
		return this._minDistance == this._maxDistance
			? this._minDistance : null;
	},

	setFixedDistance: function(distance) {
		this._minDistance = this._maxDistance = distance;
	},

	_handleMouseEvent: function(type, event, point, mouse) {
		mpaper = this._scope;
		if (mouse.drag && !this.responds(type))
			type = 'mousemove';
		var move = mouse.move || mouse.drag,
			responds = this.responds(type),
			minDistance = this.minDistance,
			maxDistance = this.maxDistance,
			called = false,
			tool = this;
		function update(minDistance, maxDistance) {
			var pt = point,
				toolPoint = move ? tool._point : (tool._downPoint || pt);
			if (move) {
				if (tool._moveCount >= 0 && pt.equals(toolPoint)) {
					return false;
				}
				if (toolPoint && (minDistance != null || maxDistance != null)) {
					var vector = pt.subtract(toolPoint),
						distance = vector.getLength();
					if (distance < (minDistance || 0))
						return false;
					if (maxDistance) {
						pt = toolPoint.add(vector.normalize(
								Math.min(distance, maxDistance)));
					}
				}
				tool._moveCount++;
			}
			tool._point = pt;
			tool._lastPoint = toolPoint || pt;
			if (mouse.down) {
				tool._moveCount = -1;
				tool._downPoint = pt;
				tool._downCount++;
			}
			return true;
		}

		function emit() {
			if (responds) {
				called = tool.emit(type, new ToolEvent(tool, type, event))
						|| called;
			}
		}

		if (mouse.down) {
			update();
			emit();
		} else if (mouse.up) {
			update(null, maxDistance);
			emit();
		} else if (responds) {
			while (update(minDistance, maxDistance))
				emit();
		}
		return called;
	}

});

 var Studio = Base.extend({
	_class: 'Studio',

	initialize: function Studio(props) {
		this._tools =[];  props = props || {};
		this.settings = {
			strokeWidth: props.strokeWidth || 1,
			strokeColor: props.strokeColor || 'black',
			fillColor: props.fillColor || 'black',
			shadowColor: props.shadowColor || 'red',
			shadowBlur: props.shadowBlur || 3,
		}
		this.pageBus = new PageBus();
		this.segs = [];
		var that = this;
		this.subscribe('studio.setting', this, function(topic, data){
		   if( data.strokeColor )  that.settings.strokeColor = data.strokeColor ;
		   if( data.fillColor ) that.settings.fillColor = data.fillColor ;
		   if( data.shadowColor ) that.settings.shadowColor = data.shadowColor ;
		   if( data.strokeWidth ) that.settings.strokeWidth = data.strokeWidth ;
		})
	},
	undo: function(){
		var len = this.segs.length;
		if( len>0 ){
			var r = this.segs.splice(len-1, 1);
			r[0].remove();
		}
	},
	clear: function(){
		this.segs.forEach(e => {
			e.remove();
		})
		this.segs = [];
	},
	updateStyle: function(style){
		this.settings.strokeColor = style.strokeColor;
		this.settings.fillColor = style.fillColor;
	},
	publish: function(topic, obj){
		this.pageBus.publish(topic, obj);
	},
	subscribe: function(topic, scope, onData, subscriberData, timeline){
		this.pageBus.subscribe(topic, scope, onData, subscriberData, timeline);
	},
	setupBuiltInToolbar: function(){
		var studio = this;
		studio.register_tool ('stroke width', '', 'stroke width', new SmallIntPicker({
			prop_name: 'strokeWidth',
			data: [0,1,3,6,9,12],
			color: 'red',
			radius: 14
		}));
	   studio.register_tool ('Line', '', 'Cloud', new LineTool());
	   studio.register_tool ('Cloud', '', 'Cloud', new CloudTool());
	   studio.register_tool ('Grid', '', 'Grid', new SquareRoundedTool());
	   studio.register_tool ('Undo', '', 'Undo',  new TwoStateButton({
		   state1_name: 'Undo',
		   bgColor:  mpaper.project.getBuiltInColor('bgColor2') || 'white',
		   textColor:  mpaper.project.getBuiltInColor('textColor') || 'black',
		   click_func: function(state){
			   studio.undo();
		   },
		   toggle: false ,
		   use_mouse_down:true
	   }));
	   studio.register_tool ('Clear', '', 'Clear',  new TwoStateButton({
		   state1_name: 'Clear',
		   bgColor:  mpaper.project.getBuiltInColor('bgColor2') || 'white',
		   textColor:  mpaper.project.getBuiltInColor('textColor') || 'black',
		   click_func: function(state){
			   studio.clear();
		   },
		   toggle: false ,
		   use_mouse_down:true
	   }));
	   studio.register_tool ('strokeColor', '', 'strokeColor', new ColorPicker({ up:false, radius:10, level:2, color_prop: 'strokeColor'}));
	   studio.register_tool ('fillColor', '', 'fillColor', new ColorPicker({ up:false, radius:10, level:1, color_prop: 'fillColor', use_inner: true}));
	   studio.register_tool ('shadowColor', '', 'shadowColor', new ColorPicker({ up:false, radius:10, level:1, color_prop: 'shadowColor' }));
	},
	showBuiltinToolbar: function( vertical ){
		this.setupBuiltInToolbar();
		this.showToolbar(vertical);
	},

	showToolbar: function( vertical){
		if( !this._toolbar ){
			this._toolbar = new Toolbar();
			this._tools.forEach(t => {
				this._toolbar.register_tool(t);
			});
			this._toolbar.align_tools(vertical);
		}
		this._toolbar.addToViewIfNot();
		this._toolbar.setAsTopOne();
	},
	removeToolbar:function(){
		 if( this._toolbar ){
			 this._tools.forEach( item => {
				if( item.tool && typeof item.tool.remove == 'function'){
					item.tool.remove();
				}
			 });
			 this._tools = [];
			 this._toolbar.remove();
		 }
	},

	register_tool: function(name, icon, tooltip, tool){
		if( typeof tool.setStudio  == 'function' ) tool.setStudio(this);
		this._tools.push({name: name, icon: icon, tooltip: tooltip, tool: tool });
	},
	get_toolinfo: function(name){
		for(var i in this._tools){
			if( this._tools[i].name == name )
				return this._tools[i];
		}
		return null;
	},
	unregister_tool: function(name){
		var pos = -1;
		this._tools = this._tools.filter(
			function(item , index){
				if( item.name == name ){
					pos =index;
					if( item.tool && typeof item.tool.remove == 'function'){
						item.tool.remove();
					}
					return false;
				}
				return true;
			}
		)
		if( pos >= 0 ){
			this._toolbar.unregister_tool(pos);
		}
	}
});

var Toolbar = Group.extend({
	_class: 'Toolbar',

	initialize: function Toolbar(params) {
		Group.apply(this, arguments);
		params = params || {};
		this._initialize(params);

		if(!this._bg_fig){
			this._bg_fig =  new Path.Rectangle({
				topLeft: new Point(0,0),
				bottomRight: new Point(1,1),
				strokeColor:  this._project.getBuiltInColor('bgColor1') || 'rgba(120,120,120,1)',
				fillColor:  this._project.getBuiltInColor('bgColor1') ||  'rgba(120,120,120,0.1)',
			});
		   this.addChild( this._bg_fig );
		}
	},

	register_tool: function(toolInfo){
		var that = this,  children = that._children, counts = children.length;
		if( toolInfo.tool instanceof Tool ){
			var button = new TwoStateButton({
				state1_name: toolInfo.name,
				state1_icon: toolInfo.icon,
				click_func: function(state){
					toolInfo.tool.activate();
					that.updateToolStatue(toolInfo.name);
				},
				bgColor:  this._project.getBuiltInColor('bgColor2') || 'white',
				textColor:  this._project.getBuiltInColor('textColor') || 'black',
				toggle: false ,
				use_mouse_down:true
			})

			this.addChild(button, true);
		} else {
			this.addChild(toolInfo.tool, true);
		}
	},
	unregister_tool: function(index){
		var c = this._children[index+1];
		c.remove();
		if( this._children.length > 1 ){
			this.align_tools( this._align );
		}
	},

	align_tools: function(vertical){
		var children = this._children, counts = children.length;
		this._align = vertical;
		this.align ( vertical, 20, this._bg_fig );
		this._bg_fig.bounds = this.bounds;
	},

	updateToolStatue: function(activedToolName){
		var children = this._children;
		for (var i = 0, l = children.length; i < l; i++) {
			var item = children[i];
			if( item._class === 'TwoStateButton'){
				if( item.state1_name == activedToolName ){
					item.setFocused(true);
				} else {
					item.setFocused(false);
				}
			}
		}
	},

	_copyExtraAttr: function(source, excludeMatrix){
		this.vertical = source.vertical;
	},
});
var LineTool = Tool.extend({
	_class: 'LineTool',

	initialize: function LineTool(params) {
		Tool.apply(this, arguments);
		this.minDistance = 20;
		this.on('mousedrag', this. onMouseDrag);
		this.on('mousedown', this. onMouseDown);
	},
	onMouseDown: function(event) {
		this.path = new Path();
		this.path.addToViewIfNot();
		this._studio.segs.push( this.path );
		this.path.closed = false;
		this.path.strokeColor =  this._studio.settings.strokeColor;
		this.path.strokeWidth=  this._studio.settings.strokeWidth;
		this.path.shadowColor=  this._studio.settings.shadowColor;
		this.path.shadowBlur =  this._studio.settings.shadowBlur;
		this.path.add(event.point);
	},

	onMouseDrag: function(event) {
		if( this.path )
		   this.path.add(event.point);
	}
});

var CloudTool = Tool.extend({
	_class: 'CloudTool',

	initialize: function CloudTool(params) {
		Tool.apply(this, arguments);
		this.minDistance = 20;
		this.on('mousedrag', this. onMouseDrag);
		this.on('mousedown', this. onMouseDown);
	},
	onMouseDown: function(event) {
		this.path = new Path();
		this.path.addToViewIfNot();
		this._studio.segs.push( this.path );
		this.path.closed = false;
		this.path.strokeColor =  this._studio.settings.strokeColor;
		this.path.strokeWidth=  this._studio.settings.strokeWidth;
		this.path.shadowColor=  this._studio.settings.shadowColor;
		this.path.shadowBlur =  this._studio.settings.shadowBlur;
		this.path.add(event.point);
	},

	onMouseDrag: function(event) {
		if( this.path )
		this.path.arcTo(event.point);
	}
});

var SquareRoundedTool = Tool.extend({
	_class: 'SquareRoundedTool',

	initialize: function SquareRoundedTool(params) {
		Tool.apply(this, arguments);
		this.path = null;
		this. curPoint = null;
		this. prevPoint = null,
		this.curHandleSeg = null;
		this.values =  {
			radius: 5,
			tolerance: 2
		};
		this.checkValues();
		this.on('mousedrag', this. onMouseDrag);
		this.on('mousedown', this. onMouseDown);
	},
	 checkValues: function(){
		var min = this.values.radius * 2;
		if (this.values.tolerance < min) this.values.tolerance = min;
		this.handle = this.values.radius * Numerical.KAPPA;
	},
	 onMouseDown: function(event) {
		this.path = new Path({
			segments: [event.point, event.point],
			strokeColor: this._studio.settings.strokeColor,
			strokeWidth: this._studio.settings.strokeWidth,
			shadowColor: this._studio.settings.shadowColor,
			shadowBlur: this._studio.settings.shadowBlur,
			strokeCap: 'round'
		});
		this.path.addToViewIfNot();
		this._studio.segs.push( this.path );
		this.path.closed = false;
		this.prevPoint = this.path.firstSegment.point;
		this.curPoint = this.path.lastSegment.point;
		this. curHandleSeg = null;
	},
	onMouseDrag: function (event) {
		var point = event.point;
		var diff =  point.__subtract(this.prevPoint).abs();
		if (diff.x < diff.y) {
			this.curPoint.x = this.prevPoint.x;
			this.curPoint.y = point.y;
		} else {
			this.curPoint.x = point.x;
			this.curPoint.y = this.prevPoint.y;
		}
		var normal = this.curPoint.__subtract(this.prevPoint);
		normal.length = 1;
		if (this.curHandleSeg) {
			this.curHandleSeg.point = this.prevPoint.__add(normal.__multiply(this.values.radius));
			this.curHandleSeg.handleIn = normal.__multiply( -this.handle );
		}
		var minDiff = Math.min(diff.x, diff.y);
		if (minDiff > this.values.tolerance) {
			var point = this.curPoint .__subtract(normal.__multiply(this.values.radius));
			var segment = new Segment(point, null, normal.__multiply(this.handle));
			this. path.insert(this.path.segments.length - 1, segment);
			this.curHandleSeg = this.path.lastSegment;
			this.prevPoint = this.curHandleSeg.point.clone();
			this.path.add(this.curHandleSeg);
			this.curPoint = this.path.lastSegment.point;
		}
	}
});

var RotatePicker = Group.extend({
	_class: 'RotatePicker',

	initialize: function RotatePicker(params) {
		Group.apply(this, arguments);
		params = params || {};
		this._initialize(params);
		this.radius = params.radius || 20;
		this.use_inner = params.use_inner || false;
		this.up  = params.up || true;
	},
	setStudio: function(studio){
		this.studio = studio;
	},
	_create_cover:function(){
		var that = this, usedColor = that.studio ? that.studio.settings[that.color_prop] : 'gray';
		usedColor = usedColor || 'gray';
		that._cover = new Path.Annulus({
			center: that.bounds.center,
			inner_radius: that.radius/2,
			outer_radius: that.radius,
			inner_color: that.use_inner? usedColor : 'white',
			fillColor:   that.use_inner?  'white' : usedColor,
			strokeColor:   that.use_inner?  'white' : usedColor,
		});
		that.addChild(that._cover);
		that._cover.on('mousedown', function(e){
			that.showPicker();
		});
	},
	_hidePicker: function( ){
		var that = this, ccc = that._children.filter( e => {
			return e != that._cover;
		});
		RU.revolver_back( ccc, that._cover.position.clone(), 'easeOutElastic(1, .5)',1);
	},
	showPicker: function(){
		var that = this,  pos = this.position, ccc = that._children.filter( e => {
			return e != that._cover;
		});

		RU.revolver( ccc, pos.clone(), that.radius*5, that.up?20:200, that.up?160:340, 'easeOutElastic(1, .5)',1);
	}
});

var ColorPicker = RotatePicker.extend({
	_class: 'ColorPicker',

	initialize: function ColorPicker(params) {
		RotatePicker.apply(this, arguments);
		params = params || {};
		this._initialize(params);
		this.callback = params.callback || null;
		this.level = params.level || 1;
		this.color_prop = params.color_prop || 'strokeColor';
		this._create_shape();
	},
	_create_shape: function(){
		var that = this, up = that.up, pos = this.position, colors = ['red', 'orange', 'yellow', 'green', 'lime', 'blue', 'purple', 'white', 'black'];
		colors.forEach( c => {
			var cc = new Path.Circle({
				center: pos,
				radius: that.radius,
				fillColor: c,
				strokeColor: c == 'white' ? 'black' : c
			});
			cc.on( 'mousedown', function(){
				var ccpos = cc.position.clone();
				that._hidePicker(c);
				if( that.level == 1 ){
					 if( that.callback )
						 that.callback(  c );
					 that._cover.setColor(that.use_inner, c);
					 var p = {}; p[that.color_prop] =c;
					 that.studio.publish('studio.setting', p);
				} else {
					var ccolor = new Color(c),  hue = (ccolor.hue + 40) % 360, ncolors = [c], count = colors.length,
						lightness, nchild = [];
					for(var i = 0; i < count; i++){
						lightness = (i * 1.0/count - 0.5) * 0.4 + 0.4;
						ncolors[i+1]  = new Color({ hue: hue, saturation: 1, lightness: lightness , alpha: 1}).toCSS();
					}
					ncolors.forEach( nc => {
						var ncc = new Path.Circle({
							center: ccpos,
							radius: that.radius,
							fillColor: nc,
							strokeColor: nc
						});
						that.addChild(ncc, true);
						nchild.push(ncc);
						ncc.on( 'mousedown', function(){
							anime({
								targets: nchild,
								opacity: 0,
								complete: function(){
									nchild.forEach( e => { e.remove(); } );
								},
								duration: 0.5
							});
							if( that.callback )
								that.callback(  nc );
							that._cover.setColor(that.use_inner, nc);
							var p = {}; p[that.color_prop] =nc;
							that.studio.publish('studio.setting', p);
						});
					});
					RU.revolver( nchild, ccpos, that.radius*4, 0, 360, 'easeOutElastic(1, .5)',1);
				}
			});
			that.addChild(cc);
		});
	   that._create_cover();
	},
});

var SmallIntPicker = RotatePicker.extend({
	_class: 'SmallIntPicker',

	initialize: function SmallIntPicker(params) {
		RotatePicker.apply(this, arguments);
		params = params || {};
		this._initialize(params);
		this.data = params.data || [1,2,3,4,5,6,7,8,9];
		this.color = params.color || 'black';
		this._create_shape();
	},
	_create_shape: function(){
		var that = this, pos = this.position, data = this.data, radius = this.radius, color = this.color;
		data.forEach( (e,i) => {
			if( e == 0 ){
				var a = Path.Circle({
					center: pos,
					radius: radius,
					strokeColor: "gray",
					fillColor: 'white'
				})
				a.on( 'mousedown', function(ev){
					var p = {}; p[that.prop_name] =0;
					that.studio.publish('studio.setting', p);
					that._hidePicker();
				});
				that.addChild(a);
			}
			var a = new Path.Annulus({
				center: pos,
				inner_radius: e,
				outer_radius:  radius,
				inner_color: color,
				strokeColor:  'gray',
				fillColor: 'white'
			});
			a.on( 'mousedown', function(ev){
				var p = {}; p[that.prop_name] =e;
				that.studio.publish('studio.setting', p);
				that._hidePicker();
			});
			that.addChild(a);
		});
		that._create_cover();
	},
});

const defaultInstanceSettings = {
  update: null,
  begin: null,
  loopBegin: null,
  changeBegin: null,
  change: null,
  changeComplete: null,
  loopComplete: null,
  complete: null,
  loop: 1,
  direction: 'normal',
  autoplay: true,
  timelineOffset: 0,
  eventFunc: null,
  eventFuncParams: null,

}

const defaultTweenSettings = {
  duration: 1.0,
  delay: 0,
  endDelay: 0,
  easing: 'linear',
  round: 0,
  positionFunc: null,
  progressFunc: null,
}

function minMax(val, min, max) {
  return Math.min(Math.max(val, min), max);
}

function stringContains(str, text) {
  return str.indexOf(text) > -1;
}

function applyArguments(func, args) {
  return func.apply(null, args);
}

const is = {
  cps: a => a && a._class && ( a._class == 'Color' || a._class == 'Size' || a._class == 'Point'),
  arr: a => Array.isArray(a),
  obj: a => stringContains(Object.prototype.toString.call(a), 'Object'),
  str: a => typeof a === 'string',
  fnc: a => typeof a === 'function',
  und: a => typeof a === 'undefined',
  nil: a => is.und(a) || a === null,
  hex: a => /(^#[0-9A-F]{6}$)|(^#[0-9A-F]{3}$)/i.test(a),
  rgb: a => /^rgb/.test(a),
  hsl: a => /^hsl/.test(a),
  cnm: a => /(red|green|blue|white|black|gray|pink|yellow|orange)/ig.test(a),
  col: a => ( a._class === 'Color' || is.hex(a) || is.rgb(a) || is.hsl(a) || is.cnm(a) ),
  key: a => !defaultInstanceSettings.hasOwnProperty(a) && !defaultTweenSettings.hasOwnProperty(a) && a !== 'targets' && a !== 'keyframes',
  exluded: a => is.str(a) && ( a == 'rotation' )
}
function colorToRgb(val) {
  if( val._class === 'Color' ) return val.toCSS();
  if (is.rgb(val)) return rgbToRgba(val);
  if (is.hex(val)) return hexToRgba(val);
  if (is.hsl(val)) return hslToRgba(val);
  if (is.cnm(val)) return nameToRgba(val);
}

function rgbToRgba(rgbValue) {
  const rgb = /rgb\((\d+,\s*[\d]+,\s*[\d]+)\)/g.exec(rgbValue);
  return rgb ? `rgba(${rgb[1]},1)` : rgbValue;
}

function nameToRgba(colorName) {
  let c = colorName;
  const rgb = { red: '255,0,0', green: '0,255,0', blue: '0,0,255', white: '255,255,255', black: '0,0,0', gray: '192,192,192', pink: '255,192,203', yellow:'255,255,0', orange:'255,127,0' };
  return rgb[c] ? `rgba(${rgb[c]},1)` : 'rgba(0,0,0,1)';
}

function rgbToRgba(rgbValue) {
  const rgb = /rgb\((\d+,\s*[\d]+,\s*[\d]+)\)/g.exec(rgbValue);
  return rgb ? `rgba(${rgb[1]},1)` : rgbValue;
}

function hexToRgba(hexValue) {
  const rgx = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
  const hex = hexValue.replace(rgx, (m, r, g, b) => r + r + g + g + b + b );
  const rgb = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  const r = parseInt(rgb[1], 16);
  const g = parseInt(rgb[2], 16);
  const b = parseInt(rgb[3], 16);
  return `rgba(${r},${g},${b},1)`;
}

function hslToRgba(hslValue) {
  const hsl = /hsl\((\d+),\s*([\d.]+)%,\s*([\d.]+)%\)/g.exec(hslValue) || /hsla\((\d+),\s*([\d.]+)%,\s*([\d.]+)%,\s*([\d.]+)\)/g.exec(hslValue);
  const h = parseInt(hsl[1], 10) / 360;
  const s = parseInt(hsl[2], 10) / 100;
  const l = parseInt(hsl[3], 10) / 100;
  const a = hsl[4] || 1;
  function hue2rgb(p, q, t) {
	if (t < 0) t += 1;
	if (t > 1) t -= 1;
	if (t < 1/6) return p + (q - p) * 6 * t;
	if (t < 1/2) return q;
	if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
	return p;
  }
  let r, g, b;
  if (s == 0) {
	r = g = b = l;
  } else {
	const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
	const p = 2 * l - q;
	r = hue2rgb(p, q, h + 1/3);
	g = hue2rgb(p, q, h);
	b = hue2rgb(p, q, h - 1/3);
  }
  return `rgba(${r * 255},${g * 255},${b * 255},${a})`;
}

function parseEasingParameters(string) {
  const match = /\(([^)]+)\)/.exec(string);
  return match ? match[1].split(',').map(p => parseFloat(p)) : [];
}

function spring(string, duration) {

  const params = parseEasingParameters(string);
  const mass = minMax(is.und(params[0]) ? 1 : params[0], .1, 100);
  const stiffness = minMax(is.und(params[1]) ? 100 : params[1], .1, 100);
  const damping = minMax(is.und(params[2]) ? 10 : params[2], .1, 100);
  const velocity = minMax(is.und(params[3]) ? 0 : params[3], .1, 100);
  const w0 = Math.sqrt(stiffness / mass);
  const zeta = damping / (2 * Math.sqrt(stiffness * mass));
  const wd = zeta < 1 ? w0 * Math.sqrt(1 - zeta * zeta) : 0;
  const a = 1;
  const b = zeta < 1 ? (zeta * w0 + -velocity) / wd : -velocity + w0;

  function solver(t) {
	let progress = duration ? (duration * t) / 1.0 : t;
	if (zeta < 1) {
	  progress = Math.exp(-progress * zeta * w0) * (a * Math.cos(wd * progress) + b * Math.sin(wd * progress));
	} else {
	  progress = (a + b * progress) * Math.exp(-progress * w0);
	}
	if (t === 0 || t === 1) return t;
	return 1 - progress;
  }

  function getDuration() {
	const cached = cache.springs[string];
	if (cached) return cached;
	const frame = 1 / 6;
	let elapsed = 0;
	let rest = 0;
	while (true) {
	  elapsed += frame;
	  if (solver(elapsed) === 1) {
		rest++;
		if (rest >= 16) break;
	  } else {
		rest = 0;
	  }
	}
	const duration = elapsed * frame * 1.0;
	cache.springs[string] = duration;
	return duration;
  }

  return duration ? solver : getDuration;

}

const bezier = (() => {

  const kSplineTableSize = 11;
  const kSampleStepSize = 1.0 / (kSplineTableSize - 1.0);

  function A(aA1, aA2) { return 1.0 - 3.0 * aA2 + 3.0 * aA1 };
  function B(aA1, aA2) { return 3.0 * aA2 - 6.0 * aA1 };
  function C(aA1) { return 3.0 * aA1 };

  function calcBezier(aT, aA1, aA2) { return ((A(aA1, aA2) * aT + B(aA1, aA2)) * aT + C(aA1)) * aT };
  function getSlope(aT, aA1, aA2) { return 3.0 * A(aA1, aA2) * aT * aT + 2.0 * B(aA1, aA2) * aT + C(aA1) };

  function binarySubdivide(aX, aA, aB, mX1, mX2) {
	let currentX, currentT, i = 0;
	do {
	  currentT = aA + (aB - aA) / 2.0;
	  currentX = calcBezier(currentT, mX1, mX2) - aX;
	  if (currentX > 0.0) { aB = currentT } else { aA = currentT };
	} while (Math.abs(currentX) > 0.0000001 && ++i < 10);
	return currentT;
  }

  function newtonRaphsonIterate(aX, aGuessT, mX1, mX2) {
	for (let i = 0; i < 4; ++i) {
	  const currentSlope = getSlope(aGuessT, mX1, mX2);
	  if (currentSlope === 0.0) return aGuessT;
	  const currentX = calcBezier(aGuessT, mX1, mX2) - aX;
	  aGuessT -= currentX / currentSlope;
	}
	return aGuessT;
  }

  function bezier(mX1, mY1, mX2, mY2) {

	if (!(0 <= mX1 && mX1 <= 1 && 0 <= mX2 && mX2 <= 1)) return;
	let sampleValues = new Float32Array(kSplineTableSize);

	if (mX1 !== mY1 || mX2 !== mY2) {
	  for (let i = 0; i < kSplineTableSize; ++i) {
		sampleValues[i] = calcBezier(i * kSampleStepSize, mX1, mX2);
	  }
	}

	function getTForX(aX) {

	  let intervalStart = 0;
	  let currentSample = 1;
	  const lastSample = kSplineTableSize - 1;

	  for (; currentSample !== lastSample && sampleValues[currentSample] <= aX; ++currentSample) {
		intervalStart += kSampleStepSize;
	  }

	  --currentSample;

	  const dist = (aX - sampleValues[currentSample]) / (sampleValues[currentSample + 1] - sampleValues[currentSample]);
	  const guessForT = intervalStart + dist * kSampleStepSize;
	  const initialSlope = getSlope(guessForT, mX1, mX2);

	  if (initialSlope >= 0.001) {
		return newtonRaphsonIterate(aX, guessForT, mX1, mX2);
	  } else if (initialSlope === 0.0) {
		return guessForT;
	  } else {
		return binarySubdivide(aX, intervalStart, intervalStart + kSampleStepSize, mX1, mX2);
	  }

	}

	return x => {
	  if (mX1 === mY1 && mX2 === mY2) return x;
	  if (x === 0 || x === 1) return x;
	  return calcBezier(getTForX(x), mY1, mY2);
	}

  }

  return bezier;

})();

function steps(steps = 10) {
  return t => Math.ceil((minMax(t, 0.000001, 1)) * steps) * (1 / steps);
}
const penner = (() => {

  const eases = { linear: () => t => t };

  const functionEasings = {
	Sine: () => t => 1 - Math.cos(t * Math.PI / 2),
	Circ: () => t => 1 - Math.sqrt(1 - t * t),
	Back: () => t => t * t * (3 * t - 2),
	Bounce: () => t => {
	  let pow2, b = 4;
	  while (t < ((pow2 = Math.pow(2, --b)) - 1) / 11) { };
	  return 1 / Math.pow(4, 3 - b) - 7.5625 * Math.pow((pow2 * 3 - 2) / 22 - t, 2)
	},
	Elastic: (amplitude = 1, period = .5) => {
	  const a = minMax(amplitude, 1, 10);
	  const p = minMax(period, .1, 2);
	  return t => {
		return (t === 0 || t === 1) ? t :
		  -a * Math.pow(2, 10 * (t - 1)) * Math.sin((((t - 1) - (p / (Math.PI * 2) * Math.asin(1 / a))) * (Math.PI * 2)) / p);
	  }
	}
  }

  const baseEasings = ['Quad', 'Cubic', 'Quart', 'Quint', 'Expo'];

  baseEasings.forEach((name, i) => {
	functionEasings[name] = () => t => Math.pow(t, i + 2);
  });

  Object.keys(functionEasings).forEach(name => {
	const easeIn = functionEasings[name];
	eases['easeIn' + name] = easeIn;
	eases['easeOut' + name] = (a, b) => t => 1 - easeIn(a, b)(1 - t);
	eases['easeInOut' + name] = (a, b) => t => t < 0.5 ? easeIn(a, b)(t * 2) / 2 :
	  1 - easeIn(a, b)(t * -2 + 2) / 2;
	eases['easeOutIn' + name] = (a, b) => t => t < 0.5 ? (1 - easeIn(a, b)(1 - t * 2)) / 2 :
	  (easeIn(a, b)(t * 2 - 1) + 1) / 2;
  });

  return eases;

})();

function parseEasings(easing, duration) {
  if (is.fnc(easing)) return easing;
  const name = easing.split('(')[0];
  const ease = penner[name];
  const args = parseEasingParameters(easing);
  switch (name) {
	case 'spring': return spring(easing, duration);
	case 'cubicBezier': return applyArguments(bezier, args);
	case 'steps': return applyArguments(steps, args);
	default: return applyArguments(ease, args);
  }
}

function selectString(str) {
  try {
	let nodes = document.querySelectorAll(str);
	return nodes;
  } catch(e) {
	return;
  }
}

function filterArray(arr, callback) {
  const len = arr.length;
  const thisArg = arguments.length >= 2 ? arguments[1] : void 0;
  const result = [];
  for (let i = 0; i < len; i++) {
	if (i in arr) {
	  const val = arr[i];
	  if (callback.call(thisArg, val, i, arr)) {
		result.push(val);
	  }
	}
  }
  return result;
}

function flattenArray(arr) {
  return arr.reduce((a, b) => a.concat(is.arr(b) ? flattenArray(b) : b), []);
}

function toArray(o) {
  if (is.arr(o)) return o;
  if (is.str(o)) o = selectString(o) || o;
  if (o instanceof NodeList || o instanceof HTMLCollection) return [].slice.call(o);
  return [o];
}

function arrayContains(arr, val) {
  return arr.some(a => a === val);
}

function cloneObject(o) {
  const clone = {};
  for (let p in o) clone[p] = o[p];
  return clone;
}

function replaceObjectProps(o1, o2) {
  const o = cloneObject(o1);
  for (let p in o1) o[p] = o2.hasOwnProperty(p) ? o2[p] : o1[p];
  return o;
}

function mergeObjects(o1, o2) {
  const o = cloneObject(o1);
  for (let p in o2) o[p] = is.und(o1[p]) ? o2[p] : o1[p];
  return o;
}

function getFunctionValue(val, animatable) {
  if (!is.fnc(val) || is.cps(val) ) return val;
  if( typeof animatable.target)
  return val(animatable.target, animatable.id, animatable.total);
}

function getOriginalTargetValue(target, propName , state) {
	return  _getState(target, propName, state);
}
function _getState(target, key, state) {
  var path =  _parseKey(key),
	  current = _getProperty(target, path),
	  value;
  if (state && !is.exluded(state)) {
	  var resolved = _resolveValue(current, state);
	  _setProperty(target, path, resolved);
	  value = _getProperty(target, path);
	  value = value && value.clone ? value.clone() : value;
	  _setProperty(target, path, current);
  } else {
	  value = current && current.clone ? current.clone() : current;
  }
  return value;
}

function _parseKey(key) {
  var  path = key
			  .replace(/\.([^.]*)/g, '/$1')
			  .replace(/\[['"]?([^'"\]]*)['"]?\]/g, '/$1');
  return path.split('/');
}
function _resolveValue(current, value) {
  if (value) {
	  if (Array.isArray(value) && value.length === 2) {
		  var operator = value[0];
		  return (
			  operator &&
			  operator.match &&
			  operator.match(/^[+\-\*\/]=/)
		  )
			  ?  _calculate(current, operator[0], value[1])
			  : value;
	  } else if (typeof value === 'string') {
		  var match = value.match(/^[+\-*/]=(.*)/);
		  if (match) {
			  var parsed = JSON.parse(match[1].replace(
				  /(['"])?([a-zA-Z0-9_]+)(['"])?:/g,
				  '"$2": '
			  ));
			  return  _calculate(current, value[0], parsed);
		  }
	  }
  }
  return value;
}

function _calculate(left, operator, right) {
  return mpaper.PaperScript.calculateBinary(left, operator, right);
}

function _getProperty(target, path, offset) {
  var obj = target, prev = target;
  for (var i = 0, l = path.length - (offset || 0); i < l && obj; i++) {
	  prev  = obj;
	  obj = obj[path[i]];
  }
  return typeof obj == 'function' ? obj.apply(prev) : obj;
}

function _setProperty (target, path, value) {
  var dest = _getProperty(target, path, 1);
  if (dest) {
	  dest[path[path.length - 1]] = value;
  }
}

function getRelativeValue(to, from) {
  if( is.cps( from ) ){
	  if( is.arr( to ) ){
		if( from._class = 'Point' ) return new Point( to );
		if( from._class = 'Color' ) return new Color( to );
		if( from._class = 'Size' ) return new Size( to );
	  }
  }
  if( is.str( to ) && to[0] == '=' && to[1] != '=' ){
	 const y0 =  to.substring(1).split(',');
	 if( from._class = 'Point' ) return new Point( y0 );
	 if( from._class = 'Color' ) return new Color( y0 );
	 if( from._class = 'Size' ) return new Size( y0 );
  }
  const operator = /^(\*=|\+=|-=|\/=|==)/.exec(to);
  if (!operator) return to;
  if( is.cps( from ) ){
	  const yy =  to.replace(operator[0], '').slice(1, -1).split(',');
	  let toobj;
	  if( from._class = 'Point' ) toobj = new Point( yy );
	  if( from._class = 'Color' ) toobj = new Color( yy );
	  if( from._class = 'Size' ) toobj = new Size( yy );
	  switch (operator[0][0]) {
		case '+': return from.__add(toobj);
		case '-': return from.__subtract(toobj);
		case '*': return from.__multiply(toobj);
		case '\/': return from.__divide(toobj);
	  }
  }

  const x = parseFloat(from);
  const y = parseFloat(to.replace(operator[0], ''));
  switch (operator[0][0]) {
	case '+': return x + y  ;
	case '-': return x - y  ;
	case '*': return x * y  ;
	case '\/': return x / y  ;
	case '=': return -x;
  }
}
function validateValue(val) {
  if( typeof val == 'string' && is.col(val) )
	  return colorToRgb(val);
  if( typeof val == 'object' && val._class === 'Color' )
	  return colorToRgb(val);
  return val + '';
}

function decomposeValue( val ) {
  const rgx = /[+-]?\d*\.?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?/g;
  const value = validateValue( val );
  return {
	orig_str: value,
	orig_value: val,
	numbers: value.match(rgx) ? value.match(rgx).map(Number) : [0],
	strings: (is.str(val)  ) ? value.split(rgx) : []
  }
}

function parseTargets(targets) {
  const targetsArray = targets ? (flattenArray(is.arr(targets) ? targets.map(toArray) : toArray(targets))) : [];
  return filterArray(targetsArray, (item, pos, self) => self.indexOf(item) === pos);
}

function getAnimatables(targets) {
  const parsed = parseTargets(targets);
  return parsed.map((t, i) => {
	return {target: t, id: i, total: parsed.length  };
  });
}

function normalizePropertyTweens(prop, tweenSettings) {
  let settings = cloneObject(tweenSettings);
  if (is.arr(prop)) {
	const l = prop.length;
	const isFromTo = (l === 2 && !is.obj(prop[0]));
	if (!isFromTo) {
	  if (!is.fnc(tweenSettings.duration)) settings.duration = tweenSettings.duration / l;
	} else {
	  prop = {value: prop};
	}
  }
  const propArray = is.arr(prop) ? prop : [prop];
  return propArray.map((v, i) => {
	const obj = (is.obj(v)  ) ? v : {value: v};
	if (is.und(obj.delay)) obj.delay = !i ? tweenSettings.delay : 0;
	if (is.und(obj.endDelay)) obj.endDelay = i === propArray.length - 1 ? tweenSettings.endDelay : 0;
	return obj;
  }).map(k => mergeObjects(k, settings));
}

function getProperties(tweenSettings, params) {
  const properties = [];
  for (let p in params) {
	if (is.key(p)) {
	  properties.push({
		name: p,
		tweens: normalizePropertyTweens(params[p], tweenSettings)
	  });
	}
  }
  return properties;
}

function normalizeTweenValues(tween, animatable) {
	const t = {};

	if( tween._class &&  is.cps( tween )  ){
	  t.value = tween;
	  t.duration = tween.duration;
	  t.delay = tween.delay;
	  t.endDelay = tween.endDelay;
	  t.easing = tween.easing;
	  t.round = tween.round;
	} else {
	  for (let p in tween) {
		if( p === 'progressFunc') continue;
		let value = getFunctionValue(tween[p], animatable);
		if (is.arr(value)) {
		  value = value.map(v => getFunctionValue(v, animatable));
		  if (value.length === 1) value = value[0];
		}
		t[p] = value;
	  }
	}
	t. positionFunc = tween.positionFunc;
	t. progressFunc = tween.progressFunc;
	t.duration = parseFloat(t.duration);
	t.delay = parseFloat(t.delay);
	return t;
}

function normalizeTweens(prop, animatable) {
  let previousTween;
  return prop.tweens.map(t => {
	const tween = normalizeTweenValues(t, animatable);
	const tweenValue = tween.value;
	let to = is.arr(tweenValue) ? tweenValue[1] : tweenValue;
	to = getOriginalTargetValue(animatable.target, prop.name, to);
	const originalValue = getOriginalTargetValue(animatable.target, prop.name );
	const previousValue = previousTween ? previousTween.to.orig_value : originalValue;
	const from = is.arr(tweenValue) ? tweenValue[0] : previousValue;
	if (is.und(to)) to = previousValue;
	tween.from = decomposeValue(from );
	tween.to = decomposeValue(getRelativeValue(to, from));
	tween.start = previousTween ? previousTween.end : 0;
	tween.end = tween.start + tween.delay + tween.duration + tween.endDelay;
	tween.easing = parseEasings(tween.easing, tween.duration);
	previousTween = tween;
	return tween;
  });
}

function setTargetsValue(targets, properties) {
  const animatables = getAnimatables(targets);
  animatables.forEach(animatable => {
	for (let property in properties) {
	  const value = getFunctionValue(properties[property], animatable);
	  const target = animatable.target;
	  const originalValue = getOriginalTargetValue(target, property );
		const to = getRelativeValue( value,   originalValue);
	   target[ property ] = to ;
	}
  });
}

function createAnimation(animatable, prop) {
	const tweens = normalizeTweens(prop, animatable);
	const lastTween = tweens[tweens.length - 1];
	return {
	  type: 'object',
	  property: prop.name,
	  animatable: animatable,
	  tweens: tweens,
	  duration: lastTween.end,
	  delay: tweens[0].delay,
	  endDelay: lastTween.endDelay,
	}
}

function getAnimations(animatables, properties) {
  return filterArray(flattenArray(animatables.map(animatable => {
	return properties.map(prop => {
	  return createAnimation(animatable, prop);
	});
  })), a => !is.und(a));
}

function getInstanceTimings(animations, tweenSettings) {
  const animLength = animations.length;
  const getTlOffset = anim => anim.timelineOffset ? anim.timelineOffset : 0;
  const timings = {};
  timings.duration = animLength ? Math.max.apply(Math, animations.map(anim => getTlOffset(anim) + anim.duration)) : tweenSettings.duration;
  timings.delay = animLength ? Math.min.apply(Math, animations.map(anim => getTlOffset(anim) + anim.delay)) : tweenSettings.delay;
  timings.endDelay = animLength ? timings.duration - Math.max.apply(Math, animations.map(anim => getTlOffset(anim) + anim.duration - anim.endDelay)) : tweenSettings.endDelay;
  return timings;
}

let instanceID = 0;

function createNewInstance(params) {

  const instanceSettings = replaceObjectProps(defaultInstanceSettings, params);
  const tweenSettings = replaceObjectProps(defaultTweenSettings, params);
  const properties = getProperties(tweenSettings, params);
  const animatables = getAnimatables(params.targets);
  const animations = getAnimations(animatables, properties);
  const timings = getInstanceTimings(animations, tweenSettings);
  const id = instanceID;
  instanceID++;
  return mergeObjects(instanceSettings, {
	id: id,
	children: [],
	animatables: animatables,
	animations: animations,
	duration: timings.duration,
	delay: timings.delay,
	endDelay: timings.endDelay
  });
}

let activeInstances = [];

const engine = (() => {
  let raf, requested = false,
	callbacks = [],
	timer;

  function play(callback) {
	if( callback && typeof callback == 'function' ){
	  registerCallback(callback);
	}
	if (!raf && (!isDocumentHidden() || !anime.suspendWhenDocumentHidden) && (activeInstances.length > 0 || callbacks.length>0)) {
	  raf = requestAnimationFrame(step);
	}
  }
  function step(t) {
	let activeInstancesLength = activeInstances.length, ts = t/1000.0;
	let i = 0;
	while (i < activeInstancesLength) {
	  const activeInstance = activeInstances[i];
	  if (!activeInstance.paused) {
		activeInstance.tick(ts);
		i++;
	  } else {
		activeInstances.splice(i, 1);
		activeInstancesLength--;
	  }
	}
	var functions = callbacks;
	callbacks = [];
	for (var j = 0, l = functions.length; j < l; j++)
	  functions[j]();
	requested = raf && callbacks.length;

	raf = i > 0 || callbacks.length > 0 ? requestAnimationFrame(step) : undefined;
  }

  function registerCallback(callback) {
	callbacks.push(callback);
	if ( typeof raf == 'function' && !requested) {
	  raf(step);
	  requested = true;
	}
  }

  function handleVisibilityChange() {
	if (!anime.suspendWhenDocumentHidden) return;

	if (isDocumentHidden()) {
	  raf = cancelAnimationFrame(raf);
	} else {
	  activeInstances.forEach(
		inste => inste ._onDocumentVisibility()
	  );
	  engine();
	}
  }
  if (typeof document !== 'undefined') {
	document.addEventListener('visibilitychange', handleVisibilityChange);
  }

  return play;
})();

function isDocumentHidden() {
  return !!document && document.hidden;
}

function anime(params = {}) {

  let startTime = 0, lastTime = 0, now = 0;
  let children, childrenLength = 0;
  let resolve = null;

  function makePromise(inste) {
	const promise = window.Promise && new Promise(_resolve => resolve = _resolve);
	inste.finished = promise;
	return promise;
  }
  params = pre_process_params( params );

  let inste = createNewInstance(params);
  let promise = makePromise(inste);

  function toggleInstanceDirection() {
	const direction = inste.direction;
	if (direction !== 'alternate') {
	  inste.direction = direction !== 'normal' ? 'normal' : 'reverse';
	}
	inste.reversed = !inste.reversed;
	children.forEach(child => child.reversed = inste.reversed);
  }

  function adjustTime(time) {
	return inste.reversed ? inste.duration - time : time;
  }

  function resetTime() {
	startTime = 0;
	lastTime = adjustTime(inste.currentTime) * (1 / anime.speed);
  }

  function seekChild(time, child) {
	if (child) child.seek(time - child.timelineOffset);
  }

  function syncInstanceChildren(time) {
	if (!inste.reversePlayback) {
	  for (let i = 0; i < childrenLength; i++) seekChild(time, children[i]);
	} else {
	  for (let i = childrenLength; i--;) seekChild(time, children[i]);
	}
  }

  function setAnimationsProgress(insTime) {
	let i = 0;
	const animations = inste.animations;
	const animationsLength = animations.length;
	while (i < animationsLength) {
	  const anim = animations[i];
	  const animatable = anim.animatable;
	  const atarget = animatable.target;
	  const tweens = anim.tweens;
	  const tweenLength = tweens.length - 1;
	  let tween = tweens[tweenLength];
	  if( insTime == 0 &&   atarget instanceof Item ){
	  }

	  if (tweenLength) tween = filterArray(tweens, t => (insTime < t.end))[0] || tween;
	  const elapsed = minMax(insTime - tween.start - tween.delay, 0, tween.duration) / tween.duration;
	  const eased = isNaN(elapsed) ? 1 : tween.easing(elapsed);
	  if( anim.property == 'pfnc' &&  tween['progressFunc']  ){
		  if( typeof  tween['progressFunc'] === 'function'){
			  tween['progressFunc'](eased);
		  } else {
			  atarget[tween['progressFunc']](eased);
		  }
		  i++;
		  continue;
	  }

	  let progress,  getValue = function(value) {
		  return typeof value === 'function'
			  ? value(eased, elapsed)
			  : value;
	  };
	  var from = getValue(tween.from.orig_value),
			  to = getValue(tween.to.orig_value);
	  var  value = (from && to && from.__add && to.__add)
			  ? to.__subtract(from).__multiply(eased).__add(from)
			: ((to - from) * eased) + from;

	  if( anim.property == 'position' && typeof tween['positionFunc'] === 'function' ){
		  value = tween['positionFunc'](from, to, value, eased);
	  }
	  _setProperty(atarget,  _parseKey(anim.property), value);
	  anim.currentValue = value;
	  i++;

	}
  }

  function setCallback(cb) {
	if (inste[cb] && !inste.passThrough) inste[cb](inste);
  }
  function invokeEvent( ) {
	    if (inste.eventFunc && !inste.passThrough){
		  inste.animatables.forEach(e => {
			if(typeof inste.eventFunc === 'function'){
				 inste.eventFunc(inste.eventFuncParams);
			} else {
				e[inste.eventFunc](inste.eventFuncParams);
			}
		  });
	  }
  }

  function countIteration() {
	if (inste.remaining && inste.remaining !== true) {
	  inste.remaining--;
	}
  }

  function setInstanceProgress(engineTime) {
	const insDuration = inste.duration;
	const insDelay = inste.delay;
	const insEndDelay = insDuration - inste.endDelay;
	const insTime = adjustTime(engineTime);
	inste.progress = minMax((insTime / insDuration) * 100, 0, 100);
	inste.reversePlayback = insTime < inste.currentTime;
	if (children) { syncInstanceChildren(insTime); }
	if (!inste.began && inste.currentTime > 0) {
	  inste.began = true;
	  setCallback('begin');

	  if ( inste.eventFunc ){
		invokeEvent( );
		inste.paused = true;
		inste.completed = true;
		setCallback('loopComplete');
		setCallback('complete');
		if (!inste.passThrough && 'Promise' in window) {
		  resolve();
		  promise = makePromise(inste);
		}
		return;
	  }
	}
	if (!inste.loopBegan && inste.currentTime > 0) {
	  inste.loopBegan = true;
	  setCallback('loopBegin');
	}
	if (insTime <= insDelay && inste.currentTime !== 0) {
	  setAnimationsProgress(0);
	}
	if ((insTime >= insEndDelay && inste.currentTime !== insDuration) || !insDuration) {
	  setAnimationsProgress(insDuration);
	}
	if (insTime > insDelay && insTime < insEndDelay) {
	  if (!inste.changeBegan) {
		inste.changeBegan = true;
		inste.changeCompleted = false;
		setCallback('changeBegin');
	  }
	  setCallback('change');
	  setAnimationsProgress(insTime);
	} else {
	  if (inste.changeBegan) {
		inste.changeCompleted = true;
		inste.changeBegan = false;
		setCallback('changeComplete');
	  }
	}
	inste.currentTime = minMax(insTime, 0, insDuration);
	if (inste.began) setCallback('update');
	if (engineTime >= insDuration) {
	  lastTime = 0;
	  countIteration();
	  if (!inste.remaining) {
		inste.paused = true;
		if (!inste.completed) {
		  inste.completed = true;
		  setCallback('loopComplete');
		  setCallback('complete');
		  if (!inste.passThrough && 'Promise' in window) {
			resolve();
			promise = makePromise(inste);
		  }
		}
	  } else {
		startTime = now;
		setCallback('loopComplete');
		inste.loopBegan = false;
		if (inste.direction === 'alternate') {
		  toggleInstanceDirection();
		}
	  }
	}
  }

  inste.reset = function() {
	const direction = inste.direction;
	inste.passThrough = false;
	inste.currentTime = 0;
	inste.progress = 0;
	inste.paused = true;
	inste.began = false;
	inste.loopBegan = false;
	inste.changeBegan = false;
	inste.completed = false;
	inste.changeCompleted = false;
	inste.reversePlayback = false;
	inste.reversed = direction === 'reverse';
	inste.remaining = inste.loop;
	children = inste.children;
	childrenLength = children.length;
	for (let i = childrenLength; i--;) inste.children[i].reset();
	if (inste.reversed && inste.loop !== true || (direction === 'alternate' && inste.loop === 1)) inste.remaining++;
	setAnimationsProgress(inste.reversed ? inste.duration : 0);
  }
  inste.addTargetsToView = function() {
	let i = 0;
	const animations = inste.animations;
	const animationsLength = animations.length;
	while (i < animationsLength) {
	  const anim = animations[i];
	  const animatable = anim.animatable;
	  const atarget = animatable.target;
	  if(  atarget instanceof Item ){
		atarget.addToViewIfNot(anim.duration, anim.delay);
	  }
	  i++;
	}
	var children = inste.children, childrenLength = children.length;
	for (let j = childrenLength; j--;) inste.children[j].addTargetsToView();

  }
  inste._onDocumentVisibility = resetTime;

  inste.set = function(targets, properties) {
	setTargetsValue(targets, properties);
	return inste;
  }

  inste.tick = function(t) {
	now = t;
	if (!startTime) startTime = now;
	setInstanceProgress((now + (lastTime - startTime)) * anime.speed);
  }

  inste.seek = function(time) {
	setInstanceProgress(adjustTime(time));
  }

  inste.pause = function() {
	inste.paused = true;
	resetTime();
  }

  inste.play = function() {
	if (!inste.paused) return;
	if (inste.completed) inste.reset();
	inste.addTargetsToView();
	inste.paused = false;
	activeInstances.push(inste);
	resetTime();
	engine();
  }

  inste.reverse = function() {
	toggleInstanceDirection();
	inste.completed = inste.reversed ? false : true;
	resetTime();
  }

  inste.restart = function() {
	inste.reset();
	inste.play();
  }

  inste.remove = function(targets) {
	const targetsArray = parseTargets(targets);
	removeTargetsFromInstance(targetsArray, inste);
  }

  inste.reset();

  if (inste.autoplay) inste.play();

  return inste;

}

function removeTargetsFromAnimations(targetsArray, animations) {
  for (let a = animations.length; a--;) {
	if (arrayContains(targetsArray, animations[a].animatable.target)) {
	  animations.splice(a, 1);
	}
  }
}

function removeTargetsFromInstance(targetsArray, inste) {
  const animations = inste.animations;
  const children = inste.children;
  removeTargetsFromAnimations(targetsArray, animations);
  for (let c = children.length; c--;) {
	const child = children[c];
	const childAnimations = child.animations;
	removeTargetsFromAnimations(targetsArray, childAnimations);
	if (!childAnimations.length && !child.children.length) children.splice(c, 1);
  }
  if (!animations.length && !children.length) inste.pause();
}

function removeTargetsFromActiveInstances(targets) {
  const targetsArray = parseTargets(targets);
  for (let i = activeInstances.length; i--;) {
	const inste = activeInstances[i];
	removeTargetsFromInstance(targetsArray, inste);
  }
}

function addTimeOffset(relative, added){
	const operator = /^(\*=|\+=|-=|\/=)/.exec(relative);
	if (!operator){
	  return isNaN(relative) ? added : parseFloat(relative) + added;
	}
	const yy =  relative.replace(operator[0], '').slice(1, -1);
	return operator[0] + (yy + added);
}

function stagger(val, params = {}) {
  const direction = params.direction || 'normal';
  const easing = params.easing ? parseEasings(params.easing) : null;
  const grid = params.grid;
  const axis = params.axis;
  let fromIndex = params.from || 0;
  const fromFirst = fromIndex === 'first';
  const fromCenter = fromIndex === 'center';
  const fromLast = fromIndex === 'last';
  const isRange = is.arr(val);
  const val1 = isRange ? parseFloat(val[0]) : parseFloat(val);
  const val2 = isRange ? parseFloat(val[1]) : 0;
  const start = params.start || 0 + (isRange ? val1 : 0);
  let values = [];
  let maxValue = 0;
  return (el, i, t) => {
	if (fromFirst) fromIndex = 0;
	if (fromCenter) fromIndex = (t - 1) / 2;
	if (fromLast) fromIndex = t - 1;
	if (!values.length) {
	  for (let index = 0; index < t; index++) {
		if (!grid) {
		  values.push(Math.abs(fromIndex - index));
		} else {
		  const fromX = !fromCenter ? fromIndex%grid[0] : (grid[0]-1)/2;
		  const fromY = !fromCenter ? Math.floor(fromIndex/grid[0]) : (grid[1]-1)/2;
		  const toX = index%grid[0];
		  const toY = Math.floor(index/grid[0]);
		  const distanceX = fromX - toX;
		  const distanceY = fromY - toY;
		  let value = Math.sqrt(distanceX * distanceX + distanceY * distanceY);
		  if (axis === 'x') value = -distanceX;
		  if (axis === 'y') value = -distanceY;
		  values.push(value);
		}
		maxValue = Math.max(...values);
	  }
	  if (easing) values = values.map(val => easing(val / maxValue) * maxValue);
	  if (direction === 'reverse') values = values.map(val => axis ? (val < 0) ? val * -1 : -val : Math.abs(maxValue - val));
	}
	const spacing = isRange ? (val2 - val1) / maxValue : val1;
	return start + (spacing * (Math.round(values[i] * 100) / 100))  ;
  }
}

function pre_process_params(options){
	if( options.target ) {
	  options.targets = options.target;
	  delete options.target;
	}
	if( !options.targets ) options.targets = {};

	var scaleX = options.scaleX || 1, scaleY = options.scaleY || 1;
	if( scaleX != 1 || scaleY != 1 ){
		options['bounds.size'] = '*=[' + scaleX + ',' + scaleY + ']';
		if( ! options.position ){
			options.position = '+=[0,0]';
		}
		delete options.scaleX;
		delete options.scaleY;
	}
	if( options.positionFunc ){
	  if( typeof options.positionFunc != 'function' ){
		  options.positionFunc = function(from, to, curpos, easing){
			return new Point(curpos.x, curpos.y + Math.sin( 4*Math.PI *easing ) * 50 * (1-easing));
		  }
	  }
	  if( !options.position )
		  options.position = '+=[0,0]';
	}
	if( options.progressFunc  )
		options.pfnc = 0;
	return options;
}

function timeline(params = {}) {
  let tl = anime(params);
  let last = null;
  tl.duration = 0;
  tl.add = function(instanceParams, timelineOffset) {
	const tlIndex = activeInstances.indexOf(tl);
	const children = tl.children;
	if (tlIndex > -1) activeInstances.splice(tlIndex, 1);
	function passThrough(ins) { ins.passThrough = true; };
	for (let i = 0; i < children.length; i++) passThrough(children[i]);
	instanceParams = pre_process_params( instanceParams );
	let insParams = mergeObjects(instanceParams, replaceObjectProps(defaultTweenSettings, params));
	insParams.targets = insParams.targets || params.targets || {};
	const tlDuration = tl.duration;
	insParams.autoplay = false;
	insParams.direction = tl.direction;
	insParams.timelineOffset = is.und(timelineOffset) ? tlDuration : getRelativeValue(timelineOffset, tlDuration);
	if( timelineOffset == '==' && tl ) insParams.timelineOffset = tl.timelineOffset
	passThrough(tl);
	tl.seek(insParams.timelineOffset);
	const ins = anime(insParams);
	last = ins;
	passThrough(ins);
	const totalDuration = ins.duration + insParams.timelineOffset;
	children.push(ins);
	const timings = getInstanceTimings(children, params);
	tl.delay = timings.delay;
	tl.endDelay = timings.endDelay;
	tl.duration = timings.duration;
	tl.seek(0);
	tl.reset();
	if (tl.autoplay) tl.play();
	return tl;
  }
  return tl;
}

anime.version = '3.2.1';
anime.speed = 1;

anime.suspendWhenDocumentHidden = true;
anime.running = activeInstances;
anime.remove = removeTargetsFromActiveInstances;
anime.get = getOriginalTargetValue;
anime.set = setTargetsValue;
anime.stagger = stagger;
anime.timeline = timeline;
anime.engine = engine;
anime.easing = parseEasings;
anime.penner = penner;
anime.addTimeOffset = addTimeOffset;
anime.random = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

 var R9InLayerTimer = Base.extend({
	_class: 'R9InLayerTimer',
	initialize: function R9InLayerTimer(cly, prefix) {
		this.cly = cly;
		this.prefix = prefix;
		this.timer = new TimeTracker();
		this.pList = [];
		this.cdList = [];
		this.chainList = [];
	},
	 addChainedJob :  function(tasks, id,  needPaint, callback ){
		this.chainList.push({tasks: tasks, id : id,  needPaint:needPaint, callback:callback});
	},
	 addProgressJob :  function(func, id, duration, needPaint, callback ){
		var func2 = func.bind( this.cly );
		this.pList.push({func: func2, id : id, duration: duration, progress:0, needPaint:needPaint, callback:callback});
	},
	 addCheckdoneJob :  function(func, id, maxtime,needPaint, callback ){
		var func2 = func.bind( this.cly );
		this.cdList.push({func: func2, id : id, maxtime: maxtime, progress:0, needPaint:needPaint, callback:callback});
	},
	stop :  function(){
		this.timer.pause();
	},
	destroy :  function(){
		this.reset();
		this.cdList =[];
		this.pList =[];
		this.chainList=[];
	} ,
	isEmpty: function(){
	   return  this.pList.length == 0 && this.cdList.length == 0 && this.chainList.length == 0;
	},
	heartbeat :  function(){
		if( this.isEmpty() )  return;
		this.timer.heartbeat_update();
		var delta = this.timer.delta, needToPaint = false;
		for(var i = this.pList.length-1; i >=0; i--){
			var t = this.pList[i];
			t.progress = Math.min( t.duration, t.progress+ delta);
			try{
				t.func( t.progress);
			}catch(e){}
			if( t.needPaint ) needToPaint = true;
			if( t.progress >= t.duration ){
				if( t.callback ){   try{ t.callback(); }catch(e){}  }
				this.pList.splice(i, 1);
			}
		}
		for(var i = this.cdList.length-1; i >=0; i--){
			var t = this.cdList[i];
			t.progress = Math.min( t.maxtime, t.progress+delta);
			try{
			if( t.func() || (t.maxtime && t.progress == t.maxtim)){
					if( t.callback ){   try{ t.callback(); }catch(e){}  }
					this.cdList.splice(i, 1);
			}
			}catch(e){}
			if( t.needPaint ) needToPaint = true;
		}
		for(var i = this.chainList.length-1; i >=0; i--){
			var task = this.chainList[i], t = task.tasks[0];
			if( t.progress == 0){  try{ t.setup(); }catch(e){} }
			t.progress =  Math.min( t.duration, t.progress+delta);
			try{
				t.step( t.progress );
			}catch(e){}
			if( t.needPaint ) needToPaint = true;
			if( t.progress >= target.duration ){
				task.tasks.splice(0, 1);
			}
			if( task.tasks.length == 0 ){
				if( target.callback ){   try{ target.callback(); }catch(e){}  }
				this.chainList.splice(i,1);
			}
		}
		if( needToPaint ){
			this.cly.batchDraw();
		}
	}
});

var R9TimlinePlayer = Base.extend({
	_class: 'R9TimlinePlayer',
	initialize: function R9TimlinePlayer(project, layer, props){
		this.r9 = project;
		this.cly = layer;
		this.name = props.prefix || '';
		this.prefix = props.prefix || '';
		this.bgvideo = props.bgvideo || false;
		this.entry = props.entry || 0;
		this.exit = props.exit || 0;
		this.ease = props.ease || '';
		this.width = props.width || 0;
		this.height = props.height || 0;
		this.chain = new Array();
		this.curStep = 0;
		this.isRunning = false;
		this.i2f = {};
		this.emotions ={};
		this.transpages = [];
		this.r9tmpnodes = [];
		this.r9gnrtrids = {};
		this.timer = new R9InLayerTimer(this.cly, this.prefix);
	},

	destroy: function(cleanuponly){
		this.reset();
		this.emotions = {};
		this. transpages = [];
		if(cleanuponly) { return; }
		this.cly.destroy();
		this.r9.getPageBus().cleanupTimeline(this.prefix);
		this. cly = null;
		this.timer.destroy();
	},
	nextStep : function(){
		var that = this;
		if (that.curStep <  that.chain.length -1)
		{
			that.curStep = that.curStep +1;
			that.processCurrentStep();
		}else
		{
			that.stop();
		}
	},

	processCurrentStep : function(){
		var that = this, curPage = that.getCurPage();
		try{ if(this.r9.removeoverlaplayer) this.r9.removeoverlaplayer(this.prefix); }catch(e){ console.log(e);  }
		if (typeof that._dismissr9keyboard === "function") {  that._dismissr9keyboard(); }
		try{ curPage.setup(); }catch(e){  console.log(e);  }
	},

	getCurPage : function(){
		return this.chain[this.curStep];
	},
	reset : function(){
		var that = this;
		if (that.chain.length == 0)  return;
		that.stop();
		that.curStep = 0;
	},
	start : function(callback){
		var that = this;
		if (that.chain.length == 0 || that.isRunning ) return;
		that.isRunning = true;
		that.processCurrentStep();
		if( callback ) callback();
	},
	resume : function(callback){
		var that = this;
		if (that.chain.length == 0 || that.isRunning ) return;
		that.isRunning = true;
		that.nextStep();
		if( callback ) callback();
	},
	stop : function(){
		var that = this;
		that.isRunning = false;
	},
	addPage : function(page){
		this.chain.push(page);
	},
	remove: function(page){
		const index = this.chain.indexOf(page);
		if (index > -1) {
			this.chain.splice(index, 1);
		}
	},
	distroy : function(){
		this.stop();
		this.chain = [];
	},

	restartFrom : function(page, phasePosition){
		this.stop();
		var p = this.chain[phasePosition];
		page.transtime = p.transtime;
		page.staytime = p.staytime;
		this.chain[phasePosition] = page;
		this.curStep = phasePosition;
		this.processCurrentStep();
	},

	initialStartFrom : function(phasePosition){
		this.stop();
		this.isRunning = true;
		this.curStep = phasePosition;
		this.processCurrentStep();
	},
});

var TimeTracker = Base.extend({
	_class: 'TimeTracker',
	initialize: function TimeTracker( ) {
	   this.reset();
	},
	heartbeat_update: function(){
		var now = Date.now() / 1000;
		this.delta = this._last ? now - this._last : 0;
		this._last = now;
		this._time += delta;
		this._count++;
	},
	pause: function(){
		this._last = 0;
	},
	reset: function(){
		this._last = 0;
		this._time = 0;
		this._count = 0;
		this._delta = 0;
	}
});

var Page = Base.extend({
	_class: 'Page',
	initialize: function Page(  cly, prefix, pos,  block){
		let that = this;
		this.cly = cly;
		this.ptimer =   anime.timeline({
			autoplay: false,
			complete: function(){
				if( !that.blockAnimation )
					cly._player.nextStep();
				else
					cly._player.stop();
			}
		  });
		this.blockAnimation = block || false;
		this.staytime = 0;
		this.prefix = prefix;
		this.pos = pos;
		cly.addPage(this);
		this.initialized = false;
	},
	remove: function(){
		this.cly.removePage( this );
		this.pos = -1;
	},
	add_func_to_tl: function(func, offset){
		this.ptimer.add( {
			targets: this,
			eventFunc:  func,
			duration: 0.1
		}, offset );
	},
	add_to_tl: function(param, offset){
				this.ptimer.add(param, offset);
	},
	wait: function(duration){
		this.ptimer.add( {
			targets: this,
			eventFunc: function(){},
			duration: 0.1,
		}, '+=' + (duration || 1) );
	},
	setup: function(){
		if( this.initialized ) return;
		this.initialized = true;
		this.setup2(this, this.cly, this.ptimer);
		if( this.staytime > 0 ){
		   this.wait(this.staytime);
		}
		this.cly._changed();
		this.ptimer.play();
	},
	setup2: function(curPage,  curLayer, curTimeline){
	},
	createItems: function(  options, offset, doneCallback){
	   this.cly.createItems(this.ptimer, options, offset, doneCallback);
	},
	uncreateItems: function(  options, offset, doneCallback){
		this.cly.uncreateItems(this.ptimer, options, offset, doneCallback);
	 },
});

var Http = {
	request: function(options) {
		var xhr = new self.XMLHttpRequest();
		xhr.open((options.method || 'get').toUpperCase(), options.url,
				Base.pick(options.async, true));
		if (options.mimeType)
			xhr.overrideMimeType(options.mimeType);
		xhr.onload = function() {
			var status = xhr.status;
			if (status === 0 || status === 200) {
				if (options.onLoad) {
					options.onLoad.call(xhr, xhr.responseText);
				}
			} else {
				xhr.onerror();
			}
		};
		xhr.onerror = function() {
			var status = xhr.status,
				message = 'Could not load "' + options.url + '" (Status: '
						+ status + ')';
			if (options.onError) {
				options.onError(message, status);
			} else {
				throw new Error(message);
			}
		};
		return xhr.send(null);
	}
};

var CanvasProvider = Base.exports.CanvasProvider = {
	canvases: [],

	getCanvas: function(width, height) {
		if (!window)
			return null;
		var canvas,
			clear = true;
		if (typeof width === 'object') {
			height = width.height;
			width = width.width;
		}
		if (this.canvases.length) {
			canvas = this.canvases.pop();
		} else {
			canvas = document.createElement('canvas');
			clear = false;
		}
		var ctx = canvas.getContext('2d');
		if (!ctx) {
			throw new Error('Canvas ' + canvas +
					' is unable to provide a 2D context.');
		}
		if (canvas.width === width && canvas.height === height) {
			if (clear)
				ctx.clearRect(0, 0, width + 1, height + 1);
		} else {
			canvas.width = width;
			canvas.height = height;
		}
		ctx.save();
		return canvas;
	},

	getContext: function(width, height) {
		var canvas = this.getCanvas(width, height);
		return canvas ? canvas.getContext('2d') : null;
	},

	release: function(obj) {
		var canvas = obj && obj.canvas ? obj.canvas : obj;
		if (canvas && canvas.getContext) {
			canvas.getContext('2d').restore();
			this.canvases.push(canvas);
		}
	}
};

var BlendMode = new function() {
	var min = Math.min,
		max = Math.max,
		abs = Math.abs,
		sr, sg, sb, sa,
		br, bg, bb, ba,
		dr, dg, db;

	function getLum(r, g, b) {
		return 0.2989 * r + 0.587 * g + 0.114 * b;
	}

	function setLum(r, g, b, l) {
		var d = l - getLum(r, g, b);
		dr = r + d;
		dg = g + d;
		db = b + d;
		var l = getLum(dr, dg, db),
			mn = min(dr, dg, db),
			mx = max(dr, dg, db);
		if (mn < 0) {
			var lmn = l - mn;
			dr = l + (dr - l) * l / lmn;
			dg = l + (dg - l) * l / lmn;
			db = l + (db - l) * l / lmn;
		}
		if (mx > 255) {
			var ln = 255 - l,
				mxl = mx - l;
			dr = l + (dr - l) * ln / mxl;
			dg = l + (dg - l) * ln / mxl;
			db = l + (db - l) * ln / mxl;
		}
	}

	function getSat(r, g, b) {
		return max(r, g, b) - min(r, g, b);
	}

	function setSat(r, g, b, s) {
		var col = [r, g, b],
			mx = max(r, g, b),
			mn = min(r, g, b),
			md;
		mn = mn === r ? 0 : mn === g ? 1 : 2;
		mx = mx === r ? 0 : mx === g ? 1 : 2;
		md = min(mn, mx) === 0 ? max(mn, mx) === 1 ? 2 : 1 : 0;
		if (col[mx] > col[mn]) {
			col[md] = (col[md] - col[mn]) * s / (col[mx] - col[mn]);
			col[mx] = s;
		} else {
			col[md] = col[mx] = 0;
		}
		col[mn] = 0;
		dr = col[0];
		dg = col[1];
		db = col[2];
	}

	var modes = {
		multiply: function() {
			dr = br * sr / 255;
			dg = bg * sg / 255;
			db = bb * sb / 255;
		},

		screen: function() {
			dr = br + sr - (br * sr / 255);
			dg = bg + sg - (bg * sg / 255);
			db = bb + sb - (bb * sb / 255);
		},

		overlay: function() {
			dr = br < 128 ? 2 * br * sr / 255 : 255 - 2 * (255 - br) * (255 - sr) / 255;
			dg = bg < 128 ? 2 * bg * sg / 255 : 255 - 2 * (255 - bg) * (255 - sg) / 255;
			db = bb < 128 ? 2 * bb * sb / 255 : 255 - 2 * (255 - bb) * (255 - sb) / 255;
		},

		'soft-light': function() {
			var t = sr * br / 255;
			dr = t + br * (255 - (255 - br) * (255 - sr) / 255 - t) / 255;
			t = sg * bg / 255;
			dg = t + bg * (255 - (255 - bg) * (255 - sg) / 255 - t) / 255;
			t = sb * bb / 255;
			db = t + bb * (255 - (255 - bb) * (255 - sb) / 255 - t) / 255;
		},

		'hard-light': function() {
			dr = sr < 128 ? 2 * sr * br / 255 : 255 - 2 * (255 - sr) * (255 - br) / 255;
			dg = sg < 128 ? 2 * sg * bg / 255 : 255 - 2 * (255 - sg) * (255 - bg) / 255;
			db = sb < 128 ? 2 * sb * bb / 255 : 255 - 2 * (255 - sb) * (255 - bb) / 255;
		},

		'color-dodge': function() {
			dr = br === 0 ? 0 : sr === 255 ? 255 : min(255, 255 * br / (255 - sr));
			dg = bg === 0 ? 0 : sg === 255 ? 255 : min(255, 255 * bg / (255 - sg));
			db = bb === 0 ? 0 : sb === 255 ? 255 : min(255, 255 * bb / (255 - sb));
		},

		'color-burn': function() {
			dr = br === 255 ? 255 : sr === 0 ? 0 : max(0, 255 - (255 - br) * 255 / sr);
			dg = bg === 255 ? 255 : sg === 0 ? 0 : max(0, 255 - (255 - bg) * 255 / sg);
			db = bb === 255 ? 255 : sb === 0 ? 0 : max(0, 255 - (255 - bb) * 255 / sb);
		},

		darken: function() {
			dr = br < sr ? br : sr;
			dg = bg < sg ? bg : sg;
			db = bb < sb ? bb : sb;
		},

		lighten: function() {
			dr = br > sr ? br : sr;
			dg = bg > sg ? bg : sg;
			db = bb > sb ? bb : sb;
		},

		difference: function() {
			dr = br - sr;
			if (dr < 0)
				dr = -dr;
			dg = bg - sg;
			if (dg < 0)
				dg = -dg;
			db = bb - sb;
			if (db < 0)
				db = -db;
		},

		exclusion: function() {
			dr = br + sr * (255 - br - br) / 255;
			dg = bg + sg * (255 - bg - bg) / 255;
			db = bb + sb * (255 - bb - bb) / 255;
		},

		hue: function() {
			setSat(sr, sg, sb, getSat(br, bg, bb));
			setLum(dr, dg, db, getLum(br, bg, bb));
		},

		saturation: function() {
			setSat(br, bg, bb, getSat(sr, sg, sb));
			setLum(dr, dg, db, getLum(br, bg, bb));
		},

		luminosity: function() {
			setLum(br, bg, bb, getLum(sr, sg, sb));
		},

		color: function() {
			setLum(sr, sg, sb, getLum(br, bg, bb));
		},

		add: function() {
			dr = min(br + sr, 255);
			dg = min(bg + sg, 255);
			db = min(bb + sb, 255);
		},

		subtract: function() {
			dr = max(br - sr, 0);
			dg = max(bg - sg, 0);
			db = max(bb - sb, 0);
		},

		average: function() {
			dr = (br + sr) / 2;
			dg = (bg + sg) / 2;
			db = (bb + sb) / 2;
		},

		negation: function() {
			dr = 255 - abs(255 - sr - br);
			dg = 255 - abs(255 - sg - bg);
			db = 255 - abs(255 - sb - bb);
		}
	};

	var nativeModes = this.nativeModes = Base.each([
		'source-over', 'source-in', 'source-out', 'source-atop',
		'destination-over', 'destination-in', 'destination-out',
		'destination-atop', 'lighter', 'darker', 'copy', 'xor'
	], function(mode) {
		this[mode] = true;
	}, {});

	var ctx = CanvasProvider.getContext(1, 1);
	if (ctx) {
		Base.each(modes, function(func, mode) {
			var darken = mode === 'darken',
				ok = false;
			ctx.save();
			try {
				ctx.fillStyle = darken ? '#300' : '#a00';
				ctx.fillRect(0, 0, 1, 1);
				ctx.globalCompositeOperation = mode;
				if (ctx.globalCompositeOperation === mode) {
					ctx.fillStyle = darken ? '#a00' : '#300';
					ctx.fillRect(0, 0, 1, 1);
					ok = ctx.getImageData(0, 0, 1, 1).data[0] !== darken
							? 170 : 51;
				}
			} catch (e) {}
			ctx.restore();
			nativeModes[mode] = ok;
		});
		CanvasProvider.release(ctx);
	}

	this.process = function(mode, srcContext, dstContext, alpha, offset) {
		var srcCanvas = srcContext.canvas,
			normal = mode === 'normal';
		if (normal || nativeModes[mode]) {
			dstContext.save();
			dstContext.setTransform(1, 0, 0, 1, 0, 0);
			dstContext.globalAlpha = alpha;
			if (!normal)
				dstContext.globalCompositeOperation = mode;
			dstContext.drawImage(srcCanvas, offset.x, offset.y);
			dstContext.restore();
		} else {
			var process = modes[mode];
			if (!process)
				return;
			var dstData = dstContext.getImageData(offset.x, offset.y,
					srcCanvas.width, srcCanvas.height),
				dst = dstData.data,
				src = srcContext.getImageData(0, 0,
					srcCanvas.width, srcCanvas.height).data;
			for (var i = 0, l = dst.length; i < l; i += 4) {
				sr = src[i];
				br = dst[i];
				sg = src[i + 1];
				bg = dst[i + 1];
				sb = src[i + 2];
				bb = dst[i + 2];
				sa = src[i + 3];
				ba = dst[i + 3];
				process();
				var a1 = sa * alpha / 255,
					a2 = 1 - a1;
				dst[i] = a1 * dr + a2 * br;
				dst[i + 1] = a1 * dg + a2 * bg;
				dst[i + 2] = a1 * db + a2 * bb;
				dst[i + 3] = sa * alpha + a2 * ba;
			}
			dstContext.putImageData(dstData, offset.x, offset.y);
		}
	};
};

var SvgElement = new function() {
	var svg = 'http://www.w3.org/2000/svg',
		xmlns = 'http://www.w3.org/2000/xmlns',
		xlink = 'http://www.w3.org/1999/xlink',
		attributeNamespace = {
			href: xlink,
			xlink: xmlns,
			xmlns: xmlns + '/',
			'xmlns:xlink': xmlns + '/'
		};

	function create(tag, attributes, formatter) {
		return set(document.createElementNS(svg, tag), attributes, formatter);
	}

	function get(node, name) {
		var namespace = attributeNamespace[name],
			value = namespace
				? node.getAttributeNS(namespace, name)
				: node.getAttribute(name);
		return value === 'null' ? null : value;
	}

	function set(node, attributes, formatter) {
		for (var name in attributes) {
			var value = attributes[name],
				namespace = attributeNamespace[name];
			if (typeof value === 'number' && formatter)
				value = formatter.number(value);
			if (namespace) {
				node.setAttributeNS(namespace, name, value);
			} else {
				node.setAttribute(name, value);
			}
		}
		return node;
	}

	return {
		svg: svg,
		xmlns: xmlns,
		xlink: xlink,

		create: create,
		get: get,
		set: set
	};
};

var SvgStyles = Base.each({
	fillColor: ['fill', 'color'],
	fillRule: ['fill-rule', 'string'],
	strokeColor: ['stroke', 'color'],
	strokeWidth: ['stroke-width', 'number'],
	strokeCap: ['stroke-linecap', 'string'],
	strokeJoin: ['stroke-linejoin', 'string'],
	strokeScaling: ['vector-effect', 'lookup', {
		true: 'none',
		false: 'non-scaling-stroke'
	}, function(item, value) {
		return !value
				&& (item instanceof PathItem
					|| item instanceof Shape
					|| item instanceof TextItem);
	}],
	miterLimit: ['stroke-miterlimit', 'number'],
	dashArray: ['stroke-dasharray', 'array'],
	dashOffset: ['stroke-dashoffset', 'number'],
	fontFamily: ['font-family', 'string'],
	fontWeight: ['font-weight', 'string'],
	fontSize: ['font-size', 'number'],
	justification: ['text-anchor', 'lookup', {
		left: 'start',
		center: 'middle',
		right: 'end'
	}],
	opacity: ['opacity', 'number'],
	blendMode: ['mix-blend-mode', 'style']
}, function(entry, key) {
	var part = Base.capitalize(key),
		lookup = entry[2];
	this[key] = {
		type: entry[1],
		property: key,
		attribute: entry[0],
		toSVG: lookup,
		fromSVG: lookup && Base.each(lookup, function(value, name) {
			this[value] = name;
		}, {}),
		exportFilter: entry[3],
		get: 'get' + part,
		set: 'set' + part
	};
}, {});

new function() {
	var formatter;

	function getTransform(matrix, coordinates, center) {
		var attrs = new Base(),
			trans = matrix.getTranslation();
		if (coordinates) {
			var point;
			if (matrix.isInvertible()) {
				matrix = matrix._shiftless();
				point = matrix._inverseTransform(trans);
				trans = null;
			} else {
				point = new Point();
			}
			attrs[center ? 'cx' : 'x'] = point.x;
			attrs[center ? 'cy' : 'y'] = point.y;
		}
		if (!matrix.isIdentity()) {
			var decomposed = matrix.decompose();
			if (decomposed) {
				var parts = [],
					angle = decomposed.rotation,
					scale = decomposed.scaling,
					skew = decomposed.skewing;
				if (trans && !trans.isZero())
					parts.push('translate(' + formatter.point(trans) + ')');
				if (angle)
					parts.push('rotate(' + formatter.number(angle) + ')');
				if (!Numerical.isZero(scale.x - 1)
						|| !Numerical.isZero(scale.y - 1))
					parts.push('scale(' + formatter.point(scale) +')');
				if (skew.x)
					parts.push('skewX(' + formatter.number(skew.x) + ')');
				if (skew.y)
					parts.push('skewY(' + formatter.number(skew.y) + ')');
				attrs.transform = parts.join(' ');
			} else {
				attrs.transform = 'matrix(' + matrix.getValues().join(',') + ')';
			}
		}
		return attrs;
	}

	function exportGroup(item, options) {
		var attrs = getTransform(item._matrix),
			children = item._children;
		var node = SvgElement.create('g', attrs, formatter);
		for (var i = 0, l = children.length; i < l; i++) {
			var child = children[i];
			var childNode = exportSVG(child, options);
			if (childNode) {
				if (child.isClipMask()) {
					var clip = SvgElement.create('clipPath');
					clip.appendChild(childNode);
					setDefinition(child, clip, 'clip');
					SvgElement.set(node, {
						'clip-path': 'url(#' + clip.id + ')'
					});
				} else {
					node.appendChild(childNode);
				}
			}
		}
		return node;
	}

	function exportRaster(item, options) {
		var attrs = getTransform(item._matrix, true),
			size = item.getSize(),
			image = item.getImage();
		attrs.x -= size.width / 2;
		attrs.y -= size.height / 2;
		attrs.width = size.width;
		attrs.height = size.height;
		attrs.href = options.embedImages == false && image && image.src
				|| item.toDataURL();
		return SvgElement.create('image', attrs, formatter);
	}

	function exportSprite(item, options) {
		var attrs = getTransform(item._matrix, true),
			size = item.getSize(),
			image = item.getImage();
		attrs.x -= size.width / 2;
		attrs.y -= size.height / 2;
		attrs.width = size.width;
		attrs.height = size.height;
		attrs.frameIndex = item._frameIndex;
		attrs.frameRate = item._frameRate;
		attrs._animation = item._animation;
		attrs._animations = item._animations;
		attrs.href = options.embedImages == false && image && image.src
				|| item.toDataURL();
		return SvgElement.create('image', attrs, formatter);
	}
	function exportPath(item, options) {
		var matchShapes = options.matchShapes;
		if (matchShapes) {
			var shape = item.toShape(false);
			if (shape)
				return exportShape(shape, options);
		}
		var segments = item._segments,
			length = segments.length,
			type,
			attrs = getTransform(item._matrix);
		if (matchShapes && length >= 2 && !item.hasHandles()) {
			if (length > 2) {
				type = item._closed ? 'polygon' : 'polyline';
				var parts = [];
				for (var i = 0; i < length; i++) {
					parts.push(formatter.point(segments[i]._point));
				}
				attrs.points = parts.join(' ');
			} else {
				type = 'line';
				var start = segments[0]._point,
					end = segments[1]._point;
				attrs.set({
					x1: start.x,
					y1: start.y,
					x2: end.x,
					y2: end.y
				});
			}
		} else {
			type = 'path';
			attrs.d = item.getPathData(null, options.precision);
		}
		return SvgElement.create(type, attrs, formatter);
	}

	function exportShape(item) {
		var type = item._type,
			radius = item._radius,
			attrs = getTransform(item._matrix, true, type !== 'rectangle');
		if (type === 'rectangle') {
			type = 'rect';
			var size = item._size,
				width = size.width,
				height = size.height;
			attrs.x -= width / 2;
			attrs.y -= height / 2;
			attrs.width = width;
			attrs.height = height;
			if (radius.isZero())
				radius = null;
		}
		if (radius) {
			if (type === 'circle') {
				attrs.r = radius;
			} else {
				attrs.rx = radius.width;
				attrs.ry = radius.height;
			}
		}
		return SvgElement.create(type, attrs, formatter);
	}

	function exportCompoundPath(item, options) {
		var attrs = getTransform(item._matrix);
		var data = item.getPathData(null, options.precision);
		if (data)
			attrs.d = data;
		return SvgElement.create('path', attrs, formatter);
	}

	function exportSymbolItem(item, options) {
		var attrs = getTransform(item._matrix, true),
			definition = item._definition,
			node = getDefinition(definition, 'symbol'),
			definitionItem = definition._item,
			bounds = definitionItem.getStrokeBounds();
		if (!node) {
			node = SvgElement.create('symbol', {
				viewBox: formatter.rectangle(bounds)
			});
			node.appendChild(exportSVG(definitionItem, options));
			setDefinition(definition, node, 'symbol');
		}
		attrs.href = '#' + node.id;
		attrs.x += bounds.x;
		attrs.y += bounds.y;
		attrs.width = bounds.width;
		attrs.height = bounds.height;
		attrs.overflow = 'visible';
		return SvgElement.create('use', attrs, formatter);
	}

	function exportGradient(color) {
		var gradientNode = getDefinition(color, 'color');
		if (!gradientNode) {
			var gradient = color.getGradient(),
				radial = gradient._radial,
				origin = color.getOrigin(),
				destination = color.getDestination(),
				attrs;
			if (radial) {
				attrs = {
					cx: origin.x,
					cy: origin.y,
					r: origin.getDistance(destination)
				};
				var highlight = color.getHighlight();
				if (highlight) {
					attrs.fx = highlight.x;
					attrs.fy = highlight.y;
				}
			} else {
				attrs = {
					x1: origin.x,
					y1: origin.y,
					x2: destination.x,
					y2: destination.y
				};
			}
			attrs.gradientUnits = 'userSpaceOnUse';
			gradientNode = SvgElement.create((radial ? 'radial' : 'linear')
					+ 'Gradient', attrs, formatter);
			var stops = gradient._stops;
			for (var i = 0, l = stops.length; i < l; i++) {
				var stop = stops[i],
					stopColor = stop._color,
					alpha = stopColor.getAlpha(),
					offset = stop._offset;
				attrs = {
					offset: offset == null ? i / (l - 1) : offset
				};
				if (stopColor)
					attrs['stop-color'] = stopColor.toCSS(true);
				if (alpha < 1)
					attrs['stop-opacity'] = alpha;
				gradientNode.appendChild(
						SvgElement.create('stop', attrs, formatter));
			}
			setDefinition(color, gradientNode, 'color');
		}
		return 'url(#' + gradientNode.id + ')';
	}

	function exportText(item) {
		var node = SvgElement.create('text', getTransform(item._matrix, true),
				formatter);
		node.textContent = item._content;
		return node;
	}

	var exporters = {
		Group: exportGroup,
		Layer: exportGroup,
		Raster: exportRaster,
		Sprite: exportSprite,
		Path: exportPath,
		Shape: exportShape,
		CompoundPath: exportCompoundPath,
		SymbolItem: exportSymbolItem,
		PointText: exportText
	};

	function applyStyle(item, node, isRoot) {
		var attrs = {},
			parent = !isRoot && item.getParent(),
			style = [];

		if (item._name != null)
			attrs.id = item._name;

		Base.each(SvgStyles, function(entry) {
			var get = entry.get,
				type = entry.type,
				value = item[get]();
			if (entry.exportFilter
					? entry.exportFilter(item, value)
					: !parent || !Base.equals(parent[get](), value)) {
				if (type === 'color' && value != null) {
					var alpha = value.getAlpha();
					if (alpha < 1)
						attrs[entry.attribute + '-opacity'] = alpha;
				}
				if (type === 'style') {
					style.push(entry.attribute + ': ' + value);
				} else {
					attrs[entry.attribute] = value == null ? 'none'
							: type === 'color' ? value.gradient
								? exportGradient(value, item)
								: value.toCSS(true)
							: type === 'array' ? value.join(',')
							: type === 'lookup' ? entry.toSVG[value]
							: value;
				}
			}
		});

		if (style.length)
			attrs.style = style.join(';');

		if (attrs.opacity === 1)
			delete attrs.opacity;

		if (!item._visible)
			attrs.visibility = 'hidden';

		return SvgElement.set(node, attrs, formatter);
	}

	var definitions;
	function getDefinition(item, type) {
		if (!definitions)
			definitions = { ids: {}, svgs: {} };
		return item && definitions.svgs[type + '-'
				+ (item._id || item.__id || (item.__id = UID.get('svg')))];
	}

	function setDefinition(item, node, type) {
		if (!definitions)
			getDefinition();
		var typeId = definitions.ids[type] = (definitions.ids[type] || 0) + 1;
		node.id = type + '-' + typeId;
		definitions.svgs[type + '-' + (item._id || item.__id)] = node;
	}

	function exportDefinitions(node, options) {
		var svg = node,
			defs = null;
		if (definitions) {
			svg = node.nodeName.toLowerCase() === 'svg' && node;
			for (var i in definitions.svgs) {
				if (!defs) {
					if (!svg) {
						svg = SvgElement.create('svg');
						svg.appendChild(node);
					}
					defs = svg.insertBefore(SvgElement.create('defs'),
							svg.firstChild);
				}
				defs.appendChild(definitions.svgs[i]);
			}
			definitions = null;
		}
		return options.asString
				? new self.XMLSerializer().serializeToString(svg)
				: svg;
	}

	function exportSVG(item, options, isRoot) {
		var exporter = exporters[item._class],
			node = exporter && exporter(item, options);
		if (node) {
			var onExport = options.onExport;
			if (onExport)
				node = onExport(item, node, options) || node;
			var data = JSON.stringify(item._data);
			if (data && data !== '{}' && data !== 'null')
				node.setAttribute('data-mpaper-data', data);
		}
		return node && applyStyle(item, node, isRoot);
	}

	function setOptions(options) {
		if (!options)
			options = {};
		formatter = new Formatter(options.precision);
		return options;
	}

	Item.inject({
		exportSVG: function(options) {
			options = setOptions(options);
			return exportDefinitions(exportSVG(this, options, true), options);
		}
	});

	Project.inject({
		exportSVG: function(options) {
			options = setOptions(options);
			var children = this._children,
				view = this.getView(),
				bounds = Base.pick(options.bounds, 'view'),
				mx = options.matrix || bounds === 'view' && view._matrix,
				matrix = mx && Matrix.read([mx]),
				rect = bounds === 'view'
					? new Rectangle([0, 0], view.getViewSize())
					: bounds === 'content'
						? Item._getBounds(children, matrix, { stroke: true })
							.rect
						: Rectangle.read([bounds], 0, { readNull: true }),
				attrs = {
					version: '1.1',
					xmlns: SvgElement.svg,
					'xmlns:xlink': SvgElement.xlink,
				};
			if (rect) {
				attrs.width = rect.width;
				attrs.height = rect.height;
				if (rect.x || rect.x === 0 || rect.y || rect.y === 0)
					attrs.viewBox = formatter.rectangle(rect);
			}
			var node = SvgElement.create('svg', attrs, formatter),
				parent = node;
			if (matrix && !matrix.isIdentity()) {
				parent = node.appendChild(SvgElement.create('g',
						getTransform(matrix), formatter));
			}
			for (var i = 0, l = children.length; i < l; i++) {
				parent.appendChild(exportSVG(children[i], options, true));
			}
			return exportDefinitions(node, options);
		}
	});
};

new function() {

	var definitions = {}, def2cache = true, idmapper,
		rootSize;

	function getValue(node, name, isString, allowNull, allowPercent,
			defaultValue) {
		var value = SvgElement.get(node, name) || defaultValue,
			res = value == null
				? allowNull
					? null
					: isString ? '' : 0
				: isString
					? value
					: parseFloat(value);
		return /%\s*$/.test(value)
			? (res / 100) * (allowPercent ? 1
				: rootSize[/x|^width/.test(name) ? 'width' : 'height'])
			: res;
	}

	function getPoint(node, x, y, allowNull, allowPercent, defaultX, defaultY) {
		x = getValue(node, x || 'x', false, allowNull, allowPercent, defaultX);
		y = getValue(node, y || 'y', false, allowNull, allowPercent, defaultY);
		return allowNull && (x == null || y == null) ? null
				: new Point(x, y);
	}

	function getSize(node, w, h, allowNull, allowPercent) {
		w = getValue(node, w || 'width', false, allowNull, allowPercent);
		h = getValue(node, h || 'height', false, allowNull, allowPercent);
		return allowNull && (w == null || h == null) ? null
				: new Size(w, h);
	}

	function convertValue(value, type, lookup) {
		return value === 'none' ? null
				: type === 'number' ? parseFloat(value)
				: type === 'array' ?
					value ? value.split(/[\s,]+/g).map(parseFloat) : []
				: type === 'color' ? getDefinition(value) || value
				: type === 'lookup' ? lookup[value]
				: value;
	}

	function importGroup(node, type, options, isRoot) {
		var nodes = node.childNodes,
			isClip = type === 'clippath',
			isDefs = type === 'defs',
			item = new Group(),
			project = item._project,
			currentStyle = project._currentStyle,
			children = [];
		if (!isClip && !isDefs) {
			item = applyAttributes(item, node, isRoot);
			 project._currentStyle = item._style.clone();
		}
		if (isRoot) {
			var defs = node.querySelectorAll('defs');
			for (var i = 0, l = defs.length; i < l; i++) {
				importNode(defs[i], options, false);
			}
		}
		for (var i = 0, l = nodes.length; i < l; i++) {
			var childNode = nodes[i],
				child;
			if (childNode.nodeType === 1
					&& !/^defs$/i.test(childNode.nodeName)
					&& (child = importNode(childNode, options, false))
					&& !(child instanceof SymbolDefinition))
				children.push(child);
		}
		item.addChildren(children);
		if (isClip)
			item = applyAttributes(item.reduce(), node, isRoot);
		  project._currentStyle = currentStyle;
		if (isClip || isDefs) {
			item.remove();
			item = null;
		}
		return item;
	}

	function importPoly(node, type) {
		var coords = node.getAttribute('points').match(
					/[+-]?(?:\d*\.\d+|\d+\.?)(?:[eE][+-]?\d+)?/g),
			points = [];
		for (var i = 0, l = coords.length; i < l; i += 2)
			points.push(new Point(
					parseFloat(coords[i]),
					parseFloat(coords[i + 1])));
		var path = new Path(points);
		if (type === 'polygon')
			path.closePath();
		return path;
	}

	function importPath(node) {
		return PathItem.create(node.getAttribute('d'));
	}

	function importGradient(node, type) {
		var id = (getValue(node, 'href', true) || '').substring(1),
			radial = type === 'radialgradient',
			gradient;
		if (id) {
			var def;
			if(  def2cache ){
				var mappedId =  idmapper ?  idmapper(id) : id,
					project = mpaper.project ;
					def = project.cachedItemDefs[mappedId];
			}
			if( !def )
				def = definitions[id];

			gradient = def.getGradient();
			if (gradient._radial ^ radial) {
				gradient = gradient.clone();
				gradient._radial = radial;
			}
		} else {
			var nodes = node.childNodes,
				stops = [];
			for (var i = 0, l = nodes.length; i < l; i++) {
				var child = nodes[i];
				if (child.nodeType === 1)
					stops.push(applyAttributes(new GradientStop(), child));
			}
			gradient = new Gradient(stops, radial);
		}
		var origin, destination, highlight,
			scaleToBounds = getValue(node, 'gradientUnits', true) !==
				'userSpaceOnUse';
		if (radial) {
			origin = getPoint(node, 'cx', 'cy', false, scaleToBounds,
				'50%', '50%');
			destination = origin.add(
				getValue(node, 'r', false, false, scaleToBounds, '50%'), 0);
			highlight = getPoint(node, 'fx', 'fy', true, scaleToBounds);
		} else {
			origin = getPoint(node, 'x1', 'y1', false, scaleToBounds,
				'0%', '0%');
			destination = getPoint(node, 'x2', 'y2', false, scaleToBounds,
				'100%', '0%');
		}
		var color = applyAttributes(
				new Color(gradient, origin, destination, highlight), node);
		color._scaleToBounds = scaleToBounds;
		return null;
	}

	var importers = {
		'#document': function (node, type, options, isRoot) {
			var nodes = node.childNodes;
			for (var i = 0, l = nodes.length; i < l; i++) {
				var child = nodes[i];
				if (child.nodeType === 1)
					return importNode(child, options, isRoot);
			}
		},
		g: importGroup,
		svg: importGroup,
		clippath: importGroup,
		polygon: importPoly,
		polyline: importPoly,
		path: importPath,
		lineargradient: importGradient,
		radialgradient: importGradient,

		image: function (node) {
			var animation = getValue(node, 'animation')
			var raster = new Raster(getValue(node, 'href', true));
			raster.on('load', function() {
				var size = getSize(node);
				this.setSize(size);
				var center = getPoint(node).add(size.divide(2));
				this._matrix.append(new Matrix().translate(center));
			});
			return raster;
		},

		symbol: function(node, type, options, isRoot) {
			return new SymbolDefinition(
					importGroup(node, type, options, isRoot), true);
		},

		defs: importGroup,

		use: function(node, type, options, isRoot) {
			var id = (getValue(node, 'href', true) || '').substring(1),
				definition,
				point = getPoint(node);
			if(  def2cache ){
				var mappedId =  idmapper ?  idmapper(id) : id,
					project = options && options.project || mpaper.project ;
				definition = project.cachedItemDefs[mappedId];
			}
			if( !definition )
				definition = definitions[id];
			return definition
					? definition instanceof SymbolDefinition
						? definition.place(point)
						: definition.clone().translate(point)
					: null;
		},

		circle: function(node) {
			return new Shape.Circle(
					getPoint(node, 'cx', 'cy'),
					getValue(node, 'r'));
		},

		ellipse: function(node) {
			return new Shape.Ellipse({
				center: getPoint(node, 'cx', 'cy'),
				radius: getSize(node, 'rx', 'ry')
			});
		},

		rect: function(node) {
			return new Shape.Rectangle(new Rectangle(
						getPoint(node),
						getSize(node)
					), getSize(node, 'rx', 'ry'));
			},

		line: function(node) {
			return new Path.Line(
					getPoint(node, 'x1', 'y1'),
					getPoint(node, 'x2', 'y2'));
		},

		text: function(node) {
			var text = new PointText(getPoint(node).add(
					getPoint(node, 'dx', 'dy')));
			text.setContent(node.textContent.trim() || '');
			return text;
		},

		switch: importGroup
	};

	function applyTransform(item, value, name, node) {
		if (item.transform) {
			var transforms = (node.getAttribute(name) || '').split(/\)\s*/g),
				matrix = new Matrix();
			for (var i = 0, l = transforms.length; i < l; i++) {
				var transform = transforms[i];
				if (!transform)
					break;
				var parts = transform.split(/\(\s*/),
					command = parts[0],
					v = parts[1].split(/[\s,]+/g);
				for (var j = 0, m = v.length; j < m; j++)
					v[j] = parseFloat(v[j]);
				switch (command) {
				case 'matrix':
					matrix.append(
							new Matrix(v[0], v[1], v[2], v[3], v[4], v[5]));
					break;
				case 'rotate':
					matrix.rotate(v[0], v[1] || 0, v[2] || 0);
					break;
				case 'translate':
					matrix.translate(v[0], v[1] || 0);
					break;
				case 'scale':
					matrix.scale(v);
					break;
				case 'skewX':
					matrix.skew(v[0], 0);
					break;
				case 'skewY':
					matrix.skew(0, v[0]);
					break;
				}
			}
			item.transform(matrix);
		}
	}

	function applyOpacity(item, value, name) {
		var key = name === 'fill-opacity' ? 'getFillColor' : 'getStrokeColor',
			color = item[key] && item[key]();
		if (color)
			color.setAlpha(parseFloat(value));
	}

	var attributes = Base.set(Base.each(SvgStyles, function(entry) {
		this[entry.attribute] = function(item, value) {
			if (item[entry.set]) {
				item[entry.set](convertValue(value, entry.type, entry.fromSVG));
				if (entry.type === 'color') {
					var color = item[entry.get]();
					if (color) {
						if (color._scaleToBounds) {
							var bounds = item.getBounds();
							color.transform(new Matrix()
								.translate(bounds.getPoint())
								.scale(bounds.getSize()));
						}
					}
				}
			}
		};
	}, {}), {
		id: function(item, value, options) {
			if(  def2cache ){
				var mappedId =  idmapper ?  idmapper(value) : value,
					project = options && options.project || mpaper.project ;
				project.cachedItemDefs[mappedId] = item;
			}
			else
				definitions[value] = item;
			if (item.setName)
				item.setName(value);
		},

		'clip-path': function(item, value, options) {
			var clip = getDefinition(value);
			if (clip) {
				clip = clip.clone();
				clip.setClipMask(true);
				if (item instanceof Group) {
					item.insertChild(0, clip);
				} else {
					return new Group(clip, item);
				}
			}
		},

		gradientTransform: applyTransform,
		transform: applyTransform,

		'fill-opacity': applyOpacity,
		'stroke-opacity': applyOpacity,

		visibility: function(item, value) {
			if (item.setVisible)
				item.setVisible(value === 'visible');
		},

		display: function(item, value) {
			if (item.setVisible)
				item.setVisible(value !== null);
		},

		'stop-color': function(item, value) {
			if (item.setColor)
				item.setColor(value);
		},

		'stop-opacity': function(item, value) {
			if (item._color)
				item._color.setAlpha(parseFloat(value));
		},

		offset: function(item, value) {
			if (item.setOffset) {
				var percent = value.match(/(.*)%$/);
				item.setOffset(percent ? percent[1] / 100 : parseFloat(value));
			}
		},

		viewBox: function(item, value, name, node, styles) {
			var rect = new Rectangle(convertValue(value, 'array')),
				size = getSize(node, null, null, true),
				group,
				matrix;
			if (item instanceof Group) {
				var scale = size ? size.divide(rect.getSize()) : 1,
				matrix = new Matrix().scale(scale)
						.translate(rect.getPoint().negate());
				group = item;
			} else if (item instanceof SymbolDefinition) {
				if (size)
					rect.setSize(size);
				group = item._item;
			}
			if (group)  {
				if (getAttribute(node, 'overflow', styles) !== 'visible') {
					var clip = new Shape.Rectangle(rect);
					clip.setClipMask(true);
					group.addChild(clip);
				}
				if (matrix)
					group.transform(matrix);
			}
		}
	});

	function getAttribute(node, name, styles) {
		var attr = node.attributes[name],
			value = attr && attr.value;
		if (!value && node.style) {
			var style = Base.camelize(name);
			value = node.style[style];
			if (!value && styles.node[style] !== styles.parent[style])
				value = styles.node[style];
		}
		return !value ? undefined
				: value === 'none' ? null
				: value;
	}

	function applyAttributes(item, node, isRoot) {
		var parent = node.parentNode,
			styles = {
				node: DomElement.getStyles(node) || {},
				parent: !isRoot && !/^defs$/i.test(parent.tagName)
						&& DomElement.getStyles(parent) || {}
			};
		Base.each(attributes, function(apply, name) {
			var value = getAttribute(node, name, styles);
			item = value !== undefined
					&& apply(item, value, name, node, styles) || item;
		});
		return item;
	}

	function getDefinition(value) {
		var match = value && value.match(/\((?:["'#]*)([^"')]+)/),
			name = match && match[1],
			nname =  name &&  window
				? name.replace(window.location.href.split('#')[0] + '#', '')
				: name,
			res;
			if( nname ){
				if( def2cache ){
					var mappedId =  idmapper ?  idmapper(nname) : nname,
						project = mpaper.project;
					res = project.cachedItemDefs[mappedId];
				}
				if( !res ){
					res =  definitions[nname];
				}
			}
		if (res && res._scaleToBounds) {
			res = res.clone();
			res._scaleToBounds = true;
		}
		return res;
	}

	function importNode(node, options, isRoot) {
		var type = node.nodeName.toLowerCase(),
			isElement = type !== '#document',
			body = document.body,
			container,
			parent,
			next;
		if (isRoot && isElement) {
			rootSize = mpaper.getView().getSize();
			rootSize = getSize(node, null, null, true) || rootSize;
			container = SvgElement.create('svg', {
				style: 'stroke-width: 1px; stroke-miterlimit: 10'
			});
			parent = node.parentNode;
			next = node.nextSibling;
			container.appendChild(node);
			body.appendChild(container);
		}
		var settings = mpaper.settings,
			applyMatrix = settings.applyMatrix,
			insertItems = settings.insertItems;
		settings.applyMatrix = false;
		settings.insertItems = false;
		var importer = importers[type],
			item = importer && importer(node, type, options, isRoot) || null;
		settings.insertItems = insertItems;
		settings.applyMatrix = applyMatrix;
		if (item) {
			if (isElement && !(item instanceof Group))
				item = applyAttributes(item, node, isRoot);
			var onImport = options.onImport,
				data = isElement && node.getAttribute('data-mpaper-data');
			if (onImport)
				item = onImport(node, item, options) || item;
			if (options.expandShapes && item instanceof Shape) {
				item.remove();
				item = item.toPath();
			}
			if (data)
				item._data = JSON.parse(data);
		}
		if (container) {
			body.removeChild(container);
			if (parent) {
				if (next) {
					parent.insertBefore(node, next);
				} else {
					parent.appendChild(node);
				}
			}
		}
		if (isRoot) {
			definitions = {};
			if (item && Base.pick(options.applyMatrix, applyMatrix))
				item.matrix.apply(true, true);
		}
		return item;
	}

	function importSVG(source, options, owner) {
		if (!source)
			return null;
	   if( typeof options === 'function' ){
		   options = { onLoad: options }
	   } else {
			options = options || {};
			if( typeof options.def2cache != 'undefined')
			   this.def2cache  = options.def2cache ;
			this.idmapper = options.idmapper;
	   }
		var scope = mpaper,
			item = null;

		function onLoad(svg) {
			try {
				var node = typeof svg === 'object'
					? svg
					: new self.DOMParser().parseFromString(
						svg.trim(),
						'image/svg+xml'
					);
				if (!node.nodeName) {
					node = null;
					throw new Error('Unsupported SVG source: ' + source);
				}
				mpaper = scope;
				item = importNode(node, options, true);
				if (!options || options.insert !== false) {
					owner._insertItem(undefined, item);
				}
				var onLoad = options.onLoad;
				if (onLoad)
					onLoad(item, svg);
			} catch (e) {
				onError(e);
			}
		}

		function onError(message, status) {
			var onError = options.onError;
			if (onError) {
				onError(message, status);
			} else {
				throw new Error(message);
			}
		}

		if (typeof source === 'string' && !/^[\s\S]*</.test(source)) {
			var node = document.getElementById(source);
			if (node) {
				onLoad(node);
			} else {
				Http.request({
					url: source,
					async: true,
					onLoad: onLoad,
					onError: onError
				});
			}
		} else if (typeof File !== 'undefined' && source instanceof File) {
			var reader = new FileReader();
			reader.onload = function() {
				onLoad(reader.result);
			};
			reader.onerror = function() {
				onError(reader.error);
			};
			return reader.readAsText(source);
		} else {
			onLoad(source);
		}

		return item;
	}

	Item.inject({
		importSVG: function(node, options) {
			return importSVG(node, options, this);
		}
	});

	Project.inject({
		importLatex: function(input){
			if(!input) return null;
			if( input.indexOf('$$') >=0 ){
				var fs = input.split('$$'), len = fs.length, f, r = '';
				for(var i = 0; i< len; i++){
					f = fs[i];
					if(f.length == 0) continue;
					if( i % 2 === 0)
						r += '\\text{' + f  + '}';
					else
						r += f;
				}
				input = r;
			}
			var format = Formatter.instance, svg = format.tex2svg(input);
			return this.importMathJax(svg);
		},
		importMathJax: function(node){
			var options = {
				applyMatrix: true ,
				expandShapes: true,
				idmapper: Formatter.instance.mathjax_idmapper,
			   insert: mpaper.settings.insertItems
			 };
			 this.activate();
			 var item = importSVG(node, options, this),  format = Formatter.instance,
				 colors = this._activeLayer.getCurrentColors();
			 format.forceStyleChanges(item, colors.fc, colors.sc, PathItem);
			 item.fromLatex = true;
			 item.visible = mpaper.settings.insertItems;
			 return item;
		},
		importSVG: function(node, options) {
			this.activate();
			return importSVG(node, options, this);
		}
	});
};

Base.exports.PaperScript = function() {
	var global = this,
		acorn = global.acorn;
	if (!acorn && typeof require !== 'undefined') {
		try { acorn = require('acorn'); } catch(e) {}
	}
	if (!acorn) {
		var exports, module;
		acorn = exports = module = {};

(function(root, mod) {
  if (typeof exports == "object" && typeof module == "object") return mod(exports);
  if (typeof define == "function" && define.amd) return define(["exports"], mod);
  mod(root.acorn || (root.acorn = {}));
})(this, function(exports) {
  "use strict";

  exports.version = "0.5.0";

  var options, input, inputLen, sourceFile;

  exports.parse = function(inpt, opts) {
	input = String(inpt); inputLen = input.length;
	setOptions(opts);
	initTokenState();
	return parseTopLevel(options.program);
  };

  var defaultOptions = exports.defaultOptions = {
	ecmaVersion: 5,
	strictSemicolons: false,
	allowTrailingCommas: true,
	forbidReserved: false,
	allowReturnOutsideFunction: false,
	locations: false,
	onComment: null,
	ranges: false,
	program: null,
	sourceFile: null,
	directSourceFile: null
  };

  function setOptions(opts) {
	options = opts || {};
	for (var opt in defaultOptions) if (!Object.prototype.hasOwnProperty.call(options, opt))
	  options[opt] = defaultOptions[opt];
	sourceFile = options.sourceFile || null;
  }

  var getLineInfo = exports.getLineInfo = function(input, offset) {
	for (var line = 1, cur = 0;;) {
	  lineBreak.lastIndex = cur;
	  var match = lineBreak.exec(input);
	  if (match && match.index < offset) {
		++line;
		cur = match.index + match[0].length;
	  } else break;
	}
	return {line: line, column: offset - cur};
  };

  exports.tokenize = function(inpt, opts) {
	input = String(inpt); inputLen = input.length;
	setOptions(opts);
	initTokenState();

	var t = {};
	function getToken(forceRegexp) {
	  lastEnd = tokEnd;
	  readToken(forceRegexp);
	  t.start = tokStart; t.end = tokEnd;
	  t.startLoc = tokStartLoc; t.endLoc = tokEndLoc;
	  t.type = tokType; t.value = tokVal;
	  return t;
	}
	getToken.jumpTo = function(pos, reAllowed) {
	  tokPos = pos;
	  if (options.locations) {
		tokCurLine = 1;
		tokLineStart = lineBreak.lastIndex = 0;
		var match;
		while ((match = lineBreak.exec(input)) && match.index < pos) {
		  ++tokCurLine;
		  tokLineStart = match.index + match[0].length;
		}
	  }
	  tokRegexpAllowed = reAllowed;
	  skipSpace();
	};
	return getToken;
  };

  var tokPos;

  var tokStart, tokEnd;

  var tokStartLoc, tokEndLoc;

  var tokType, tokVal;

  var tokRegexpAllowed;

  var tokCurLine, tokLineStart;

  var lastStart, lastEnd, lastEndLoc;

  var inFunction, labels, strict;

  function raise(pos, message) {
	var loc = getLineInfo(input, pos);
	message += " (" + loc.line + ":" + loc.column + ")";
	var err = new SyntaxError(message);
	err.pos = pos; err.loc = loc; err.raisedAt = tokPos;
	throw err;
  }

  var empty = [];

  var _num = {type: "num"}, _regexp = {type: "regexp"}, _string = {type: "string"};
  var _name = {type: "name"}, _eof = {type: "eof"};

  var _break = {keyword: "break"}, _case = {keyword: "case", beforeExpr: true}, _catch = {keyword: "catch"};
  var _continue = {keyword: "continue"}, _debugger = {keyword: "debugger"}, _default = {keyword: "default"};
  var _do = {keyword: "do", isLoop: true}, _else = {keyword: "else", beforeExpr: true};
  var _finally = {keyword: "finally"}, _for = {keyword: "for", isLoop: true}, _function = {keyword: "function"};
  var _if = {keyword: "if"}, _return = {keyword: "return", beforeExpr: true}, _switch = {keyword: "switch"};
  var _throw = {keyword: "throw", beforeExpr: true}, _try = {keyword: "try"}, _var = {keyword: "var"};
  var _while = {keyword: "while", isLoop: true}, _with = {keyword: "with"}, _new = {keyword: "new", beforeExpr: true};
  var _this = {keyword: "this"};

  var _null = {keyword: "null", atomValue: null}, _true = {keyword: "true", atomValue: true};
  var _false = {keyword: "false", atomValue: false};

  var _in = {keyword: "in", binop: 7, beforeExpr: true};

  var keywordTypes = {"break": _break, "case": _case, "catch": _catch,
					  "continue": _continue, "debugger": _debugger, "default": _default,
					  "do": _do, "else": _else, "finally": _finally, "for": _for,
					  "function": _function, "if": _if, "return": _return, "switch": _switch,
					  "throw": _throw, "try": _try, "var": _var, "while": _while, "with": _with,
					  "null": _null, "true": _true, "false": _false, "new": _new, "in": _in,
					  "instanceof": {keyword: "instanceof", binop: 7, beforeExpr: true}, "this": _this,
					  "typeof": {keyword: "typeof", prefix: true, beforeExpr: true},
					  "void": {keyword: "void", prefix: true, beforeExpr: true},
					  "delete": {keyword: "delete", prefix: true, beforeExpr: true}};

  var _bracketL = {type: "[", beforeExpr: true}, _bracketR = {type: "]"}, _braceL = {type: "{", beforeExpr: true};
  var _braceR = {type: "}"}, _parenL = {type: "(", beforeExpr: true}, _parenR = {type: ")"};
  var _comma = {type: ",", beforeExpr: true}, _semi = {type: ";", beforeExpr: true};
  var _colon = {type: ":", beforeExpr: true}, _dot = {type: "."}, _question = {type: "?", beforeExpr: true};

  var _slash = {binop: 10, beforeExpr: true}, _eq = {isAssign: true, beforeExpr: true};
  var _assign = {isAssign: true, beforeExpr: true};
  var _incDec = {postfix: true, prefix: true, isUpdate: true}, _prefix = {prefix: true, beforeExpr: true};
  var _logicalOR = {binop: 1, beforeExpr: true};
  var _logicalAND = {binop: 2, beforeExpr: true};
  var _bitwiseOR = {binop: 3, beforeExpr: true};
  var _bitwiseXOR = {binop: 4, beforeExpr: true};
  var _bitwiseAND = {binop: 5, beforeExpr: true};
  var _equality = {binop: 6, beforeExpr: true};
  var _relational = {binop: 7, beforeExpr: true};
  var _bitShift = {binop: 8, beforeExpr: true};
  var _plusMin = {binop: 9, prefix: true, beforeExpr: true};
  var _multiplyModulo = {binop: 10, beforeExpr: true};

  exports.tokTypes = {bracketL: _bracketL, bracketR: _bracketR, braceL: _braceL, braceR: _braceR,
					  parenL: _parenL, parenR: _parenR, comma: _comma, semi: _semi, colon: _colon,
					  dot: _dot, question: _question, slash: _slash, eq: _eq, name: _name, eof: _eof,
					  num: _num, regexp: _regexp, string: _string};
  for (var kw in keywordTypes) exports.tokTypes["_" + kw] = keywordTypes[kw];

  function makePredicate(words) {
	words = words.split(" ");
	var f = "", cats = [];
	out: for (var i = 0; i < words.length; ++i) {
	  for (var j = 0; j < cats.length; ++j)
		if (cats[j][0].length == words[i].length) {
		  cats[j].push(words[i]);
		  continue out;
		}
	  cats.push([words[i]]);
	}
	function compareTo(arr) {
	  if (arr.length == 1) return f += "return str === " + JSON.stringify(arr[0]) + ";";
	  f += "switch(str){";
	  for (var i = 0; i < arr.length; ++i) f += "case " + JSON.stringify(arr[i]) + ":";
	  f += "return true}return false;";
	}

	if (cats.length > 3) {
	  cats.sort(function(a, b) {return b.length - a.length;});
	  f += "switch(str.length){";
	  for (var i = 0; i < cats.length; ++i) {
		var cat = cats[i];
		f += "case " + cat[0].length + ":";
		compareTo(cat);
	  }
	  f += "}";

	} else {
	  compareTo(words);
	}
	return new Function("str", f);
  }

  var isReservedWord3 = makePredicate("abstract boolean byte char class double enum export extends final float goto implements import int interface long native package private protected public short static super synchronized throws transient volatile");

  var isReservedWord5 = makePredicate("class enum extends super const export import");

  var isStrictReservedWord = makePredicate("implements interface let package private protected public static yield");

  var isStrictBadIdWord = makePredicate("eval arguments");

  var isKeyword = makePredicate("break case catch continue debugger default do else finally for function if return switch throw try var while with null true false instanceof typeof void delete new in this");

  var nonASCIIwhitespace = /[\u1680\u180e\u2000-\u200a\u202f\u205f\u3000\ufeff]/;
  var nonASCIIidentifierStartChars = "\xaa\xb5\xba\xc0-\xd6\xd8-\xf6\xf8-\u02c1\u02c6-\u02d1\u02e0-\u02e4\u02ec\u02ee\u0370-\u0374\u0376\u0377\u037a-\u037d\u0386\u0388-\u038a\u038c\u038e-\u03a1\u03a3-\u03f5\u03f7-\u0481\u048a-\u0527\u0531-\u0556\u0559\u0561-\u0587\u05d0-\u05ea\u05f0-\u05f2\u0620-\u064a\u066e\u066f\u0671-\u06d3\u06d5\u06e5\u06e6\u06ee\u06ef\u06fa-\u06fc\u06ff\u0710\u0712-\u072f\u074d-\u07a5\u07b1\u07ca-\u07ea\u07f4\u07f5\u07fa\u0800-\u0815\u081a\u0824\u0828\u0840-\u0858\u08a0\u08a2-\u08ac\u0904-\u0939\u093d\u0950\u0958-\u0961\u0971-\u0977\u0979-\u097f\u0985-\u098c\u098f\u0990\u0993-\u09a8\u09aa-\u09b0\u09b2\u09b6-\u09b9\u09bd\u09ce\u09dc\u09dd\u09df-\u09e1\u09f0\u09f1\u0a05-\u0a0a\u0a0f\u0a10\u0a13-\u0a28\u0a2a-\u0a30\u0a32\u0a33\u0a35\u0a36\u0a38\u0a39\u0a59-\u0a5c\u0a5e\u0a72-\u0a74\u0a85-\u0a8d\u0a8f-\u0a91\u0a93-\u0aa8\u0aaa-\u0ab0\u0ab2\u0ab3\u0ab5-\u0ab9\u0abd\u0ad0\u0ae0\u0ae1\u0b05-\u0b0c\u0b0f\u0b10\u0b13-\u0b28\u0b2a-\u0b30\u0b32\u0b33\u0b35-\u0b39\u0b3d\u0b5c\u0b5d\u0b5f-\u0b61\u0b71\u0b83\u0b85-\u0b8a\u0b8e-\u0b90\u0b92-\u0b95\u0b99\u0b9a\u0b9c\u0b9e\u0b9f\u0ba3\u0ba4\u0ba8-\u0baa\u0bae-\u0bb9\u0bd0\u0c05-\u0c0c\u0c0e-\u0c10\u0c12-\u0c28\u0c2a-\u0c33\u0c35-\u0c39\u0c3d\u0c58\u0c59\u0c60\u0c61\u0c85-\u0c8c\u0c8e-\u0c90\u0c92-\u0ca8\u0caa-\u0cb3\u0cb5-\u0cb9\u0cbd\u0cde\u0ce0\u0ce1\u0cf1\u0cf2\u0d05-\u0d0c\u0d0e-\u0d10\u0d12-\u0d3a\u0d3d\u0d4e\u0d60\u0d61\u0d7a-\u0d7f\u0d85-\u0d96\u0d9a-\u0db1\u0db3-\u0dbb\u0dbd\u0dc0-\u0dc6\u0e01-\u0e30\u0e32\u0e33\u0e40-\u0e46\u0e81\u0e82\u0e84\u0e87\u0e88\u0e8a\u0e8d\u0e94-\u0e97\u0e99-\u0e9f\u0ea1-\u0ea3\u0ea5\u0ea7\u0eaa\u0eab\u0ead-\u0eb0\u0eb2\u0eb3\u0ebd\u0ec0-\u0ec4\u0ec6\u0edc-\u0edf\u0f00\u0f40-\u0f47\u0f49-\u0f6c\u0f88-\u0f8c\u1000-\u102a\u103f\u1050-\u1055\u105a-\u105d\u1061\u1065\u1066\u106e-\u1070\u1075-\u1081\u108e\u10a0-\u10c5\u10c7\u10cd\u10d0-\u10fa\u10fc-\u1248\u124a-\u124d\u1250-\u1256\u1258\u125a-\u125d\u1260-\u1288\u128a-\u128d\u1290-\u12b0\u12b2-\u12b5\u12b8-\u12be\u12c0\u12c2-\u12c5\u12c8-\u12d6\u12d8-\u1310\u1312-\u1315\u1318-\u135a\u1380-\u138f\u13a0-\u13f4\u1401-\u166c\u166f-\u167f\u1681-\u169a\u16a0-\u16ea\u16ee-\u16f0\u1700-\u170c\u170e-\u1711\u1720-\u1731\u1740-\u1751\u1760-\u176c\u176e-\u1770\u1780-\u17b3\u17d7\u17dc\u1820-\u1877\u1880-\u18a8\u18aa\u18b0-\u18f5\u1900-\u191c\u1950-\u196d\u1970-\u1974\u1980-\u19ab\u19c1-\u19c7\u1a00-\u1a16\u1a20-\u1a54\u1aa7\u1b05-\u1b33\u1b45-\u1b4b\u1b83-\u1ba0\u1bae\u1baf\u1bba-\u1be5\u1c00-\u1c23\u1c4d-\u1c4f\u1c5a-\u1c7d\u1ce9-\u1cec\u1cee-\u1cf1\u1cf5\u1cf6\u1d00-\u1dbf\u1e00-\u1f15\u1f18-\u1f1d\u1f20-\u1f45\u1f48-\u1f4d\u1f50-\u1f57\u1f59\u1f5b\u1f5d\u1f5f-\u1f7d\u1f80-\u1fb4\u1fb6-\u1fbc\u1fbe\u1fc2-\u1fc4\u1fc6-\u1fcc\u1fd0-\u1fd3\u1fd6-\u1fdb\u1fe0-\u1fec\u1ff2-\u1ff4\u1ff6-\u1ffc\u2071\u207f\u2090-\u209c\u2102\u2107\u210a-\u2113\u2115\u2119-\u211d\u2124\u2126\u2128\u212a-\u212d\u212f-\u2139\u213c-\u213f\u2145-\u2149\u214e\u2160-\u2188\u2c00-\u2c2e\u2c30-\u2c5e\u2c60-\u2ce4\u2ceb-\u2cee\u2cf2\u2cf3\u2d00-\u2d25\u2d27\u2d2d\u2d30-\u2d67\u2d6f\u2d80-\u2d96\u2da0-\u2da6\u2da8-\u2dae\u2db0-\u2db6\u2db8-\u2dbe\u2dc0-\u2dc6\u2dc8-\u2dce\u2dd0-\u2dd6\u2dd8-\u2dde\u2e2f\u3005-\u3007\u3021-\u3029\u3031-\u3035\u3038-\u303c\u3041-\u3096\u309d-\u309f\u30a1-\u30fa\u30fc-\u30ff\u3105-\u312d\u3131-\u318e\u31a0-\u31ba\u31f0-\u31ff\u3400-\u4db5\u4e00-\u9fcc\ua000-\ua48c\ua4d0-\ua4fd\ua500-\ua60c\ua610-\ua61f\ua62a\ua62b\ua640-\ua66e\ua67f-\ua697\ua6a0-\ua6ef\ua717-\ua71f\ua722-\ua788\ua78b-\ua78e\ua790-\ua793\ua7a0-\ua7aa\ua7f8-\ua801\ua803-\ua805\ua807-\ua80a\ua80c-\ua822\ua840-\ua873\ua882-\ua8b3\ua8f2-\ua8f7\ua8fb\ua90a-\ua925\ua930-\ua946\ua960-\ua97c\ua984-\ua9b2\ua9cf\uaa00-\uaa28\uaa40-\uaa42\uaa44-\uaa4b\uaa60-\uaa76\uaa7a\uaa80-\uaaaf\uaab1\uaab5\uaab6\uaab9-\uaabd\uaac0\uaac2\uaadb-\uaadd\uaae0-\uaaea\uaaf2-\uaaf4\uab01-\uab06\uab09-\uab0e\uab11-\uab16\uab20-\uab26\uab28-\uab2e\uabc0-\uabe2\uac00-\ud7a3\ud7b0-\ud7c6\ud7cb-\ud7fb\uf900-\ufa6d\ufa70-\ufad9\ufb00-\ufb06\ufb13-\ufb17\ufb1d\ufb1f-\ufb28\ufb2a-\ufb36\ufb38-\ufb3c\ufb3e\ufb40\ufb41\ufb43\ufb44\ufb46-\ufbb1\ufbd3-\ufd3d\ufd50-\ufd8f\ufd92-\ufdc7\ufdf0-\ufdfb\ufe70-\ufe74\ufe76-\ufefc\uff21-\uff3a\uff41-\uff5a\uff66-\uffbe\uffc2-\uffc7\uffca-\uffcf\uffd2-\uffd7\uffda-\uffdc";
  var nonASCIIidentifierChars = "\u0300-\u036f\u0483-\u0487\u0591-\u05bd\u05bf\u05c1\u05c2\u05c4\u05c5\u05c7\u0610-\u061a\u0620-\u0649\u0672-\u06d3\u06e7-\u06e8\u06fb-\u06fc\u0730-\u074a\u0800-\u0814\u081b-\u0823\u0825-\u0827\u0829-\u082d\u0840-\u0857\u08e4-\u08fe\u0900-\u0903\u093a-\u093c\u093e-\u094f\u0951-\u0957\u0962-\u0963\u0966-\u096f\u0981-\u0983\u09bc\u09be-\u09c4\u09c7\u09c8\u09d7\u09df-\u09e0\u0a01-\u0a03\u0a3c\u0a3e-\u0a42\u0a47\u0a48\u0a4b-\u0a4d\u0a51\u0a66-\u0a71\u0a75\u0a81-\u0a83\u0abc\u0abe-\u0ac5\u0ac7-\u0ac9\u0acb-\u0acd\u0ae2-\u0ae3\u0ae6-\u0aef\u0b01-\u0b03\u0b3c\u0b3e-\u0b44\u0b47\u0b48\u0b4b-\u0b4d\u0b56\u0b57\u0b5f-\u0b60\u0b66-\u0b6f\u0b82\u0bbe-\u0bc2\u0bc6-\u0bc8\u0bca-\u0bcd\u0bd7\u0be6-\u0bef\u0c01-\u0c03\u0c46-\u0c48\u0c4a-\u0c4d\u0c55\u0c56\u0c62-\u0c63\u0c66-\u0c6f\u0c82\u0c83\u0cbc\u0cbe-\u0cc4\u0cc6-\u0cc8\u0cca-\u0ccd\u0cd5\u0cd6\u0ce2-\u0ce3\u0ce6-\u0cef\u0d02\u0d03\u0d46-\u0d48\u0d57\u0d62-\u0d63\u0d66-\u0d6f\u0d82\u0d83\u0dca\u0dcf-\u0dd4\u0dd6\u0dd8-\u0ddf\u0df2\u0df3\u0e34-\u0e3a\u0e40-\u0e45\u0e50-\u0e59\u0eb4-\u0eb9\u0ec8-\u0ecd\u0ed0-\u0ed9\u0f18\u0f19\u0f20-\u0f29\u0f35\u0f37\u0f39\u0f41-\u0f47\u0f71-\u0f84\u0f86-\u0f87\u0f8d-\u0f97\u0f99-\u0fbc\u0fc6\u1000-\u1029\u1040-\u1049\u1067-\u106d\u1071-\u1074\u1082-\u108d\u108f-\u109d\u135d-\u135f\u170e-\u1710\u1720-\u1730\u1740-\u1750\u1772\u1773\u1780-\u17b2\u17dd\u17e0-\u17e9\u180b-\u180d\u1810-\u1819\u1920-\u192b\u1930-\u193b\u1951-\u196d\u19b0-\u19c0\u19c8-\u19c9\u19d0-\u19d9\u1a00-\u1a15\u1a20-\u1a53\u1a60-\u1a7c\u1a7f-\u1a89\u1a90-\u1a99\u1b46-\u1b4b\u1b50-\u1b59\u1b6b-\u1b73\u1bb0-\u1bb9\u1be6-\u1bf3\u1c00-\u1c22\u1c40-\u1c49\u1c5b-\u1c7d\u1cd0-\u1cd2\u1d00-\u1dbe\u1e01-\u1f15\u200c\u200d\u203f\u2040\u2054\u20d0-\u20dc\u20e1\u20e5-\u20f0\u2d81-\u2d96\u2de0-\u2dff\u3021-\u3028\u3099\u309a\ua640-\ua66d\ua674-\ua67d\ua69f\ua6f0-\ua6f1\ua7f8-\ua800\ua806\ua80b\ua823-\ua827\ua880-\ua881\ua8b4-\ua8c4\ua8d0-\ua8d9\ua8f3-\ua8f7\ua900-\ua909\ua926-\ua92d\ua930-\ua945\ua980-\ua983\ua9b3-\ua9c0\uaa00-\uaa27\uaa40-\uaa41\uaa4c-\uaa4d\uaa50-\uaa59\uaa7b\uaae0-\uaae9\uaaf2-\uaaf3\uabc0-\uabe1\uabec\uabed\uabf0-\uabf9\ufb20-\ufb28\ufe00-\ufe0f\ufe20-\ufe26\ufe33\ufe34\ufe4d-\ufe4f\uff10-\uff19\uff3f";
  var nonASCIIidentifierStart = new RegExp("[" + nonASCIIidentifierStartChars + "]");
  var nonASCIIidentifier = new RegExp("[" + nonASCIIidentifierStartChars + nonASCIIidentifierChars + "]");

  var newline = /[\n\r\u2028\u2029]/;

  var lineBreak = /\r\n|[\n\r\u2028\u2029]/g;

  var isIdentifierStart = exports.isIdentifierStart = function(code) {
	if (code < 65) return code === 36;
	if (code < 91) return true;
	if (code < 97) return code === 95;
	if (code < 123)return true;
	return code >= 0xaa && nonASCIIidentifierStart.test(String.fromCharCode(code));
  };

  var isIdentifierChar = exports.isIdentifierChar = function(code) {
	if (code < 48) return code === 36;
	if (code < 58) return true;
	if (code < 65) return false;
	if (code < 91) return true;
	if (code < 97) return code === 95;
	if (code < 123)return true;
	return code >= 0xaa && nonASCIIidentifier.test(String.fromCharCode(code));
  };

  function line_loc_t() {
	this.line = tokCurLine;
	this.column = tokPos - tokLineStart;
  }

  function initTokenState() {
	tokCurLine = 1;
	tokPos = tokLineStart = 0;
	tokRegexpAllowed = true;
	skipSpace();
  }

  function finishToken(type, val) {
	tokEnd = tokPos;
	if (options.locations) tokEndLoc = new line_loc_t;
	tokType = type;
	skipSpace();
	tokVal = val;
	tokRegexpAllowed = type.beforeExpr;
  }

  function skipBlockComment() {
	var startLoc = options.onComment && options.locations && new line_loc_t;
	var start = tokPos, end = input.indexOf("*/", tokPos += 2);
	if (end === -1) raise(tokPos - 2, "Unterminated comment");
	tokPos = end + 2;
	if (options.locations) {
	  lineBreak.lastIndex = start;
	  var match;
	  while ((match = lineBreak.exec(input)) && match.index < tokPos) {
		++tokCurLine;
		tokLineStart = match.index + match[0].length;
	  }
	}
	if (options.onComment)
	  options.onComment(true, input.slice(start + 2, end), start, tokPos,
						startLoc, options.locations && new line_loc_t);
  }

  function skipLineComment() {
	var start = tokPos;
	var startLoc = options.onComment && options.locations && new line_loc_t;
	var ch = input.charCodeAt(tokPos+=2);
	while (tokPos < inputLen && ch !== 10 && ch !== 13 && ch !== 8232 && ch !== 8233) {
	  ++tokPos;
	  ch = input.charCodeAt(tokPos);
	}
	if (options.onComment)
	  options.onComment(false, input.slice(start + 2, tokPos), start, tokPos,
						startLoc, options.locations && new line_loc_t);
  }

  function skipSpace() {
	while (tokPos < inputLen) {
	  var ch = input.charCodeAt(tokPos);
	  if (ch === 32) {
		++tokPos;
	  } else if (ch === 13) {
		++tokPos;
		var next = input.charCodeAt(tokPos);
		if (next === 10) {
		  ++tokPos;
		}
		if (options.locations) {
		  ++tokCurLine;
		  tokLineStart = tokPos;
		}
	  } else if (ch === 10 || ch === 8232 || ch === 8233) {
		++tokPos;
		if (options.locations) {
		  ++tokCurLine;
		  tokLineStart = tokPos;
		}
	  } else if (ch > 8 && ch < 14) {
		++tokPos;
	  } else if (ch === 47) {
		var next = input.charCodeAt(tokPos + 1);
		if (next === 42) {
		  skipBlockComment();
		} else if (next === 47) {
		  skipLineComment();
		} else break;
	  } else if (ch === 160) {
		++tokPos;
	  } else if (ch >= 5760 && nonASCIIwhitespace.test(String.fromCharCode(ch))) {
		++tokPos;
	  } else {
		break;
	  }
	}
  }

  function readToken_dot() {
	var next = input.charCodeAt(tokPos + 1);
	if (next >= 48 && next <= 57) return readNumber(true);
	++tokPos;
	return finishToken(_dot);
  }

  function readToken_slash() {
	var next = input.charCodeAt(tokPos + 1);
	if (tokRegexpAllowed) {++tokPos; return readRegexp();}
	if (next === 61) return finishOp(_assign, 2);
	return finishOp(_slash, 1);
  }

  function readToken_mult_modulo() {
	var next = input.charCodeAt(tokPos + 1);
	if (next === 61) return finishOp(_assign, 2);
	return finishOp(_multiplyModulo, 1);
  }

  function readToken_pipe_amp(code) {
	var next = input.charCodeAt(tokPos + 1);
	if (next === code) return finishOp(code === 124 ? _logicalOR : _logicalAND, 2);
	if (next === 61) return finishOp(_assign, 2);
	return finishOp(code === 124 ? _bitwiseOR : _bitwiseAND, 1);
  }

  function readToken_caret() {
	var next = input.charCodeAt(tokPos + 1);
	if (next === 61) return finishOp(_assign, 2);
	return finishOp(_bitwiseXOR, 1);
  }

  function readToken_plus_min(code) {
	var next = input.charCodeAt(tokPos + 1);
	if (next === code) {
	  if (next == 45 && input.charCodeAt(tokPos + 2) == 62 &&
		  newline.test(input.slice(lastEnd, tokPos))) {
		tokPos += 3;
		skipLineComment();
		skipSpace();
		return readToken();
	  }
	  return finishOp(_incDec, 2);
	}
	if (next === 61) return finishOp(_assign, 2);
	return finishOp(_plusMin, 1);
  }

  function readToken_lt_gt(code) {
	var next = input.charCodeAt(tokPos + 1);
	var size = 1;
	if (next === code) {
	  size = code === 62 && input.charCodeAt(tokPos + 2) === 62 ? 3 : 2;
	  if (input.charCodeAt(tokPos + size) === 61) return finishOp(_assign, size + 1);
	  return finishOp(_bitShift, size);
	}
	if (next == 33 && code == 60 && input.charCodeAt(tokPos + 2) == 45 &&
		input.charCodeAt(tokPos + 3) == 45) {
	  tokPos += 4;
	  skipLineComment();
	  skipSpace();
	  return readToken();
	}
	if (next === 61)
	  size = input.charCodeAt(tokPos + 2) === 61 ? 3 : 2;
	return finishOp(_relational, size);
  }

  function readToken_eq_excl(code) {
	var next = input.charCodeAt(tokPos + 1);
	if (next === 61) return finishOp(_equality, input.charCodeAt(tokPos + 2) === 61 ? 3 : 2);
	return finishOp(code === 61 ? _eq : _prefix, 1);
  }

  function getTokenFromCode(code) {
	switch(code) {
	case 46:
	  return readToken_dot();

	case 40: ++tokPos; return finishToken(_parenL);
	case 41: ++tokPos; return finishToken(_parenR);
	case 59: ++tokPos; return finishToken(_semi);
	case 44: ++tokPos; return finishToken(_comma);
	case 91: ++tokPos; return finishToken(_bracketL);
	case 93: ++tokPos; return finishToken(_bracketR);
	case 123: ++tokPos; return finishToken(_braceL);
	case 125: ++tokPos; return finishToken(_braceR);
	case 58: ++tokPos; return finishToken(_colon);
	case 63: ++tokPos; return finishToken(_question);

	case 48:
	  var next = input.charCodeAt(tokPos + 1);
	  if (next === 120 || next === 88) return readHexNumber();
	case 49: case 50: case 51: case 52: case 53: case 54: case 55: case 56: case 57:
	  return readNumber(false);

	case 34: case 39:
	  return readString(code);

	case 47:
	  return readToken_slash(code);

	case 37: case 42:
	  return readToken_mult_modulo();

	case 124: case 38:
	  return readToken_pipe_amp(code);

	case 94:
	  return readToken_caret();

	case 43: case 45:
	  return readToken_plus_min(code);

	case 60: case 62:
	  return readToken_lt_gt(code);

	case 61: case 33:
	  return readToken_eq_excl(code);

	case 126:
	  return finishOp(_prefix, 1);
	}

	return false;
  }

  function readToken(forceRegexp) {
	if (!forceRegexp) tokStart = tokPos;
	else tokPos = tokStart + 1;
	if (options.locations) tokStartLoc = new line_loc_t;
	if (forceRegexp) return readRegexp();
	if (tokPos >= inputLen) return finishToken(_eof);

	var code = input.charCodeAt(tokPos);
	if (isIdentifierStart(code) || code === 92 ) return readWord();

	var tok = getTokenFromCode(code);

	if (tok === false) {
	  var ch = String.fromCharCode(code);
	  if (ch === "\\" || nonASCIIidentifierStart.test(ch)) return readWord();
	  raise(tokPos, "Unexpected character '" + ch + "'");
	}
	return tok;
  }

  function finishOp(type, size) {
	var str = input.slice(tokPos, tokPos + size);
	tokPos += size;
	finishToken(type, str);
  }

  function readRegexp() {
	var content = "", escaped, inClass, start = tokPos;
	for (;;) {
	  if (tokPos >= inputLen) raise(start, "Unterminated regular expression");
	  var ch = input.charAt(tokPos);
	  if (newline.test(ch)) raise(start, "Unterminated regular expression");
	  if (!escaped) {
		if (ch === "[") inClass = true;
		else if (ch === "]" && inClass) inClass = false;
		else if (ch === "/" && !inClass) break;
		escaped = ch === "\\";
	  } else escaped = false;
	  ++tokPos;
	}
	var content = input.slice(start, tokPos);
	++tokPos;
	var mods = readWord1();
	if (mods && !/^[gmsiy]*$/.test(mods)) raise(start, "Invalid regexp flag");
	try {
	  var value = new RegExp(content, mods);
	} catch (e) {
	  if (e instanceof SyntaxError) raise(start, e.message);
	  raise(e);
	}
	return finishToken(_regexp, value);
  }

  function readInt(radix, len) {
	var start = tokPos, total = 0;
	for (var i = 0, e = len == null ? Infinity : len; i < e; ++i) {
	  var code = input.charCodeAt(tokPos), val;
	  if (code >= 97) val = code - 97 + 10;
	  else if (code >= 65) val = code - 65 + 10;
	  else if (code >= 48 && code <= 57) val = code - 48;
	  else val = Infinity;
	  if (val >= radix) break;
	  ++tokPos;
	  total = total * radix + val;
	}
	if (tokPos === start || len != null && tokPos - start !== len) return null;

	return total;
  }

  function readHexNumber() {
	tokPos += 2;
	var val = readInt(16);
	if (val == null) raise(tokStart + 2, "Expected hexadecimal number");
	if (isIdentifierStart(input.charCodeAt(tokPos))) raise(tokPos, "Identifier directly after number");
	return finishToken(_num, val);
  }

  function readNumber(startsWithDot) {
	var start = tokPos, isFloat = false, octal = input.charCodeAt(tokPos) === 48;
	if (!startsWithDot && readInt(10) === null) raise(start, "Invalid number");
	if (input.charCodeAt(tokPos) === 46) {
	  ++tokPos;
	  readInt(10);
	  isFloat = true;
	}
	var next = input.charCodeAt(tokPos);
	if (next === 69 || next === 101) {
	  next = input.charCodeAt(++tokPos);
	  if (next === 43 || next === 45) ++tokPos;
	  if (readInt(10) === null) raise(start, "Invalid number");
	  isFloat = true;
	}
	if (isIdentifierStart(input.charCodeAt(tokPos))) raise(tokPos, "Identifier directly after number");

	var str = input.slice(start, tokPos), val;
	if (isFloat) val = parseFloat(str);
	else if (!octal || str.length === 1) val = parseInt(str, 10);
	else if (/[89]/.test(str) || strict) raise(start, "Invalid number");
	else val = parseInt(str, 8);
	return finishToken(_num, val);
  }

  function readString(quote) {
	tokPos++;
	var out = "";
	for (;;) {
	  if (tokPos >= inputLen) raise(tokStart, "Unterminated string constant");
	  var ch = input.charCodeAt(tokPos);
	  if (ch === quote) {
		++tokPos;
		return finishToken(_string, out);
	  }
	  if (ch === 92) {
		ch = input.charCodeAt(++tokPos);
		var octal = /^[0-7]+/.exec(input.slice(tokPos, tokPos + 3));
		if (octal) octal = octal[0];
		while (octal && parseInt(octal, 8) > 255) octal = octal.slice(0, -1);
		if (octal === "0") octal = null;
		++tokPos;
		if (octal) {
		  if (strict) raise(tokPos - 2, "Octal literal in strict mode");
		  out += String.fromCharCode(parseInt(octal, 8));
		  tokPos += octal.length - 1;
		} else {
		  switch (ch) {
		  case 110: out += "\n"; break;
		  case 114: out += "\r"; break;
		  case 120: out += String.fromCharCode(readHexChar(2)); break;
		  case 117: out += String.fromCharCode(readHexChar(4)); break;
		  case 85: out += String.fromCharCode(readHexChar(8)); break;
		  case 116: out += "\t"; break;
		  case 98: out += "\b"; break;
		  case 118: out += "\u000b"; break;
		  case 102: out += "\f"; break;
		  case 48: out += "\0"; break;
		  case 13: if (input.charCodeAt(tokPos) === 10) ++tokPos;
		  case 10:
			if (options.locations) { tokLineStart = tokPos; ++tokCurLine; }
			break;
		  default: out += String.fromCharCode(ch); break;
		  }
		}
	  } else {
		if (ch === 13 || ch === 10 || ch === 8232 || ch === 8233) raise(tokStart, "Unterminated string constant");
		out += String.fromCharCode(ch);
		++tokPos;
	  }
	}
  }

  function readHexChar(len) {
	var n = readInt(16, len);
	if (n === null) raise(tokStart, "Bad character escape sequence");
	return n;
  }

  var containsEsc;

  function readWord1() {
	containsEsc = false;
	var word, first = true, start = tokPos;
	for (;;) {
	  var ch = input.charCodeAt(tokPos);
	  if (isIdentifierChar(ch)) {
		if (containsEsc) word += input.charAt(tokPos);
		++tokPos;
	  } else if (ch === 92) {
		if (!containsEsc) word = input.slice(start, tokPos);
		containsEsc = true;
		if (input.charCodeAt(++tokPos) != 117)
		  raise(tokPos, "Expecting Unicode escape sequence \\uXXXX");
		++tokPos;
		var esc = readHexChar(4);
		var escStr = String.fromCharCode(esc);
		if (!escStr) raise(tokPos - 1, "Invalid Unicode escape");
		if (!(first ? isIdentifierStart(esc) : isIdentifierChar(esc)))
		  raise(tokPos - 4, "Invalid Unicode escape");
		word += escStr;
	  } else {
		break;
	  }
	  first = false;
	}
	return containsEsc ? word : input.slice(start, tokPos);
  }

  function readWord() {
	var word = readWord1();
	var type = _name;
	if (!containsEsc && isKeyword(word))
	  type = keywordTypes[word];
	return finishToken(type, word);
  }

  function next() {
	lastStart = tokStart;
	lastEnd = tokEnd;
	lastEndLoc = tokEndLoc;
	readToken();
  }

  function setStrict(strct) {
	strict = strct;
	tokPos = tokStart;
	if (options.locations) {
	  while (tokPos < tokLineStart) {
		tokLineStart = input.lastIndexOf("\n", tokLineStart - 2) + 1;
		--tokCurLine;
	  }
	}
	skipSpace();
	readToken();
  }

  function node_t() {
	this.type = null;
	this.start = tokStart;
	this.end = null;
  }

  function node_loc_t() {
	this.start = tokStartLoc;
	this.end = null;
	if (sourceFile !== null) this.source = sourceFile;
  }

  function startNode() {
	var node = new node_t();
	if (options.locations)
	  node.loc = new node_loc_t();
	if (options.directSourceFile)
	  node.sourceFile = options.directSourceFile;
	if (options.ranges)
	  node.range = [tokStart, 0];
	return node;
  }

  function startNodeFrom(other) {
	var node = new node_t();
	node.start = other.start;
	if (options.locations) {
	  node.loc = new node_loc_t();
	  node.loc.start = other.loc.start;
	}
	if (options.ranges)
	  node.range = [other.range[0], 0];

	return node;
  }

  function finishNode(node, type) {
	node.type = type;
	node.end = lastEnd;
	if (options.locations)
	  node.loc.end = lastEndLoc;
	if (options.ranges)
	  node.range[1] = lastEnd;
	return node;
  }

  function isUseStrict(stmt) {
	return options.ecmaVersion >= 5 && stmt.type === "ExpressionStatement" &&
	  stmt.expression.type === "Literal" && stmt.expression.value === "use strict";
  }

  function eat(type) {
	if (tokType === type) {
	  next();
	  return true;
	}
  }

  function canInsertSemicolon() {
	return !options.strictSemicolons &&
	  (tokType === _eof || tokType === _braceR || newline.test(input.slice(lastEnd, tokStart)));
  }

  function semicolon() {
	if (!eat(_semi) && !canInsertSemicolon()) unexpected();
  }

  function expect(type) {
	if (tokType === type) next();
	else unexpected();
  }

  function unexpected() {
	raise(tokStart, "Unexpected token");
  }

  function checkLVal(expr) {
	if (expr.type !== "Identifier" && expr.type !== "MemberExpression")
	  raise(expr.start, "Assigning to rvalue");
	if (strict && expr.type === "Identifier" && isStrictBadIdWord(expr.name))
	  raise(expr.start, "Assigning to " + expr.name + " in strict mode");
  }

  function parseTopLevel(program) {
	lastStart = lastEnd = tokPos;
	if (options.locations) lastEndLoc = new line_loc_t;
	inFunction = strict = null;
	labels = [];
	readToken();

	var node = program || startNode(), first = true;
	if (!program) node.body = [];
	while (tokType !== _eof) {
	  var stmt = parseStatement();
	  node.body.push(stmt);
	  if (first && isUseStrict(stmt)) setStrict(true);
	  first = false;
	}
	return finishNode(node, "Program");
  }

  var loopLabel = {kind: "loop"}, switchLabel = {kind: "switch"};

  function parseStatement() {
	if (tokType === _slash || tokType === _assign && tokVal == "/=")
	  readToken(true);

	var starttype = tokType, node = startNode();

	switch (starttype) {
	case _break: case _continue:
	  next();
	  var isBreak = starttype === _break;
	  if (eat(_semi) || canInsertSemicolon()) node.label = null;
	  else if (tokType !== _name) unexpected();
	  else {
		node.label = parseIdent();
		semicolon();
	  }

	  for (var i = 0; i < labels.length; ++i) {
		var lab = labels[i];
		if (node.label == null || lab.name === node.label.name) {
		  if (lab.kind != null && (isBreak || lab.kind === "loop")) break;
		  if (node.label && isBreak) break;
		}
	  }
	  if (i === labels.length) raise(node.start, "Unsyntactic " + starttype.keyword);
	  return finishNode(node, isBreak ? "BreakStatement" : "ContinueStatement");

	case _debugger:
	  next();
	  semicolon();
	  return finishNode(node, "DebuggerStatement");

	case _do:
	  next();
	  labels.push(loopLabel);
	  node.body = parseStatement();
	  labels.pop();
	  expect(_while);
	  node.test = parseParenExpression();
	  semicolon();
	  return finishNode(node, "DoWhileStatement");

	case _for:
	  next();
	  labels.push(loopLabel);
	  expect(_parenL);
	  if (tokType === _semi) return parseFor(node, null);
	  if (tokType === _var) {
		var init = startNode();
		next();
		parseVar(init, true);
		finishNode(init, "VariableDeclaration");
		if (init.declarations.length === 1 && eat(_in))
		  return parseForIn(node, init);
		return parseFor(node, init);
	  }
	  var init = parseExpression(false, true);
	  if (eat(_in)) {checkLVal(init); return parseForIn(node, init);}
	  return parseFor(node, init);

	case _function:
	  next();
	  return parseFunction(node, true);

	case _if:
	  next();
	  node.test = parseParenExpression();
	  node.consequent = parseStatement();
	  node.alternate = eat(_else) ? parseStatement() : null;
	  return finishNode(node, "IfStatement");

	case _return:
	  if (!inFunction && !options.allowReturnOutsideFunction)
		raise(tokStart, "'return' outside of function");
	  next();

	  if (eat(_semi) || canInsertSemicolon()) node.argument = null;
	  else { node.argument = parseExpression(); semicolon(); }
	  return finishNode(node, "ReturnStatement");

	case _switch:
	  next();
	  node.discriminant = parseParenExpression();
	  node.cases = [];
	  expect(_braceL);
	  labels.push(switchLabel);

	  for (var cur, sawDefault; tokType != _braceR;) {
		if (tokType === _case || tokType === _default) {
		  var isCase = tokType === _case;
		  if (cur) finishNode(cur, "SwitchCase");
		  node.cases.push(cur = startNode());
		  cur.consequent = [];
		  next();
		  if (isCase) cur.test = parseExpression();
		  else {
			if (sawDefault) raise(lastStart, "Multiple default clauses"); sawDefault = true;
			cur.test = null;
		  }
		  expect(_colon);
		} else {
		  if (!cur) unexpected();
		  cur.consequent.push(parseStatement());
		}
	  }
	  if (cur) finishNode(cur, "SwitchCase");
	  next();
	  labels.pop();
	  return finishNode(node, "SwitchStatement");

	case _throw:
	  next();
	  if (newline.test(input.slice(lastEnd, tokStart)))
		raise(lastEnd, "Illegal newline after throw");
	  node.argument = parseExpression();
	  semicolon();
	  return finishNode(node, "ThrowStatement");

	case _try:
	  next();
	  node.block = parseBlock();
	  node.handler = null;
	  if (tokType === _catch) {
		var clause = startNode();
		next();
		expect(_parenL);
		clause.param = parseIdent();
		if (strict && isStrictBadIdWord(clause.param.name))
		  raise(clause.param.start, "Binding " + clause.param.name + " in strict mode");
		expect(_parenR);
		clause.guard = null;
		clause.body = parseBlock();
		node.handler = finishNode(clause, "CatchClause");
	  }
	  node.guardedHandlers = empty;
	  node.finalizer = eat(_finally) ? parseBlock() : null;
	  if (!node.handler && !node.finalizer)
		raise(node.start, "Missing catch or finally clause");
	  return finishNode(node, "TryStatement");

	case _var:
	  next();
	  parseVar(node);
	  semicolon();
	  return finishNode(node, "VariableDeclaration");

	case _while:
	  next();
	  node.test = parseParenExpression();
	  labels.push(loopLabel);
	  node.body = parseStatement();
	  labels.pop();
	  return finishNode(node, "WhileStatement");

	case _with:
	  if (strict) raise(tokStart, "'with' in strict mode");
	  next();
	  node.object = parseParenExpression();
	  node.body = parseStatement();
	  return finishNode(node, "WithStatement");

	case _braceL:
	  return parseBlock();

	case _semi:
	  next();
	  return finishNode(node, "EmptyStatement");

	default:
	  var maybeName = tokVal, expr = parseExpression();
	  if (starttype === _name && expr.type === "Identifier" && eat(_colon)) {
		for (var i = 0; i < labels.length; ++i)
		  if (labels[i].name === maybeName) raise(expr.start, "Label '" + maybeName + "' is already declared");
		var kind = tokType.isLoop ? "loop" : tokType === _switch ? "switch" : null;
		labels.push({name: maybeName, kind: kind});
		node.body = parseStatement();
		labels.pop();
		node.label = expr;
		return finishNode(node, "LabeledStatement");
	  } else {
		node.expression = expr;
		semicolon();
		return finishNode(node, "ExpressionStatement");
	  }
	}
  }

  function parseParenExpression() {
	expect(_parenL);
	var val = parseExpression();
	expect(_parenR);
	return val;
  }

  function parseBlock(allowStrict) {
	var node = startNode(), first = true, strict = false, oldStrict;
	node.body = [];
	expect(_braceL);
	while (!eat(_braceR)) {
	  var stmt = parseStatement();
	  node.body.push(stmt);
	  if (first && allowStrict && isUseStrict(stmt)) {
		oldStrict = strict;
		setStrict(strict = true);
	  }
	  first = false;
	}
	if (strict && !oldStrict) setStrict(false);
	return finishNode(node, "BlockStatement");
  }

  function parseFor(node, init) {
	node.init = init;
	expect(_semi);
	node.test = tokType === _semi ? null : parseExpression();
	expect(_semi);
	node.update = tokType === _parenR ? null : parseExpression();
	expect(_parenR);
	node.body = parseStatement();
	labels.pop();
	return finishNode(node, "ForStatement");
  }

  function parseForIn(node, init) {
	node.left = init;
	node.right = parseExpression();
	expect(_parenR);
	node.body = parseStatement();
	labels.pop();
	return finishNode(node, "ForInStatement");
  }

  function parseVar(node, noIn) {
	node.declarations = [];
	node.kind = "var";
	for (;;) {
	  var decl = startNode();
	  decl.id = parseIdent();
	  if (strict && isStrictBadIdWord(decl.id.name))
		raise(decl.id.start, "Binding " + decl.id.name + " in strict mode");
	  decl.init = eat(_eq) ? parseExpression(true, noIn) : null;
	  node.declarations.push(finishNode(decl, "VariableDeclarator"));
	  if (!eat(_comma)) break;
	}
	return node;
  }

  function parseExpression(noComma, noIn) {
	var expr = parseMaybeAssign(noIn);
	if (!noComma && tokType === _comma) {
	  var node = startNodeFrom(expr);
	  node.expressions = [expr];
	  while (eat(_comma)) node.expressions.push(parseMaybeAssign(noIn));
	  return finishNode(node, "SequenceExpression");
	}
	return expr;
  }

  function parseMaybeAssign(noIn) {
	var left = parseMaybeConditional(noIn);
	if (tokType.isAssign) {
	  var node = startNodeFrom(left);
	  node.operator = tokVal;
	  node.left = left;
	  next();
	  node.right = parseMaybeAssign(noIn);
	  checkLVal(left);
	  return finishNode(node, "AssignmentExpression");
	}
	return left;
  }

  function parseMaybeConditional(noIn) {
	var expr = parseExprOps(noIn);
	if (eat(_question)) {
	  var node = startNodeFrom(expr);
	  node.test = expr;
	  node.consequent = parseExpression(true);
	  expect(_colon);
	  node.alternate = parseExpression(true, noIn);
	  return finishNode(node, "ConditionalExpression");
	}
	return expr;
  }

  function parseExprOps(noIn) {
	return parseExprOp(parseMaybeUnary(), -1, noIn);
  }

  function parseExprOp(left, minPrec, noIn) {
	var prec = tokType.binop;
	if (prec != null && (!noIn || tokType !== _in)) {
	  if (prec > minPrec) {
		var node = startNodeFrom(left);
		node.left = left;
		node.operator = tokVal;
		var op = tokType;
		next();
		node.right = parseExprOp(parseMaybeUnary(), prec, noIn);
		var exprNode = finishNode(node, (op === _logicalOR || op === _logicalAND) ? "LogicalExpression" : "BinaryExpression");
		return parseExprOp(exprNode, minPrec, noIn);
	  }
	}
	return left;
  }

  function parseMaybeUnary() {
	if (tokType.prefix) {
	  var node = startNode(), update = tokType.isUpdate;
	  node.operator = tokVal;
	  node.prefix = true;
	  tokRegexpAllowed = true;
	  next();
	  node.argument = parseMaybeUnary();
	  if (update) checkLVal(node.argument);
	  else if (strict && node.operator === "delete" &&
			   node.argument.type === "Identifier")
		raise(node.start, "Deleting local variable in strict mode");
	  return finishNode(node, update ? "UpdateExpression" : "UnaryExpression");
	}
	var expr = parseExprSubscripts();
	while (tokType.postfix && !canInsertSemicolon()) {
	  var node = startNodeFrom(expr);
	  node.operator = tokVal;
	  node.prefix = false;
	  node.argument = expr;
	  checkLVal(expr);
	  next();
	  expr = finishNode(node, "UpdateExpression");
	}
	return expr;
  }

  function parseExprSubscripts() {
	return parseSubscripts(parseExprAtom());
  }

  function parseSubscripts(base, noCalls) {
	if (eat(_dot)) {
	  var node = startNodeFrom(base);
	  node.object = base;
	  node.property = parseIdent(true);
	  node.computed = false;
	  return parseSubscripts(finishNode(node, "MemberExpression"), noCalls);
	} else if (eat(_bracketL)) {
	  var node = startNodeFrom(base);
	  node.object = base;
	  node.property = parseExpression();
	  node.computed = true;
	  expect(_bracketR);
	  return parseSubscripts(finishNode(node, "MemberExpression"), noCalls);
	} else if (!noCalls && eat(_parenL)) {
	  var node = startNodeFrom(base);
	  node.callee = base;
	  node.arguments = parseExprList(_parenR, false);
	  return parseSubscripts(finishNode(node, "CallExpression"), noCalls);
	} else return base;
  }

  function parseExprAtom() {
	switch (tokType) {
	case _this:
	  var node = startNode();
	  next();
	  return finishNode(node, "ThisExpression");
	case _name:
	  return parseIdent();
	case _num: case _string: case _regexp:
	  var node = startNode();
	  node.value = tokVal;
	  node.raw = input.slice(tokStart, tokEnd);
	  next();
	  return finishNode(node, "Literal");

	case _null: case _true: case _false:
	  var node = startNode();
	  node.value = tokType.atomValue;
	  node.raw = tokType.keyword;
	  next();
	  return finishNode(node, "Literal");

	case _parenL:
	  var tokStartLoc1 = tokStartLoc, tokStart1 = tokStart;
	  next();
	  var val = parseExpression();
	  val.start = tokStart1;
	  val.end = tokEnd;
	  if (options.locations) {
		val.loc.start = tokStartLoc1;
		val.loc.end = tokEndLoc;
	  }
	  if (options.ranges)
		val.range = [tokStart1, tokEnd];
	  expect(_parenR);
	  return val;

	case _bracketL:
	  var node = startNode();
	  next();
	  node.elements = parseExprList(_bracketR, true, true);
	  return finishNode(node, "ArrayExpression");

	case _braceL:
	  return parseObj();

	case _function:
	  var node = startNode();
	  next();
	  return parseFunction(node, false);

	case _new:
	  return parseNew();

	default:
	  unexpected();
	}
  }

  function parseNew() {
	var node = startNode();
	next();
	node.callee = parseSubscripts(parseExprAtom(), true);
	if (eat(_parenL)) node.arguments = parseExprList(_parenR, false);
	else node.arguments = empty;
	return finishNode(node, "NewExpression");
  }

  function parseObj() {
	var node = startNode(), first = true, sawGetSet = false;
	node.properties = [];
	next();
	while (!eat(_braceR)) {
	  if (!first) {
		expect(_comma);
		if (options.allowTrailingCommas && eat(_braceR)) break;
	  } else first = false;

	  var prop = {key: parsePropertyName()}, isGetSet = false, kind;
	  if (eat(_colon)) {
		prop.value = parseExpression(true);
		kind = prop.kind = "init";
	  } else if (options.ecmaVersion >= 5 && prop.key.type === "Identifier" &&
				 (prop.key.name === "get" || prop.key.name === "set")) {
		isGetSet = sawGetSet = true;
		kind = prop.kind = prop.key.name;
		prop.key = parsePropertyName();
		if (tokType !== _parenL) unexpected();
		prop.value = parseFunction(startNode(), false);
	  } else unexpected();

	  if (prop.key.type === "Identifier" && (strict || sawGetSet)) {
		for (var i = 0; i < node.properties.length; ++i) {
		  var other = node.properties[i];
		  if (other.key.name === prop.key.name) {
			var conflict = kind == other.kind || isGetSet && other.kind === "init" ||
			  kind === "init" && (other.kind === "get" || other.kind === "set");
			if (conflict && !strict && kind === "init" && other.kind === "init") conflict = false;
			if (conflict) raise(prop.key.start, "Redefinition of property");
		  }
		}
	  }
	  node.properties.push(prop);
	}
	return finishNode(node, "ObjectExpression");
  }

  function parsePropertyName() {
	if (tokType === _num || tokType === _string) return parseExprAtom();
	return parseIdent(true);
  }

  function parseFunction(node, isStatement) {
	if (tokType === _name) node.id = parseIdent();
	else if (isStatement) unexpected();
	else node.id = null;
	node.params = [];
	var first = true;
	expect(_parenL);
	while (!eat(_parenR)) {
	  if (!first) expect(_comma); else first = false;
	  node.params.push(parseIdent());
	}

	var oldInFunc = inFunction, oldLabels = labels;
	inFunction = true; labels = [];
	node.body = parseBlock(true);
	inFunction = oldInFunc; labels = oldLabels;

	if (strict || node.body.body.length && isUseStrict(node.body.body[0])) {
	  for (var i = node.id ? -1 : 0; i < node.params.length; ++i) {
		var id = i < 0 ? node.id : node.params[i];
		if (isStrictReservedWord(id.name) || isStrictBadIdWord(id.name))
		  raise(id.start, "Defining '" + id.name + "' in strict mode");
		if (i >= 0) for (var j = 0; j < i; ++j) if (id.name === node.params[j].name)
		  raise(id.start, "Argument name clash in strict mode");
	  }
	}

	return finishNode(node, isStatement ? "FunctionDeclaration" : "FunctionExpression");
  }

  function parseExprList(close, allowTrailingComma, allowEmpty) {
	var elts = [], first = true;
	while (!eat(close)) {
	  if (!first) {
		expect(_comma);
		if (allowTrailingComma && options.allowTrailingCommas && eat(close)) break;
	  } else first = false;

	  if (allowEmpty && tokType === _comma) elts.push(null);
	  else elts.push(parseExpression(true));
	}
	return elts;
  }

  function parseIdent(liberal) {
	var node = startNode();
	if (liberal && options.forbidReserved == "everywhere") liberal = false;
	if (tokType === _name) {
	  if (!liberal &&
		  (options.forbidReserved &&
		   (options.ecmaVersion === 3 ? isReservedWord3 : isReservedWord5)(tokVal) ||
		   strict && isStrictReservedWord(tokVal)) &&
		  input.slice(tokStart, tokEnd).indexOf("\\") == -1)
		raise(tokStart, "The keyword '" + tokVal + "' is reserved");
	  node.name = tokVal;
	} else if (liberal && tokType.keyword) {
	  node.name = tokType.keyword;
	} else {
	  unexpected();
	}
	tokRegexpAllowed = false;
	next();
	return finishNode(node, "Identifier");
  }

});

		if (!acorn.version)
			acorn = null;
	}

	function parse(code, options) {
		return (global.acorn || acorn).parse(code, options);
	}

	var binaryOperators = {
		'+': '__add',
		'-': '__subtract',
		'*': '__multiply',
		'/': '__divide',
		'%': '__modulo',
		'==': '__equals',
		'!=': '__equals'
	};

	var unaryOperators = {
		'-': '__negate',
		'+': '__self'
	};

	var fields = Base.each(
		['add', 'subtract', 'multiply', 'divide', 'modulo', 'equals', 'negate'],
		function(name) {
			this['__' + name] = '#' + name;
		},
		{
			__self: function() {
				return this;
			}
		}
	);
	Point.inject(fields);
	Size.inject(fields);
	Color.inject(fields);

	function __$__(left, operator, right) {
		var handler = binaryOperators[operator];
		if (left && left[handler]) {
			var res = left[handler](right);
			return operator === '!=' ? !res : res;
		}
		switch (operator) {
		case '+': return left + right;
		case '-': return left - right;
		case '*': return left * right;
		case '/': return left / right;
		case '%': return left % right;
		case '==': return left == right;
		case '!=': return left != right;
		}
	}

	function $__(operator, value) {
		var handler = unaryOperators[operator];
		if (value && value[handler])
			return value[handler]();
		switch (operator) {
		case '+': return +value;
		case '-': return -value;
		}
	}

	function compile(code, options) {
		if (!code)
			return '';
		options = options || {};

		var insertions = [];

		function getOffset(offset) {
			for (var i = 0, l = insertions.length; i < l; i++) {
				var insertion = insertions[i];
				if (insertion[0] >= offset)
					break;
				offset += insertion[1];
			}
			return offset;
		}

		function getCode(node) {
			return code.substring(getOffset(node.range[0]),
					getOffset(node.range[1]));
		}

		function getBetween(left, right) {
			return code.substring(getOffset(left.range[1]),
					getOffset(right.range[0]));
		}

		function replaceCode(node, str) {
			var start = getOffset(node.range[0]),
				end = getOffset(node.range[1]),
				insert = 0;
			for (var i = insertions.length - 1; i >= 0; i--) {
				if (start > insertions[i][0]) {
					insert = i + 1;
					break;
				}
			}
			insertions.splice(insert, 0, [start, str.length - end + start]);
			code = code.substring(0, start) + str + code.substring(end);
		}

		function insertArguments(str, inserted){
			var pos = str.indexOf('(');
			return str.substring(0, pos +1) + inserted + str.substring(pos+1);
		}
		function insertOptions(str, inserted){
			var pos = str.indexOf('{');
			return str.substring(0, pos +1) + inserted + str.substring(pos+1);
		}
		function insertFirstStatement(parentNode, inserted){
			if( parentNode.type == 'FunctionDeclaration' && parentNode.body
				&& parentNode.body.type == 'BlockStatement' ){
				var pos = parentNode.body.start;
				replaceCode({
				range: [pos, pos+1]
				}, '{ ' + inserted  );
			}
		}

		function handleOverloading(node, parent) {
			switch (node.type) {
			case 'UnaryExpression':
				if (node.operator in unaryOperators
						&& node.argument.type !== 'Literal') {
					var arg = getCode(node.argument);
					replaceCode(node, '$__("' + node.operator + '", '
							+ arg + ')');
				}
				break;
			case 'BinaryExpression':
				if (node.operator in binaryOperators
						&& node.left.type !== 'Literal') {
					var left = getCode(node.left),
						right = getCode(node.right),
						between = getBetween(node.left, node.right),
						operator = node.operator;
					replaceCode(node, '__$__(' + left + ','
							+ between.replace(new RegExp('\\' + operator),
								'"' + operator + '"')
							+ ', ' + right + ')');
				}
				break;
			case 'UpdateExpression':
			case 'AssignmentExpression':
				var parentType = parent && parent.type;
				if (!(
						parentType === 'ForStatement'
						|| parentType === 'BinaryExpression'
							&& /^[=!<>]/.test(parent.operator)
						|| parentType === 'MemberExpression' && parent.computed
				)) {
					if (node.type === 'UpdateExpression') {
						var arg = getCode(node.argument),
							exp = '__$__(' + arg + ', "' + node.operator[0]
									+ '", 1)',
							str = arg + ' = ' + exp;
						if (node.prefix) {
							str = '(' + str + ')';
						} else if (
							parentType === 'AssignmentExpression' ||
							parentType === 'VariableDeclarator' ||
							parentType === 'BinaryExpression'
						) {
							if (getCode(parent.left || parent.id) === arg)
								str = exp;
							str = arg + '; ' + str;
						}
						replaceCode(node, str);
					} else {
						if (/^.=$/.test(node.operator)
								&& node.left.type !== 'Literal') {
							var left = getCode(node.left),
								right = getCode(node.right),
								exp = left + ' = __$__(' + left + ', "'
									+ node.operator[0] + '", ' + right + ')';
							replaceCode(node, /^\(.*\)$/.test(getCode(node))
									? '(' + exp + ')' : exp);
						}
					}
				}
				break;
			}
		}
		function handleInjection(node, parent, parseCxt){
			switch (node.type) {
				case 'Identifier':
					if( parent.type == 'AssignmentExpression' ){
						if( !parseCxt.global_vars[node.name] )
							parseCxt.global_vars.push(node.name);
					}
					switch( node.name ){
						case 'onResize':
						case 'onFrame':
							insertFirstStatement(parent, 'if( !doneInitialization ) return;');
							break;
					}
					break;
				case 'CallExpression':
					if( node.callee.type == 'Identifier' ){
						switch(node.callee.name ){
							case 'Main':
								replaceCode({
									range: [node.start, node.end]
								}, ' \n curPage = new Page(curLayer); \n curPage.setup2=function(curPage, curLayer, curTimeline){ \n ');
								break;
							case 'Scene':
								replaceCode({
									range: [node.callee.start, node.callee.end]
								}, '}; \n project.addNewLayer');
								break;
							case 'End_Scene_Setup':
								replaceCode({
									range: [node.callee.start, node.callee.end]
								}, '}; \n curPage.blockAnimation = true; \n curLayer.sceneSetup');
								break;
							case 'enterScene':
									replaceCode({
										range: [node.callee.start, node.callee.end]
									}, ' \n;project.showLayer');
									break;
							case 'leaveScene':
								replaceCode({
									range: [node.callee.start, node.callee.end]
								}, ' \n;project.hideTopLayer');
								break;
							case 'Clear':
								replaceCode({
									range: [node.start, node.end]
								}, ' \n;curPage.cly.removeChildren(); ');
								break;
							case 'Broadcast':
								replaceCode({
									range: [node.callee.start, node.callee.end]
								}, ' \n;project.broadcast');
								break;
							case 'Wait':
								replaceCode({
									range: [node.callee.start, node.callee.end]
								}, ' \n;curPage.wait');
								break;
							case 'Pause':
								replaceCode({
									range: [node.start, node.end]
								}, '}; \n curPage.blockAnimation = true;  \n curPage = new Page(curLayer); \n curPage.setup2=function(curPage, curLayer, curTimeline){ ');
								break;
							case 'Play':
								replaceCode({
									range: [node.callee.start, node.callee.end]
								}, ' \n curPage.add_to_tl');
								break;
							case 'Create':
								replaceCode({
									range: [node.callee.start, node.callee.end]
								}, ' \n curPage.createItems');
								break;
							case 'Uncreate':
								replaceCode({
									range: [node.callee.start, node.callee.end]
								}, ' \n curPage.uncreateItems');
								break;
							case 'Focus':
							case 'Indicate':
							case 'Flash':
							case 'Circumscribe':
							case 'ShowPassingFlash':
							case 'Homotopy':
							case 'ApplyingWaves':
							case 'MorphingTo':
								var code = getCode(node), tag = node.callee.name;
								code = insertOptions(code, 'page : curPage, ');
								code = code.replace(tag, 'RU.' + tag)
								replaceCode({
									range:  [node.start, node.end]
								}, code);
								break;
							case 'PlayCode':
								var code = getCode(node), numops = node.arguments.length,
									op0 = node.arguments[0].raw, op0len = op0.length, op1 = numops > 1 ? node.arguments[1].raw : undefined;
								op0 = op0.substring(1,op0len-1);
								replaceCode({
									range: [node.start, node.end]
								}, ' \n curPage.add_func_to_tl( function(){' + op0 + '}, ' + op1 + '); ');
								break;
							case 'Anime':
								var code = getCode(node), tag = node.callee.name;
								code = insertOptions(code, 'complete : function(){   curPage.cly._player.nextStep(); }, ');
								code = code.replace(tag, ' curPage.blockAnimation=true; anime')
								replaceCode({
									range:  [node.start, node.end]
								}, code);
								break;
							case 'stagger':
								replaceCode({
									range: [node.callee.start, node.callee.end]
								}, 'anime.stagger');
								break;
						}
						switch(node.callee.name ){
							case 'Wait':
							case 'Play':
							case 'Create':
							case 'Uncreate':
							case 'PlayCode':
							case 'Focus':
							case 'Indicate':
							case 'Flash':
							case 'Circumscribe':
							case 'ShowPassingFlash':
							case 'Homotopy':
							case 'ApplyingWaves':
							case 'MorphingTo':
							case 'Anime':
								replaceCode({
									range: [node.start, node.start]
								 }, ' }; \n curPage = new Page(curLayer); \n curPage.setup2=function(curPage, curLayer, curTimeline){  \n');
								replaceCode({
								   range: [node.end, node.end]
								}, ' } ; \n  curPage = new Page(curLayer); \n curPage.setup2=function(curPage, curLayer, curTimeline){  \n');
								break;
							case 'Scene':
								replaceCode({
									range: [node.start, node.start]
								}, ' }; ');
								replaceCode({
									range: [node.end, node.end]
								}, ';  curLayer  =  project.getActiveLayer(); \n'
									+ ';  curPage = new Page(curLayer); \n curPage.setup2=function(curPage, curLayer, curTimeline){  \n ');
								break;
							case 'End_Scene_Setup':
								replaceCode({
									range: [node.start, node.start]
								}, ' } ; ');
								replaceCode({
									range: [node.end, node.end]
								}, '; \n curPage = new Page(curLayer); \n curPage.setup2=function(curPage, curLayer, curTimeline){ \n ');
								break;
						}
					}
					break;
			}
		}

		function handleExports(node) {
			switch (node.type) {
			case 'ExportDefaultDeclaration':
				replaceCode({
					range: [node.start, node.declaration.start]
				}, 'module.exports = ');
				break;
			case 'ExportNamedDeclaration':
				var declaration = node.declaration;
				var specifiers = node.specifiers;
				if (declaration) {
					var declarations = declaration.declarations;
					if (declarations) {
						declarations.forEach(function(dec) {
							replaceCode(dec, 'module.exports.' + getCode(dec));
						});
						replaceCode({
							range: [
								node.start,
								declaration.start + declaration.kind.length
							]
						}, '');
					}
				} else if (specifiers) {
					var exports = specifiers.map(function(specifier) {
						var name = getCode(specifier);
						return 'module.exports.' + name + ' = ' + name + '; ';
					}).join('');
					if (exports) {
						replaceCode(node, exports);
					}
				}
				break;
			}
		}

		function walkAST(node, parent, paperFeatures, parseCxt) {
			if (node) {
				for (var key in node) {
					if (key !== 'range' && key !== 'loc') {
						var value = node[key];
						if (Array.isArray(value)) {
							for (var i = 0, l = value.length; i < l; i++) {
								walkAST(value[i], node, paperFeatures, parseCxt);
							}
						} else if (value && typeof value === 'object') {
							walkAST(value, node, paperFeatures, parseCxt);
						}
					}
				}
				if (paperFeatures.operatorOverloading !== false) {
					handleOverloading(node, parent);
				}
				if (paperFeatures.moduleExports !== false) {
					handleExports(node);
				}
				handleInjection(node, parent, parseCxt);
			}
		}

		function encodeVLQ(value) {
			var res = '',
				base64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
			value = (Math.abs(value) << 1) + (value < 0 ? 1 : 0);
			while (value || !res) {
				var next = value & (32 - 1);
				value >>= 5;
				if (value)
					next |= 32;
				res += base64[next];
			}
			return res;
		}

		var url = options.url || '',
			sourceMaps = options.sourceMaps,
			paperFeatures = options.paperFeatures || {},
			source = options.source || code,
			offset = options.offset || 0,
			agent = mpaper.agent,
			version = agent.versionNumber,
			offsetCode = false,
			lineBreaks = /\r\n|\n|\r/mg,
			map;
		if (sourceMaps && (agent.chrome && version >= 30
				|| agent.webkit && version >= 537.76
				|| agent.firefox && version >= 23
				|| agent.node)) {
			if (agent.node) {
				offset -= 2;
			} else if (window && url && !window.location.href.indexOf(url)) {
				var html = document.getElementsByTagName('html')[0].innerHTML;
				offset = html.substr(0, html.indexOf(code) + 1).match(
						lineBreaks).length + 1;
			}
			offsetCode = offset > 0 && !(
					agent.chrome && version >= 36 ||
					agent.safari && version >= 600 ||
					agent.firefox && version >= 40 ||
					agent.node);
			var mappings = ['AA' + encodeVLQ(offsetCode ? 0 : offset) + 'A'];
			mappings.length = (code.match(lineBreaks) || []).length + 1
					+ (offsetCode ? offset : 0);
			map = {
				version: 3,
				file: url,
				names:[],
				mappings: mappings.join(';AACA'),
				sourceRoot: '',
				sources: [url],
				sourcesContent: [source]
			};
		}
		var hasMainTag = new RegExp('\\s+' + 'Main' + '\\b').test(code);
		var parseCxt = { global_vars :[] };
		if (
			paperFeatures.operatorOverloading !== false ||
			paperFeatures.moduleExports !== false
		) {
			walkAST(parse(code, {
				ranges: true,
				preserveParens: true,
				sourceType: 'module'
			}), null, paperFeatures, parseCxt);
		}
		var code2 = '';
		if( parseCxt.global_vars.length > 0 ){
			code2 += ' var ' + parseCxt.global_vars[0] + '';
			for(var i = 1; i < parseCxt.global_vars.length; i++)
				code2 += ', ' + parseCxt.global_vars[i];
			code2 += '; '
		}
		if( !hasMainTag )
			code2  += 'curPage = new Page(curLayer);  curPage.setup2=function(curPage, curLayer, curTimeline){   ';
		code =  Constants.Env +  ' var doneInitialization = false, curLayer = project.getActiveLayer(), center = view.center,  curPage; curLayer.name =\'main\'; RU.setProject(project); '
				+ code2  + code + '   };  project.resetLayerStack(); project.showLayer(\'main\', {}, function(){ doneInitialization=true; }); ';
		if (map) {
			if (offsetCode) {
				code = new Array(offset + 1).join('\n') + code;
			}
			if (/^(inline|both)$/.test(sourceMaps)) {
				code += "\n//# sourceMappingURL=data:application/json;base64,"
						+ self.btoa(unescape(encodeURIComponent(
							JSON.stringify(map))));
			}
			code += "\n//# sourceURL=" + (url || 'paperscript');
		}
		return {
			url: url,
			source: source,
			code: code,
			map: map
		};
	}

	function execute(code, scope, options) {
		mpaper = scope;
		var view = scope.getView(),
			tool = /\btool\.\w+|\s+on(?:Key|Mouse)(?:Up|Down|Move|Drag)\b/
					.test(code) && !/\bnew\s+Tool\b/.test(code)
						? new Tool() : null,
			toolHandlers = tool ? tool._events : [],
			handlers = ['onFrame', 'onResize'].concat(toolHandlers),
			params = [],
			args = [],
			func,
			compiled = typeof code === 'object' ? code : compile(code, options);
		code = compiled.code;
		function expose(scope, hidden) {
			for (var key in scope) {
				if ((hidden || !/^_/.test(key)) && new RegExp('([\\b\\s\\W]|^)'
						+ key.replace(/\$/g, '\\$') + '\\b').test(code)) {
					params.push(key);
					args.push(scope[key]);
				}
			}
		}
		expose({ __$__: __$__, $__: $__, mpaper: scope, tool: tool },
				true);
		expose(scope);
		code = 'var module = { exports: {} }; ' + code;
		var exports = Base.each(handlers, function(key) {
			if (new RegExp('\\s+' + key + '\\b').test(code)) {
				params.push(key);
				this.push('module.exports.' + key + ' = ' + key + ';');
			}
		}, []).join('\n');
		if (exports) {
			code += '\n' + exports;
		}
		code += '\nreturn module.exports;';

		console.log( code );
		var agent = mpaper.agent;
		if (document && (agent.chrome
				|| agent.firefox && agent.versionNumber < 40)) {
			var script = document.createElement('script'),
				head = document.head || document.getElementsByTagName('head')[0];
			if (agent.firefox)
				code = '\n' + code;
			script.appendChild(document.createTextNode(
				'document.__paperscript__ = function(' + params + ') {' +
					code +
				'\n}'
			));
			head.appendChild(script);
			func = document.__paperscript__;
			delete document.__paperscript__;
			head.removeChild(script);
		} else {
			func = Function(params, code);
		}
		var exports = func && func.apply(scope, args);
		var obj = exports || {};
		Base.each(toolHandlers, function(key) {
			var value = obj[key];
			if (value)
				tool[key] = value;
		});
		if (view) {
			if (obj.onResize)
				view.setOnResize(obj.onResize);
			view.emit('resize', {
				size: view.size,
				delta: new Point()
			});
			if (obj.onFrame)
				view.setOnFrame(obj.onFrame);
			view.requestUpdate();
		}
		return exports;
	}

	function loadScript(script) {
		if (/^text\/(?:x-|)paperscript$/.test(script.type)
				&& PaperScope.getAttribute(script, 'ignore') !== 'true') {
			var canvasId = PaperScope.getAttribute(script, 'canvas'),
				canvas = document.getElementById(canvasId),
				src = script.src || script.getAttribute('data-src'),
				async = PaperScope.hasAttribute(script, 'async'),
				scopeAttribute = 'data-mpaper-scope';
			if (!canvas)
				throw new Error('Unable to find canvas with id "'
						+ canvasId + '"');
			var scope = PaperScope.get(canvas.getAttribute(scopeAttribute))
						|| new PaperScope().setup(canvas);
			canvas.setAttribute(scopeAttribute, scope._id);

			if (src) {
				Http.request({
					url: src,
					async: async,
					mimeType: 'text/plain',
					onLoad: function(code) {
						execute(code, scope, src);
					}
				});
			} else {
				execute(script.innerHTML, scope, script.baseURI);
			}
			script.setAttribute('data-mpaper-ignore', 'true');
			return scope;
		}
	}

	function loadAll() {
		Base.each(document && document.getElementsByTagName('script'),
				loadScript);
	}

	function load(script) {
		return script ? loadScript(script) : loadAll();
	}

	if (window) {
		if (document.readyState === 'complete') {
			setTimeout(loadAll);
		} else {
			DomEvent.add(window, { load: loadAll });
		}
	}

	return {
		compile: compile,
		execute: execute,
		load: load,
		parse: parse,
		calculateBinary: __$__,
		calculateUnary: $__
	};

}.call(this);

var mpaper = new (PaperScope.inject(Base.exports, {
	Base: Base,
	Numerical: Numerical,
	RU:RU,
	Formatter:Formatter,
	anime:anime,
	Key: Key,
	DomEvent: DomEvent,
	DomElement: DomElement,
	document: document,
	window: window,
	Symbol: SymbolDefinition,
	PlacedSymbol: SymbolItem
}))();

if (mpaper.agent.node) {
	require('./node/extend.js')(mpaper);
}

if (typeof define === 'function' && define.amd) {
	define('mpaper', mpaper);
} else if (typeof module === 'object' && module) {
	module.exports = mpaper;
}

return mpaper;
}.call(this, typeof self === 'object' ? self : null);
