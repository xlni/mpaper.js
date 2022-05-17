 

 /**
 * @name Toolbar
 *
 * @class The Toolbar  
 * 
 * @example   see  Toolbar.html  as examples
 *
 * var toolbar = new Toolbar({
 *    // vertical: true|false,  default is false;
 * })
 * 
 * toolbar.registerTool();
 * 
 * toolbar.show(position, animType)
 * 
 * toolbar.hide(animType);
 * 
 * @extends Item
 */
var Toolbar = Group.extend(/** @lends Toolbar# */{
    _class: 'Toolbar',  

    initialize: function Toolbar(params) {
        Group.apply(this, arguments);
        params = params || {};
        this._initialize(params);  

        if(!this._bg_fig){
            this._bg_fig =  new Path.Rectangle({
                topLeft: new Point(0,0),
                bottomRight: new Point(1,1), 
                strokeColor:  this._project.getBuiltInColor('bgColor1') || 'rgba(120,120,120,1)',
                fillColor:  this._project.getBuiltInColor('bgColor1') ||  'rgba(120,120,120,0.1)',
            });  
           this.addChild( this._bg_fig );
        }
    },

    // show: function(position, animType){
        
    // },
    // hide: function(animType){

    // },
     
    /**
     * 
     * @param {*} toolInfo {name: name, icon: icon, tooltip: tooltip, tool: tool }
     */
    register_tool: function(toolInfo){
        var that = this,  children = that._children, counts = children.length; 
      
        if( toolInfo.tool instanceof Tool ){
            var button = new TwoStateButton({
                state1_name: toolInfo.name,
                state1_icon: toolInfo.icon, 
                click_func: function(state){
                    toolInfo.tool.activate();
                    that.updateToolStatue(toolInfo.name);
                },  
                bgColor:  this._project.getBuiltInColor('bgColor2') || 'white',
                textColor:  this._project.getBuiltInColor('textColor') || 'black',
                toggle: false ,
                use_mouse_down:true
            })

            this.addChild(button, true);
        } else {
            this.addChild(toolInfo.tool, true);
        }  
    },
    unregister_tool: function(index){
        var c = this._children[index+1];
        c.remove();
        if( this._children.length > 1 ){
            this.align_tools( this._align );
        }
    },

    align_tools: function(vertical){
        var children = this._children, counts = children.length;
        this._align = vertical;
        this.align ( vertical, 20, this._bg_fig ); 
        this._bg_fig.bounds = this.bounds;
    },

    updateToolStatue: function(activedToolName){
        var children = this._children;
        for (var i = 0, l = children.length; i < l; i++) {
            var item = children[i]; 
            if( item._class === 'TwoStateButton'){
                if( item.state1_name == activedToolName ){
                    item.setFocused(true);
                } else {
                    item.setFocused(false);
                }
            }
        }
    },

    
    _copyExtraAttr: function(source, excludeMatrix){ 
        this.vertical = source.vertical;
    
    },
    
});
  
var LineTool = Tool.extend(/** @lends LineTool# */{
    _class: 'LineTool',  

    initialize: function LineTool(params) {
        Tool.apply(this, arguments); 
        this.minDistance = 20; 
        this.on('mousedrag', this. onMouseDrag);
        this.on('mousedown', this. onMouseDown); 
    },
   
    onMouseDown: function(event) {
        this.path = new Path();
        this.path.addToViewIfNot();
        this._studio.segs.push( this.path );
        this.path.closed = false;
        this.path.strokeColor =  this._studio.settings.strokeColor;
        this.path.strokeWidth=  this._studio.settings.strokeWidth;
        this.path.shadowColor=  this._studio.settings.shadowColor;
        this.path.shadowBlur =  this._studio.settings.shadowBlur;
        this.path.add(event.point);
    },

    onMouseDrag: function(event) {
        // Use the arcTo command to draw cloudy lines
        if( this.path )
           this.path.add(event.point);
    }
});

var CloudTool = Tool.extend(/** @lends CloudTool# */{
    _class: 'CloudTool',  

    initialize: function CloudTool(params) {
        Tool.apply(this, arguments); 
        this.minDistance = 20; 
        this.on('mousedrag', this. onMouseDrag);
        this.on('mousedown', this. onMouseDown); 
    },
   
    onMouseDown: function(event) {
        this.path = new Path();
        this.path.addToViewIfNot();
        this._studio.segs.push( this.path );
        this.path.closed = false;
        this.path.strokeColor =  this._studio.settings.strokeColor;
        this.path.strokeWidth=  this._studio.settings.strokeWidth;
        this.path.shadowColor=  this._studio.settings.shadowColor;
        this.path.shadowBlur =  this._studio.settings.shadowBlur;
        this.path.add(event.point);
    },

    onMouseDrag: function(event) {
        // Use the arcTo command to draw cloudy lines
        if( this.path )
        this.path.arcTo(event.point);
    }
});

