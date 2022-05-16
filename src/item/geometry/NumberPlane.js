/**
 * @name NumberPlane
 *
 * @class The NumberPlane  
 * 
 * @example   see  NumberPlane.html  as examples
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
     @param kwargs
        Additional arguments to be passed to :class:`~.Line`.


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
                    label_direction:UP,
                )

                l1 = NumberPlane(
                       from: [2,3],
                    to: [4,9],
                    x_range:[-10, 10, 2], 
                    numbers_with_elongated_ticks:[-2, 4],
                    include_label:True,
                    font_size:24,
                )
             
                l2 = NumberPlane(
                       from: [2,3],
                    to: [4,9],
                    x_range:[-2.5, 2.5 + 0.5, 0.5], 
                    decimal_number_config:{"num_decimal_places": 2},
                    include_label:True,
                )

                l3 = NumberPlane(
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
var NumberPlane = Path.extend(/** @lends NumberPlane# */{
    _class: 'NumberPlane',
    
    initialize: function NumberPlane(params) {
      
    }

});
  