/*
 *  
 */
 

/**
 * @name R9Function
 *
 * @class The R9Function  
 * base class for function curves drawing on Coordinate System.
 *  
 * @example   see  R9Function.html  as examples
 *
 * 
 * PARAMETERS
 *   @param  coord_system reference to a Coordinate System.
     @param  func (Callable[[float, float], float]) – The func to be plotted in the form of (lambda x: x**2)

     @param  t_range (Sequence[float] | None) – Determines the length that the func spans. By default [0, 1]

     @param scale_func (_ScaleBase) – Scaling class applied to the points of the func. Default of LinearBase.

     @param use_smoothing (bool) – Whether to interpolate between the points of the func after they have been created. (Will have odd behaviour with a low number of points)

     @param  discontinuities (Iterable[float] | None) – Values of t at which the func experiences discontinuity.

     @param dt (float) – The left and right tolerance for the discontinuities.

     @param is_param_func  - default true,  flag to indicate it is a parametrized function,  (x,y) = f(t)
     otherwise , it is a regular function : y = f(x)
 * 
 * 
 * @extends Path
 */
 var R9Function = CompoundPath.extend(/** @lends R9Function# */{
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
      //  if( typeof this.scaling == 'undefined')  this.scaling = new LinearBase();
        if( typeof this.use_smoothing == 'undefined')  this.use_smoothing = true;
        //FIXME TODO
        if( typeof this.discontinuities == 'undefined') this.discontinuities = [];
        if( typeof this.dt == 'undefined') this.dt = 1e-08;

        this.closed = false;
        this.fillColor = 'rgba(0,0,0,0)';
        this.coord_system.registerFunctionCurve(this);
      //  this.generate_points();
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
    /**
     * 
     * @param {*} t input numerica value
     * @returns an [x,y] pair
     */
   get_point_from_func: function(t){
       var v = this.func(t);
       if( Array.isArray(v)) return v;
       return [t, v];
   },

  /**
    * 
    * @param {*} x is a value in domain, not input for functions.
    * @returns  array.  it can has multiple values.
    */
    get_value_y_from_value_x: function(x, asif_param_func){
        if( this.is_param_func || asif_param_func ){
            var space = this.coord_system;
            var r = this.get_render_y_from_render_x(space.getGlobalRenderPosByValue_X(x));
            return r.map( e =>  space.getValueByGlobalRenderPos_Y(e) );
        }
        return [this.func(x)];
    },


   /**
    * 
    * @param {*} x is a value in domain, not input for functions.
    * @returns array it can has multiple values.
    */
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
   //override by subclass...
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
            cur_path.fillColor = that.fillColor;
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

/*
 *  
 */

/**
 * @name SVGFunction
 *
 * @class The SVGFunction  
 * 
 * @param  path_data  path_data path string.
 * @param  keep_svg_unmapped: false | true.    
 * if value is true, we use the data in path_data directly.
 * 
 * 
 * @example   see  ParametricFunction.html  as examples
 *
 * @extends R9Function
 */
 var SVGFunction = R9Function.extend(/** @lends SVGFunction# */{
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
        temp_path.fillColor = that.fillColor;
        temp_path.strokeColor = that.strokeColor;
        temp_path.strokeWidth = that.strokeWidth;
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

/*
 *  
 */

/**
 * @name LinearFunction
 *
 * @class The LinearFunction  
 * 
 * @example   see  ParametricFunction.html  as examples
 *
 * @extends R9Function
 */
 var LinearFunction = R9Function.extend(/** @lends LinearFunction# */{
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
        path.fillColor = that.fillColor;
        path.strokeColor = that.strokeColor;
        path.strokeWidth = that.strokeWidth;
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

/**
 * @name CircleFunction
 *
 * @class The CircleFunction  
 * 
 * parameters:
 *   @param center   {Point} or [x,y]
 *   @param radius   can be [x,y] or a single number
 * 
 * @example   see  ParametricFunction.html  as examples
 *
 * @extends Path
 */
 var EllipseFunction = SVGFunction.extend(/** @lends CircleFunction# */{
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
            fillColor: that.fillColor,
            strokeWidth: that.strokeWidth
        }); 
        this.addChild( path ); 
        return this;
    } 
});
 