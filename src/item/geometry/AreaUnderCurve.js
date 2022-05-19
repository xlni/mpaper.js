/**
 * @name AreaUnderCurve
 *
 * @class The AreaUnderCurve  
 * 
 * Parameters:
 *    @param space : coordnate-system
 *    @param curve : ParametricFunction.
 *    @param start_x:  x start 
 *    @param end_x:   x end  
 *    @param num_rects: number of rectangles, default is 0
 *
 * @extends R9Line
 */
 var AreaUnderCurve = Path.extend(/** @lends AreaUnderCurve# */{
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
           // start_y = curve.get_value_y_from_value_x(start_x, true),
            start_y_r = curve.get_render_y_from_render_x(start_x_r, true)[0],

         //   end_y = curve.get_value_y_from_value_x(end_x, true),
            end_y_r = curve.get_render_y_from_render_x(end_x_r, true)[0],
            y_zero_r = space.getGlobalRenderPosByValue_Y(0);
 
        var offset_s = curve.getOffsetOf(new Point(start_x_r,start_y_r),1), 
            offset_e = curve.getOffsetOf(new Point(end_x_r,end_y_r),1);

        
        var   partial_curve = curve. cloneSubPath(offset_s, offset_e, false),
             path = partial_curve.children[0];
        
            
        that.add(new Segment(start_x_r, y_zero_r));
        path.segments.forEach(e => { 
            that.add( e.clone() );
        });
        that.add(new Segment(end_x_r, y_zero_r));
        that.closed = true; 
        var curves = that.getCurves();
        //flat two sides
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
       var that = this, space = that.space,  start_x = that.start_x, end_x = that.end_x;
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