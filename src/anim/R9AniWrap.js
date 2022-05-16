 var R9InLayerTimer = Base.extend(/** @lends R9InLayerTimer# */{
    _class: 'R9InLayerTimer',
    
    /**
     * Creates a R9InLayerTimer object using  
     * 
     * @name R9InLayerTimer#initialize
     */
    initialize: function R9InLayerTimer(cly, prefix) {
        this.cly = cly;
        this.prefix = prefix;
        this.timer = new TimeTracker();
        this.pList = [];
        this.cdList = []; 
        this.chainList = []; 
    },
    //tasks : [{setup:function(){}, step: function(progress){} ,duration: progress:  }]
     addChainedJob :  function(tasks, id,  needPaint, callback ){ 
        this.chainList.push({tasks: tasks, id : id,  needPaint:needPaint, callback:callback});
    },
    //func : function(pregress){}
     addProgressJob :  function(func, id, duration, needPaint, callback ){
        var func2 = func.bind( this.cly );
        this.pList.push({func: func2, id : id, duration: duration, progress:0, needPaint:needPaint, callback:callback});
    },
    //func : function(){ return true|false}
     addCheckdoneJob :  function(func, id, maxtime,needPaint, callback ){
        var func2 = func.bind( this.cly );
        this.cdList.push({func: func2, id : id, maxtime: maxtime, progress:0, needPaint:needPaint, callback:callback});
    },
     
    stop :  function(){
        this.timer.pause(); 
    },
    destroy :  function(){
        this.reset();
        this.cdList =[];
        this.pList =[]; 
        this.chainList=[];
    } ,
    isEmpty: function(){
       return  this.pList.length == 0 && this.cdList.length == 0 && this.chainList.length == 0;
    },
    heartbeat :  function(){ 
        if( this.isEmpty() )  return;
        this.timer.heartbeat_update();
        var delta = this.timer.delta, needToPaint = false;  
        for(var i = this.pList.length-1; i >=0; i--){
            var t = this.pList[i];
            t.progress = Math.min( t.duration, t.progress+ delta);
            try{
                t.func( t.progress);
            }catch(e){}
            if( t.needPaint ) needToPaint = true;
            if( t.progress >= t.duration ){
                if( t.callback ){   try{ t.callback(); }catch(e){}  }
                this.pList.splice(i, 1);
            } 
        }
        for(var i = this.cdList.length-1; i >=0; i--){
            var t = this.cdList[i];
            t.progress = Math.min( t.maxtime, t.progress+delta);
            try{
            if( t.func() || (t.maxtime && t.progress == t.maxtim)){
                    if( t.callback ){   try{ t.callback(); }catch(e){}  }
                    this.cdList.splice(i, 1);
            }
            }catch(e){}
            if( t.needPaint ) needToPaint = true;
        }
        for(var i = this.chainList.length-1; i >=0; i--){
            ////tasks : [{setup:function(){}, step: function(progress){} ,duration: progress  }]
            var task = this.chainList[i], t = task.tasks[0];
            if( t.progress == 0){  try{ t.setup(); }catch(e){} }
            t.progress =  Math.min( t.duration, t.progress+delta);
            try{
                t.step( t.progress );
            }catch(e){}
            if( t.needPaint ) needToPaint = true;
            if( t.progress >= target.duration ){
                task.tasks.splice(0, 1);
            } 
            if( task.tasks.length == 0 ){
                if( target.callback ){   try{ target.callback(); }catch(e){}  }
                this.chainList.splice(i,1);
            }
        }
        if( needToPaint ){
            this.cly.batchDraw();
        }
    }
});
 

