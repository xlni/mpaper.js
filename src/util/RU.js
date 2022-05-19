/**
 * migrated from R9 source code. mainly from r9geom.js
 *   used to render math in format defined in R9 mathop.
 * 
 * 
 * ImageTransitionUIType
 *   ITT_BOX_INSITU(0, "方块-原位"), IIT_BOX_RANDOM(1,"方块-随机"),IIT_BOX_TLBR(2,"方块-左上到右下"),
        ITT_BOX_LTR(3,"方块-左到右"), ITT_BOX_RTL(4,"方块-右到左"), ITT_BOX_TTB(5,"方块-上到下"), ITT_BOX_BTT(6,"方块-下到上"),
        ITT_STRIPE_HOR(7,"百叶窗－竖条"), ITT_STRIPE_VER(8,"百叶窗－横条"),ITT_RANDOM(9, "随机选择"), 
        ITT_GATHER(10, "聚散"), ITT_Winding(11, "");
        ITT_NONE(12, "不使用"), ITT_DELAY(13, "滞后删除"),  ITT_FLIPBOARD(14, "折叠翻页"),
        ITT_PAGETURN(15, "翻转翻页"),    

    type:
     in_situ 0
     box_random 1
     box_tlbr 2 
     box_ltr 3
     box_rtl 4
     box_ttb 5
     box_btt 6
     blinder_h 7
     blinder_v 8
     random 9
     particle 10
     winding 11
     none 12
     delay
     flipboard 14
     page_turn 15
 */ 
 var RU = new function() {
     //
     var Ani_Types = [
        'in_situ',
        'box_random',
        'box_tlbr', 
        'box_ltr',
        'box_rtl' ,
        'box_ttb' ,
        'box_btt' ,
        'blinder_h' ,
        'blinder_v' ,
        'random' ,
        'particle' ,
        'winding' ,
        'none' ,
        'delay',
        'flipboard' ,
        'page_turn',
     ];
     var project;
     function shuffle0(arr) {
         let curInx = arr.length,  ranInx; 
         while (curInx != 0) { 
           ranInx = Math.floor(Math.random() * curInx);
           curInx--; 
           [arr[curInx], arr[ranInx]] = [arr[ranInx], arr[curInx]];
         } 
         return arr;
     }
     function guessSize(kiw){
         if ( kiw >= 800 ) return 20;
         else if ( kiw > 600 ) return 20;
         else if  (kiw > 400 ) return 20;
         else if  (kiw  > 200 ) return 20;
         else if  (kiw > 50 )  return parseInt(kiw / 10)
         else if  (kiw > 20 )  return parseInt(kiw / 5)
         else if  (kiw > 4 )  return parseInt(kiw / 4)
         return 1;
     }
     function getImageBoxes(kimage, boxCols, boxRows){
         if (!kimage )  return []; 
         var  kiw = kimage.bounds.width, kih = kimage.bounds.height;
         boxCols = boxCols || guessSize(kiw); boxRows = boxRows || guessSize(kih);
          
         var boxList = [];
         var boxWidth = Math.round(kiw/boxCols),  boxHeight = Math.round(kih/boxRows), nimage;
          
         for(var rows = 0; rows < boxRows; rows++){
             for(var cols = 0; cols < boxCols; cols++){
             //    var nimage =  kimage.getSubRaster(new Rectangle(cols*boxWidth, rows*boxHeight, boxWidth, boxHeight)); 
                 nimage = new CroppedImage(kimage, cols*boxWidth, rows*boxHeight, boxWidth, boxHeight);
                 boxList.push(nimage);
             }
         }
         return {list : boxList, width: boxWidth, height: boxHeight, boxRows: boxRows, boxCols: boxCols};
     }
  
     function getImageStrips (kimage, horizontal){
         if (!kimage )    return [];
         var boxWidth,boxHeight, boxList = [];
         var  kiw = kimage.bounds.width, kih = kimage.bounds.height,
           kiw = horizontal ? kiw : kih, boxCols = 8;
         if ( kiw >= 800 ) boxCols = 40;
         else if ( kiw > 600 ) boxCols = 35;
         else if  (kiw > 400 ) boxCols = 25;
         else if  (kiw  > 200 ) boxCols = 16;
         
         if ( horizontal ){ 
             boxWidth = Math.round(kiw /boxCols),
             boxHeight = Math.round(kih) ; 
             if( Math.random() > 0.3 ){
                 var curx = 0, curw = 2, fright = Math.random() > 0.5;
                 if( fright ) curx = kiw - curw;
                 while( curx <  kiw  && curx >= 0 ){ 
                     curw +=1;
                     if(! fright ){
                         if( curx + curw > kiw){
                             curw = kiw - curx;
                         }
                     }
                    // var nimage =  kimage.getSubRaster(new Rectangle(curx, 0, curw, boxHeight));  
                     var nimage = new CroppedImage(kimage, curx, 0, curw, boxHeight);
                     boxList.push(nimage);
                     if( fright ){
                         if( curx > 0 && curx < curw ){
                             curw = curx;
                             curx = 0;
                         } else {
                             curx -= curw;
                         }
                     } else
                         curx += curw; 
                 }
             } else { 
                 for(var cols = 0; cols < boxCols; cols++){
                     var adjusted_w = cols ===  boxCols-1 ? kiw -boxWidth*cols : boxWidth;
                    // var nimage =  kimage.getSubRaster(new Rectangle(boxWidth*cols , 0, adjusted_w, boxHeight));  
                     var nimage = new CroppedImage(kimage, boxWidth*cols , 0, adjusted_w, boxHeight);
                     boxList.push(nimage); 
                 }
             } 
             
         } else {
             boxRows = boxCols;
             kiw = kimage.bounds.width
             boxWidth = Math.round(kiw),
             boxHeight = Math.round(kih/boxRows);
             for(var rows = 0; rows < boxRows; rows++){
                 var adjusted_h = rows ===  boxRows-1 ? kih - boxHeight*rows : boxHeight;
               //  var nimage =  kimage.getSubRaster(new Rectangle(0, boxHeight*rows,boxWidth,adjusted_h));  
                 var nimage = new CroppedImage(kimage, 0, boxHeight*rows,boxWidth,adjusted_h);
                 boxList.push(nimage); 
             }
         } 
         if( horizontal )
            return {list : boxList, width: boxWidth, height: boxHeight, boxRows: 1, boxCols: boxCols};
          else
            return {list : boxList, width: boxWidth, height: boxHeight, boxRows: boxCols, boxCols: 1};
     }
     /**
      * 
      * @param {*} layer if layer is null, invoke animation directly, do not put it into page's timeline
      * @param {*} item 
      * @param {*} duration 
      * @param {*} transType 
      * @param {*} easing 
      * @param {*} positionFunc 
      * @param {*} isCreation 
      * @param {*} callback 
      * @param {*} sentToBackOnFinish 
      */
     function handleImageTrans(layer, item, duration, transType, easing, positionFunc, isCreation, callback , sentToBackOnFinish){ 

        var timeline = layer ? layer.getCurPage().ptimer :  anime.timeline({ autoplay: false  }),
             boxWidth= item.bounds.width, boxHeight = item.bounds.height; 
        var isRaster = item instanceof Raster;
        var kimage = isRaster ? item :  item.rasterize();
          
        if( !isRaster ){
               //remove item at begining
          if( isCreation )
            item.setShowHide(false);
          else
            item.remove(); //delete   
        }  
         
        if( callback && callback.onStart ){
            callback.onStart();
        } 
        
        var newCallback = {};
        newCallback.onSuccess = function( ) { 
            if( isCreation   ){ /** creating for background */ 
                item.setShowHide(true);
                if( sentToBackOnFinish  ){
                    item.sendToBack(); //FIXME? if item is a group?
                }
                if(!isRaster){
                    kimage.remove();
                }
            } else {
                kimage.remove();
                item.remove();
            }
            if( callback && callback.onEnd ){
                callback.onEnd();
            } 
        };   
       
        if ( isCreation ){ 
      //      kimage.opacity = 0.1; 
         }else {
      //      kimage.opacity = 1;
         } 

        if( transType == 15 ){ 
            var tweenwrap = { 
                targets: kimage, 
                'bounds.width' : isCreation ? boxWidth :  1, 
                'bounds.height' : isCreation ? boxHeight :  1, 
                position: kimage.position.clone(),
                complete: function() { 
                    newCallback.onSuccess(true);
                } ,
                easing: easing,
                duration: duration, 
            };
            
            if ( isCreation ){
                tweenwrap.position = kimage.position.clone();
                kimage.position  = kimage.position.__add(new Point(50, 200));
                kimage.bounds.width = 1;
                kimage.bounds.height /=2;
            } else {
                tweenwrap.position  =  kimage.position.__subtract(new Point( 50,  200));
                kimage.position = kimage.position.clone(); 
            }
            if(typeof positionFunc == 'function') { 
                tweenwrap.positionFunc = positionFunc;
            } else {
                tweenwrap.positionFunc = function(from, to, curpos, easing){
                    return new Point(curpos.x+ Math.sin( Math.PI/2 *easing ) * 50 * (1-easing), curpos.y );
                }
            }  
            timeline.add(tweenwrap) ;
        } 
        if(! layer ) 
            timeline.play();
    }

    /**
     * 
     * @param {*} layer if layer is null , invoke animation immediately, (do not put it into page's timeline)
     * @param {*} item 
     * @param {*} duration 
     * @param {*} transType 
     * @param {*} easing 
     * @param {*} positionFunc 
     * @param {*} isCreation 
     * @param {*} callback 
     * @param {*} sentToBackOnFinish 
     * @returns 
     */
     function imgBoxEffect(layer, item, duration, transType, easing, positionFunc, isCreation, callback , sentToBackOnFinish){ 

         var boxList, boxWidth,boxHeight, boxRows, boxCols, result,  
             timeline = layer ? layer.getCurPage().ptimer : anime.timeline({ autoplay: false  });;  
         var isRaster = item instanceof Raster;
         var kimage = isRaster ? item :  item.rasterize();
         if( transType == 9 ) transType = Math.floor(Math.random() * 9);

         if ( transType < 7 || transType == 10 || transType == 11 ){
             result = getImageBoxes(kimage);
         } else if (  transType == 7 || transType == 8 ){
             result = getImageStrips(kimage, transType == 7);
         }   else { 
             return;
         } 
           //remove item at begining
           item.setShowHide(false);
           if( !isCreation ) {
               item.remove(); //delete 
           }
              
           if(! isRaster ){
               kimage.setShowHide(false);
               kimage.remove();
           }
               
 
         if( callback && callback.onStart ){
             callback.onStart();
         } 
         boxList = result.list;
         boxWidth = result.width;
         boxHeight = result.height;
         boxRows = result.boxRows;
         boxCols = result.boxCols;
         
         var size = boxList.length;
         var tweens = [];
         var finished = false;
         
         
         var newCallback = {};
         newCallback.onSuccess = function(removenimages) {
             size --; 
             if (!finished && size <= 0 ){ // console.log("done animation");
                 finished = true;
                 if( isCreation   ){ /** creating for background */ 
                     item.setShowHide(true);
                     if( sentToBackOnFinish  ){
                         item.sendToBack(); //FIXME? if item is a group?
                     }
                 } else {
                  //   item.setShowHide(false);
                 }
                 if( callback && callback.onEnd ){
                     callback.onEnd();
                 }
                 if(removenimages){
                     for( var b = 0; b < boxList.length; b++){
                         var nimage = boxList[b];
                          nimage.visible = false;
                          nimage.remove();
                     }
                 }
             }
         };  
         
         for( var b = 0; b < size; b++){
             var nimage = boxList[b]; 

             if( transType == 7 ){ 
                var tweenwrap = {   targets: nimage, 
                    'bounds.width' : isCreation ? boxWidth :  1, 
                    position: nimage.position.clone(),
                    complete: function() { 
                        newCallback.onSuccess(true);
                    } ,
                    easing: easing,
                    duration: duration, 
                };
                if ( isCreation ){
                    nimage.position.x -= nimage.bounds.width/2;
                    nimage.bounds.width = 1; 
                } 
                tweens.push(   tweenwrap );
                continue;
             }
             if( transType == 8 ){ 
                var tweenwrap = {   targets: nimage, 
                   'bounds.height' : isCreation ? boxHeight :  1, 
                    complete: function() { 
                        newCallback.onSuccess(true);
                    } ,
                    easing: easing,
                    duration: duration, 
                };
                if ( isCreation ){
                    nimage.position.y -= nimage.bounds.height/2;
                    nimage.bounds.height = 1; 
                } 
                tweens.push(   tweenwrap );
                continue;
             }

             if ( isCreation ){ 
                nimage.opacity = 0.1; 
             }else {
                nimage.opacity = 1;
             } 
             var tweenwrap = {   targets: nimage,
                 opacity :  isCreation ? 1 : 0.1 , 
                 complete: function() { 
                     newCallback.onSuccess(true);
                 } ,
                 easing: easing,
                 duration: duration, 
             };
             if ( transType == 10 ){
                if ( isCreation ){
                    tweenwrap.position = nimage.position.clone();
                    nimage.position  = nimage.position.__add(new Point(nimage.bounds.width * 25 * (0.5- Math.random() ), nimage.bounds.height * 25 * (0.5- Math.random() )));
                } else {
                    tweenwrap.position  = nimage.position.__add(new Point(nimage.bounds.width * 25 * (0.5- Math.random() ), nimage.bounds.height * 25 * (0.5- Math.random() )));
                    nimage.position = nimage.position.clone(); 
                }
              }
              if ( transType == 11 ){
                if ( isCreation ){
                    tweenwrap.position = nimage.position.clone();
                     nimage.position  = nimage.position.__subtract(new Point(200, 50));
                 } else {
                     tweenwrap.position  =  nimage.position.__add(new Point( 200,  50));
                     nimage.position = nimage.position.clone(); 
                }
                tweenwrap.positionFunc = positionFunc || true; 
              } 
              if( positionFunc && transType != 11 ){ 
                if( typeof tweenwrap.position === 'undefined' ){
                    if ( isCreation ){
                        tweenwrap.position = nimage.position.clone();
                         nimage.position  = nimage.position.__subtract(new Point(100, 50));
                     } else {
                         tweenwrap.position  =  nimage.position.__add(new Point( 100,  50));
                         nimage.position = nimage.position.clone(); 
                    }
                }
             }
             tweens.push(   tweenwrap );
         }
           
         if ( transType ==  0 || transType == 7 || transType == 8 || transType == 10 ){
             tweens.forEach(e => {  timeline.add(e, 0)  ; } ); 
         } else if ( transType == 1){ /**  box random */
             shuffle0(tweens);
             var toffset = 0, step = 2.0 / tweens.length;
             for( var i = 0; i < tweens.length; i++){
                 timeline.add(tweens[i], toffset) ; 
                 toffset +=  step;
             } 
         } else if ( transType ==  2){ /** box topleft to bottomright */
               TL2BR1(timeline, tweens, 0, boxRows, boxCols);
         } else if ( transType == 3 || transType == 5  ){ /**  box topleft to bottomright */
               _one_dir(timeline, duration, tweens, 0, transType - 3, boxRows, boxCols);
         } else if ( transType == 11){ /**  box topleft to bottomright */
            _one_dir(timeline, duration, tweens, 0, 0, boxRows, boxCols);
         }  else if ( transType ==4 || transType ==6 ){  /**  box topleft to bottomright */
                var startPos = transType == 4 ? boxCols -1 : boxRows -1;
               _one_dir(timeline, duration, tweens, startPos, transType - 3, boxRows, boxCols);
         }

         if(! layer )
            timeline.play(); 
     }
      
     function  TL2BR1(timeline, tweens, colIndex, boxRows, boxCols){  
         var toffset = 0;
         while ( colIndex <   boxCols -1 ){
             for(var col  = 0; col <= colIndex; col++ ){
                 var row = colIndex - col;
                 var index = row * boxCols + col;
                 if (index < tweens.length ){
                     var tween  = tweens[index];
                     timeline.add(tween, toffset) ;
                 }
             }
             colIndex ++;
             toffset += 0.1;
         }
        // timeline.play();
         if ( colIndex >= boxCols -1 ) {   TL2BR_2(timeline, tweens,0, boxRows, boxCols);  }
     }
     function  TL2BR_2(timeline, tweens, rowIndex, boxRows, boxCols){ 
         var toffset = 0;
         while ( rowIndex < boxRows -1 ){
             for(var row  = rowIndex; row < boxRows; row++ ){
                 var col = boxRows - 1 + rowIndex - row;
                 var index = row * boxCols + col;
                 if (index < tweens.length ){
                     var tween  = tweens[index];
                     timeline.add(tween, toffset) ;
                 }
             }
             rowIndex ++;
             toffset += 0.1;
         } 
       //  timeline.play();
     }
     //direction: 0-1  horizontal,  2-3, vertical
     function  _one_dir(timeline, duration, tweens, curIndex, direction, boxRows, boxCols){ 
         var is_hor = direction == 0 ||  direction == 1 ;
         var nextIndex = curIndex;
         var needPlays = [], needTargets = []; 
         var toffset = 0;
         while( nextIndex >=0 && ( (is_hor && nextIndex < boxCols) ||( !is_hor && nextIndex < boxRows  ) )){
             needPlays = []; 
             if ( is_hor ){ /** left to right */ 
                 for(var row  = 0; row < boxRows; row++ ){
                     var index = row * boxCols + nextIndex;
                     if (index < tweens.length ){
                         needPlays.push( tweens[index] ); 
                     }
                 }
                 nextIndex =  direction == 0 ? nextIndex + 1 : nextIndex - 1  ;
             } 
             else { /**  up down   ( direction == 2 || direction == 3) */ 
                 for(var col  = 0; col < boxCols; col++ ){
                     var index = nextIndex * boxCols + col;
                     if (index < tweens.length ){
                         needPlays.push( tweens[index] ); 
                     }
                 }
                 nextIndex = direction == 2 ? nextIndex + 1 : nextIndex - 1  ;
             }
             if( needPlays.length == 0 ) continue; 
         //    timeline.add(needPlays[0], toffset) ; 
            for( var i = 0; i < needPlays.length; i++)
               timeline.add(needPlays[i], toffset) ;
             //  timeline.add(needPlays[i], "-=" + (duration) + "") ;  
          //   timeline.play();
            toffset += Math.max(0.2, duration / (is_hor? boxCols : boxRows));
         } 
     }

     function showTempObj(cly, timeline, rect, duration){
        var callback = function(){
            rect.remove(); 
        }
        cly.createItems(timeline, {
            targets: rect,
            type: 'Write', 
            duration: duration,
        },
        undefined, 
        callback
        );
     } 
     function doHomotopy(timeline, item, homotopy, duration, offset, doneCallback){
        var isRaster = item instanceof Raster;
        var kimage = isRaster ? item :  item.rasterize();
        var result = getImageBoxes(kimage), boxList = result.list, blen = boxList.length, started = false;
        timeline.add({
            targets : item,
          //  begin: function(){
         //       started = true;
         //       boxList.forEach(e => { item._project._activeLayer.addChild(e); });
         //   }.bind(this),
            progressFunc : function(progress){
                if(!started) {
                    started = true;
                    boxList.forEach(e => { item._project._activeLayer.addChild(e); }); 
                };
                   var t  =  progress * duration, box,pos, r;
                   for(var i = 0; i < blen; i++){
                        box = boxList[i];
                        pos = box.position;
                        r = homotopy(pos.x, pos.y, t);
                        box.position = new Point(r[0], r[1]);
                   }
            }.bind(this),
            duration : duration,   
            complete: function(){
                if( doneCallback ) doneCallback();
                boxList.forEach(e => { e.remove(); });
            }.bind(this)
          }, offset);
     } 


     return {
         setProject: function(p){
            project = p;
         },
         shuffle: function(arr){
              return shuffle0(arr);
         },
         handleSeveralTargets: function(items, duration, offset, callback){ 
            if( Array.isArray( items )){
                if( typeof offset != 'undefined' && offset != '=='){
                    duration = duration * 1.0 / items.length; 
                }  
                callback( items[0], duration, offset);
                if( typeof offset == 'undefined' || offset == '=='){
                    offset = '==';
                }  
                for(var i = 1; i < items.length; i++)
                    callback( items[i], duration, offset); 
            } else {
                callback( items, duration, offset);
            } 
        },
        handleTargets : function(params, offset, callback){
            var that = this,  items = params.target || params.targets, duration = params.duration || 1,
                offset = params.delay || offset ; 
            this.handleSeveralTargets(items, duration, offset, function(item, duration, offset){
                var options = Base.set({}, params);
                delete options.target; delete options.targets;
                options.target = item;
                options.duration = duration;
                callback(options, offset);
            });  
        },

        /**
         * 
         * @param {*} layer 
         * @param {*} item 
         * @param {*} duration 
         * @param {*} callback 
         */
        handleDelayedDelete: function( layer, item, duration, callback ){
            if( layer ){
                var timeline =   layer.getCurPage().ptimer;
                timeline.add({
                   target : item,
                   eventFunc : function(){
                        item.remove();  
                        if( callback && callback.onEnd ){
                            callback.onEnd();
                        }
                   }    
                }, '+=' +duration);
            } else {
                setTimeout(function(){    
                    item.remove();  
                    if( callback && callback.onEnd ){
                        callback.onEnd();
                    }
                },duration);  
            } 
         },
         /**
          * 
          * @param {*} layer 
          * @param {*} item  it maybe a image , if it is not an image, system will create a temperay 
          * @param {*} duration in seconds.
          * @param {*} transType  valid value [0-8] and 13, 10, 11
          * @param {*} easing easing type supported by anime.js  
          * @param {*} positionFunc  it is used to control the moving path for tween.
          *       api is :  function(from, to, curpos, easing){  
          *                     return calculated position for item.
          *                 }
          *       from  is the starting position, to is the ending position, curpos is calculated position for current tween animation.
          *        easing is the value computed by easing function, indicating progress of tween. most time at [0-1]
          * if positionFunc is provided, we should provide position changes for item.
          *    if position change is not provided, system provide a default value. 
          * @param {*} isCreation    creation or disappear
          * @param {*} callback   for start of tween and complete of tween.
          *        {   onStart()   onEnd();  }
          * @returns 
          */
          
         imageEffect2: function(layer, item, duration, transType, easing, positionFunc, isCreation, callback){
            if( typeof transType != 'number' )
               transType = Ani_Types.indexOf(transType)
            if( transType < 0 ) transType = 0;
              if( transType == 13 )  
                this.handleDelayedDelete(layer, item, duration, callback);
             else if ( transType == 15 ) 
                  handleImageTrans(layer, item, duration, transType, easing || 'linear', positionFunc, isCreation, callback);
             else 
                  imgBoxEffect(layer, item, duration, transType, easing || 'linear', positionFunc, isCreation, callback);

           
         },
     
 
         imageFlipEffect: function(layer, removed, added, duration){
            var bd = removed.bounds, 
                img_rmv = removed instanceof Raster ? removed : removed.rasterize(),
                rmv_1 = new CroppedImage(img_rmv,0, 0, bd.width/2, bd.height),
                rmv_2 = new CroppedImage(img_rmv, bd.width/2, 0, bd.width/2, bd.height),
                img_add= added instanceof Raster ? added : added.rasterize(),
                add_1 = new CroppedImage(img_add, 0, 0, bd.width/2, bd.height),
                layer = layer || project._activeLayer;
                timeline =   layer.getCurPage().ptimer;
            removed.remove(); 
            if(!(removed instanceof Raster)) img_rmv.remove();
            if(!(added instanceof Raster)) img_add.remove(); 
        
            
            var p1 = add_1.position.clone(), add_1_w = add_1.bounds.width, opacity = added.opacity;
            added.opacity = 0.01;
            add_1.bounds.width = 0.01;
            add_1.position = p1.__add(new Point(add_1_w/2+2,0))
            timeline.add({
                targets: rmv_2,
                'bounds.width' :   1, 
                position: rmv_2.position.clone().__add(new Point(-bd.width/4, 0)),
                duration: duration/2,
                begin: function(){
                    layer.addChild(rmv_1); 
                },
                complete: function(){
                    rmv_2.remove();
                }
            }) .add({
                targets: add_1,
                'bounds.width' :   add_1_w, 
                position: p1,
                duration: duration/2,
                complete: function(){
                    add_1.remove();
                    rmv_1.remove();
                }
            }).add({
                targets: added, 
                opacity: opacity,
                duration: duration 
            }, '-=' + duration) ; 
         },

         handleImageBgTransition : function( alay, kimage, duration, transType, kimage2, duration2, transType2, useForground){
             /** kimage for delete,  kimage2 for add. we treat delay delete separately. */
             var callback = {};
             var count = 2;
             if( typeof transType != 'number' )
                 transType = Ani_Types.indexOf(transType)
             if( transType < 0 ) transType = 0;
             if( !kimage  || transType == 13)
                 count --;
             if( !kimage2 )
                 count --;
             if( count <= 0 )
                 return;
             callback.onStart = function( ) { };
             callback.onEnd = function( ) {
                 count -- ;
                 if( count == 0 ) {
                     if( transType == 13 && kimage){
                         kimage.remove();
                     }
                     if(!useForground && kimage2){
                         kimage2.sendToBack();
                     }
                 }
             };
             if(useForground && kimage2){
                 kimage2.bringToFront();
             }
             if( transType != 13 && kimage) { /** delay delete */
                 imgBoxEffect(alay, kimage, duration, transType, 'linear', null, false, callback);
             }
             if( kimage2 ) {
                 imgBoxEffect(alay, kimage2, duration2, transType2, 'linear', null, true, callback);
             }
         },
          
         tweenSize: function( item, fromBounds, toBounds, duration, easing){ 
                var tweenwrap = {   
                    targets: item,  
                    'bounds.size': toBounds.size, 
                    'bounds.point': toBounds.point, 
                    easing: easing || 'linear',
                    duration: duration, 
                };
                item.bounds.point = fromBounds.point;
                item.bounds.size = fromBounds.size; 
                return tweenwrap;
         },
         tweenPosition: function(  item, fromPos, toPos, duration, easing){
            var tweenwrap = {   
                targets: item,  
                position: toPos, 
                easing: easing || 'linear',
                duration: duration, 
            };
            item.position = fromPos;
            return tweenwrap;
         },

      /**
       * @example
       *   var p = RU.Homotopy({
       *         page : ..
       *         target : ..
       *         homotopy: ... ( optional)   
       *         duration:  optional.
       *            offset optional,
       *          doneCallback optional;
       *   })
       * 
       * @param {*} params 
       */ 
        Homotopy: function(params, offset){
            var that = this;
            this.handleTargets(params, offset, function(params, offset){
                that.homotopy(params, offset);
            });  
        },
        homotopy: function(params){
             var  page = params.page, timeline = page.ptimer, item = params.targets || params.target,
                 homotopy = params.homotopy || function(x,y,t){ return [x,y]; },
                 duration = params.duration, offset = params.delay || params.offset, 
                 doneCallback = params.doneCallback; 
                if( item instanceof Path || item instanceof CompoundPath ||  (typeof item.containsAllPaths == 'function' && item.containsAllPaths(true)) ){
                    item.doHomotopy(timeline, homotopy, duration, offset, doneCallback);
                } else {
                    doHomotopy(timeline, item, homotopy, duration, offset, doneCallback);
                } 
         },
         MorphingTo: function(params, offset){
            var that = this;
            this.handleTargets(params, offset, function(params, offset){
                that.morphingTo(params, offset);
            });  
         },
         morphingTo: function(params, offset){
            var  page = params.page, timeline = page.ptimer, item = params.targets || params.target, 
                duration = params.duration, offset = params.delay || params.offset, to = params.to,
                doneCallback = params.doneCallback; 
            if( typeof item.morphingTo == 'function' ){
                item.morphingTo(timeline, to, duration, offset, doneCallback);
            }  
        },
      /**
       * @example
       *   var p = RU.Flash({
       *         page : ..
       *         target : ..
       *         times: ... ( optional)  if zero or undefined, means loop forever
       *         color_array: [color1, color2] optional.
       *   })
       * 
       * @param {*} params 
       */ 
         Flash: function(params, offset){
            var that = this;
            this.handleTargets(params, offset, function(params, offset){
                that.flash(params, offset);
            });  
         },
         flash : function(params ){
            var  page = params.page, item = params.target || params.targets, times = params.times, color_array = params.color_array;
             times = typeof times == 'undefined' ? 0 : times;
            if( !color_array ){ //for opacity 
                var tweenwrap = {   
                    targets: item,   
                    opacity: 0.1, 
                    duration: 0.5, 
                    direction: 'alternate',
                    loop: times == 0 ? true : times
                }; 
                times ? page.ptimer.add(tweenwrap) : anime(tweenwrap) ;
                return;
            }
            if(  color_array.length == 1 ){  
                var tweenwrap = {   
                    targets: item,   
                    fillColor: color_array[0], 
                    duration: 0.5, 
                    direction: 'alternate',
                    loop: times == 0 ? true : times
                }; 
                times ? page.ptimer.add(tweenwrap) : anime(tweenwrap) ;
                return;
            } 
            var ocolor = item.fillColor, curcolor;
            color_array.push( ocolor ); 
            if( times ){
               for(var k = 0; k < times; k++){
                    for(var i = 0; i < color_array.length; i++){
                        var tweenwrap = {   
                            targets: item,   
                            fillColor: color_array[i], 
                            duration: 0.5, 
                        }; 
                       // if( k == 0 && i == 0)
                       //     page.ptimer.add(tweenwrap,0);
                      //  else
                            page.ptimer.add(tweenwrap);
                    }
               } 
            } else {
                var acc = 0, pos = 0, ncolor ;
                for(var i = 0; i < color_array.length; i++){
                    var c = color_array[i];
                    if( c._class !== 'Color' ) 
                        color_array[i] = new Color( c )
                }
                item.addUpdater(function(event){
                    acc += event.delta *2;
                    if( acc > 0.5 ){ 
                        acc = 0;
                        ocolor = color_array[pos]; 
                        pos = (++pos) % color_array.length; 
                    }
                    ncolor = color_array[pos];
                    item.fillColor = ocolor.add( ncolor.subtract(ocolor).multiply(acc*2)); 
                });
            } 
         },
      /**
       * @example
       *   var p = RU.Indicate({
       *         page : ..
       *         target : ..
       *         times: ... ( optional)  if zero or undefined, means loop forever
       *   })
       * 
       * @param {*} params 
       */
       Indicate: function(params, offset){
            var that = this;
            this.handleTargets(params, offset, function(params, offset){
                that.indicate(params, offset);
            });  
        },
        indicate : function( params, offset){
            var  page = params.page, item = params.target, times = params.times, w = item.bounds.width,
                 h = item.bounds.height, dw, dh ;
            if( w < 20 ) dw = w; else if (w < 100) dw = 20; else if (w < 200 ) dw = 40; else dw = 60;
            if( h < 20 ) dh = h; else if (h < 100) dh = 20; else if (h < 200 ) dh = 40; else dh = 60;

            if( times ){
                var pos = item.position, tweenwrap = {   
                    targets: item,  
                    position: pos, //'+=[0,0]', 
                    easing:  'linear',  
                    update: function(anim){ //console.log( anim.progress)
                        var p =   anim.progress/100  ;
                        item.bounds.width =  w +  Math.abs(Math.sin( Math.PI * times * p )) * dw  ;
                        item.bounds.height =  h + Math.abs(Math.sin( Math.PI * times * p )) * dh   ;
                    },
                    complete: function(){
                         item.bounds.width = w;
                         item.bounds.height = h;
                    }, 
                    loop: times, 
                };
                page.ptimer.add(tweenwrap);
            } else {
                var acc = 0;
                item.addUpdater(function(event){
                    acc += event.delta *2;
                    item.bounds.width =  w +  Math.abs(Math.sin(  acc )) * dw  ;
                    item.bounds.height =  h + Math.abs(Math.sin(  acc)) * dh   ;
                });
            } 
         },
         revolver_back: function( items, center,  easing, duration, callback){  
            items.forEach( (v, i) =>{
                    anime({
                        targets: v,
                        position: center,
                        duration: duration || 1,
                        easing: easing || 'linear',
                        complete: function() { 
                            if( callback ) callback();
                        } ,
                    })
                } 
            )
         },
         revolver: function( items, center, radius, angleFrom, angleTo, easing, duration, callback){ 
            var counts = items.length, step = (angleTo - angleFrom) / counts;
            items.forEach( (v, i) =>{
                    anime({
                        targets: v,
                        position:  new Point(center.x + radius * Math.cos((angleFrom + step*i)* (Math.PI / 180)), 
                                            center.y - radius * Math.sin((angleFrom + step*i)* (Math.PI / 180)) ) ,
                        duration: duration || 1,
                        easing: easing || 'linear',
                        complete: function() { 
                            if( callback ) callback();
                        } ,
                    })
                } 
            )
         },
         //return animation setting for anime.js
         r9divmove : function (div, nx, ny, nw, nh, dur, callback) {
             var x = parseInt(div.style.left), y = parseInt(div.style.top),
                 w = parseInt(div.style.width), h = parseInt(div.style.height),
                 t = 60.0 * dur / 1000, duration = dur;
             var dx = typeof nx === 'number' ? (parseInt(nx) - x) / t : 0;
             var dy = typeof ny === 'number' ? (parseInt(ny) - y) / t : 0;
             var dw = typeof nw === 'number' ? (parseInt(nw) - w) / t : 0;
             var dh = typeof nh === 'number' ? (parseInt(nh) - h) / t : 0;
 
             function r() {
                 if (typeof dx === 'number' && dx != 0) div.style.left = parseInt(div.style.left) + dx + 'px';
                 if (typeof dy === 'number' && dy != 0) div.style.top = parseInt(div.style.top) + dy + 'px';
                 if (typeof dh === 'number' && dh != 0) div.style.width = parseInt(div.style.width) + dw + 'px';
                 if (typeof dw === 'number' && dw != 0) div.style.height = parseInt(div.style.height) + dh + 'px';
             };
             
             return {
                 target: {},
                 duration: dur,
                 update: r
             };
 
            // DomEvent.requestAnimationFrame(function () {
           //      r();
           //      duration -= 1000 / 60;
           //      if (duration > 0) DomEvent.requestAnimationFrame(arguments.callee);
           //      else if (callback) callback();
           //  });
         },
 
 
         r9_drawRounded : function (ctx, x, y, w, h, r) {
             var rawctx = ctx //.getCanvas()._canvas.getContext('2d');
             if (w < 2 * r) r = w / 2;
             if (h < 2 * r) r = h / 2;
             rawctx.beginPath();
             rawctx.moveTo(x + r, y);
             rawctx.arcTo(x + w, y, x + w, y + h, r);
             rawctx.arcTo(x + w, y + h, x, y + h, r);
             rawctx.arcTo(x, y + h, x, y, r);
             rawctx.arcTo(x, y, x + w, y, r);
             rawctx.closePath();
         },

         r9_drawMathForm: function(context, mathInput, tXoff, tYoff, context, style) {
           if (mathInput != null && (typeof mathInput.render != 'undefined')) {
             context.save();
             context.translate(tXoff, tYoff);
             context.setAttr('textBaseline', 'middle');
             var fillcolor = style? style.fillColor : null;
             var strokecolor = style? style.strokeColor : null;
             var strokeWidth = style? style.strokeWidth : 1;
             var fontSize = style? style.fontSize : 18;
             if (fillcolor) context.setAttr('fillStyle', fillcolor);
             if (strokecolor) context.setAttr('storkeStyle', strokecolor);
 
             for (var i in mathInput.render) {
                 var r = mathInput.render[i];
                 if (r.type == 'fra-sign' || r.type == 'root-group') {
                     context.beginPath();
                     context.moveTo(r.x1, r.y1);
                     context.lineTo(r.x2, r.y2);
                     context.stroke();
                 } else if (r.type == 'rootsign') {
                     context.beginPath();
                     context.moveTo(r.x, r.y + r.h * 2 / 3);
                     context.lineTo(r.x + r.w / 3, r.y + r.h);
                     context.lineTo(r.x + r.w, r.y);
                     context.stroke();
                     if (style){
                         style.strokeWidth = 1;
                         style.fontSize = r.fs;
                         context.font = style.getFontStyle();
                     } 
                     context.strokeText(r.s, r.x, r.y);//+ r.asc/4 );
                     context.fillText(r.s, r.x, r.y + r.asc / 4);
                     if (style){
                         style.strokeWidth = strokeWidth;
                         style.fontSize = fontSize;
                         context.font = style.getFontStyle();
                     }  
                 } else if (typeof r.value != 'undefined') { 
                         context.save();
                         if (style){
                              style.strokeWidth = 1;
                              style.fontSize = r.fs;
                              context.font = style.getFontStyle();
                          } 
                         context.translate(r.x, r.y);
                         if (typeof r.sx != 'undefined' && typeof r.sy != 'undefined') {
                             context.scale(r.sx, r.sy);
                         }
                         context.strokeText(r.value, 0, 0);
                         context.fillText(r.value, 0, 0);
                         if (style){
                              style.strokeWidth = strokeWidth;
                              style.fontSize = fontSize; 
                          }  
                         context.restore(); 
                 }
             }
             // context.fillStrokeShape(this);
             // context.translate( -tXoff,  -tYoff); 
             context.restore();
           }
        },
        /**
         * if input is integer, return integer + 1;
         * if input is letter, return next letter;
         * if input is letter+integer, return  letter + next integer
         * if input is letter_integer, return letter_next integer
         * if input is letter^integer, return letter^next integer
         * otherwise
         *     return null;
         * @param symbol
         * @return
         */
        nextSequenceSymbol: function(symbol) {
            return this.nextSequenceSymbol(symbol, false);
        },
        nextSequenceSymbol: function(symbol, upcase) {
            if( !symbol  || symbol.length == 0 )
                return upcase? "A" : "a"; 
            var v =  parseInt(symbol);
            if(!Number.isNaN(v))  return (v + 1) + ""; 
            var length = symbol.length, pos = symbol.indexOf("_");
            if( pos == 0 || pos ==  length -1)
                return null;
            if( pos > 0 ) {
                  v =  parseInt(symbol.substring(pos+1));
                if(!Number.isNaN(v)) return symbol.substring(0, pos) + "_" + (v+1); 
            }
            pos = symbol.indexOf("^");
            if( pos == 0 || pos ==  length-1)
                return null;
            if( pos > 0 ) { 
                  v =  parseInt(symbol.substring(pos+1));
                if(!Number.isNaN(v)) return symbol.substring(0, pos) + "^" + (v+1); 
            }
            var c = symbol.charAt(0), ccode = symbol.charCodeAt(0); 
            if( !c.match(/[a-z]/i)   )
                return null;
            if( length == 1 ) { 
                return ( c.match(/[A-Z]/) ) ?
                       (( c  == 'Z' ) ? "A0" : String.fromCharCode(ccode+1)) 
                      :  (( c  == 'z' ) ? "a0" : String.fromCharCode(ccode+1));
                
            }
             v =   parseInt(symbol.substring(1));
            return Number.isNaN(v) ? null :  "" + c + (v+1); 
        } ,
      /**
       * @example
       *   var p = RU.Focus({
       *         page : ..
       *         target | position: ..
       *         color: ... ( optional) 
       *         opacity:  (optional)
       *   })
       * 
       * @param {*} params 
       */
       Focus: function(params, offset){
            var that = this;
            this.handleTargets(params, offset, function(params, offset){
                that.focus(params, offset);
            });  
        },
        focus: function(params){
              var  conf =  project.configuration,
              w = conf.frame_width, h = conf.frame_height,
              circle = new Path.Circle({
                  center: params.target ? params.target.position : params.position,
                  radius: (w+h)/4,
                  fillColor : params.color || 'gray',
                  opacity: params.opacity || '0.3', 
              })
              params.page.ptimer.add({
                  targets: circle,
                  'bounds.size': new Size(10,10),
                  position: '+=[0,0]',
                  duration: params.duration || 1,
                  complete: function(){
                      circle.remove();
                  }
              })
        },
     /**
       * @example
       *   var p = RU.Circumscribe({
       *         page : ..
       *         target: ..
       *         color: ... ( optional) 
       *   })
       * 
       * @param {*} params 
       */
        Circumscribe: function(params, offset){
            var that = this;
            this.handleTargets(params, offset, function(params, offset){
                that.circumscribe(params, offset);
            });  
        },
        circumscribe: function(params, offset){
            var  page = params.page, target =   params.target, bd = target.bounds, rect;
            if( target instanceof PathItem ){
               rect = target.clone();
               rect.bounds.width = bd.width + 20;
               rect.bounds.height = bd.height + 20;
               rect.position = target.position;
               rect.strokeColor = params.color ||  target.strokeColor;
               rect.strokeWidth = params.strokeWidth || target.strokeWidth || 2;
               rect.fillColor = null;
            } else {
                rect = new Path.Rectangle({
                    from:  bd.topLeft.__add(-10,-10),
                    to: bd.bottomRight.__add(10,10),
                    strokeColor : params.color ||  target.strokeColor, 
                    strokeWidth:  params.strokeWidth || 2,
                }) 
            } 
            showTempObj( page.cly, page.ptimer, rect, params.duration || 1); 
      },
      /**
       * @example
       *   var p = RU.ShowPassingFlash({
       *         page : ..
       *         target: ..
       *         color: ... ( optional)
       *         tips: .... (optional,  see R9Line for a list of tips)
       *   })
       * 
       * @param {*} params 
       */
       ShowPassingFlash : function(params, offset){
            var that = this;
            this.handleTargets(params, offset, function(params, offset){
                that.showpassingflash(params, offset);
            });  
       },

       showpassingflash : function(params, offset){
            var page = params.page, target = params.target, bd = target.bounds, underline; 
            underline = new R9Line(bd.bottomLeft.__add(0, 20), bd.bottomRight.__add(0,20));
            underline.strokeColor = params.color ||  target.strokeColor;
            underline.strokeWidth = params.strokeWidth || target.strokeWidth || 2;
            if( params.tips )  underline.setTips(params.tips);
            showTempObj( page.cly, page.ptimer, underline, params.duration || 1); 
      },
     /**
      *  @copyright from manim project.
       * @example
       *   var p = RU.ApplyingWaves({
       *         page : ..
       *         target: ..
       *         direction:   optional, default UP,
                 amplitude:  optional, default 0.2,  The distance points of the shape get shifted  
                 wave_func:  optional, default  smooth,  The function defining the shape of one wave flank.
                 time_width: optional, default 100, The length of the wave relative to the width of the  object.
                 ripples:    optional default 1 in manima,   The number of ripples of the wave 
                 duration:   optional, default 2.
       *   })
       * 
       * @param {*} params 
       */
        ApplyingWaves : function(params, offset){
            var that = this;
            this.handleTargets(params, offset, function(params, offset){
                 that.applyingwaves(params, offset);
            });  
        },

        applyingwaves : function(params, offset){
            var page = params.page, direction = params.direction || new Point([0,1]),
                target = params.target, bd = target.bounds,
                amplitude = params.amplitude ||  Math.max(bd.height/10, 30),
                wave_func = params.wave_func ||  Numerical.smooth,  
                time_width = params.time_width ||  Math.max(bd.width/10, 50),  ripples = params.ripples || 1 ; 
            var  x_min = target.bounds.x,
                x_max = x_min + target.bounds.width,
                vect = direction.normalize().__multiply( amplitude );
            var wave = function(t) {
                t = 1 - t; 
                if (t >= 1 || t <= 0)
                    return 0
                let phases = ripples * 2;
                let phase = parseInt(t * phases);
                if (phase == 0)
                    return wave_func(t * phases);
                else if( phase == phases - 1 ){
                    t -= phase / phases   ;
                    return (1 - wave_func(t * phases)) * (2 * (ripples % 2) - 1);
                } 
                else {
                    phase = parseInt((phase - 1) / 2);
                    t -= (2 * phase + 1) / phases;
                    return (1 - 2 * wave_func(t * ripples)) * (1 - 2 * ((phase) % 2))
                } 
            } 
          
            var homo = function(x,y,t){
                var upper = Numerical.interpolate(0, 1 + time_width, t);
                var lower = upper - time_width
                var relative_x = Numerical.inverse_interpolate(x_min, x_max, x)
                var  wave_phase = Numerical.inverse_interpolate(lower, upper, relative_x)
                var nudge =  vect.__multiply(wave(wave_phase));   
                return  [x + nudge.x, y + nudge.y];  
            }
           params.homotopy = homo;
           this.homotopy(params, offset); 
      },
    }
};