CoordinateSystem.inject({ statics: new function() {

      
    function _createCoordinateSystem(axis_x, axis_y,  origin_render, show_grid,  grid_color, asGroup) {
        var cs = new CoordinateSystem(axis_x, axis_y,  origin_render, show_grid,  grid_color);
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
             grid_color = params.grid_color || mpaper.project.getBuiltInColor('color1') ;
        var axies = _createTwoAxis(params); 
        return _createCoordinateSystem(axies[0], axies[1],   show_grid, grid_color, asGroup);
    } 

  
    return /** @lends CoordinateSystem */{
        
       /**
         * Creates a CoordinateSystem item from the properties described by an object
         * literal.
         *
         * @name CoordinateSystem.ByRenderAreaAndAxies
         * @param {Object} object an object containing properties describing the
         *     path's attributes
         * @return {CoordinateSystem} the newly CoordinateSystem
         *
         * @example {@paperscript}
         * var path = new CoordinateSystem.ByRenderAreaAndAxies({
         *      render: [x, y, width, height], //if not present, it is a fullscreen one.
         *      x_range:[-10, 10, 2], 
         *      y_range:[-10,10,2], 
         *      include_tip:true,            //default true
                include_label:true,          //default true
                strokeWidth: 2,
                show_grid: false,
                exclude_origin_tick: false,
                grid_color: 'red'    //optional , default to same as numberline color.
                dot_color: 'red'      //optional , default to red.
                draggable_origin: true | false,  default to false.   add a dot to drag the coordinate.
                draggable_x_dot:  positive number, in range. used to scale x axis
                draggable_y_dot:  positive number, in range. used to scale y axis
         * });
         */
        ByRenderAreaAndAxies: function(params) {  
             return _ByRenderAreaAndAxies(true, params);
        },
        ByAxiesFullScreen: function(project, param){
            param.render = [0,0, project.configuration.frame_width, project.configuration.frame_height ];
            var space =  _ByRenderAreaAndAxies(false, param);
            if( param.draggable_origin ){
                var dot  =  space.registerDote(0,0);
              //  dot.draggable = true; 
                dot.on('mousedrag', function(event){
                    space.shift_space(event.delta.x , event.delta.y);
                 //   dot.position.x += event.delta.x;
                  //  dot.position.y += event.delta.y; 
                });  
            }
            if( param.draggable_x_dot &&  param.draggable_x_dot > 0 && param.draggable_x_dot < param.x_range[1] ){
                var dv_x = param.draggable_x_dot, dot2  =  space.registerDote(dv_x,0);
               // dot2.draggable = true; 
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
              //  dot3.draggable = true;  
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

               /**
         * Creates a BarChart item wrapped in BarChartUnit from the properties described by an object
         * literal.
         *
         * @name CoordinateSystem.BarChart
         * @param {Object} object an object containing properties describing the
         *     path's attributes
         * @return {BarChartUnit} the newly BarChartUnit
         *
         * @example {@paperscript}
         * var path = new CoordinateSystem.BarChart({
         *      render: [x, y, width, height], //if not present, it is a fullscreen one. 
         *      y_range:[-10,10,2],  
                strokeWidth: 2, 
                values,  //must have
                bar_names,  
                bar_name_size, 
                bar_colors, 
                bar_width, 
                bar_fill_opacity,
                duration  //default 0
         * });
         */
        createBarChart: function(params) {  
            params.x_range = [0,10]; //dummy
            params.show_grid = false;
            var axies = _createTwoAxis(params); 
            axies[0].include_label = false;
            axies[0].include_ticks = false; 

            //axis_x, axis_y, values, bar_names,  bar_name_size, bar_colors, bar_width, bar_fill_opacity
            //duration
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
