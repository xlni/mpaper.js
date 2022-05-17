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
 * @name PositionControl
 *
 * @class The PositionControl object is the base class for any of the other updator types,
 * such as {@link PositionControl},  
 */
/* global PositionControl: true */
var PositionControl = Base.extend(/** @lends PositionControl# */{
    _class: 'PositionControl',

    //{  }
    /**
     * @example
     * new PositionControl({
     *      shape : ...
     *      type : ...   'center', 'segment'.....
     * })
     * 
     * 'center':   shape's center , or position
     * 
     * 
     * 'segment':   shape's segment point ,  
     *     type: 'segment',
     *     order: 0, // number,  for index of segment on path.
     * 
     * 'bound;    on bounds, there are four points.
     *    type: 'bound',
     *    location:  top|left|right|bottom
     *   
     * 'onborder':  on border, 
     *    type: 'onborder',
     *    percentage:  fixed location by percentage
     *    fixlength:   fixed location by fixed length from start endpoint.
     *   //if neither percentage nor fixlenght is specified, it can free move ...
     *    loc: [3,5]    a point on border
     *    
     * 
     * @param {*} param {}
     */
    initialize: function PositionControl(param) { 
        this.type = param.type ; 
        this.shape = param.shape;
        this.order = param.order || 0;  
        this.location = param.location;
        this.percentage = param.percentage;
        this.fixlength = param.fixlength;
        if ( param.loc ){
            this.loc = new Point(param.loc);
        }
        if( !(this.shape instanceof Item) ){
             throw console.error("shape is not an Item ini PositionControl");
        }
        if( this.type == 'segment' && !(this.shape instanceof Path) ){
            throw console.error("shape is not an Path while type is segment");
        }
        if( this.type == 'bound' && '|top|left|right|bottom|'.indexOf( '|'+ this.location +'|') < 0 ){
            throw console.error("shape type is bound, but location constant is not supported");
        }
        if( this.type == 'onborder' && !(this.shape instanceof Path) ){
            throw console.error("shape is not an Path while type is onborder");
        }
    },

    getPosition: function(){ 
        var that = this, type = that.type;
        if( type == 'center' ){
            return that.shape.position;
        }
        else if( type == 'segment' ){
            return that.shape.segments[ that.order ].point;
        }
        else if( type == 'bound' ){
            var b = that.shape.bounds;
            return b[that.location + 'Center'];
            // if( that.location == 'top ' )  return b.topCenter;
            // if( that.location == 'left ' )  return b.rightCenter;
            // if( that.location == 'right ' )  return b.topCenter;
            // if( that.location == 'bottom ' )  return b.topCenter; 
        }
        else if( type == 'onborder' ){
            var length = that.shape.length;
            if( typeof that.percentage != 'undefined' ){
                 return that.shape.getPointAt( length * that.percentage );
            } else if( typeof that.fixlength != 'undefined' ){
                var len = that.fixlength > length ? length : that.fixlength;
                return that.shape.getPointAt( len );
            } else if( typeof that.loc == 'Point') { 
                return that.loc;
            }
        }
    },
    setPosition: function(position){ 
        var that = this, type = that.type;
        if( type == 'center' ){
            that.shape.position = position;   
        }
        else if( type == 'segment' ){
           that.shape.segments[ that.order ].point = position;
        }
        else if( type == 'bound'){
            //do nothing....
        } else if( type == 'onborder' ){
            var length = that.shape.length;
            if( typeof that.loc == 'Point') { 
                 that.loc = that.shape.getNearestPoint(position);
            }
        }
    } 
   
});
