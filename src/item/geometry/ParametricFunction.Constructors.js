R9Function.inject({ statics: new function() {

      
    function createR9Function(axis_x, axis_y,  origin_render, show_grid, show_grid_color) {
         return cs;
    }

  
  
    return /** @lends R9Function */{
        
       /**
         * Creates a R9Function item from the properties described by an object
         * literal.
         *
         * @name Path.Linear
            @param  coord_system reference to a Coordinate System.
            @param  function (Callable[[float, float], float]) – The function to be plotted in the form of (lambda x: x**2)

            @param  t_range (Sequence[float] | None) – Determines the length that the function spans. By default [0, 1]

            @param scaling (_ScaleBase) – Scaling class applied to the points of the function. Default of LinearBase.

            @param use_smoothing (bool) – Whether to interpolate between the points of the function after they have been created. (Will have odd behaviour with a low number of points)

            @param  discontinuities (Iterable[float] | None) – Values of t at which the function experiences discontinuity.

            @param dt (float) – The left and right tolerance for the discontinuities.
                * path = new R9Function.Linear({
         *      coord_system:  
         *      function : function(x){  return 2*x + 3; },
         *      t_range:[-10,10,2],  
         * });
         * @example {@paperscript}
         * var
         */
        Linear: function(params) {  
             var f = new LinearFunction(params);
             f.generate_points();
             return f;
        }, 
        Circle: function(params) {  
          var f = new EllipseFunction(params);
          f.generate_points();
          return f;
        }, 
        Ellipse: function(params) {  
          var f = new EllipseFunction(params);
          f.generate_points();
          return f;
        }, 
        SVG: function(params) {  
          var f = new SVGFunction(params);
          f.generate_points();
          return f;
        }, 
        ParameterFunc: function(params) {  
            var f = new R9Function(params);
            f.generate_points();
            return f;
       }, 
 

    };
}});
