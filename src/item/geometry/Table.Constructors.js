Table.inject({ statics: new function() {

      
    function _createTable(axis_x, axis_y,  origin_render, show_grid, show_grid_color, asGroup) {
       
    }

   
    return /** @lends Table */{
         
        SimpleTable: function(params) {  
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
