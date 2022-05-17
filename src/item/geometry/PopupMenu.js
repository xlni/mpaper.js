 
 /**
 * @name PopupMenu
 *
 * @class The PopupMenu  
 * 
 * @example   see  PopupMenu.html  as examples
 *
 *  
 * 
 * 
 * 
 * @extends Group
 */
  var PopupMenu = Group.extend(/** @lends PopupMenu# */{
    _class: 'PopupMenu',  
   

    initialize: function PopupMenu( params ) {
      //  Group.apply(this, arguments); 
      //   this._initialize( params ); 
        this.cornerRadius = params.cornerRadius || 4;
       // this.fontFamily', r9_global_font);
     //    this.fontSize', 18);
        this.menuItems = [];  
      
        Group.apply(this, arguments);
        this. _initialize(params);
        this.addorder = params.addorder || true; 
        this.colnum = params.colnum || 1;
        this.margin = params.margin || 5;
        this.cellheight = params.fontSize || 18;
        this.cellwidth = 10;  
        this.checked = params.checked || false;
        this.corner = params.corner || 0;
        this.title = params.title || '';
        this.borderColor = this.borderColor || this._project.getBuiltInColor('color1') || this.strokeColor; 
        this.keyColor = this.keyColor || this._project.getBuiltInColor('bgColor1') || this.fillColor;
        this.keyTextColor = this.keyTextColor || this._project.getBuiltInColor('textColor') || this.strokeColor;
        this.keyboardColor = this.keyboardColor || this._project.getBuiltInColor('bgColor2') || this.fillColor;
        if( this.autoClose == 'undefined' )
            this.autoClose = true;
     //   this._changed(/*#=*/Change.CHILDREN);
    },
    _copyExtraAttr: function(source, excludeMatrix){
        this. cornerRadius = source.cornerRadius;
        this. menuItems = source.menuItems;
        this. addorder = source.addorder;
        this. colnum = source.colnum;
        this.margin = source.margin;
        this.cellheight = source.cellheight;
        this.cellwidth = source.cellwidth; 
        this.checked = source.checked;
        this.corner = source.corner;
        this.keyColor = source.keyColor;
        this.keyTextColor = source.keyTextColor; 
     },
   
    // _drawBackground : function(ctx, param, viewMatrix){ 
    //    // this._setStyles(ctx, param, viewMatrix);
    //     var x = this.bounds.x, y = this.bounds.y, width = this.bounds.getWidth(), height = this.bounds.getHeight(),
    //     borderColor = this.borderColor, bgColor = this.keyboardColor,
    //      corner = this.corner, borderWidth = this.borderWidth ;
      
    //      ctx.save();  
    //     if( borderWidth ) ctx.lineWidth = borderWidth;
    //     ctx.fillStyle = bgColor;
    //     ctx.strokeStyle = borderColor; 
    //         RU.r9_drawRounded(ctx, x,y, width, height, corner);  
    //     if( bgColor )   ctx.fill();
    //     if( borderColor )   ctx.stroke(); 
    //     ctx.restore();  
    // },
    //it is not needed, and it will cause problem for raster() method.
    // _getBounds: function(matrix, options) {
    //     var margin = this.margin, colnum = this.colnum, items = this.menuItems ? this.menuItems.length : 0,
    //         rownum = Math.ceil(items / colnum),
    //         cellwidth = this.cellwidth, cellheight = this.cellheight,
    //         w = margin*2 + (colnum -1)* margin + cellwidth * colnum,
    //         h = margin*2 + (rownum-1)* margin + cellheight * rownum;   
         
    //     var rect = new Rectangle(0,0, w, h);
    //     return matrix ? matrix._transformBounds(rect, rect) : rect;
    // },

    addMenuItems: function(title, keyList, callback, userobj){
        var that = this;
        that.title = title;
        if( Array.isArray(keyList[0]) ){
            that.colnum = keyList[0].length;
        }
        keyList.forEach(cell => {
            if( typeof cell.forEach == 'function') 
                cell.forEach(c => {    that.addMenuTextItem(c, callback, '',  userobj);   });
            else
                that.addMenuTextItem(cell, callback, '', userobj);
        });
    },

    addMenuTextItem: function( content,  callback, iconName, userobj) { 
        var text =  content, style = this._style;
         if( this.addorder  ){
             text = Formatter.instance.toAbcOrder(this.menuItems.length) + ": " + content;
         }
        var textNode = new StyledText({
           content:   text, 
           fontSize: style.fontSize || this.fontSize || 16 , 
           fillColor :   this.keyTextColor,
           strokeColor : this.keyTextColor,
           borderColor: this.borderColor || 'white',
           bgColor: this.keyColor || 'white',
        //   justification: 'center', 
           textXOffset:10,
           textYOffset:3, 
           corner: this.corner,
            });
 
        this.addMenuItem(  textNode,  content, callback, iconName, userobj);
    },

    addMenuItem: function( textNode, content,callback,  iconName, userobj) { 
        var that = this, bd = that.bounds.clone(), tnode_bd = textNode.bounds.clone();
        if( !bd.width ) bd.width = 0; 
        if( !bd.height ) bd.height = 0;
        var gap= this.margin,  colnum = this.colnum ; 
       
        var tw = parseFloat(tnode_bd.width + ( iconName ? 30 : 0) );
        this.cellwidth = Math.max( this.cellwidth, tw);
        this.cellheight = Math.max( this.cellheight, tnode_bd.height);
        var curpos = 0,  curx = bd.x + gap, cury = bd.y + gap, curnode;

        //check title
        if( that.title && !that.titleNode ){
            if( that.title instanceof Item ){
                that.titleNode = that.title; 
            }
            else {
                that.titleNode = new StyledText({
                    content:   that.title, 
                    fontSize:  that._style.fontSize || that.fontSize || 18, 
                    fillColor :   this.keyTextColor,
                    strokeColor : this.keyTextColor,
                    borderColor: this.borderColor || 'white',
                    bgColor: this.keyColor || 'white', 
                    textXOffset:10,
                    textYOffset:3, 
                    corner: this.corner,
                     });
            } 
            that.addChild( that.titleNode );
            that.titleNode.bounds.x = curx;
            that.titleNode.bounds.y = cury;
           
            this.cellwidth = Math.max( this.cellwidth, that.titleNode.bounds.width);

        }
        if( that.titleNode ){
            that.titleNode.adjustXOffsetByNewWidth(this.cellwidth);
            cury += that.titleNode.bounds.height + gap;
        }
           

        textNode.remove();
        this.menuItems.push(textNode);
        this.addChild(textNode);
 
        var items = this.menuItems.length;
        while( curpos < items ){ 
            for(var i = 0; i < colnum && curpos < items; i++){
                curnode = this.menuItems[curpos];
                curnode.bounds.x = curx;
                curnode.bounds.y = cury;
                curnode.adjustXOffsetByNewWidth(this.cellwidth);
                curnode.adjustYOffsetByNewHeight(this.cellheight); 
                curx += this.cellwidth + gap;
                curpos++;
 
            }
            curx = bd.x +  gap;
            cury += this.cellheight + gap;
        } 
        textNode.on('click', function() { 
            if( that.autoClose ) that.removeAllItems(); 
             if(callback) 
                callback(content, userobj);  
         });
        
        if( this.bgrect ){
            this.bgrect.remove(); 
        }
        
        var   items = this.menuItems ? this.menuItems.length : 0, rownum = Math.ceil(items / colnum), 
        w = gap*2 + (colnum -1)* gap + this.cellwidth * colnum,
        h = gap*2 + (rownum-1)* gap + this.cellheight * rownum; 
        if( that.titleNode ){
            w = Math.max(w, that.titleNode.bounds.width +2*gap);
            h += that.titleNode.bounds.height + gap;
        }
        this.bgrect = new Path.Rectangle({
                rectangle:{  topLeft: [bd.x, bd.y],
                             bottomRight: [bd.x +w, bd.y +h]},
                radius:  this.corner,
                strokeColor: this.borderColor ,
                fillColor: this.keyboardColor
            });
        this.insertChild(0, this.bgrect);
      //  this.position = this.position;
      //  this._changed(/*#=*/Change.GEOMETRY);
    },

    removeAllItems:   function( ) {
        var items = this.menuItems ;
        for(var i in items){
          items[i].remove();
        }
        this.menuItems.length = 0;
        if(  this.bgrect  )
            this.bgrect.remove();
       // this.removeChildren();
        this.remove(); 
    },
});
  
 /**
 * @name ChoiceProblem
 *
 * @class The ChoiceProblem  
 * 
 * @example   see  ChoiceProblem.html  as examples
 * 
 * 
 * @param  data is :
 * {
 *    title: 
 *    options: [
 *               { 
 *                 content:  
 *                 correct: 
 *                 feedback:
 *                 toScene:
 *               }
 *             ]
 * 
 * }
 * 
 * @extends PopupMenu
 */
  var ChoiceProblem = PopupMenu.extend(/** @lends ChoiceProblem# */{
    _class: 'ChoiceProblem',   
    initialize: function ChoiceProblem( params ) {
        this.autoClose = false;
        PopupMenu.apply(this, arguments);  
       
        if( this.problem )
            this.setup( this.problem );
    },
    setup: function(data){
        var that = this;
        that._problem = data;
        that.title = that._problem.title;
        that._problem.options.forEach( e => {
            that.addMenuTextItem( e.content, function(){
                if( that.autoClose ) that.removeAllItems();
                else if( that.autoMarkAnswer ) that.markAnswer();

                if( e.feedback ) {
                    that._project._studio.publish('global.message.notification', 
                    { content : e.feedback, position: that.position, ani_type:10 });
                }
                else if( e.toScene ){
                    that._project.showLayer( event.toScene );
                }  
            })
        });
    },
    setProblem: function(data){
        this._problem = data;
    },
    getProblem: function(){
        return this._problem;
    },
    markAnswer: function(){
        var that = this;
        that._problem.options.forEach( e => {
            if( e.correct ) e.bgColor = that._project.getBuiltInColor('correctColor');
            else  e.bgColor = that._project.getBuiltInColor('wrongColor');
        });
    }
  
});