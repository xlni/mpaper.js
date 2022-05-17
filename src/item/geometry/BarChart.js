 
 /**
 * @name BarChart
 *
 * @class The BarChart  
 * 
 * @example   see  BarChart.html  as examples
 * PARAMETERS
      @param values (Iterable[float]) – array of values that determines the height of each bar. Accepts negative values.
         if values is 1-d array,  
         if values is 2-d array, [[2,3,4], [3,5,6]]

     @param bar_names (Iterable[str] | None) – An iterable of names for each bar. Does not have to match the length of values.

     @param y_range (Sequence[float] | None) – The y_axis range of values. If None, the range will be calculated based on the min/max of values and the step will be calculated based on y_length.

     @param x_length (float | None) – The length of the x-axis. If None, it is automatically calculated based on the number of values and the width of the screen.

     @param y_length (float | None) – The length of the y-axis.

     @param bar_colors (str | Iterable[str] | None) – The color for the bars. Accepts a single color or an iterable of colors. If the length of``bar_colors`` does not match that of values, intermediate colors will be automatically determined.

     @param bar_width (float) – The width of a bar.  

     @param bar_fill_opacity (float) – The fill opacity of the bars.

   //  @param bar_stroke_width (float) – The stroke width of the bars.
 * 
 * 
 * design concerns: 
 *   we 
 * 
 * @extends CoordinateSystem
 */
var BarChart = CoordinateSystem.extend(/** @lends BarChart# */{
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
                
                //add value_labels.  add it as separate item, so it can animate...
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
        //this._setStyles(ctx, param, viewMatrix);
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
  