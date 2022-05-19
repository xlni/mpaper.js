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
 * @name Group
 *
 * @class A Group is a collection of items. When you transform a Group, its
 * children are treated as a single unit without changing their relative
 * positions.
 *
 * @extends Item
 */
var Group = Item.extend(/** @lends Group# */{
    _class: 'Group',
    _selectBounds: false,
    _selectChildren: true,
    _serializeFields: {
        children: []
    },

    // DOCS: document new Group(item, item...);
    /**
     * Creates a new Group item and places it at the top of the active layer.
     *
     * @name Group#initialize
     * @param {Item[]} [children] An array of children that will be added to the
     * newly created group
     *
     * @example {@paperscript}
     * // Create a group containing two paths:
     * var path = new Path([100, 100], [100, 200]);
     * var path2 = new Path([50, 150], [150, 150]);
     *
     * // Create a group from the two paths:
     * var group = new Group([path, path2]);
     *
     * // Set the stroke color of all items in the group:
     * group.strokeColor = 'black';
     *
     * // Move the group to the center of the view:
     * group.position = view.center;
     *
     * @example {@paperscript height=320}
     * // Click in the view to add a path to the group, which in turn is rotated
     * // every frame:
     * var group = new Group();
     *
     * function onMouseDown(event) {
     *     // Create a new circle shaped path at the position
     *     // of the mouse:
     *     var path = new Path.Circle(event.point, 5);
     *     path.fillColor = 'black';
     *
     *     // Add the path to the group's children list:
     *     group.addChild(path);
     * }
     *
     * function onFrame(event) {
     *     // Rotate the group by 1 degree from
     *     // the centerpoint of the view:
     *     group.rotate(1, view.center);
     * }
     */
    /**
     * Creates a new Group item and places it at the top of the active layer.
     *
     * @name Group#initialize
     * @param {Object} [object] an object containing the properties to be set on
     *     the group
     *
     * @example {@paperscript}
     * var path = new Path([100, 100], [100, 200]);
     * var path2 = new Path([50, 150], [150, 150]);
     *
     * // Create a group from the two paths:
     * var group = new Group({
     *     children: [path, path2],
     *     // Set the stroke color of all items in the group:
     *     strokeColor: 'black',
     *     // Move the group to the center of the view:
     *     position: view.center
     * });
     */
    initialize: function Group(arg) {
        // Allow Group to have children and named children
        this._children = [];
        this._topIndex = -1;
        this._namedChildren = {};
        if (!this._initialize(arg))
            this.addChildren(Array.isArray(arg) ? arg : arguments);
    },

     

    _changed: function _changed(flags) {
        _changed.base.call(this, flags);
        if (flags & /*#=*/(ChangeFlag.CHILDREN | ChangeFlag.CLIPPING | ChangeFlag.STYLE )) {
            // Clear cached clip item whenever hierarchy changes
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
      //  cs.forEach(e =>{  e._progress = create ? 0 : 1; });
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
          //  begin: function(){
          //      started = true;
         //       children.forEach(e => {  e.visible = false; });
         //   }.bind(this),
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
        // NOTE: _clipItem is the child that has _clipMask set to true.
        var clipItem = this._clipItem;
        // Distinguish null (no clipItem set) and undefined (clipItem was not
        // looked for yet).
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

    /**
     * Specifies whether the group item is to be clipped. When setting to
     * `true`, the first child in the group is automatically defined as the
     * clipping mask.
     *
     * @bean
     * @type Boolean
     *
     * @example {@paperscript}
     * var star = new Path.Star({
     *     center: view.center,
     *     points: 6,
     *     radius1: 20,
     *     radius2: 40,
     *     fillColor: 'red'
     * });
     *
     * var circle = new Path.Circle({
     *     center: view.center,
     *     radius: 25,
     *     strokeColor: 'black'
     * });
     *
     * // Create a group of the two items and clip it:
     * var group = new Group(circle, star);
     * group.clipped = true;
     *
     * // Lets animate the circle:
     * function onFrame(event) {
     *     var offset = Math.sin(event.count / 30) * 30;
     *     circle.position.x = view.center.x + offset;
     * }
     */
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
                    // Pass clipItem for hidden _exclude parameter
                    clipItem);
    },
    _draw_extra_bg: function(ctx, param, viewMatrix) { },
    _draw_extra_fb: function(ctx, param, viewMatrix) { },
    _draw: function(ctx, param, viewMatrix) { 
        var clip = param.clip,
            clipItem = !clip && this._getClipItem();
        param = param.extend({ clipItem: clipItem, clip: false });
        if (clip) {
            // If told to clip with a group, we start our own path and draw each
            // child just like in a compound-path.
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
    /**
     * alignment all childrend into grid. grid with same cell sizes.
     * @param {*} numrows 
     * @param {*} numcols 
     *  * @param {*} gap 
     *  * @param {*} exclude 
     */
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
      /**
     * alignment all childrend into a line with same gap.
     * @param {*} vertical 
     * @param {*} gap 
     * @param {*} exclude  the child to exclude, for example background one?
     */
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
    /**
      * @param {*} timeline 
     * @param {*} target 
     * @param {*} duration  
     * @param {*} offset 
     * @param {*} finishCallback 
     */
    morphingTo: function(timeline, target, duration, offset, finishCallback){
        var that = this, fromList = this.getAllLeaves(true), cc = fromList.filter(e =>{ return e instanceof PathItem; }),
            toList = target.getAllLeaves(true), tc = toList.filter(e =>{ return e instanceof PathItem; }),
            ccount = cc.length, tcount = tc.length;  
            //we move all leave out of group ,as in some cases child in group can not get correct position?
            // when applyMatrix is false when group created? 
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
                //    c.remove(); 
                 //   that._project._activeLayer.addChild(c);
                 //   if( !to_more )    c.visible = false;
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
