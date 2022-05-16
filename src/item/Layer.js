/*
 * Paper.js - The Swiss Army Knife of Vector Graphics Scripting.
 * http://paperjs.org/
 *
 * Copyright (c) 2011 - 2020, Jürg Lehni & Jonathan Puckey
 * http://juerglehni.com/ & https://puckey.studio/
 *
 * Distributed under the MIT license. See LICENSE file for details.
 *
 * All rights reserved.
 */

/**
 * @name Layer
 *
 * @class The Layer item represents a layer in a Paper.js project.
 *
 * The layer which is currently active can be accessed through
 * {@link Project#activeLayer}.
 * An array of all layers in a project can be accessed through
 * {@link Project#layers}.
 *
 * @extends Group
 */
var Layer = Group.extend(/** @lends Layer# */{
    _class: 'Layer',
    // Turn on again for now, since examples depend on it.
    // TODO: Discus with @puckey and come to a conclusion
    // _selectChildren: false,

    

    // DOCS: improve constructor code example.
    /**
     * Creates a new Layer item and places it at the end of the
     * {@link Project#layers} array. The newly created layer will be activated,
     * so all newly created items will be placed within it.
     **
     * @name Layer#initialize
     * @param {*} [children] An array of items that will be added to the
     * newly created layer
     *
     * @example
     * var layer = new Layer();
     */
    /**
     * Creates a new Layer item and places it at the end of the
     * {@link Project#layers} array. The newly created layer will be activated,
     * so all newly created items will be placed within it.
     *
     * @name Layer#initialize
     * @param {Object} object an object containing the properties to be set on
     *     the layer
     *
     * @name Layer#initialize
     * @param {Rectangle} clips layer clip area, is a rectangle 
     *
     * 
     * @example {@paperscript}
     * var path = new Path([100, 100], [100, 200]);
     * var path2 = new Path([50, 150], [150, 150]);
     *
     * // Create a layer. The properties in the object literal
     * // are set on the newly created layer.
     * var layer = new Layer({
     *     children: [path, path2],
     *     strokeColor: 'black',
     *     position: view.center
     *     clips: layer clip area, is a rectangle
     * });
     */
    initialize: function Layer() {
        Group.apply(this, arguments); 
        //each layer has its own timeline (anime.js) , which controls animation of this layer.
        //in R9 project,  Project maps to project, Layer maps to storyline/timeline in R9. 
        this._timeline = anime.timeline({ 
            autoplay: false
          });
        this._player = new R9TimlinePlayer(this._project, this, {});
    },
    getPlayer: function(){
        return this._player;
    },
    addPage: function(page){
        this._player.addPage(page);
    },
    removePage: function(page){
        this._player.remove(page);
    },
    getCurPage: function(){
       return this._player.getCurPage();
    },
     
    getTimeline: function(){
        return this._timeline;
    },
    setTimeline: function(timeline){
        this._timeline = timeline;
    },
    heartbeat: function(){
        this._player.heartbeat();
    },
    _anime: function(params){
        anime(params);
    },
   
     /**
     * 
     * @param {*} timeline 
     * @param {*} options 
     *    duration: default 1 second
     *    type:  a set of keywords: ... 
     *    data:  additional data for type.  optional. 
     *    easing:  tween type.  string or a function. optional, default 'linear' 
     *    update: 
     *    beginning:
     *    complete: 
     * 
     *  for  type in options                                        data
     *  s[0] = ShowCreation;                           
        s[1] = DrawBorderThenFill;
        s[2] = Write;
        s[3] = FadeIn;
        s[4] = FadeInFromLarge;                          scale: scale level.
        s[5] = SpinInFromNothing;
        s[6] = GrowFromEdge;                             direction: ???
        s[7] = GrowFromCenter;
        s[8 ] = GrowFromPoint;                            point:   location
        s[9] = FadeInFromUp;
        s[10] = FadeInFromDown;
        s[11] = FadeInFromLeft;
        s[12] = FadeInFromRight;
        s[13] = FadeInFromPoint;                         point:  location.
        s[14] = ReplacementTransform;                    to_target
        s[15] = TransformFromCopy;                        to_target
    //    s[16] = GrowArrow;                               //ONLY for Text
        s[17] = Text;                               animType : additional type        // AddTextLetterByLetter      // ONLY for Text
        s[18] = Flip; 
        s[19] = CurlRight; 
        s[20] = CurlDown; 
        s[21] = ImageEffect;  
          for ImageEffect , data is :
           ITT_BOX_INSITU(0, "方块-原位","mosaic.png"), IIT_BOX_RANDOM(1,"方块-随机","mosaic"),IIT_BOX_TLBR(2,"方块-左上到右下","mosaic"),
     ITT_BOX_LTR(3,"方块-左到右","mosaic"), ITT_BOX_RTL(4,"方块-右到左","mosaic"), ITT_BOX_TTB(5,"方块-上到下","mosaic"), ITT_BOX_BTT(6,"方块-下到上","mosaic"),
     ITT_STRIPE_HOR(7,"百叶窗－竖条","blinds-v.png"), ITT_STRIPE_VER(8,"百叶窗－横条","binds-h.png"),ITT_RANDOM(9, "随机选择","random.png"), 
     ITT_NONE(10, "不使用",""), ITT_DELAY(11, "滞后删除",""), ITT_GATHER(12, "聚散","gather-split.png"), ITT_FLIPBOARD(13, "折叠翻页","flipboard.png"),
     ITT_PAGETURN(14, "翻转翻页","page-turn-up.png");  

         easing:   tween type is from Anime.js project. as we use anime.js for animation

       @option  'linear'   :Does not apply any easing timing to your animation. Usefull for opacity and colors transitions.
       @option  [PENNER'S FUNCTIONS] :  'ease' +  'In|Out|InOut|OutIn' + 'Quad|Cubic|Quart|Quint|Sine|Expo|Circ|Back|Bounce'
                                there are 4*9 = 36 type of penner functions.
       @option [CUBIC BÉZIER CURVE] :   cubicBezier(x1, y1, x2, y2).
       @option  [Spring physics based easing.]   'spring(mass, stiffness, damping, velocity)'
            The duration of a spring animation is defined by the spring parameters. The animation duration parameter will not be taken into account.
                                            PARAMETER	DEFAULT	MIN	MAX
                                            Mass	     1	0	100
                                            Stiffness	100	0	100
                                            Damping	    10	0	100
                                            Velocity	0	0	10
        @option [Elastic easing.]       easeOutElastic(amplitude, period)   
             'easeInElastic'	'easeOutElastic'	'easeInOutElastic'	'easeOutInElastic'
                      Amplitude	  default: 1, value-range:	[1	  10]	
                         Controls the overshoot of the curve. The larger this number, the more overshoot there is.
                      Period	  default: .5 value-range: [0.1	  2]
                       	Controls how many times the curve goes back and forth. The smaller this number, the more times the curtain goes back and forth.
        @option [STEPS]  'steps(numberOfSteps)'
        @option  [CUSTOM EASING FUNCTION]  A custom easing function must be returned by function based value.
                    easing: function(el, i, total) {
                        return function(t) {
                        return Math.pow(Math.sin(t * (i + 1)), total);
                        }
                    }

        @param {*}  offset  same as the one used in anime.js. support absoluate and relative values.
        @param {*}  doneCallback as the one used in anime.js. support absoluate and relative values.
     */
     createItems: function( timeline, options, offset, doneCallback){
        var that = this,  conf = that._project.configuration,
            w = conf.frame_width, h = conf.frame_height ; 
       
        //pre-process
        if( options.target ){ options.targets = options.target; delete options.target; }
        if( !Array.isArray( options.targets ) ) options.targets = [options.targets];
        var targets = options.targets; options.type = options.type || 'FadeIn';  
        if( options.type == 'ShowCreation' ||  options.type == 'DrawBorderThenFill' || options.type == 'Write'){  
            options.progress = 1;
            var allpath = true;
            targets.forEach(e =>{
                 e.progress = 0; 
                 if( !(e  instanceof Path || e instanceof CompoundPath ||  
                    (typeof e.containsAllPaths == 'function' && e.containsAllPaths(true))) )
                    allpath = false;
            }); 
            if(  allpath ){ 
                targets.forEach(e =>{
                    e.write(timeline, options.duration||1, offset,   doneCallback);
                });
            } else {
                options.complete = function(){
                    targets.forEach(e =>{ e.progress = -1; }); 
                    if( doneCallback ) doneCallback();
                };
                timeline.add( options, offset )
            } 
        }
        else if( options.type == 'GrowFromCenter' ){ 
            var bdss = [], poss = [];
            targets.forEach(e =>{ 
                var pos = e.position.clone();
                bdss.push( e.bounds.clone() );
                poss.push(pos);
                e.bounds.width = 1;
                e.bounds.height = 1;
                e.position = pos;
             }); 
            options['bounds.size'] = function(ta, i){  return bdss[i].size ;   } ; 
            options.position = '+=[0,0]';   
            if( doneCallback )   options.complete = function(){   doneCallback();  };
            timeline.add( options, offset ); 
        }
        else if( options.type == 'GrowFromPoint' ){ 
            var bdss = [], poss = [];
            targets.forEach(e =>{ 
                var pos = e.position.clone();
                bdss.push( e.bounds.clone() );
                poss.push(pos);
                e.bounds.width = 1;
                e.bounds.height = 1;
                e.position = options.point;
             }); 
             options['bounds.size'] = function(ta, i){  return bdss[i].size ;   } ; 
             if( doneCallback )   options.complete = function(){   doneCallback();  };

            delete options.point;
            timeline.add( options, offset); 
        }//
        else if( options.type == 'GrowFromEdge' ){ 
            var bdss = [], poss = [];
            targets.forEach(e =>{ 
                var pos = e.position.clone();
                bdss.push( e.bounds.clone() );
                poss.push(pos);
                var dir = options.direction, pos;
                if( dir ==  'UP') pos = e.bounds.topCenter;
                else if( dir == 'DOWN') pos = e.bounds.bottomCenter;
                else if( dir == 'LEFT') pos = e.bounds.leftCenter;
                else   pos = e.bounds.rightCenter; 
                e.bounds.width = 1;
                e.bounds.height = 1;
                e.position = pos;
             }); 
             options['bounds.size'] = function(ta, i){  return bdss[i].size ;   } ;  
             if( doneCallback )   options.complete = function(){   doneCallback();  };
            delete options.direction;
            timeline.add( options , offset); 
        }//
        else if( options.type == 'SpinInFromNothing' ){ 
            var bdss = [], poss = [], ams = [];
            targets.forEach(e =>{ 
                var pos = e.position.clone();
                bdss.push( e.bounds.clone() );
                poss.push(pos);
                ams.push(e.applyMatrix); 
                e.applyMatrix = false;
                e.bounds.width = 1;
                e.bounds.height = 1; 
             });  
            options.position = '+=[0,0]';   
            options.rotation = 360*5* options.duration; 
            options['bounds.size'] = function(ta, i){  return bdss[i].size  ;   } ;  
            options.complete = function(){
                targets.forEach( (e,i) =>{ e.applyMatrix = ams[i]; });
                if( doneCallback )   doneCallback();   
            }; 
             
            timeline.add( options , offset); 
        }
        else if( options.type.startsWith('FadeIn') ){ 
            //FadeIn FadeInFromLarge    FadeInFromUp;  FadeInFromDown; FadeInFromLeft; FadeInFromRight; FadeInFromPoint;  
            if( options.type == 'FadeIn'  ){  
            } 
            else if( options.type == 'FadeInFromLarge' ){
                var bdss = [], poss = [] ;
                targets.forEach(e =>{ 
                    var pos = e.position.clone();
                    bdss.push( e.bounds.clone() );
                    poss.push(pos); 
                    e.bounds.width = e.bounds.width * 10;
                    e.bounds.height = e.bounds.heigh * 10; 
                 });   
                options['bounds.size'] = function(ta, i){  return bdss[i].size ;   } ;   
                options.position = '+=[0,0]';   
            }
            else {
                var bdss = [], poss = [] ;
                targets.forEach(e =>{ 
                    var pos = e.position.clone();
                    bdss.push( e.bounds.clone() );
                    poss.push(pos); 
                    var point;
                    if( options.type == 'FadeInFromPoint' ) {
                        point = options.point;
                        delete options.point;
                    }
                    else if( options.type == 'FadeInFromUp' ) point = new Point(pos.x, -100);
                    else if( options.type == 'FadeInFromDown' ) point = new Point(pos.x, h+100);
                    else if( options.type == 'FadeInFromLeft' ) point = new Point(-100, pos.y);
                    else if( options.type == 'FadeInFromRight' ) point = new Point(w+100, pos.y);  
                    e.position =  point; 
                 });   
                 options.position = function(ta, i){  return poss[i] ;   } ;   
                
            } 
            options.opacity = 1;   
            if( doneCallback )   options.complete = function(){   doneCallback();  };
            targets.forEach(e =>{ e.opacity = 0; });
            timeline.add( options , offset); 
        } //
        else if(   options.type == 'CurlDown'  ){ 
            var bdss = [], poss = [] ;
            targets.forEach(e =>{ 
                var pos = e.position.clone();
                bdss.push( e.bounds.clone() );
                poss.push(pos); 
                 e.bounds.height = 0.1; 
             });   
            options['bounds.size'] = function(ta, i){  return bdss[i].size ;   } ;  
            if( doneCallback )   options.complete = function(){   doneCallback();  };
            options.position = '+=[0,0]';   
            ani = timeline.add( options , offset); 
        } //
        else if( options.type == 'CurlRight'   ){  
            var bdss = [], poss = [] ;
            targets.forEach(e =>{ 
                var pos = e.position.clone();
                bdss.push( e.bounds.clone() );
                poss.push(pos); 
                e.position.x -= e.bounds.width / 2;
                e.bounds.width = e.bounds.width * 0.01;  
             });     
            options.scaleX = 100;
            options.scaleY= 1 ; 
            options.position = function(ta, i){  return poss[i] ;   } ;  
            if( doneCallback )   options.complete = function(){   doneCallback();  };
            timeline.add( options , offset); 
        } //
        else if( options.type == 'ReplacementTransform' ){  
            var to_targets = Array.isArray(options.to_target) ? options.to_target : [options.to_target];
            if( to_targets.length == targets.length ){
                for(var i = 0; i < targets.length; i++)
                   targets[i].morphingTo(timeline, to_targets[i], options.duration, offset, doneCallback);  
            } 
        }
        else if( options.type == 'TransformFromCopy'  ){ 
            var to_targets = Array.isArray(options.to_target) ? options.to_target : [options.to_target];
            if( to_targets.length == targets.length ){
                for(var i = 0; i < targets.length; i++)
                   targets[i].clone().morphingTo(timeline, to_targets[i], options.duration, offset, doneCallback);  
            }  
        } 
        else if ( options.type == 'ImageEffect' ){
            var transType = options.effect, easing = options.easing, positionFunc = options.positionFunc;
            targets.forEach( e => {
                RU.imageEffect2(this, e, options.duration || 1, transType, easing, positionFunc, true, doneCallback);
            });  
        }
        else if ( options.type == 'Text' ){
            targets.forEach( e => {
                 if( e instanceof Group &&  e.fromLatex ){
                    e.showChildOneByOne(timeline,  options.duration || 1, offset, doneCallback);
                 }
                 else if ( e instanceof StyledText ){
                     e.animType =  e.animType || options.animType || 'writing';
                     e.write( timeline, options.duration || 1, offset, doneCallback) 
                 }
            });  
           
        }
    },

    uncreateItems: function( timeline, options, offset, doneCallback){
        var that = this,  conf = that._project.configuration,
            w = conf.frame_width, h = conf.frame_height, hasAnim = false;  
        //pre-process
        if( options.target ){ options.targets = options.target; delete options.target; }
        if( !Array.isArray( options.targets ) ) options.targets = [options.targets];
        var targets = options.targets;  options.type = options.type || 'FadeOut';  
        if( options.type == 'Uncreate' ||  options.type == 'Unwrite' ){  
            options.progress = 1;
            var allpath = true;
            targets.forEach(e =>{
                 e.progress = 0; 
                 if( !(e  instanceof Path || e instanceof CompoundPath ||  
                    (typeof e.containsAllPaths == 'function' && e.containsAllPaths(true))) )
                    allpath = false;
            }); 
            if(  allpath ){
                targets.forEach(e =>{
                    e.unwrite(timeline, options.duration||1, offset,  function(){
                        e.remove();
                        if( doneCallback ) doneCallback();
                    });
                });
                return;
            }
            hasAnim = true;
        }
        else if( options.type == 'DisappearToCenter' ){  
            options['bounds.size'] = new Size(2,2) ; 
            options.position = '+=[0,0]';    
            hasAnim = true;
        }
        else if( options.type == 'DisappearToPoint' ){ 
            options['bounds.size'] = new Size(2,2) ; 
            options.position = options.point;    
            delete options.point; 
            hasAnim = true;
        }// 
        else if( options.type == 'SpinInToNothing' ){ 
            targets.forEach(e =>{  
                e.applyMatrix = false; 
             });  
            options.position = '+=[0,0]';   
            options.rotation = 360*5* options.duration; 
            options['bounds.size'] = new Size(2,2) ;   
            hasAnim = true;
        }
        else if( options.type.startsWith('FadeOut') ){ 
            //FadeOut FadeOutToLarge   FadeOutTo_UP;  FadeOutTo_DOWN; FadeOutTo_LEFT; FadeOutTo_RIGHT; FadeOutTo_POINT;  
            if( options.type == 'FadeOut'  ){  
            } 
            else if( options.type == 'FadeOutToLarge' ){
                var bdss = [] ;
                targets.forEach(e =>{  
                    bdss.push( e.bounds.clone() ); 
                 });   
                options['bounds.size'] = function(ta, i){  return bdss[i].size.__multiply(10) ;   } ;   
                options.position = '+=[0,0]';    
            }
            else {
                var   poss = [] ;
                targets.forEach(e =>{  
                    var point;
                    if( options.type == 'FadeOutToPoint' ) {
                        point = options.point;
                        delete options.point;
                    }
                    else if( options.type == 'FadeOutToUp' ) point = new Point(pos.x, -100);
                    else if( options.type == 'FadeOutToDown' ) point = new Point(pos.x, h+100);
                    else if( options.type == 'FadeOutToLeft' ) point = new Point(-100, pos.y);
                    else if( options.type == 'FadeOutToRight' ) point = new Point(w+100, pos.y);  
                    poss.push(point); 
                 });   
                 options.position = function(ta, i){  return poss[i] ;   } ;    
            }  
            options.opacity = 0.01; 
            hasAnim = true;
        } // 
        else if ( options.type == 'ImageEffect' ){
            var transType = options.effect, easing = options.easing, positionFunc = options.positionFunc;
            targets.forEach( e => {
                RU.imageEffect2(this, e, options.duration, transType, easing, positionFunc, false, doneCallback);
            });  
            return;
        }
        if(   hasAnim ){
            options.complete = function(){
                targets.forEach(e =>{ e.remove(); }); 
                if( doneCallback ) doneCallback();
            };
            timeline.add( options, offset )
        } 
    },
    sceneSetup: function(options){
        this._sceneSetupOptions = options || {};
    },
        
    /**
     * hanning:  should we set layer as no clip?   FIXME ? 
     * @returns 
     */
    _getClipItem: function() {
        if(this._clipItem == undefined){
            if( this._children.length > 0 && this._children[0]._clipMask )
                this._clipItem = this._children[0];
            else {
                var cliparea = this.clips && this.clips._class == 'Rectangle' ?  this.clips : this._project.view.bounds.clone();
                var item = new Path.Rectangle( cliparea);
                this.insertChild(0, item);
                this._clipItem = item;
                this._clipItem._clipMask = true;
                this._clipItem._matrix = new Matrix()
                this._clipItem._aslayerbg = true; 

            //    this._clipItem.bounds = cliparea;
            } 
            this._clipItem.fillColor = this._style._values.sceneBgColor || this._project._currentStyle.sceneBgColor || 
                                       this._style._defaults.sceneBgColor || 'white';
        }
        return this._clipItem;
    },
    getCurrentColors: function(){ 
       return { fc: this._style._values.fillColor || this._project._currentStyle.fillColor, sc: this._style._values.strokeColor || this._project._currentStyle.strokeColor };
    },

    _draw_extra_bg: function(ctx, param, viewMatrix) { 
        var item  = this._getClipItem(), bounds = item.bounds, color = this.fillColor || item.fillColor;
        if( !color ) return;
        ctx.fillStyle =  color.toCanvasStyle(ctx, viewMatrix);
        ctx.fillRect(bounds.x, bounds.y, bounds.width, bounds.height); 
    },
 
    /**
     * Private helper to return the owner, either the parent, or the project
     * for top-level layers, if they are inserted in it.
     */
    _getOwner: function() {
        return this._parent || this._index != null && this._project;
    },

    isInserted: function isInserted() {
        return this._parent ? isInserted.base.call(this) : this._index != null;
    },

    /**
     * Activates the layer.
     *
     * @example
     * var firstLayer = project.activeLayer;
     * var secondLayer = new Layer();
     * console.log(project.activeLayer == secondLayer); // true
     * firstLayer.activate();
     * console.log(project.activeLayer == firstLayer); // true
     */
    activate: function() {
        this._project._activeLayer = this;
    },

    _hitTestSelf: function() {
    }
});

 /**
 * @name ViewPort
 *
 * @class The ViewPort  
 * 
 * @example   see  ViewPort.html  as examples
 *
 * var picker = new ViewPort({ 
 *     clips: 
 *     borderColor: optional ,  default no border 
 *     scrollPolicy: optional , four valid values: [vertical|v,  horizontal|h, both|b, none|n].
 *                          if it is not none, we will add addtional top layer to intercept mouse event.
 *     padding: optional, default 0.  
 * })
 *  
 * 
 * @extends Group
 */
  var ViewPort = Group.extend(/** @lends ViewPort# */{
    _class: 'ViewPort',  

    initialize: function ViewPort(params) {
        Group.apply(this, arguments); 
        this._getClipItem();
        //add content view.
        this._contentView = new Group();
        this.insertChild(1, this._contentView);
        this._setup_cover();
    }, 
    _getClipItem: function() {
        if(this._clipItem == undefined){
            if( this._children.length > 0 && this._children[0]._clipMask )
                this._clipItem = this._children[0];
            else {
                var item = new Path.Rectangle( this.clips );
                item.strokeColor = 'black';
                item.strokeWidth = 1;
                this.insertChild(0, item); //after insertion, _clipItem is set to null.
                this._clipItem = item;
                this._clipItem._clipMask = true;
                this._clipItem._matrix = new Matrix()  
            }  
        }
        return this._clipItem;
    },
    _setup_cover: function(){
        var clipItem = this._getClipItem(), sw = this.strokeWidth,  sb = this.getScrollPolicy();
        if( ! this._cover ){
            this._paddingObj = new Path.Rectangle( clipItem.bounds );
            this._paddingObj.remove();
            this._cover =  new Path.Rectangle( clipItem.bounds ); 
            this._cover.remove();
        }
        if( sw || !sb.startsWith('n') ) {
            this._cover._style = this._style.clone();  
            this._cover.fillColor = !sb || sb.startsWith('n') ? 'rgba(0,0,0,0)' : 'rgba(123,123,123,0.01)';
            this._paddingObj.strokeWidth = this.padding; 
            this._paddingObj.strokeColor = 'white'; 
            
            if( this._cover._parent == null ){
                this.addChild(this._paddingObj, true);
                this.addChild(this._cover, true); 
            } 
        } else {
            this._cover.strokeWidth = 0;
            this._paddingObj.strokeWidth = 0;
            this._cover.remove();
            this._paddingObj.remove(); 
        }

    },
 

    // setBorderColor: function(c){
    //     this._borderColor = c;
    //     this._setup_cover();
    // },
    // getBorderColor: function(){
    //     return this._borderColor;
    // },
    setScrollPolicy: function(s){
        this._scrollPolicy = s || 'n'; 
        this._setup_cover(); 
        var that = this, cover = that._cover;
     
        if( s ){
            cover.on('mousedown', that._scrollHandler.bind(that)); 
            cover.on('mousedrag', that._scrollHandler.bind(that));  
        } else {
            cover.off('mousedown', that._scrollHandler.bind(that)); 
            cover.off('mousedrag', that._scrollHandler.bind(that)); 
        }
      
    },
    getScrollPolicy: function(){
        return this._scrollPolicy;
    },
    _scrollHandler: function(event){
         var that = this, type = event.type, point = event.point, sp = that._scrollPolicy, diff = 0;
         if( type == 'mousedown'){
             that._prevPoint = point;
         }
         else if( type == 'mousedrag'){
             diff = point.__subtract( that._prevPoint );
             that._prevPoint = point;
             that.scroll(diff.x, diff.y)
        }
    },
    scroll: function(xoffset, yoffset, duration){
        var that = this, sp = this._scrollPolicy, bs = that._cover.bounds, 
            content = that.getContentView(), padding = Math.max(that.padding, that.strokeWidth||0),
            cbs = content.bounds, adj_xoffset, adj_yoffset;
        if( !cbs || sp.startsWith('n') ) return;
        var m_y_t = bs.y +padding - cbs.y,
            m_y_b = cbs.y + cbs.height - bs.y - bs.height + padding*2, 
            m_x_l = bs.x + padding - cbs.x,
            m_x_r = cbs.x + cbs.width - bs.x - bs.width + padding*2;
        if( sp.startsWith('b') || sp.startsWith('v') ){
            if( yoffset > 0 && m_y_t > 0) {
                adj_yoffset = Math.min(yoffset, m_y_t); 
            }
            if( yoffset < 0 && m_y_b > 0) {
                adj_yoffset = -Math.min(-yoffset, m_y_b); 
            }
        }
        if( sp.startsWith('b') || sp.startsWith('h') ){
            if( xoffset > 0 && m_x_l > 0) {
                adj_xoffset = Math.min(xoffset, m_x_l); 
            }
            if( xoffset < 0 && m_x_r > 0) {
                adj_xoffset = -Math.min(-xoffset, m_x_r); 
            }
        }
        var npos = content.position.__add(new Point(adj_xoffset, adj_yoffset));
        if( duration ){
            anime({
                targets: content,
                position: npos,
                duration: duration
            })
        } else {
            content.position = npos;
        } 
    },
    isEmpty: function(){
        return this._children.length < 2;
    },
    getContentView: function(){
        return this._contentView;
    },
    addToContentView: function(v){
        this._contentView.addChild(v);
    },
    centerIt: function(){
        var   clipview = this._getClipItem(); 
        this.setCameraPosition(clipview.position);
    },
    setCameraScale: function(scale, duration){
        var c = this.getContentView();
        if( duration ){
             anime({
                 targets: c,
                 'bounds.size' : '*=[' + scale + ',' + scale + ']',
                 position : '+=[0,0]',
                 duration: duration
             });
        } else {
            c.scale(scale);
        } 
    },
    setCameraPosition: function(pos, duration){
        var c = this.getContentView();
        if( duration ){
             anime({
                 targets: c,
                 position : pos,
                 duration: duration
             });
        } else {
            c.position = pos;
        } 
    },
   
});