/**
 * @name  BarChartUnit
 *
 * @class The  BarChartUnit  
 * 
 * @example   see   BarChartUnit.html  as examples
 *
 *   
 * 
 * 
 * @extends Group
 */
  var  BarChartUnit = Group.extend(/** @lends  BarChartUnit# */{
    _class: ' BarChartUnit',  

    initialize: function  BarChartUnit( coordsystem ) {
        this.space = coordsystem;
        Group.apply(this, arguments);
       // this. _initialize(params); 
        this._addAllChildren();  
    },
    _addAllChildren:function(){ 
        this.removeChildren(); 
        var that = this, space = that.space, list = [space, space._axis[0], space._axis[1]];
        list.forEach(c => {
            c.remove();
            that.addChild(c);
        });;
        space.rects.forEach(c => {
            c.remove();
            that.addChild(c);
        });;
        space.value_labels.forEach(c => {
            c.remove();
            that.addChild(c);
        }); 
    }, 
    changeValue: function( newValues, duration){
         this.space.changeValue(newValues, duration)
    },
    _animForShowing: function(duration, offset){ 
        this.visible = true;
        this.space._animForShowing( duration || 1, offset);
    },
    
     
});
  