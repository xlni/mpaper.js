/**
 * migrated from R9 source code.  used to render math in format defined in R9 mathop.
 */

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


        // getter setter code is directly from Kinetics.
        // Base has similiar code.... FIXME ....
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

            // getter
            constructor.prototype[getter] = function () {
                var ret = {};

                for (n = 0; n < len; n++) {
                    component = components[n];
                    ret[component] = this.getAttr(attr + capitalize(component));
                }

                return ret;
            };

            // setter
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
                // setting
                if (arguments.length) {
                    this[setter](arguments[0]);
                    return this;
                }
                // getting
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