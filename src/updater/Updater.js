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
 * @name Updater
 *
 * @class The Updater object is the base class for any of the other updator types,
 * such as {@link MoveRestriction},  
 */
/* global Updater: true */
var Updater = Base.extend(/** @lends Updater# */{
    _class: 'Updater',

    //{  id: aid, func: update_func, duration: duration || 0 , startAniTime : 0}
    initialize: function Updater(param) {
        this.id = UID.get();
        this.host = param.host;
        this.update_func = param.func;
        this.duration = param.duration || 0;
        this.startAniTime = param.startAniTime || 0;
        this.accTime = 0;
        this.lastTime = 0;
        this.repeat = param.repeat || false;
        this.doneCallback = param.doneCallback;
        this.paused = false;
        this.name = this.id + '';
    },
    pause: function(){
        this.paused = true;
        this.lastTime = 0;
    },
    resume: function(){
        this.paused = false;
    },

    update: function(event){
        var that = this;
        if( this.startAniTime > event.time || this.paused ) return;
        if(  that.duration == 0 ){
            if( !this.paused )
                that.update_func(event);
        } else { 
          //  if( that.lastTime != 0 ){
           //     that.accTime += event.time - that.lastTime;
          //  }  
          //  that.lastTime = event.time;
            that.accTime += event.delta;

            if(  that.accTime  <= that.duration ){
                 var progress = that.accTime / that.duration;  
                 that.update_func(event, progress);
            } else { 
                if( that.doneCallback )
                    that.doneCallback();
                if( that.repeat ){
                    that.accTime = 0; 
                } else {
                    if( that.host )
                        that.host.removeUpdaterById( that.id )
                } 
            }
        } 
    }
   
});

/**
 * used to define and store variable. 
 * value can be numeric type of object.
 */
var VarInCxt = Base.extend(/** @lends VarInCxt# */{
    _class: 'VarInCxt',
    context: null,
    name: null,
    value: null,


    initialize: function VarInCxt(context, name, value) {
        this.context = context;
        this.name = name;
        this.value = value;
    },
    get_value: function(){
        if( this.context != null )
            return this.context[this.name];
        return this.value;
    },
    set_value: function(value, duration){
        if( this.context != null )
            this.context[this.name] = value;
        else
            this.value = value;
    },
    increment: function(delta){
         this.set_value( this._add(delta) );
    },
    _add: function(delta){
        var v = this.get_value();
        if( typeof delta == 'Array'   ){
             var r = new Array();
             for(var i in delta){
                 r[i] = v[i] + delta[i];
             }
             return r;
        } 
        else if( typeof delta == 'object' && v.hasOwnProperty('__add') )
            return v.__add( delta )  ;
        else
            return v + delta;
    },
    statics:{
        progress: function(start, end, percentage){
            if( typeof start == 'Array'  ){
                var r = new Array();
                for(var i in start){
                    r[i] = start[i] + (end[i] - start[i]) * percentage;
                }
                return r;
            }  if( typeof start == 'object' && v.hasOwnProperty('__add') ) { 
                return start.__add( end.__subtract( start ) * percentage  );
            }
            else {
                return start + (end - start) * percentage;
            }
        }
    }

});

/**
 * it does not directly inherit from Updater, but it still is updater,
 * and will be add into Item's updaters array.
 */
var ValueTracker = Base.extend(/** @lends ValueTracker# */{
    _class: 'ValueTracker',
    value : null,
    duration: 0,
    startAniTime: 0,

    initialize: function ValueTracker(/* param */) {
        var params = arguments;
        this.value = new VarInCxt(null, '', 0);
        if( params.length == 0){ 
        }
        else if ( params.length == 1 ){
            var value = params[0];
            if( typeof value == 'object' && value._class == 'VarInCxt')    
                this.value = value;
            else {
                if( typeof value == 'string' )
                    this.value = new VarInCxt(null, value, 0);
                else if( typeof value == 'number' )
                    this.value = new VarInCxt(null, '', value); 
            }
        }
        else if ( params.length == 2 ){
            var value = params[0], value2 = params[1];
            if( typeof value == 'string' )    
                this.value = new VarInCxt(null, value, value2);
            else  if( typeof value == 'object' && typeof value2 == 'string')    
                this.value = new VarInCxt(  value, value2, 0); 
        }
        else if ( params.length == 3){
            var value = params[0], value2 = params[1], value3 = params[2];
            if( typeof value == 'object' && typeof value2 == 'string' )    
                this.value = new VarInCxt(  value, value2, value3); 
        }
    },
    set_value: function(value, duration){
        if( duration ){
            this.duration = duration;
            this.startAniTime = 0;
            this._start = this.value.get_value();
            this._end = value;
        } else {
            this.duration = 0;
            this.startAniTime = 0;
            this.value.set_value(value);
        } 
    },
    increment: function(delta, duration){
        if( duration ){
            this.duration = duration;
            this.startAniTime = 0;
            this._start = this.value.get_value();
            this._end = this.value._add( delta);
        } else {
            this.duration = 0;
            this.startAniTime = 0;
            this.value.increment(delta);
        } 
    },
    get_value: function(){
        return this.value.get_value();
    },
 
    //callback for Updater interface
    update: function(event){
        var that = this;
        if(  that.duration != 0 ){  
            if( that.startAniTime == 0 )
                that.startAniTime = event.time ;
            if(   event.time - that.startAniTime < that.duration ){
                 var progress = (event.time - that.startAniTime ) / that.duration;  
                 var v = VarInCxt.progress( that._start, that._end, progress);
                 this.value.set_value(v)
            } else { 
               that.duration = 0;
               that.startAniTime = 0;
            }
        } 
    }
   
});