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
 * @name StyledText
 *
 * @class A StyledText item represents a piece of typography in your Paper.js
 * project which starts from a certain point and extends by the amount of
 * characters contained in it.
 *
 * Note for animation type:
 * @param animType
 *  //0 : static text, 1: show text increasely 2: use text as background  3: use underline as animation 
    //4: karaoka    5: manim-style  6: manim-style2 

     0 static, 1 writing, 2 rewriting, 3 underline, 4 karaoka,  5 manim
    
 * 
 * @extends TextItem
 */
 var StyledText = TextItem.extend(/** @lends StyledText# */{
    _class: 'StyledText',
 

    /**
     * Creates a point text item
     *
     * @name StyledText#initialize
     * @param {Point} point the position where the text will start
     * @return {StyledText} the newly created point text
     *
     * @example {@paperscript}
     * var text = new StyledText(new Point(200, 50));
     * text.justification = 'center';
     * text.fillColor = 'black';
     * text.content = 'The contents of the point text';
     */
    /**
     * Creates a point text item from the properties described by an object
     * literal.
     *
     * @name StyledText#initialize
     * @param {Object} object an object containing properties describing the
     *     path's attributes
     * @return {StyledText} the newly created point text
     *
     * @example {@paperscript}
     * var text = new StyledText({
     *     point: [50, 50],
     *     content: 'The contents of the point text',
     *     fillColor: 'black',
     *     fontFamily: 'Courier New',
     *     fontWeight: 'bold',
     *     fontSize: 25
     * });
     */
    initialize: function StyledText(arg) {
        //font family
        this._curFF=null;  
        //font style
        this._curFS=null; 
        //font weight
        this._curFW=null; 
        //r9style
        this._curStyle=null; 
        this._defaultStroke=null; 
        this._calculatedHeight=0;  
    
        this.fontStyle= TextItem.NORMAL; //different from paperjs' fontstyle. which is a complete setting for font.
        this.fontVariant= TextItem.NORMAL;
        this.padding= 0;
        this.align= TextItem.LEFT;
        this.lineHeight= 1;
        this.r9textstyle= '';
        this._content= '';
        this.duration= 0;
        this.resumeAnimation= 1;   
        this.animType=  'static';
        this. drawunderline=  false;
        this. expression=  '';
        this.penImageName=  ''; 
        this.fixed=  2;   
        this._karaokaWidth=  0;   
        this.userobj=  null; 
        this.abOrder= '';
        this.mstyles= null; 
        this. corner= 0;
        this. borderWidth= 0;
        this. textXOffset= 0;
        this. textYOffset= 0;
        this. textHeight=0;
        this.textWidth=0;
        this.borderColor= '';
        this.bgColor = '';
        this.glow= 0;
        this.gstart= 0;
        this.gend= 0;
        this.effectColor= ''; 
        this.correct= 0;  //0= not used | >0: correct | <0: incorrect
        this. textArr=[]; 
        this.line2height=[];
       // var hasProps = arg && Base.isPlainObject(arg)
        //      && arg.x === undefined && arg.y === undefined;
      //  this._initialize(hasProps && arg, !hasProps && Point.read(arguments));
        
        if( !arg.fillColor && arg.strokeColor )
            arg.fillColor = arg.strokeColor;
        if( !arg.strokeColor && arg.fillColor )
            arg.strokeColor = arg.fillColor; 
    
        TextItem.apply(this, arguments)
        if( !this.strokeColor ) this.strokeColor = mpaper.project.getBuiltInColor('textColor');
        if( !this.fillColor ) this.fillColor = mpaper.project.getBuiltInColor('textColor');
 

        this.partialText = this._content;
        this._setTextData();
        this._changed(/*#=*/Change.CONTENT);
    },

    _copyExtraAttr: function(source, excludeMatrix){
        this._defaultStroke=source._defaultStroke; 
        this._calculatedHeight=source._calculatedHeight;   
        this.fontStyle=  source.fontStyle;
        this.fontVariant= source.fontVariant;
        this.padding= source.padding;
        this.align= source.align;
        this.lineHeight= source.lineHeight;
        this.r9textstyle= source.r9textstyle;
        this._content= source._content;
        this.duration= source.duration;
        this.resumeAnimation= source.resumeAnimation;    
        this.animType= source.animType;
        this. drawunderline=  source.drawunderline;
        this. expression=  source.expression;
        this.penImageName=  source.penImageName; 
        this.fixed=  source.fixed;   
        this._karaokaWidth=  source._karaokaWidth;   
        this.userobj=  source.userobj; 
        this.abOrder= source.abOrder;
        this.mstyles= source.mstyles; 
        this. corner= source.corner;
        this. borderWidth= source.borderWidth;
        this. textXOffset= source.textXOffset;
        this. textYOffset= source.textYOffset;
        this. textHeight= source.textHeight;
        this.textWidth= source.textWidth;
        this.borderColor= source.borderColor;
        this.bgColor = source.bgColor;
        this.glow= source.glow;
        this.gstart= source.gstart;
        this.gend= source.gend;
        this.effectColor= source.effectColor; 
        this.correct= source.correct;
        this. textArr= source.textArr; 
        this.line2height= source.line2height;
    },
 
    setTextData: function(data){
        this._content = data; 
        this.partialText = data;
        this._setTextData();
        this._changed(/*#=*/Change.CONTENT);
     },

    _draw: function(ctx, param, viewMatrix) {
        if (! this._content)
            return;
        this._setStyles(ctx, param, viewMatrix);
 
       this._draw2(ctx);
        
    //   this._drawBackground(ctx); 

    //   ctx.translate(this.getPaddingX(), this.getPaddingY());
 
    //     var  content = this.text || this._content, 
    //         lines =  content.split(/\r\n|\n|\r/mg);
    //         style = this._style,
    //         hasFill = style.hasFill(),
    //         hasStroke = style.hasStroke(),
    //         leading = style.getLeading(),
    //         shadowColor = ctx.shadowColor;
    //     ctx.font = style.getFontStyle();
    //     ctx.textAlign = style.getJustification();
    //     for (var i = 0, l = lines.length; i < l; i++) {
    //         // See Path._draw() for explanation about ctx.shadowColor
    //         ctx.shadowColor = shadowColor;
    //         var line =  lines[i];
    //         if (hasFill) {
    //             ctx.fillText(line, 0, 0);
    //             ctx.shadowColor = 'rgba(0,0,0,0)';
    //         }
    //         if (hasStroke)
    //             ctx.strokeText(line, 0, 0);
    //         ctx.translate(0, leading);
    //    }
        
    },

    getdPoint: function() {
        // Se Item#getPosition for an explanation why we create new LinkedPoint
        // objects each time.
        var point = this._matrix.getTranslation();
        return new LinkedPoint(point.x, point.y, this, 'setPoint');
    },

    setPdoint: function(/* point */) {
        var point = Point.read(arguments);
        this.translate(point.subtract(this._matrix.getTranslation()));
     //   this.translate(0,-50);
    },

    _getBounds: function(matrix, options) {
        var w =this.getWidth(), h = this.getHeight(),
           px = this.getPaddingX(), py = this.getPaddingY() ;
        var rect = new Rectangle(0/2,0/2, w, h);
        return matrix ? matrix._transformBounds(rect, rect) : rect;  
    /**      var style = this._style, 
            lines = (this._content || this.text).split(/\r\n|\n|\r/mg),
            numLines =  lines.length,
            justification = style.getJustification(),
            leading = style.getLeading(),
            px = this.getPaddingX(), py = this.getPaddingY(),
            width = this.getView().getTextWidth(style.getFontStyle(), lines) + px + px,
            height = numLines * leading + py + py, 
            x = 0;
        // Adjust for different justifications.
     //   if (justification !== 'left')
     //     x -= width / (justification === 'center' ? 2: 1); 
    //     var rect = new Rectangle(x,
     //       numLines ? - 0.75 * leading : 0,
     //       width, numLines * leading);

        var rect = new Rectangle(0,  0, width, height);
        return matrix ? matrix._transformBounds(rect, rect) : rect; **/
    },

    _addTextUnit : function(line, width, r9textstyle) {
        return this.textArr.push({
                                 text : line,
                                 width : width,
                                 style : r9textstyle
                                 });
    },
    


    // calculateTextWidth: function(ctx, font, line) {
    //     var ctx = ctx,
    //         prevFont = ctx.font,
    //         width = 0;
    //     ctx.font = font;
    //     width = Math.max(width, ctx.measureText(line).width);
    //     ctx.font = prevFont;
    //     return width;
    // },

    _getLineHeightPx : function(r9textstyle){
        if(  r9textstyle && r9textstyle.math && r9textstyle.math.h ){
            return  parseInt(r9textstyle.math.h, 16) 
        }
        if( r9textstyle &&  r9textstyle.rh   ) 
           return r9textstyle.rh;
        else 
           return  this._style.getLeading(); 
    },
      

    _restore: function(){
        this._curFF = null;
        this._curFS = null; 
        this._curFW = null;
        this._curStyle = null; 
        this._defaultStroke = null;
        this.fontStyle = TextItem.NORMAL; //different from paperjs' fontstyle. which is a complete setting for font.
        this.fontVariant = TextItem.NORMAL;
    },

    write: function(timeline, duration, offset,  doneCallback) {
        this._write0(timeline, duration, offset,   true, doneCallback);
    },

    unwrite: function(timeline, duration, offset,  doneCallback) {
        this._write0(timeline, duration, offset,   false, doneCallback);
    },

    _write0: function(timeline, duration, offset, create, doneCallback) { 
        var that = this; 
        this.duration = duration; 
        timeline.add({
                targets : this,
                progressFunc : function(progress){
                     that._progress = create ? progress : 1 - progress;
                     that._changed(/*#=*/(Change.SEGMENTS)); 
                }.bind(this),
                duration : duration,   
                complete: function(){
                    that.duration = 0;
                    if( doneCallback ) doneCallback();
                }.bind(this)
           }, offset);
          
        return true;
     },

    _drawGlow : function(ctx, x, y ) {
        var w =this.getWidth(), h = this.getHeight();
         ctx.save();  
         ctx.translate(w, -h/2); 
        var gradient4 = ctx.createRadialGradient(0, 0, 0, 0, 0, h/2 );
         gradient4.addColorStop(0, 'rgba(255,0,0, 0.6)');
         gradient4.addColorStop(1, 'rgba(255,0,0,0)');
        ctx.fillStyle = gradient4;// "rgba(255,0,0, 0.2)"  ; 
        ctx.beginPath();
        ctx.arc(0, 0, h/2, 0, Math.PI *2, false);
        ctx.closePath();  
        ctx.fill();     

        ctx.restore();
   },
   adjustXOffsetByNewWidth: function(newWidth){
        var w = this.bounds.width, changes = (newWidth - w) /2;
        this.textXOffset += changes;
        this._changed(/*#=*/Change.CONTENT);
   },
   adjustYOffsetByNewHeight: function(newHeight){
        var h = this.bounds.height, changes = (newHeight - h) /2;
        this.textYOffset += changes;
        this._changed(/*#=*/Change.CONTENT);
   },
    getPaddingX : function() {
       return this.padding + this.textXOffset ;
    },
    getPaddingY : function() {
        return this.padding  + this.textYOffset ;
    },
    getKaraokaWidth: function(){
        if(! this._karaokaWidth ) this._karaokaWidth = this._project._activeLayer.bounds.width;
        return this._karaokaWidth;
    },
    setKaraokaWidth: function(w){
         this._karaokaWidth = w;
    },
    getWidth : function() {
        if( this.animType== 'karaoka' ){
             return this.getKaraokaWidth();
        }
       return  this.calculateTextWidth() + this.getPaddingX() * 2 ;
    },
    
    getNumLines: function(){
        return  this._content  .split(/\r\n|\n|\r/mg).length;
    },

    getHeight : function() { 
        if( this._calculatedHeight <= 0 ){
            return   ( this.getNumLines() * this._getLineHeightPx())
                    + this.getPaddingY() * 2 ;
        } else {
            return this._calculatedHeight + this.getPaddingY() * 2 ;
        } 
    },
    
    calculateTextWidth : function() { 
        return this.textWidth;
    },
    
    _getFontWeight : function(){
        if ( this._curFW)
            return this._curFW;
        else
            return this._style.getFontWeight();
    },
    _getFontVariant : function(){
        if ( this._curFontVariant )
            return this._curFontVariant;
        else
            return this.fontVariant;
    },
    _getFontStyle : function(){
        if ( this._curFS ){
            var style = this._curFS;
            if( style === "bold" ){
                this._curFW = "bold";
               return "normal";
            }
            return this._curFS; 
        } else {  
            var style = this.fontStyle
            if( style === "bold" ){
               _curFW = "bold";
               return "normal";
            }
            return style;
        }
    },
    _getFontFamily : function(){
        if ( this._curFF )
            return this._curFF;
        else
            return this._style.getFontFamily(); 
    },
        
    _calculateTextWidth : function(text) {
        return this.getView().getOneLineTextWidth(this._getContextFont(), text); 
    },

    _getContextFont : function(fontsize) {
        return this._getFontStyle() + TextItem.SPACE + this._getFontVariant() + TextItem.SPACE + this._getFontWeight() + TextItem.SPACE
        + ( typeof fontsize == 'undefined' ? this._style.getFontSize() : fontsize )+   TextItem.PX_SPACE + this._getFontFamily();
    },
     
    _getTextSize : function(text, r9textstyle) {
        if( typeof r9textstyle != "undefined" && r9textstyle.math ){
            return {
               width : parseInt(r9textstyle.math.w, 16),
               height : parseInt(r9textstyle.math.h, 16)
            };
        }
        var _context = this.getView()._context, fontSize = this._style.getFontSize(), metrics;
       
        _context.save();
        _context.font = this._getContextFont();
       
        metrics = _context.measureText(text);
        _context.restore();
        return {
            width : metrics.width,
            height :this._getLineHeightPx(r9textstyle) 
        };
    },

    _drawBackground : function(ctx){
        var width = this.getWidth(), height = this.getHeight(),
        useBackground = this.borderColor || this.bgColor  ,
         borderColor = this.borderColor, bgColor = this.bgColor,
         corner = this.corner, borderWidth = this.borderWidth ;
        if( !useBackground )
            return;
         ctx.save(); 
     
        if( borderWidth ) ctx.lineWidth = borderWidth;
        ctx.fillStyle = bgColor;
        ctx.strokeStyle = borderColor; 
         RU.r9_drawRounded(ctx, 0,0, width, height, corner); 
        
        if( bgColor )   ctx.fill();
        if( borderColor )   ctx.stroke(); 
         ctx.restore();  
    },
    _setTextData : function() {  
        if ( this.r9textstyle  ){
            try{
                return this._setTextData2();
            }catch(e){
                CoreUtils.r9_log_console(e); 
                return this._setTextData1();
            }
        } else {
            return this._setTextData1();
        } 
    },
    _setCurTexTStyle: function(s){
        if ( s.b ){  
            this._curFW = "bold";
            this._curFS = null;
        } else if ( s.i ){  
            this._curFS = "italic";
            this._curFW = "normal";
        }else { 
            this._curFW = "normal";
            this._curFS = null;
        } 
        if ( s.fontFamily )
            this._curFF = s.fontFamily;
        else
            this._curFF = this._getFontFamily();
    },
    _setTextData1 : function() {
        var lines = this.partialText.split(/\r\n|\n|\r/mg), fontSize = this._style.getFontSize(), textWidth = 0, lineHeightPx = this
        ._getLineHeightPx(),    paddingX = this .getPaddingX() , paddingY = this .getPaddingY() ,
         numLines = lines.length;
         
        this.textArr = [];
        this.line2height = [];
        for (var i = 0, max = lines.length; i < max; ++i) {
            var line = lines[i], lineWidth = this._calculateTextWidth(line);
            this._addTextUnit(line+ "\n", lineWidth);
            textWidth = Math.max(textWidth, lineWidth); 
            this.line2height.push( lineHeightPx );
        }
 
        this.textHeight = numLines * lineHeightPx;
        this.textWidth = textWidth;
        this._calculatedHeight = this.textHeight ;
        var abOrder = this.abOrder;
        if( abOrder ){
            var orderw = this._getTextSize(abOrder).width;
            this.textWidth += orderw;
        }
    },

    _setTextData2 : function() {
        var text = this.partialText , 
         animType = this.animType, 
         r9textstyle = this.r9textstyle ,
         textWidth = 0, 
         totalHeightPx = 0 ;
         
        this.textArr = []; 
        this.line2height = []; 
        
        var maxLineHeight =  0,  line, lineWidth = 0;  
        for (var i = 0; i < r9textstyle.length; i++) { 
            var line =  r9textstyle[i].end < text.length -1 ? text.substring( r9textstyle[i].start, r9textstyle[i].end + 1) : text.substring( r9textstyle[i].start );
            this._setCurTexTStyle ( r9textstyle[i] ) ; 
            var textSize = this._getTextSize(line, r9textstyle[i]);
            lineWidth += textSize.width;
            if( textSize.height > maxLineHeight )
                maxLineHeight = textSize.height;
            
            this._addTextUnit(line, textSize.width, r9textstyle[i]);
            textWidth = Math.max(textWidth, lineWidth);
            if ( line.indexOf("\n") >= 0 && animType != 4 ){
                lineWidth = 0;
                this.line2height.push(maxLineHeight);
                totalHeightPx += maxLineHeight; 
                maxLineHeight = 0; 
            }  
        }
        if( maxLineHeight > 0 ){
            this.line2height.push(maxLineHeight); 
            totalHeightPx += maxLineHeight; 
        } 
        
        this.textHeight = totalHeightPx;
        this.textWidth = textWidth;
        var abOrder = this.abOrder;
        if( abOrder ){
            var orderw = this._getTextSize(abOrder).width;
            this.textWidth += orderw;
         }
      
         this._restore();
    },

    _sceneFuncImpl : function(ctx, paintBgText, paintBorderOnly) {
        var  animType = this.animType, textHeight = this.textHeight, lineHeightPx = this._getLineHeightPx(), 
        textArr = this.textArr, textArrLen = textArr.length, totalWidth = this
        .getWidth(), abOrder=this.abOrder ,  glow = this.glow , gstart = this.gstart , gend = this.gend , 
        pX = this.getPaddingX(), pY = this.getPaddingY(), n;// ctx = this.getView()._context;

        this._drawBackground(ctx);  
        
        var paintAll = this.partialText == this._content; 

        
        ctx.font = this._getContextFont();
        ctx.textBaseline = TextItem.MIDDLE; 
        ctx.textAlign = TextItem.LEFT;

         ctx.save();
        ctx.translate(pX, 0);

       
        ctx.translate(0, pY  );

        // if( animType == 'manim2' && gend > 0){
        //     if( gstart > 0){ 
        //         // var offx6 = this._getTextSize(this._content.substring(0, gstart)).width;
        //         // //textbaseline  to center
        //         // ctx.translate(offx6, this.line2height[0]/2);  
        //         // this.partialText=this._content ;
        //         // this._strokeFunc(ctx); 
        //         ctx.restore();
        //         return;
        //     }
        // }

        if( abOrder ){
            var orderw = this._getTextSize(abOrder).width;
            ctx.strokeText(abOrder, 0,0);
            ctx.translate(orderw, 0);
        }
        
        if( animType == 'karaoka'){
            var kalaokoffset = this.kalaokoffset();
           // if( kalaokoffset < 0 ){
           //     ctx.restore();
           //     return;
          //  } 
         //   else
                ctx.translate(kalaokoffset , 0);  
        }
        var _xoffset = 0; 
        var rowIndex = 0;
        var newLineStart = false;
        var hasMedia = false;
        ctx.translate(0, this.line2height[0]/2);
        for (n = 0; n < textArrLen; n++) {
            var obj = textArr[n], text = obj.text, width = obj.width,  style = obj.style;
            this._curStyle = style ;
            hasMedia = false;
            
            var isNewLine = text.indexOf("\n") >= 0 && animType != 4;
 

            if(  newLineStart  && animType != 4){  
                //we fix text-base-line to center...  
                if( rowIndex > 0 )
                    ctx.translate(0, this.line2height[rowIndex-1]/2);
                ctx.translate(- _xoffset, this.line2height[rowIndex]/2);
                _xoffset = 0;
                newLineStart = false;
            }

            if( isNewLine ) newLineStart = true;

            if ( style ){ 
                ctx.save();
                style.width = width;
                style.height = this.line2height[rowIndex];

                this._setCurTexTStyle( style ); 
                if( style.iconName){
                    var imge  = this.getProject().getCacheImageByName(style.iconName);
                    if( imge ){
                        var iconwh = this._getTextSize("xx").width;
                        var iconxof = Math.max(0, (width - iconwh)/2 );
                        //  var iconyoff = Math.abs((style.height - iconw)/2);
                        ctx.translate(iconxof, -iconwh/2);
                        var params =  [imge,   0, 0, 32, 32, 0, 0, iconwh, iconwh];
                        ctx.drawImage.apply(ctx, params); 
                        ctx.translate(-iconxof, iconwh/2);
                        hasMedia = true;
                    } 
                }
                
                var fillcolorStr =  this._style.getFillColor().toCSS();
                var strokecolorStr = this._style.getStrokeColor().toCSS();
                if( paintBorderOnly ){
                    fillcolorStr= 'rgba(0,0,0,0)';
                }
            
                if ( style.stroke ){
                    //this._defaultStroke = this.getStroke();
                    ctx.strokeStyle = style.stroke  ;
                    ctx.fillStyle =   style.stroke  ;
                } else if ( this._defaultStroke ) {
                    ctx.strokeStyle = this._defaultStroke ;
                    ctx.fillStyle =  this._defaultStroke  ;
                } else {
                    ctx.strokeStyle =  strokecolorStr ;
                    ctx.fillStyle = fillcolorStr  ;
                }
            
            
                if ( style.fontFamily )
                    this._curFF = style.fontFamily;
                else
                    this._curFF = this._getFontFamily();
            
            
                if ( style.sup )
                    ctx.translate(0, - style.height /3);
                if ( style.sub )
                    ctx.translate(0, + style.height /3);
            

                var strokeAlpha = this._style.getStrokeColor().alpha;
                var fillAlpha = this._style.getFillColor().alpha;
                if( paintBgText) { 
                    this._style.getStrokeColor().alpha = 0.3;
                    ctx.strokeStyle = strokecolorStr;   
                    this._style.getFillColor().alpha = 0.3;
                    ctx.fillStyle = fillcolorStr;   
                }
                ctx.font = this._getContextFont();
                 
                if( style.math ){   
                    var tXoff =  Math.max(0, (width - style.math.w)/2 );
                    var tYoff = - style.math.h /2;
                    r9_drawMathForm.call(this, style.math, tXoff, tYoff,
                        ctx, fillcolorStr, strokecolorStr); 
                    hasMedia = true; 
                }
                
                this.partialText = hasMedia ? "" : text;
                if( paintBorderOnly ){ 
                    this.strokeWidth(1),
                    this._strokeFunc(ctx);
                  //  ctx.fillStrokeShape(this);
                } else {
                    this._strokeFunc(ctx); 
                   // ctx.fillStrokeShape(this);
                }
                ctx.restore();
                ctx.lineWidth = 1;
                if( paintBgText) {
                    this._style.getStrokeColor().alpha = strokeAlpha;
                    this._style.getFillColor().alpha = fillAlpha;
                }

                if ( isNewLine ){ 
                    rowIndex ++;
                } else {
                    ctx.translate(width, 0);
                    _xoffset += width;
                }
            
            } else {  //end-style 
                 ctx.save();
                if (this.align ===  TextItem.RIGHT) {
                    ctx.translate(totalWidth - width - pX * 2, 0);
                } else if (this.align ===  TextItem.CENTER) {
                    ctx.translate((totalWidth - width - pX * 2) / 2, 0);
                }
                this._curFF = this._getFontFamily();
                var strokeAlpha = this._style.getStrokeColor().alpha;
                var fillAlpha = this._style.getFillColor().alpha;
               
                if( paintBgText) {
                    this._style.getStrokeColor().alpha = 0.3;
                    ctx.strokeStyle = this._style.getStrokeColor().toCSS();   
                    this._style.getFillColor().alpha = 0.3;
                    ctx.fillStyle = this._style.getFillColor().toCSS();   
                } else {
                    ctx.strokeStyle = this._style.getStrokeColor().toCSS(); 
                    ctx.fillStyle = this._style.getFillColor().toCSS();   
                }
                this.partialText = text;
                this._strokeFunc(ctx);
               // ctx.fillStrokeShape(this);  
                ctx.restore(); 
                if( paintBgText) {
                    this._style.getStrokeColor().alpha = strokeAlpha;
                    this._style.getFillColor().alpha = fillAlpha;
                }
                if( isNewLine ){
                    rowIndex ++;
                }
            }
        }
        if( !paintAll ){
            if( glow )
            this._drawGlow(ctx, 0,0);
            this._drawPenFunc(ctx, 0,0);
        }
        ctx.restore();
        if( this.correct != 0){
            var cimge  = this.getProject().getCacheImageByName(this.correct > 0 ?"r9correct" : "r9wrong");
            if( cimge ){
                var params =  [cimge, this.getWidth()-28, this.getHeight()-24, 22, 22];
                ctx.drawImage.apply(ctx, params); 
            }
        }
        if( this.selected  ){ 
            ctx. strokeStyle ='rgba(255,0,0,1)';
            ctx.beginPath(); 
            ctx.rect(0, 0, this.getWidth(), this.getHeight());
            ctx.closePath();
            ctx.stroke(this);
        } 
    },
    needToPaint: function(){
        var duration = this.duration , content = this._content ,  total = content.length; 
        return duration > 0 ? Math.ceil(total * this.progress ) : total;
    },
    getKaraokaTextWidth: function(){
        if(! this._karaokaTextWidth )
            this._karaokaTextWidth = this._calculateTextWidth(this._content);
        return this._karaokaTextWidth;
    },
    kalaokoffset: function(){
        var duration = this.duration , content = this._content , animType = this.animType , total = content.length;  
        if( animType != 'karaoka' ) return 0;
        var fullTextWidth =  this.getKaraokaTextWidth(), window_w = this.getKaraokaWidth(); 
        
        return duration > 0 ?   (fullTextWidth +  window_w ) * (1-this.progress) - window_w : - fullTextWidth; 
    },

    _draw2 : function(ctx) {
        var animType = this.animType, needToPaint = this.needToPaint(), duration = this.duration, content = this._content
        ,    expression = this.expression ; 
       
        if( expression ){
           this. _setText( eval( expression ) );
           var  r9vs = this.partialText;
            var r9v = Number(r9vs);
            if( !Number.isNaN( r9v) ){
                 r9vs = r9v.toFixed(this.fixed);
                 r9v = parseFloat(r9vs);
                  this. _setText( r9v + "");
            } 
           this._sceneFuncImpl(ctx, false, false);
           return;
        }
        if( (  animType == 0 || duration <= 0 ) && (animType != 'karaoka')){
            this. _setText(  content); 
            this._sceneFuncImpl(ctx, false, false);
            return;
        }
        if(  animType== 'karaoka' ){ 
            var kalaokoffset = this.kalaokoffset(), kalaoktextwidth = this.getKaraokaTextWidth(); 
            if( kalaokoffset > 0 ){
                var w_width =  this.getKaraokaWidth() || this.getWidth();
                var  diff =   w_width - kalaokoffset;
                if( diff <= 0 ){
                     //this. _setText( "" );
                     return;
                } else {
                    var showStr = parseInt(content.length * diff / kalaoktextwidth);
                    this. _setText(content.substr(0, showStr));
                } 
            } else {
                var  diff = - kalaokoffset;
                if( diff >= kalaoktextwidth)  return; // this. _setText( "" );
                else {
                    var showStr = Math.ceil(  content.length * diff / kalaoktextwidth );
                    this. _setText(content.substr(showStr));
                } 
            }  
            this._sceneFuncImpl(ctx, false, false);
            return;
        }
        if( animType == 'underline' ){
            this. _setText(content);
         //   this._setTextData();
            this._sceneFuncImpl(ctx, false, false);
            this.drawunderline = true;
            if( needToPaint > 0){  
                this. _setText(content.substr(0, needToPaint+1));
             //   this._setTextData();
                this._sceneFuncImpl(ctx, false, false);
                this.drawunderline = false;
            }
            return;
        }
        if ( animType == 'manim'  &&  needToPaint < content.length ){
            if( needToPaint > 0){  
                this. _setText(content.substr(0, needToPaint == 1? 1 : ( needToPaint == 2 ? 3 : needToPaint+3)));
               // this._setTextData();
                this._sceneFuncImpl(ctx, false, true); 
                this. _setText(content.substr(0, needToPaint == 1 ? 0 : needToPaint));
              //  this._setTextData();
                this._sceneFuncImpl(ctx, false, false); 
            }
            return;  
        }
     
          
        if ( animType == 'rewriting'  &&  needToPaint < content.length ){
            this. _setText(content);
         //   this._setTextData();
            this._sceneFuncImpl(ctx, true, false);
        }
        if( needToPaint > 0 ){  
          //  ctx.strokeStyle = this._style.getStrokeColor();   
         //   ctx.fillStyle = this._style.getFillColor();   
            this. _setText(content.substr(0, needToPaint+1));
         //   this._setTextData();
            this._sceneFuncImpl(ctx, false, false);
        }
    },
    
    _setText : function(text) {
        var str = CoreUtils._isString(text) ? text : text.toString();
        if( str == this.partialText ) return;
        this.partialText = str;
        this._setTextData();
        return this;
    },

    changeStyle : function(styleName) {
        var mstyles = this.mstyles();
        if( typeof mstyles == 'undefined' )
            return;
        
        for(var i in mstyles){
            if( CoreUtils._r9norm(mstyles[i].name) == CoreUtils._r9norm(styleName) ){
                this.r9textstyle =  mstyles[i].style  ;
                this._content = CoreUtils._r9norm(mstyles[i].text) ; 
                break;
            }
        } 
    },

    getMathInput : function() {
        var r9textstyle = this.r9textstyle ;
        if( r9textstyle && r9textstyle.length == 2 && r9textstyle[1].math)
            return r9textstyle[1].math;
        if( r9textstyle && r9textstyle.length == 1 && r9textstyle[0].math)
            return r9textstyle[0].math;
        return null; 
    },


    _progress_imp : function(progress, options) {
        var duration = this.duration  ;
        this.setProgress( progress / duration );  
    },
      
    _strokeFunc : function(ctx) { 
        ctx = ctx || this.getView()._context;
        var lh = this._getLineHeightPx( );
        if( this.drawunderline ){  // 
             ctx.save();
            ctx.font = this._getContextFont();
            ctx.beginPath();
            ctx.moveTo(0,  lh/3);
            ctx.lineTo(this._calculateTextWidth(this.partialText), lh/3);
            ctx.stroke();
            ctx.restore();
            return;
        }
        ctx.lineWidth = 1;
        if( this.animType == 'manim' && this.partialText != this._content )
            ctx.strokeText(this.partialText, 0, 0);
        // if( this.animType  == 'manim2' && this.partialText != this._content ){ // && this.gend != 0 ){
        //    var offx6 = 0;
        //    ctx.save();
        //    ctx.strokeText(this.partialText, offx6, 0);
        //    ctx.fillText(this.partialText, offx6, 0); 
           
        //    if( this.partialText.length < this._content.length -1 ){
        //         if( this.effectColor ){
        //             ctx.fillStyle = this.effectColor;
        //             ctx.strokeStyle = this.effectColor; 
        //             ctx.shadowColor =  this.effectColor;
        //         } else {
        //             ctx.shadowColor =  this._style.getFillColor().toCSS();
        //         } 
        //         ctx.shadowOffsetX = 0;
        //         ctx.shadowOffsetY = 0;
        //         ctx.shadowBlur = 5; 
        //         var wh6 = lh;// this.textHeight *.75;
        //         offx6 = this._getTextSize(this.partialText).width;
        //         ctx.translate(0,-wh6/2  );
        //         for(var i = 0; i < 16; i++){
        //             var x0 = Math.random() * wh6 *2;
        //             var y0 = Math.random() * wh6;
        //             ctx.beginPath(); 
        //             ctx.rect(offx6 + x0, y0,  wh6 * 0.2, wh6*0.25);
        //             ctx.closePath();
        //             ctx.fill( ); 
        //         } 
        //      }
         
        //      ctx.restore();
        //      return;
        // }
        ctx.fillText(this.partialText, 0, 0);
        
        if ( ! this._curStyle )
            return;
        if ( this._curStyle.u ){
            ctx.beginPath();
            ctx.moveTo(0,   lh /3);
            ctx.lineTo(this._curStyle.width, lh/3);
            ctx.stroke();
        } 
        if ( this._curStyle.strike ){
            ctx.beginPath();
            ctx.moveTo(0,    0);
            ctx.lineTo(this._curStyle.width,   0);
            ctx.stroke();
        } 
    },
    _drawPenFunc : function(ctx, x, y ) {
        var pen  = this.penImageName ;
        if( pen && pen.length > 0 ){
         var imge  = this.getProject().getCacheImageByName(pen);
         if( imge ){ 
              ctx.translate(x - imge.width/2, y + 10 );
              var params =  [imge, 0, 0, imge.width, imge.height];
              ctx.drawImage.apply(ctx, params);
              ctx.translate(-x + imge.width/2, -y - 10 );
         } 
        }
    }  
});
/**
 * @name LabeledDot
 *
 * @class The LabeledDot  
 * 
 * Parameters:
 *    
 *
 * @extends StyledText
 */
