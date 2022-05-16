
var LinearBase = Base.extend(/** @lends LinearBase# */{
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

var LogBase = Base.extend(/** @lends LogBase# */{
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

/**
 * @name NumberLine
 *
 * @class The NumberLine  
 * 
 * @example   see  NumberLine.html  as examples
 *
 *  """Creates a number line with tick marks.

    Parameters
    ----------
     @param x_range
        The ``[x_min, x_max, x_val_step]`` values to create the line.
    
 
     @param include_ticks
        Whether to include ticks on the number line.
   
     @param numbers_with_elongated_ticks
        An iterable of specific values with elongated ticks.
   
 
 
     @param include_tip
        Whether to add a tip to the end of the line.
   
     @param nclude_numbers
        Whether to add numbers to the tick marks. The number of decimal places is determined
        by the step size, this default can be overridden by ``decimal_number_config``.
     @param value_scaling
        The way the ``x_range`` is value is scaled, i.e. :class:`~.LogBase` for a logarithmic numberline. Defaults to :class:`~.LinearBase`.
     @param font_size
        The size of the label mobjects. Defaults to 18.
     @param label_direction
        The specific position to which label mobjects are added on the line.
     @param label_constructor
        Determines the mobject class that will be used to construct the labels of the number line.
 
     @param decimal_number_config
        Arguments that can be passed to :class:`~.numbers.DecimalNumber` to influence number mobjects.
     @param numbers_to_exclude
        An explicit iterable of numbers to not be added to the number line.
     @param numbers_to_include
        An explicit iterable of numbers to add to the number line
     @param numbers_to_include_color
        used to mark numbers_to_include
     @param dynamic_step_value
        change step value on length changes  [0,10,2],  step value is 2
     @param fixed_step_length
        keep step length unchanged on length change.   [0,10,2]  2 is step value, step-length is rendered length for step value
        when length changes, fixed_step_length means  changes of value ranges for whole axis.


    .. note::

        Number ranges that include both negative and positive values will be generated
        from the 0 point, and may not include a tick at the min / max
        values as the tick locations are dependent on the step size.

    Examples
    -------- 

                l1 =    NumberLineExample( 
                       from: [2,3],
                    to: [4,9],
                    x_range:[-10, 10, 2], 
                    color:BLUE,
                    include_label:True,
                    label_direction:true
                )

                l1 = NumberLine(
                       from: [2,3],
                    to: [4,9],
                    x_range:[-10, 10, 2], 
                    numbers_with_elongated_ticks:[-2, 4],
                    include_label:True,
                    font_size:24,
                )
             
                l2 = NumberLine(
                       from: [2,3],
                    to: [4,9],
                    x_range:[-2.5, 2.5 + 0.5, 0.5], 
                    decimal_number_config:{"num_decimal_places": 2},
                    include_label:True,
                )

                l3 = NumberLine(
                    from: [2,3],
                    to: [4,9],
                    x_range:[-5, 5 + 1, 1], 
                    include_tip:True,
                    include_label:True, 
                )
 
 * 
 * 
 * 
 * @extends R9Line
 */
var NumberLine = R9Line.extend(/** @lends NumberLine# */{
    _class: 'NumberLine',  

    initialize: function NumberLine(params) {
        var args = arguments; 
        R9Line.apply(this, args); 
     //   this.removeSegments();
        this._add([ new Segment(params.from),  new Segment(params.to)]);
        // tip
        this.include_tip =  typeof params.include_tip == 'undefined' ? true : params.include_tip ; 
        if ( this.include_tip ){
            this.setTips('arrow');
        }
        this.font_size = params.font_size || 16;
        // avoid mutable arguments in defaults
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
           
 
        //ticks
        this.include_ticks =  typeof params.include_ticks == 'undefined' ? true : params.include_ticks ; 
        this.exclude_origin_tick = params.exclude_origin_tick ||  false; 
       
        // visuals  
        this.numberColor = params.numberColor  ;
        this.tick_length = params.tick_length || 6;
  
        // numbers
        this.include_label =  typeof params.include_label == 'undefined' ? true : params.include_label ; 
        this.label_direction = typeof params.label_direction == 'undefined' ? true : params.label_direction ;    
        
        //this is only used for coordinate system.
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
        //ticks
        this.include_ticks =  source.include_ticks ; 
        this.exclude_origin_tick = source.exclude_origin_tick  ;  
        // visuals  
        this.numberColor = source.numberColor  ;
        this.tick_length = source.tick_length  ; 
        // numbers
        this.include_label =  source.include_label ; 
        this.label_direction = source.label_direction ;     
        //this is only used for coordinate system.
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
 
    /**
     * this method is used by {CoordniateSystem} shift_space method.
     * @param {*} delta   //delta is shift value in render space
     * @param {*} keep_tick_value we need to show tick_value after shifting.. 
     * @returns 
     */
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

    /**
     * 
     * @param {*} pos is a {Point} in render space
     * @returns 
     */
    getValueByGlobalRenderPos: function(pos){
        var pos2 = this.getNearestPoint(pos),  offset = this.getOffsetOf(pos2);
        return this.x_min + offset * this.value2pix();
    },
    getGlobalRenderPosByValue: function(avalue){
        var offset = (avalue - this.x_min) * this.pix2value();
        return this.getPointAt(offset) ;
      
    },

    /**
     *
     * @param {*} p2v 
     * @param {*} fix_tick_value scale center tick.
     */
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
         //first initialization
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
        //add -2 for ...accumulated error?
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
        //add +2 for accumulated error?
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
  