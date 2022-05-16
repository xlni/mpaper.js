/*
 *  
 */

/**
 * @name R9Line
 *
 * @class The R9Line  
 * 
 * @example   see  R9Line.html  as examples
 *
 * @extends Path
 */
 var R9Line = Path.extend(/** @lends R9Line# */{
    _class: 'R9Line',
    
    initialize: function R9Line(arg) {
        Path.apply(this, arguments); 
        if( !this.fillColor ) this.fillColor = this._project.getBuiltInColor('fillColor');
        if( !this.strokeColor ) this.strokeColor = this._project.getBuiltInColor('strokeColor');
    },

    getVector : function(){
        return  this.getEnd().__subtract(this.getStart());
    },

    /**
     * 
     * @returns Point
     */
    getStart: function(){
       return this.getFirstSegment().point;
    },
    
    /**
     * 
     * @returns Point
     */
     getEnd: function(){
        return this.getLastSegment().point;
     },  


     /**
      * 
      * @param {*} start 
      * @param {*} end 
      */
     put_start_and_end_on: function(start, end){
        if( start && start._class == 'Point' )
            this.getFirstSegment().point = start;
        if(  end && end._class == 'Point' )
            this.getLastSegment().point = end;
     },

     /**
      * Returns the projection of a point onto a line.  
      * @param {*} point 
      * @returns Point
      */
     get_projection: function(point){
         return this.getNearestPoint(point);
     },


     /**
      * 
      * @param {*} shape use shape to control the start 
      */
     setPostionControl_start: function(shape){
        var that = this;
        this.addUpdater(function(){
            var c = shape.position;
            if( !c.equals( that.getFirstSegment().point )){
                that.getFirstSegment().point = c;
            }
        });
     },

/**
      * 
      * @param {*} shape use shape to control the end 
      */
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

/**
 * @name R9DashLine
 *
 * @class The R9DashLine  
 *
 * @extends R9Line
 */
 var R9DashLine = R9Line.extend(/** @lends R9DashLine# */{
    _class: 'R9DashLine',
    
    initialize: function R9DashLine(arg) {
        R9Line.apply(this, arguments); 
        this.dashArray = [1, 2];
    },

   
});

/**
 * @name R9TangentLine
 *"Constructs a line tangent to a :class:{Path} at a specific point.
 * 
 * @class The R9TangentLine  
 * 
 * var line = new r9TangentLine( {  host:  a path {Path}
 *                                  point:  a point on path  {Point} ,
 *                                  vertexDraggable: true|false
 *                                   });
 * 
 *
 * @extends R9Line
 */
 var R9TangentLine = R9Line.extend(/** @lends R9TangentLine# */{
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
                //   var location = hitResult.location;
                //   segment = path.insert(location.index + 1, event.point);
                //   path.smooth();
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
                that._changed(/*#=*/(Change.SEGMENTS)); 
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


/**
 * @name R9Angle
 *"Constructs a angle given three points.
 * 
 * @class The R9Angle  
 * 
 * var line = new R9Angle( {  vertex:  {Point} or {PositionControl}
 *                            from:    {Point} or {PositionControl},
 *                            to:    {Point} or {PositionControl},
 *                            show_label: true|false,
 *                            dash:   true|false,
 *                            show_arrow: false|true
 *                                   });
 * 
 *
 * @extends Path
 */
 var R9Angle = Path.extend(/** @lends R9Angle# */{
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
            // Angle Label
            this.label = new PointText(center.__add( through.normalize(radius + 10) ).__add( new Point(0, 3)));
            this.label.content = Math.floor(angle * 100) / 100 + '\xb0';
            this.label.fillColor = this.strokeColor; 
            // this.label.fontSize = 14;
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
            // Angle Label
            this.label.position = (center.__add( through.normalize(radius + 10) ).__add( new Point(0, 3)));
            this.label.content = Math.floor(angle * 100) / 100 + '\xb0'; 
        } 
    }
     
});

/**
 * @name TracedPath
 *
 * @class The TracedPath  
 *    
 *  Parameters
    ----------
    @param traced_func 
        The function to be traced or item object
     @param stroke_width
        The width of the trace.
     @param stroke_color
        The color of the trace.
     @param tail_time
        The time taken for the path to dissipate. 
 * @example   see  TracedPath.html  as examples
 * 
 *  
 *
 * @extends TracedPath
 */
 var TracedPath = Path.extend(/** @lends TracedPath# */{
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
var PointPath2 = Path.extend(/** @lends PointPath2# */{
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
         //   dx = p[0] - t.point.x;
         //   dy = p[1] - t.point.y;
            t.point._set(p[0], p[1], true);
            if( t.handleIn ){
               //  t.handleIn._set(t.handleIn.x+ dx, t.handleIn.y+dy, true);
            }   
            if( t.handleOut ){
              //   t.handleOut._set(t.handleOut.x+dx, t.handleOut.y+dy, true);
            }   
            t._changed();
        }
    },
    getTime: function(){
        return this._time;
    }

});
var PointPath = Item.extend(/** @lends PointPath# */{
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
var TracedPathLite = PointPath.extend(/** @lends TracedPathLite# */{
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