var R9TimlinePlayer = Base.extend(/** @lends R9TimlinePlayer# */{
    _class: 'R9TimlinePlayer',
    
    /**
     * Creates a R9TimlinePlayer object using  
     * 
     * @name R9TimlinePlayer#initialize
     */
    initialize: function R9TimlinePlayer(project, layer, props){ 
        this.r9 = project;
        this.cly = layer;
        this.name = props.prefix || '';
        this.prefix = props.prefix || '';
        this.bgvideo = props.bgvideo || false; 
        this.entry = props.entry || 0;
        this.exit = props.exit || 0;
        this.ease = props.ease || '';
        this.width = props.width || 0;
        this.height = props.height || 0;  
        this.chain = new Array();
        this.curStep = 0;
        this.isRunning = false;  
     
        this.i2f = {}; 
        this.emotions ={};  
        this.transpages = [];   
        this.r9tmpnodes = [];  
        this.r9gnrtrids = {};   
       
        this.timer = new R9InLayerTimer(this.cly, this.prefix);  
    },
   

    destroy: function(cleanuponly){   
        this.reset();
        this.emotions = {}; 
        this. transpages = [];  
        if(cleanuponly) { return; } 
        this.cly.destroy();
        this.r9.getPageBus().cleanupTimeline(this.prefix);
        this. cly = null; 
        this.timer.destroy(); 
    }, 
 
 
    nextStep : function(){
        var that = this; 
        if (that.curStep <  that.chain.length -1)
        {
            that.curStep = that.curStep +1;
            that.processCurrentStep();
        }else
        { 
            that.stop(); 
        }  
    },
   

    processCurrentStep : function(){ 
        var that = this, curPage = that.getCurPage();
        try{ if(this.r9.removeoverlaplayer) this.r9.removeoverlaplayer(this.prefix); }catch(e){ console.log(e);  } 
        if (typeof that._dismissr9keyboard === "function") {  that._dismissr9keyboard(); }    
        try{ curPage.setup(); }catch(e){  console.log(e);  }  
    },
   

    getCurPage : function(){
    	return this.chain[this.curStep];
    },
    reset : function(){
        var that = this;
        if (that.chain.length == 0)  return; 
        that.stop(); 
        that.curStep = 0;
    },
    start : function(callback){
        var that = this;
        if (that.chain.length == 0 || that.isRunning ) return;  
        that.isRunning = true; 
        that.processCurrentStep();
        if( callback ) callback();
    },
    resume : function(callback){
        var that = this;
        if (that.chain.length == 0 || that.isRunning ) return;  
        that.isRunning = true; 
        that.nextStep();
        if( callback ) callback();
    }, 
    
    stop : function(){
        var that = this; 
        that.isRunning = false; 
    },
    addPage : function(page){
        this.chain.push(page);
    },
    remove: function(page){
        const index = this.chain.indexOf(page);
        if (index > -1) {
            this.chain.splice(index, 1);
        }
    },
    
    distroy : function(){
        this.stop();
        this.chain = [];
    },

    restartFrom : function(page, phasePosition){
        this.stop();
        var p = this.chain[phasePosition];
        page.transtime = p.transtime;
        page.staytime = p.staytime;
        this.chain[phasePosition] = page;
        this.curStep = phasePosition;
        this.processCurrentStep(); 
    },

    initialStartFrom : function(phasePosition){
        this.stop();
        this.isRunning = true;
        this.curStep = phasePosition;
        this.processCurrentStep();
    },
    
});

var TimeTracker = Base.extend(/** @lends TimeTracker# */{
    _class: 'TimeTracker', 
    /**
     * Creates a TimeTracker object using  
     *
     * @param {}  
     * @name TimeTracker#initialize
     */
    initialize: function TimeTracker( ) {  
       this.reset();
    },
    heartbeat_update: function(){
        var now = Date.now() / 1000;
        this.delta = this._last ? now - this._last : 0;
        this._last = now;
        this._time += delta;
        this._count++; 
    },
    pause: function(){
        this._last = 0;
    },
    reset: function(){
        this._last = 0;
        this._time = 0;
        this._count = 0;
        this._delta = 0;
    }
});

var Page = Base.extend(/** @lends Page# */{
    _class: 'Page', 
    /**
     * Creates a Page object using  
     *
     * @param {}  
     * @name Page#initialize
     */
    initialize: function Page(  cly, prefix, pos,  block){ 
        let that = this;
        this.cly = cly; 
        this.ptimer =   anime.timeline({ 
            autoplay: false,
            complete: function(){
                if( !that.blockAnimation )
                    cly._player.nextStep();
                else
                    cly._player.stop();
            }
          });
        //new R9InPageTimer(this, cly, prefix || '', pos || 0);  
        this.blockAnimation = block || false;   
        this.staytime = 0;
        this.prefix = prefix;
        this.pos = pos;
        cly.addPage(this);
        this.initialized = false;
    },
    remove: function(){
        this.cly.removePage( this );
        this.pos = -1;
    },
    add_func_to_tl: function(func, offset){
        this.ptimer.add( {
            targets: this,
            eventFunc:  func,
            duration: 0.1
        }, offset );
    },
    add_to_tl: function(param, offset){
      //  if( Base.isPlainObject(param)){
         //   if( typeof offset === 'undefined ')
         //       this.ptimer.add(param);
         //   else
                this.ptimer.add(param, offset);
      //  }  
    },
    wait: function(duration){
        this.ptimer.add( {
            targets: this,
            eventFunc: function(){},
            duration: 0.1,
        }, '+=' + (duration || 1) );
    },
    setup: function(){ 
        if( this.initialized ) return;
        this.initialized = true; 
        this.setup2(this, this.cly, this.ptimer); 
        if( this.staytime > 0 ){
           this.wait(this.staytime);
        }
        this.cly._changed();
        this.ptimer.play();
    },
    setup2: function(curPage,  curLayer, curTimeline){ 
    }, 
    createItems: function(  options, offset, doneCallback){
       this.cly.createItems(this.ptimer, options, offset, doneCallback);
    },
    uncreateItems: function(  options, offset, doneCallback){
        this.cly.uncreateItems(this.ptimer, options, offset, doneCallback);
     },
    
});