  /**
 * @name CoordinateSystemUnit
 *
 * @class The CoordinateSystemUnit  
 * 
 * @example   see  CoordinateSystemUnit.html  as examples
 *
 *   
 * 
 * 
 * @extends Group
 */
  var CoordinateSystemUnit = Group.extend(/** @lends CoordinateSystemUnit# */{
    _class: 'CoordinateSystemUnit',  

    initialize: function CoordinateSystemUnit( coordsystem ) {
        this.space = coordsystem;
        Group.apply(this, arguments);
      //  this. _initialize(params); 
        this._addAllChildren();  
    },
    _addAllChildren:function(){ 
        this.removeChildren(); 
        var that = this, space = that.space, list = [space, space._axis[0], space._axis[1]];
        list.forEach(c => {
            c.remove();
            that.addChild(c);
        });;
        space._registeredDotes.forEach(c => {
            c.remove();
            that.addChild(c);
        });;
        space._registeredFuncs.forEach(c => {
            c.remove();
            that.addChild(c);
        }); 
    }, 

    _animForShowing: function(duration, offset){ 
        this.visible = true;
        this.space.addToViewIfNot(duration, '==');
    },

    registerFunctionCurve: function( funcCurve ){
        this.space ._registeredFuncs.push(funcCurve);
        funcCurve.remove();
        this.addChild( funcCurve );
     },
 
     unregisterFunctionCurve: function( funcCurve ){
        this.space.unregisterFunctionCurve( funcCurve );
        funcCurve.remove();
     },

     update_registered_funcs: function(){ 
         this.space .update_registered_funcs();
     },
     update_registered: function(){
        this.space.update_registered(); 
     },
 
     registerDote: function(x_value, y_value, color, radius){ 
         var dot = this.space.registerDote( x_value, y_value, color, radius );
         dot.remove();
         this.addChild( dot );
         return dot;
     },
     unregisterDot: function(x_value, y_value){ 
        var dot = this.space._registeredDotes( x_value, y_value );
        if( dot != null ){
            dot.remove();
        }
        return dot;
     },
 
     update_registered_dots: function(){
        this.space.update_registered_dots();
     },
 
    _copyExtraAttr: function(source, excludeMatrix){
     
    },
    getGlobalRenderPosByValue: function(x, y){
       return this.space.getGlobalRenderPosByValue(x,y);
    },
    getGlobalRenderPosByValue_X: function(v){
        return this.space.getGlobalRenderPosByValue_X(v);
    },
    getGlobalRenderPosByValue_Y: function(v){
        return this.space.getGlobalRenderPosByValue_Y(v);
    },
    getValueByGlobalRenderPos: function(x, y){
        return this.space.getValueByGlobalRenderPos(x,y);
    },
    getValueByGlobalRenderPos_X: function(v){
        return this.space.getValueByGlobalRenderPos_X(v);
    },
    getValueByGlobalRenderPos_Y: function(v){
        return this.space.getValueByGlobalRenderPos_Y(v);
    },
     
});
  