var LabeledDot = StyledText.extend(/** @lends LabeledDot# */{
    _class: 'LabeledDot', 
      
    initialize: function LabeledDot(props) {
        StyledText.apply(this, arguments)
        this.bgColor = this.bgColor || this.fillColor || 'white';
        this.borderColor = this.borderColor || this.strokeColor || 'black';  
    },
    useNextSymbol: function(){
        this.content = RU.nextSequenceSymbol(this.content || 'A');
    },
    _getBounds: function(matrix, options) {
        // if( this.textWidth == 0 ){
        //     var style = this._style, 
        //     lines = (this._content ).split(/\r\n|\n|\r/mg),
        //     numLines =  lines.length, 
        //     leading = style.getLeading(),
        //     padding  = this.padding || 0,
        //     px = this.getPaddingX(), py = this.getPaddingY(),
        //     w = this.getView().getTextWidth(style.getFontStyle(), lines) + px + px,
        //     h = numLines * leading + py + py,
        //     radius = Math.sqrt(w* w + h*h) ;
        //     this.textXOffset = (radius -w)/2;
        //     this.textYOffset = (radius -h)/2;
        //     this.radius = radius/2;
        //     var rect = new Rectangle(0, 0, radius+padding*2, radius+padding*2);  
        //     return matrix ? matrix._transformBounds(rect, rect) : rect;  
        // } else {
            var w = this.textWidth , h = this.textHeight,     padding  = this.padding || 0,
               radius = Math.sqrt(w* w + h*h);
            this.textXOffset = (radius -w)/2;
            this.textYOffset = (radius -h)/2;
            this.radius = radius/2;
            var rect = new Rectangle(0, 0, radius+padding*2, radius+padding*2);  
            return matrix ? matrix._transformBounds(rect, rect) : rect;  
     //   }  
    },
    _drawBackground : function(ctx){
        var w = this.getWidth(), h = this.getHeight(), 
         bc = this.borderColor, bgc = this.bgColor,
         bw = this.borderWidth,  padding = this.padding || 0, radius = this.radius || Math.sqrt(w* w + h*h)/2;

       ctx.save();   
        if( bw ) ctx.lineWidth = bw;
        ctx.fillStyle = bgc;
        ctx.strokeStyle = bc;
     //    if( this.opacity < 1 ){   //FIXME ... not sure why animation of opacity does not work here..
     //        var w = Math.max(width, height);
     //        RU.r9_drawRounded(ctx, 0,0, w, w, w/2); 
    //     } else { 
             ctx.beginPath();
             ctx.arc(w/2, h/2, radius + padding , 0, 360); 
    //     } 
        if( bgc )     ctx.fill(); 
        if( bc )   ctx.stroke(); 
         ctx.restore();  
    },
});