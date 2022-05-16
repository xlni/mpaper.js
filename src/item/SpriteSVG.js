/*
 * copy the copy logic from kinetics.js 
 */

/**
 * @name SpriteSVG
 *
 * @class The SpriteSVG item represents an animated SVG in a Paper.js project.
 * it can has several states
 * 
 *    * @example 
     *   var sprite = new  SpriteSVG({  
     *     position: 
     *     animation: 'standing',
     *     state: 'svg1',
     *     states: {
     *        svg1 : {
     *           data:  //raw path data
     *           adjusted:
     *        },
     *        svg2 : {
     *           data: 
     *           adjusted:
     *        },
     *     },
     *     animations: {
     *       standing: { 
     *           fromdata:  svg1 
     *           todata:  svg2 
     *           morphtime:  //in second.
     *           yoyo: true|false
     *       },
     *       kicking: [
     *           fromdata:  svg1 
     *           todata:  svg2 
     *           morphtime:  //in second.
     *           yoyo: true|false
     *       ]          
     *     } 
     *   });   
 * @extends Item
 */
var SpriteSVG = Item.extend(/** @lends SpriteSVG# */{
    _class: 'SpriteSVG',
    _applyMatrix: false,
    _canApplyMatrix: false,
    // SpriteSVG doesn't make the distinction between the different bounds,
    // so use the same name for all of them
    _boundsOptions: { stroke: false, handle: false },
    
    
   
    _serializeFields: { 
        animation: null,
        animations:null, 
        _state: null,
        _states:null, 
    },
    
    // Enforce creation of beans, as bean getters have hidden parameters.
    // See  #getContext(_change) below.
    beans: true,
   
    

  
  
    /**
     * Creates a new raster from an object description, and places it in the
     * active layer.
     *
     * @name SpriteSVG#initialize
     * @param {Object} object an object containing properties to be set on the
     *     raster
     *
     * @example {@paperscript height=300}
     *   var sprite = new  SpriteSVG({  
     *     position: 
     *    
     *     state: 'svg1',
     *     states: {
     *        svg1 : {
     *           data:  //raw path data
     *           adjusted:
     *        },
     *        svg2 : {
     *           data: 
     *           adjusted:
     *        },
     *     },
     *     animation: 'standing',
     *     animations: {
     *       standing: { 
     *           fromdata:  svg1 
     *           todata:  svg2 
     *           morphtime:  //in second.
     *           yoyo: true|false
     *       },
     *       kicking: [
     *           fromdata:  svg1 
     *           todata:  svg2 
     *           morphtime:  //in second.
     *           yoyo: true|false
     *       ]          
     *     } 
     *   });    
     * raster.scale(0.5);
     * raster.rotate(10);
     */
    initialize: function SpriteSVG(position,  state, states, animation, animations ) {
        this._animation = null;
        this._animations = null;
        this._state= null;
        this._states=null; 
        this._cursvg=null;
        this. yoyoState=true, //  true: start->end ; false: end->start
          //flag to indicate animation
        this.running = 0;
        this.lastAniTime = 0;
        this.startAniTime = 0;
        this._initialize(position,  state, states, animation, animations ) ;  
        var anim = this.getAnimation(), state = this.getState();
        if( anim ){
           this.setAnimation(anim);
        } else {
           this.setState(state);
        }
        this._size = this._cursvg._size;
        this.on('frame', this._onFrame.bind(this))
        this.start()
    },

    _copyExtraAttr: function(source, excludeMatrix){
        this. _state = source._state;
        this. _states = source._states;
        this. _cursvg = source._cursvg;
        this. yoyoState = source.yoyoState;
        this. running = source.running;
        this. lastAniTime = source.lastAniTime;
        this. _animation = source._animation;
        this. _animations = source._animations;
        this._size = source._size;
        this._loaded = source._loaded;
     },


    _draw: function(ctx, param, viewMatrix) {
        if( this._cursvg == null )
            return;
        this._setStyles(ctx, param, viewMatrix);
        this._cursvg.position = this.position;
        this._cursvg._style = this._style;
        this._cursvg._draw(ctx, param, viewMatrix);
    },

    
    start: function() {
       this.running = true;
    },
    /**
     * stop sprite animation
     * @method
     * @memberof Kinetic.SpriteSVG.prototype
     */
    stop: function() {
        this.running = false;
    },
     
    //onFrame: '#_onFrame', 
    /**
     * by default, paperjs invoke it 60 times a second.
     * @returns 
     */
    _onFrame: function(event){
        var that = this;
        if( !that.running  ) return;
        var anim = that.getAnimation(),  animsetting = that.getAnimations()[anim];
        if( !anim ) return;
        //            fromdata:  svg1 
        //             todata:  svg2 
        //           morphtime:  //in second.
        //          yoyo: true|false
        var fromdata = that.getStates()[animsetting.fromdata].adjusted;
        var todata = that.getStates()[animsetting.todata].adjusted;
        if( that.startAniTime == 0 || event.time - that.startAniTime < animsetting.morphtime ){
            var f = new Path(fromdata, Item.NO_INSERT);
            var t = new Path(todata, Item.NO_INSERT);
            if( that.startAniTime == 0 )
                that.startAniTime = event.time;
            var progress =  ( event.time - that.startAniTime ) /  animsetting.morphtime ;
           // if(  that._cursvg  != null )
          //      that._cursvg.remove();
          //  that._cursvg = new Path(Item.NO_INSERT);
            that._cursvg.resetPathData("");
            if( that.yoyoState )
                that._cursvg .interpolate(f,t,progress);
            else
                that._cursvg .interpolate(t,f,progress); 
            f.remove();
            t.remove();
        } else {
            todata = that.yoyoState ? that.getStates()[animsetting.todata].data 
            : that.getStates()[animsetting.fromdata].data;
           // if(  that._cursvg  != null )
           //     that._cursvg.remove();
           // that._cursvg =  new Path(todata, Item.NO_INSERT);
            that._cursvg.resetPathData(todata);

            if( animsetting.yoyo ){ 
                that.yoyoState = !that.yoyoState;
                that.startAniTime = 0; 
            } else {
                that.stop();
                that._reset( );
            }
        } 
        that._changed(/*#=*/(Change.GEOMETRY | Change.PIXELS)); 
    },

    _reset:function(){
        this.lastAniTime = 0;
        this.yoyoState = true;
    },
   
    getAnimation: function(){
        return this._animation;
    },
    setAnimation: function(animation){
        this.stop();
        this._animation = animation;
        if( this.getAnimations() == null )
            return; //during initialization
        this._state = null;
        this._reset() ;
        this.start();
        var anim = this.getAnimation(),  animsetting = this.getAnimations()[anim];
        var data = this.getStates()[animsetting.fromdata].data;
       // if(  this._cursvg  != null )
       //     this._cursvg.remove();
       // this._cursvg = new Path(data, Item.NO_INSERT); 
       if(  this._cursvg == null ){  
           this._cursvg = new Path(data, Item.NO_INSERT); 
           this._cursvg.visible = false;
       } else { 
            this._cursvg.resetPathData(data);
       }
    }, 
    getAnimations: function(){
        return this._animations;
    },
    setAnimations: function(animations){
        this._animations = animations;
    },   

    getState: function(){
        return this._state;
    },
    setState: function(state){
        this._state = state;
        if( this.getStates() == null )
            return ;// during initialization

        this.stop();
        this._reset();
        this._animation = null; 
        var data = this.getStates()[state].data;
      //  if(  this._cursvg  != null )
      //      this._cursvg.remove();
       // this._cursvg = new Path(data, Item.NO_INSERT); 
       if(  this._cursvg == null ){  
            this._cursvg = new Path(data, Item.NO_INSERT); 
            this._cursvg.visible = false;
        } else { 
            this._cursvg.resetPathData(data);
        }

        this._changed(/*#=*/(Change.GEOMETRY | Change.PIXELS));
    }, 
    getStates: function(){
        return this._states;
    },
    setStates: function(states){
        this._states = states;
    },  

    _equals: function(item) {
        return this._animations === item._animations
           && this._states === item._states
           && this._size.equals(item._size) ;
    },
 

    copyContent: function(source) {
        
    }, 

    isEmpty: function() {
        return false;
    }

 
});
