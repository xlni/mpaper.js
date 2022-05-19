 /**
 * @name CoordinateSystem
 *
 * @class The CoordinateSystem  
 * 
 * @example   see  CoordinateSystem.html  as examples
 *
 *  
 * 
 * 
 * 
 * @extends Item
 */
var CoordinateSystem = Item.extend(/** @lends CoordinateSystem# */{
    _class: 'CoordinateSystem',  

    initialize: function CoordinateSystem(axis_x, axis_y,    show_grid,  grid_color) {
        this._initialize( ); 
        this._axis = []; 
        this._axis[0] = axis_x; 
        this._axis[1] = axis_y;  
        this.show_grid = show_grid;
        this. grid_color =  grid_color || this._project.getBuiltInColor('color1') || 'black';
        //create grid...
        var that = this;
        var ticks_x_range = axis_x.get_ticks_global_range();
        this.x_min = ticks_x_range[0].x;
        this.x_max = ticks_x_range[1].x;
        var ticks_y_range = axis_y.get_ticks_global_range();
        this.y_min = ticks_y_range[1].y;
        this.y_max = ticks_y_range[0].y;
        
        this._registeredDotes = [];
        this._registeredFuncs = [];
     //   this._changed(/*#=*/Change.CHILDREN);
    },
    _copyExtraAttr2: function(source, excludeMatrix){  
    },

    _copyExtraAttr: function(source, excludeMatrix){ 
        this._axis = source._axis;  
        this.show_grid = source.show_grid;
        this. grid_color = source. grid_color  ;
        //create grid...  
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
            ctx.strokeStyle = this. grid_color;
            ctx.fillStyle = this. grid_color; 
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
       // _draw.base.call(this, ctx, param);
    },
    _animForShowing: function(duration, offset){ 
        this.visible = true;
        this._axis[0].addToViewIfNot(duration, '==');
        this._axis[1].addToViewIfNot(duration, '==');
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
        if( p2v <=0 ) return; //ilegal
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

    /**
     * 
     * @param {*} x_change in render space
     * @param {*} y_change in render space
     * @returns 
     */
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
    /**
     * 
     * @param {*} x is a  in render space
       @param {*} y is a  in render space
     * @returns  array of two
     */
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
    /**
     * 
     * @param {*} x 
     * @param {*} y 
     * @returns  array of two
     */
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
    setGrid_color: function(color){
         this. grid_color = color;
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
  