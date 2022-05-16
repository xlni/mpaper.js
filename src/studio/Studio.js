/**
 * @name Studio
 *
 * @class The Studio object refers to a workspace. it includes both canvas and html dom div
 * . All its properties are also available in the mpaper  scope.
 * 
 *
 * @classexample {@paperscript height=300}
 * var path;
 
 */
 var Studio = Base.extend(/** @lends Studio# */{
    _class: 'Studio', 
    

    // DOCS: rewrite Studio constructor explanation
    initialize: function Studio(props) {
        this._tools =[];  props = props || {};
        this.settings = {
            strokeWidth: props.strokeWidth || 1,
            strokeColor: props.strokeColor || 'black',
            fillColor: props.fillColor || 'black',
            shadowColor: props.shadowColor || 'red',
            shadowBlur: props.shadowBlur || 3,
        }
        this.pageBus = new PageBus();
        this.segs = [];
        var that = this;
        this.subscribe('studio.setting', this, function(topic, data){
           if( data.strokeColor )  that.settings.strokeColor = data.strokeColor ;
           if( data.fillColor ) that.settings.fillColor = data.fillColor ;
           if( data.shadowColor ) that.settings.shadowColor = data.shadowColor ;
           if( data.strokeWidth ) that.settings.strokeWidth = data.strokeWidth ;
        })
    },
    undo: function(){
        var len = this.segs.length;
        if( len>0 ){
            var r = this.segs.splice(len-1, 1);
            r[0].remove();
        }
    },
    clear: function(){
        this.segs.forEach(e => {
            e.remove();
        })
        this.segs = [];
    },
    updateStyle: function(style){
        this.settings.strokeColor = style.strokeColor;
        this.settings.fillColor = style.fillColor;
    },
    publish: function(topic, obj){
        this.pageBus.publish(topic, obj);
    },
    subscribe: function(topic, scope, onData, subscriberData, timeline){
        this.pageBus.subscribe(topic, scope, onData, subscriberData, timeline);
    },
    setupBuiltInToolbar: function(){
        var studio = this;
        studio.register_tool ('stroke width', '', 'stroke width', new SmallIntPicker({
            prop_name: 'strokeWidth',
            data: [0,1,3,6,9,12],
            color: 'red',
            radius: 14
        }));
       studio.register_tool ('Line', '', 'Cloud', new LineTool());
       studio.register_tool ('Cloud', '', 'Cloud', new CloudTool());
       studio.register_tool ('Grid', '', 'Grid', new SquareRoundedTool());
       studio.register_tool ('Undo', '', 'Undo',  new TwoStateButton({
           state1_name: 'Undo', 
           bgColor:  mpaper.project.getBuiltInColor('bgColor2') || 'white',
           textColor:  mpaper.project.getBuiltInColor('textColor') || 'black',
           click_func: function(state){
               studio.undo();
           },  
           toggle: false ,
           use_mouse_down:true
       }));
       studio.register_tool ('Clear', '', 'Clear',  new TwoStateButton({
           state1_name: 'Clear', 
           bgColor:  mpaper.project.getBuiltInColor('bgColor2') || 'white',
           textColor:  mpaper.project.getBuiltInColor('textColor') || 'black',
           click_func: function(state){
               studio.clear();
           },  
           toggle: false ,
           use_mouse_down:true
       }));
       studio.register_tool ('strokeColor', '', 'strokeColor', new ColorPicker({ up:false, radius:10, level:2, color_prop: 'strokeColor'}));
       studio.register_tool ('fillColor', '', 'fillColor', new ColorPicker({ up:false, radius:10, level:1, color_prop: 'fillColor', use_inner: true}));
       studio.register_tool ('shadowColor', '', 'shadowColor', new ColorPicker({ up:false, radius:10, level:1, color_prop: 'shadowColor' })); 
    },
    showBuiltinToolbar: function( vertical ){
        this.setupBuiltInToolbar();
        this.showToolbar(vertical);
    },

    showToolbar: function( vertical){
        if( !this._toolbar ){
            this._toolbar = new Toolbar();
            this._tools.forEach(t => {
                this._toolbar.register_tool(t); 
            });
            this._toolbar.align_tools(vertical);
            //this cause problem for toolbar's new bounds....
          //  this._toolbar.position = point; 
        }
        this._toolbar.addToViewIfNot();
        //it is a bug, when re-position group, bounds of group changed, if it is on top,
        //it will affect visibility of others...
        this._toolbar.setAsTopOne();
        
    },
    removeToolbar:function(){
         if( this._toolbar ){
             this._tools.forEach( item => {
                if( item.tool && typeof item.tool.remove == 'function'){
                    item.tool.remove();
                }
             });
             this._tools = [];
             this._toolbar.remove(); 
         }
    },

    register_tool: function(name, icon, tooltip, tool){
        if( typeof tool.setStudio  == 'function' ) tool.setStudio(this);
        this._tools.push({name: name, icon: icon, tooltip: tooltip, tool: tool });
    },
    get_toolinfo: function(name){
        for(var i in this._tools){
            if( this._tools[i].name == name )
                return this._tools[i];
        }
        return null;
    },
    unregister_tool: function(name){ 
        var pos = -1;
        this._tools = this._tools.filter(
            function(item , index){
                if( item.name == name ){
                    pos =index;
                    if( item.tool && typeof item.tool.remove == 'function'){
                        item.tool.remove();
                    }
                    return false;
                }
                return true;
            }
        ) 
        if( pos >= 0 ){
            this._toolbar.unregister_tool(pos);
        }
    }
});
