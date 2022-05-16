 /**
 * @name TwoStateButton
 *
 * @class The TwoStateButton  
 * 
 * @example   see  TwoStateButton.html  as examples
 *
 * var button = new TwoStateButton({
 *     position: ..
 *     width:
 *     height:
 *     state1_name: ..
 *     state1_icon:  
 *     state2_name: ...
 *     state2_icon
 *     click_func:
 *     use_mouse_down:  true| false,  default is false;
 *     cur_state:
 *     toggle:  true| false,  default is false;
 *     tooltip: 
 * })
 * 
 * 
 * 
 * @extends Item
 */
var TwoStateButton = Group.extend(/** @lends TwoStateButton# */{
    _class: 'TwoStateButton',  

    initialize: function TwoStateButton(params) {
        Group.apply(this, arguments);
        this._initialize(params); 
        this.toggle = params.toggle || false;
        if( !this.state1_icon && this.state1_name ){
            this.state1_label = this._setupLabel( this.state1_name );
        }
        if( !this.state2_icon &&  this.state2_name ){
            this.state2_label = this._setupLabel( this.state2_name );
        }
        if( this.state1_icon ){
            this.state1_icon.remove();
        }
           
        if( this.state2_icon )
            this.state2_icon.remove();
        
        this.setState( this.cur_state || this.state1_name ); 
      
        var that = this;
        this.on(params.use_mouse_down ? 'mousedown' : 'click', function(e){
            if( !this.isDisabled() ){
                if( that.toggle )
                    that.toggleState();
                else
                    that.click_func( this.cur_state )
                e.stopPropagation();
                e.preventDefault();
            }
        });
    },
    toggleState: function(){
        this.setState( this.cur_state == this.state1_name ? this.state2_name : this.state1_name );
    },
    
    _setupLabel:function( text ){
        var txtColor = this.textColor || this._style && this._style.strokeColor  || this._style && this._style.fillColor ||'black';
        var bgColor = this.bgColor  || 'white';
        var label =  new StyledText({
            content:  text,
            fontSize:  this._style && this._style.fontSize || 20, 
            fillColor : txtColor,
            strokeColor : txtColor,
            borderColor: txtColor,
            bgColor:  bgColor, 
            textXOffset:5,
            textYOffset:2, 
            corner: 2,
        });
        if( this.width ){
            label.adjustXOffsetByNewWidth(this.width);
        }
        if( this.height ){
            label.adjustYOffsetByNewHeight(this.height);
        }
        label.remove();
        return label;
    },
    _getBounds: function(matrix, options) {
        if( ! (this.width || this.state1_icon || this.state1_label ) )
            return new Rectangle();
        var w =this.width || this.state1_icon && this.state1_icon.bounds.width || this.state1_label.bounds.width,
            h =this.height || this.state1_icon && this.state1_icon.bounds.height || this.state1_label.bounds.height,
            rect = new Rectangle(0, 0, w, h);
        return matrix ? matrix._transformBounds(rect, rect) : rect;  
    },
    isFocused: function(){
        return this._focused;
    },
    setFocused: function(focus){
        this._focused = focus; 
    },

    isDisabled: function(){
        return this._disabled || false;
    },
    setDisabled: function(e){
        this._disabled = e;
        if( e ){
            if( !this._dis_fig ){
                var b = this.bounds;
                this._dis_fig =   new Path.Rectangle({
                   topLeft: b.topLeft,
                   bottomRight: b.bottomRight,
                    radius: 2,
                    strokeColor: 'rgba(250,250,250,0.6)',
                    fillColor: 'rgba(250,250,250,0.6)',
                 });  
            } 
            if( this._cur_shape )
                this._dis_fig.position = this._cur_shape.position;
            this._dis_fig.visible = true;
            this.addChild(this._dis_fig);

        } else {
            if( this._dis_fig ){
                this._dis_fig.visible = false;
                this._dis_fig.remove();
            }
        }
        this._changed(/*#=*/Change.GEOMETRY);
    },
   
    _get_cur_shape: function(state){
        return state === this.state1_name ? 
        ( this.state1_icon || this.state1_label) : 
        ( this.state2_icon || this.state2_label  );
    },

    setState: function(state){
        var that = this, willbe = that._get_cur_shape(state);
        if( that._cur_shape === willbe ) return; 
        that.cur_state = state; 
        if( that._cur_shape )
           willbe.position = that._cur_shape.position;
        if( that._cur_shape && that.state1_icon && that.state2_icon ){
            that._cur_shape.morphingTo(null, willbe, 1.0, null, function(){
                 that._cur_shape.remove();
                 that._cur_shape = willbe;
                 that._cur_shape.visible = true;
                 that.addChild(that._cur_shape);
            });         
        } else {
            if( that._cur_shape )
                that._cur_shape.remove();
            that._cur_shape = willbe;
            that._cur_shape.visible = true;
            that.addChild(that._cur_shape);
        }
        that._changed(/*#=*/Change.GEOMETRY);
    },

    _copyExtraAttr2: function(source, excludeMatrix){  
    },

    _copyExtraAttr: function(source, excludeMatrix){ 
        this.state1_name = source.state1_name;
        this.state1_icon = source.state1_icon;
        this.state2_name = source.state2_name;
        this.state2_icon = source.state2_icon;
        this._disabled = source._disabled;
        this.click_func = source.click_func;
        this.default_state = source.default_state;
        this.tooltip = source.tooltip;
        this._copyExtraAttr2(source, excludeMatrix);
    },
    // _draw_extra_fb_XXXXXXX: function(ctx, param, viewMatrix) { 
    //     if( this._disabled ){
    //         ctx.lineWidth = 1;
    //         ctx.fillStyle = 'rgba(125,125,125,0.3)';
    //         ctx.strokeStyle = 'rgba(125,125,125,0.3)';
    //         RU.r9_drawRounded(ctx, -this.bounds.width/2, -this.bounds.height/2, this.bounds.width, this.bounds.height, 2); 
    //         ctx.fill();
    //         ctx.stroke(); 
    //     }
    // },
     
   
});
  