var SquareRoundedTool = Tool.extend(/** @lends SquareRoundedTool# */{
    _class: 'SquareRoundedTool',  

    initialize: function SquareRoundedTool(params) {
        Tool.apply(this, arguments);   
        this.path = null;
        this. curPoint = null;
        this. prevPoint = null,
        this.curHandleSeg = null;
        this.values =  {
            radius: 5,
            tolerance: 2
        };
        this.checkValues(); 
        this.on('mousedrag', this. onMouseDrag);
        this.on('mousedown', this. onMouseDown); 
    },
    
     checkValues: function(){
        var min = this.values.radius * 2;
        if (this.values.tolerance < min) this.values.tolerance = min;
        this.handle = this.values.radius * Numerical.KAPPA;
    },
 
     onMouseDown: function(event) { 
        this.path = new Path({
            segments: [event.point, event.point],
            strokeColor: this._studio.settings.strokeColor,
            strokeWidth: this._studio.settings.strokeWidth,
            shadowColor: this._studio.settings.shadowColor,
            shadowBlur: this._studio.settings.shadowBlur,
            strokeCap: 'round'
        });
        this.path.addToViewIfNot();
        this._studio.segs.push( this.path );
        this.path.closed = false;
        this.prevPoint = this.path.firstSegment.point;
        this.curPoint = this.path.lastSegment.point;
        this. curHandleSeg = null; 
    },
 
    onMouseDrag: function (event) {
        var point = event.point;
        var diff =  point.__subtract(this.prevPoint).abs();
        if (diff.x < diff.y) {
            this.curPoint.x = this.prevPoint.x;
            this.curPoint.y = point.y;
        } else {
            this.curPoint.x = point.x;
            this.curPoint.y = this.prevPoint.y;
        }
        var normal = this.curPoint.__subtract(this.prevPoint);
        normal.length = 1;
        if (this.curHandleSeg) {
            this.curHandleSeg.point = this.prevPoint.__add(normal.__multiply(this.values.radius));
            this.curHandleSeg.handleIn = normal.__multiply( -this.handle );
        }
        var minDiff = Math.min(diff.x, diff.y);
        if (minDiff > this.values.tolerance) {
            var point = this.curPoint .__subtract(normal.__multiply(this.values.radius));
            var segment = new Segment(point, null, normal.__multiply(this.handle));
            this. path.insert(this.path.segments.length - 1, segment);
            this.curHandleSeg = this.path.lastSegment;
            // clone as we want the unmodified one:
            this.prevPoint = this.curHandleSeg.point.clone();
            this.path.add(this.curHandleSeg);
            this.curPoint = this.path.lastSegment.point;
        }
    }
});

var RotatePicker = Group.extend(/** @lends RotatePicker# */{
    _class: 'RotatePicker',  

    initialize: function RotatePicker(params) {
        Group.apply(this, arguments);
        params = params || {};
        this._initialize(params);   
        this.radius = params.radius || 20; 
        this.use_inner = params.use_inner || false;  
        this.up  = params.up || true;
    },
    setStudio: function(studio){
        this.studio = studio;
    },
    _create_cover:function(){
        var that = this, usedColor = that.studio ? that.studio.settings[that.color_prop] : 'gray';
        usedColor = usedColor || 'gray';
        that._cover = new Path.Annulus({
            center: that.bounds.center,
            inner_radius: that.radius/2,
            outer_radius: that.radius,
            inner_color: that.use_inner? usedColor : 'white',
            fillColor:   that.use_inner?  'white' : usedColor,
            strokeColor:   that.use_inner?  'white' : usedColor,
        });
        that.addChild(that._cover);
        that._cover.on('mousedown', function(e){
            that.showPicker();
        });
    },
    _hidePicker: function( ){ 
        var that = this, ccc = that._children.filter( e => {
            return e != that._cover;
        }); 
        RU.revolver_back( ccc, that._cover.position.clone(), 'easeOutElastic(1, .5)',1); 
    }, 
    showPicker: function(){
        var that = this,  pos = this.position, ccc = that._children.filter( e => {
            return e != that._cover;
        });

        RU.revolver( ccc, pos.clone(), that.radius*5, that.up?20:200, that.up?160:340, 'easeOutElastic(1, .5)',1);
    }
});

