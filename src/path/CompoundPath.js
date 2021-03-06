/*
 * Paper.js - The Swiss Army Knife of Vector Graphics Scripting.
 * http://paperjs.org/
 *
 * Copyright (c) 2011 - 2020, Jürg Lehni & Jonathan Puckey
 * http://juerglehni.com/ & https://puckey.studio/
 *
 * Distributed under the MIT license. See LICENSE file for details.
 *
 * All rights reserved.
 */ 
/**
 * @name CompoundPath
 *
 * @class A compound path is a complex path that is made up of one or more
 * simple sub-paths. It can have the `nonzero` fill rule, or the `evenodd` rule
 * applied. Both rules use mathematical equations to determine if any region is
 * outside or inside the final shape. The `evenodd` rule is more predictable:
 * Every other region within a such a compound path is a hole, regardless of
 * path direction.
 *
 * All the paths in a compound path take on the style of the compound path and
 * can be accessed through its {@link Item#children} list.
 *
 * @extends PathItem
 */
var CompoundPath = PathItem.extend(/** @lends CompoundPath# */{
    _class: 'CompoundPath',
    _serializeFields: {
        children: []
    },
    // Enforce creation of beans, as bean getters have hidden parameters.
    // See #getPathData() below.
    beans: true,

    /**
     * Creates a new compound path item and places it in the active layer.
     *
     * @param {Path[]} [paths] the paths to place within the compound path
     *
     * @example {@paperscript}
     * // Create a circle shaped path with a hole in it:
     * var circle = new Path.Circle({
     *     center: new Point(50, 50),
     *     radius: 30
     * });
     *
     * var innerCircle = new Path.Circle({
     *     center: new Point(50, 50),
     *     radius: 10
     * });
     *
     * var compoundPath = new CompoundPath([circle, innerCircle]);
     * compoundPath.fillColor = 'red';
     *
     * // Move the inner circle 5pt to the right:
     * compoundPath.children[1].position.x += 5;
     */
    /**
     * Creates a new compound path item from an object description and places it
     * at the top of the active layer.
     *
     * @name CompoundPath#initialize
     * @param {Object} object an object containing properties to be set on the
     *     path
     * @return {CompoundPath} the newly created path
     *
     * @example {@paperscript}
     * var path = new CompoundPath({
     *     children: [
     *         new Path.Circle({
     *             center: new Point(50, 50),
     *             radius: 30
     *         }),
     *         new Path.Circle({
     *             center: new Point(50, 50),
     *             radius: 10
     *         })
     *     ],
     *     fillColor: 'black',
     *     selected: true
     * });
     */
    /**
     * Creates a new compound path item from SVG path-data and places it at the
     * top of the active layer.
     *
     * @name CompoundPath#initialize
     * @param {String} pathData the SVG path-data that describes the geometry
     * of this path
     * @return {CompoundPath} the newly created path
     *
     * @example {@paperscript}
     * var pathData = 'M20,50c0,-16.56854 13.43146,-30 30,-30c16.56854,0 30,13.43146 30,30c0,16.56854 -13.43146,30 -30,30c-16.56854,0 -30,-13.43146 -30,-30z M50,60c5.52285,0 10,-4.47715 10,-10c0,-5.52285 -4.47715,-10 -10,-10c-5.52285,0 -10,4.47715 -10,10c0,5.52285 4.47715,10 10,10z';
     * var path = new CompoundPath(pathData);
     * path.fillColor = 'black';
     */
    initialize: function CompoundPath(arg) {
        // CompoundPath has children and supports named children.
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
        // If we're passed a segment array describing a simple path instead of a
        // compound-path, wrap it in another array to turn it into the array
        // notation for compound-paths.
        var list = items,
            first = list[0];
        if (first && typeof first[0] === 'number')
            list = [list];
        // Perform some conversions depending on the type of item passed:
        // Convert array-notation to paths, and expand compound-paths in the
        // items list by adding their children to the it replacing their parent.
        for (var i = items.length - 1; i >= 0; i--) {
            var item = list[i];
            // Clone the list array before modifying it, as it may be a passed
            // children array from another item.
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

    // DOCS: reduce()
    // TEST: reduce()
    reduce: function reduce(options) {
        var children = this._children;
        for (var i = children.length - 1; i >= 0; i--) {
            var path = children[i].reduce(options);
            if (path.isEmpty())
                path.remove();
        }
        if (!children.length) { // Replace with a simple empty Path
            var path = new Path(Item.NO_INSERT);
            path.copyAttributes(this);
            path.insertAbove(this);
            this.remove();
            return path;
        }
        return reduce.base.call(this);
    },

    /**
     * Specifies whether the compound-path is fully closed, meaning all its
     * contained sub-paths are closed path.
     *
     * @bean
     * @type Boolean
     * @see Path#closed
     */
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

    /**
     * The first Segment contained within the compound-path, a short-cut to
     * calling {@link Path#firstSegment} on {@link Item#firstChild}.
     *
     * @bean
     * @type Segment
     */
    getFirstSegment: function() {
        var first = this.getFirstChild();
        return first && first.getFirstSegment();
    },

    /**
     * The last Segment contained within the compound-path, a short-cut to
     * calling {@link Path#lastSegment} on {@link Item#lastChild}.
     *
     * @bean
     * @type Segment
     */
    getLastSegment: function() {
        var last = this.getLastChild();
        return last && last.getLastSegment();
    },

    /**
     * All the curves contained within the compound-path, from all its child
     * {@link Path} items.
     *
     * @bean
     * @type Curve[]
     */
    getCurves: function() {
        var children = this._children,
            curves = [];
        for (var i = 0, l = children.length; i < l; i++) {
            Base.push(curves, children[i].getCurves());
        }
        return curves;
    },


    /**
     * 
     * @returns longest sub-path
     */
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
    /**
     * @param {*} timeline 
     * @param {*} target  may be compound path  or single path.
     * @param {*} duration 
     *  @param {*} offset 
     *  @param {*} finishCallback 
     */
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
     //   tc.forEach(e =>{
     //       if( !e.strokeColor ) e.strokeColor = target.strokeColor;
     //       if( !e.fillColor ) e.fillColor = target.fillColor;
     //   })
        var to_more = ccount < tcount, temp = to_more ? cc : tc, diff =  Math.abs(ccount - tcount),
            added=[];
        if( diff > 0 ){
            var temp = ccount < tcount ? cc : tc, last = temp[temp.length-1], t; 
            for(var i = diff; i > 0; i--) {
               t =  last.clone(); 
             //  if( !to_more )  t.visible = false;
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
  
    /**
     * The first Curve contained within the compound-path, a short-cut to
     * calling {@link Path#firstCurve} on {@link Item#firstChild}.
     *
     * @bean
     * @type Curve
     */
    getFirstCurve: function() {
        var first = this.getFirstChild();
        return first && first.getFirstCurve();
    },

    /**
     * The last Curve contained within the compound-path, a short-cut to
     * calling {@link Path#lastCurve} on {@link Item#lastChild}.
     *
     * @bean
     * @type Curve
     */
    getLastCurve: function() {
        var last = this.getLastChild();
        return last && last.getLastCurve();
    },

    /**
     * The area that the compound-path's geometry is covering, calculated by
     * getting the {@link Path#area} of each sub-path and it adding up.
     * Note that self-intersecting paths and sub-paths of different orientation
     * can result in areas that cancel each other out.
     *
     * @bean
     * @type Number
     */
    getArea: function() {
        var children = this._children,
            area = 0;
        for (var i = 0, l = children.length; i < l; i++)
            area += children[i].getArea();
        return area;
    },

    /**
     * remove all children 
     */
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

    cloneSubPath: function(start_offset, end_offset, copyAttributes){
        var len = this.getLength(),  children = this._children, accLen = 0;
        var r = new CompoundPath();
         for (var i = 0, l = children.length; i < l; i++){
            var c = children[i], clen = c.getLength(), accLen_e = accLen + clen ;
            if( accLen_e < start_offset ) { accLen = accLen_e; continue; }
            if( accLen > end_offset ) { break; }
            var start_offset_adjust = accLen_e >= end_offset ? start_offset-accLen : 0;
            if( accLen_e >= end_offset ){
                r.addChild( c.cloneSubPath(start_offset_adjust, end_offset-accLen, copyAttributes) );
                break;
            } else {
                r.addChild(  c.cloneSubPath(start_offset_adjust, clen, copyAttributes)  )
                accLen = accLen_e; 
                continue;
            }  
         } 
         return r;
    },
    /**
     * The total length of all sub-paths in this compound-path, calculated by
     * getting the {@link Path#length} of each sub-path and it adding up.
     *
     * @bean
     * @type Number
     */
    getLength: function() {
        var children = this._children,
            length = 0;
        for (var i = 0, l = children.length; i < l; i++)
            length += children[i].getLength();
        return length;
    },

    //added Positions functions
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

    /**
     * 
     * @param {*} point 
     * @param {*} [epsilon] 
     * @returns  -1 if not on the path
     */
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
        // NOTE: #setPathData() is defined in PathItem.
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
                // If we're not specifically asked to returns paths through
                // options.class == Path, do not test children for fill, since a
                // compound path forms one shape.
                // Also support legacy format `type: 'path'`.
                options.class === Path || options.type === 'path' ? options
                    : Base.set({}, options, { fill: false }),
                viewMatrix);
    },

    _draw: function(ctx, param, viewMatrix, strokeMatrix) {
        var children = this._children;
        // Return early if the compound path doesn't have any children:
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
            // Do not draw this child now if it's separately marked as selected,
            // as it would be drawn twice otherwise.
            if (!selectionItems[child._id]) {
                child._drawSelected(ctx, mx.isIdentity() ? matrix
                        : matrix.appended(mx));
            }
        }
    }
},
new function() { // Injection scope for PostScript-like drawing functions
    /**
     * Helper method that returns the current path and checks if a moveTo()
     * command is required first.
     */
    function getCurrentPath(that, check) {
        var children = that._children;
        if (check && !children.length)
            throw new Error('Use a moveTo() command first');
        return children[children.length - 1];
    }

    // Redirect all other drawing commands to the current path
    return Base.each(['lineTo', 'cubicCurveTo', 'quadraticCurveTo', 'curveTo',
            'arcTo', 'lineBy', 'cubicCurveBy', 'quadraticCurveBy', 'curveBy',
            'arcBy'],
        function(key) {
            this[key] = function() {
                var path = getCurrentPath(this, true);
                path[key].apply(path, arguments);
            };
        }, {
            // NOTE: Documentation for these methods is found in PathItem, as
            // they are considered abstract methods of PathItem and need to be
            // defined in all implementing classes.
            moveTo: function(/* point */) {
                var current = getCurrentPath(this),
                    // Reuse current path if nothing was added yet
                    path = current && current.isEmpty() ? current
                            : new Path(Item.NO_INSERT);
                if (path !== current)
                    this.addChild(path);
                path.moveTo.apply(path, arguments);
            },

            moveBy: function(/* point */) {
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
    // Injection scope for methods forwarded to the child paths.
    // NOTE: Documentation is in PathItem
    this[key] = function(param) {
        var children = this._children,
            res;
        for (var i = 0, l = children.length; i < l; i++) {
            res = children[i][key](param) || res;
        }
        return res;
    };
}, {}));