var ColorPicker = RotatePicker.extend(/** @lends ColorPicker# */{
    _class: 'ColorPicker',  

    initialize: function ColorPicker(params) {
        RotatePicker.apply(this, arguments);
        params = params || {};
        this._initialize(params);  
        this.callback = params.callback || null; 
        this.level = params.level || 1;
        this.color_prop = params.color_prop || 'strokeColor';   
        this._create_shape(); 
    },
   
    _create_shape: function(){
        var that = this, up = that.up, pos = this.position, colors = ['red', 'orange', 'yellow', 'green', 'lime', 'blue', 'purple', 'white', 'black'];
        colors.forEach( c => {
            var cc = new Path.Circle({
                center: pos,
                radius: that.radius,
                fillColor: c,
                strokeColor: c == 'white' ? 'black' : c
            });
            cc.on( 'mousedown', function(){
                var ccpos = cc.position.clone();
                that._hidePicker(c);
                if( that.level == 1 ){ 
                     if( that.callback )
                         that.callback(  c ); 
                     that._cover.setColor(that.use_inner, c);
                     var p = {}; p[that.color_prop] =c;
                     that.studio.publish('studio.setting', p);
                } else {
                    var ccolor = new Color(c),  hue = (ccolor.hue + 40) % 360, ncolors = [c], count = colors.length,
                        lightness, nchild = []; 
                    for(var i = 0; i < count; i++){
                        lightness = (i * 1.0/count - 0.5) * 0.4 + 0.4; 
                        ncolors[i+1]  = new Color({ hue: hue, saturation: 1, lightness: lightness , alpha: 1}).toCSS();
                    }
                    ncolors.forEach( nc => {
                        var ncc = new Path.Circle({
                            center: ccpos,
                            radius: that.radius,
                            fillColor: nc,
                            strokeColor: nc
                        });
                        that.addChild(ncc, true);
                        nchild.push(ncc);
                        ncc.on( 'mousedown', function(){
                            anime({
                                targets: nchild,
                                opacity: 0,
                                complete: function(){
                                    nchild.forEach( e => { e.remove(); } );
                                },
                                duration: 0.5
                            });
                          //  nchild.forEach(e => {  anime(); });
                            if( that.callback )
                                that.callback(  nc );
                            that._cover.setColor(that.use_inner, nc);
                            var p = {}; p[that.color_prop] =nc;
                            that.studio.publish('studio.setting', p);
                        });
                    });
                    RU.revolver( nchild, ccpos, that.radius*4, 0, 360, 'easeOutElastic(1, .5)',1);
                } 
            });
            that.addChild(cc);
        });
       that._create_cover();
    }, 
});

 /**
 * @name SmallIntPicker
 *
 * @class The SmallIntPicker  
 * 
 * @example   see  SmallIntPicker.html  as examples
 *
 * var picker = new SmallIntPicker({
 *     data : [2,3,4..]
 *     prop_name: 'strokeWidth',
 *     radius: // radius for touch circle.
 *     color: 
 * })
 *  
 * 
 * @extends Item
 */
var SmallIntPicker = RotatePicker.extend(/** @lends SmallIntPicker# */{
    _class: 'SmallIntPicker',  

    initialize: function SmallIntPicker(params) {
        RotatePicker.apply(this, arguments);
        params = params || {};
        this._initialize(params);   
        this.data = params.data || [1,2,3,4,5,6,7,8,9]; 
        this.color = params.color || 'black';
        this._create_shape();
    },
   
    _create_shape: function(){
        var that = this, pos = this.position, data = this.data, radius = this.radius, color = this.color;
        data.forEach( (e,i) => {
            if( e == 0 ){
                var a = Path.Circle({
                    center: pos,
                    radius: radius,
                    strokeColor: "gray",
                    fillColor: 'white'
                })
                a.on( 'mousedown', function(ev){
                    var p = {}; p[that.prop_name] =0;
                    that.studio.publish('studio.setting', p);
                    that._hidePicker();
                });
                that.addChild(a);
            }
            var a = new Path.Annulus({
                center: pos,
                inner_radius: e,
                outer_radius:  radius,
                inner_color: color, 
                strokeColor:  'gray',
                fillColor: 'white'
            });
            a.on( 'mousedown', function(ev){
                var p = {}; p[that.prop_name] =e;
                that.studio.publish('studio.setting', p);
                that._hidePicker();
            });
            that.addChild(a);
        });
        that._create_cover();
    },  
});