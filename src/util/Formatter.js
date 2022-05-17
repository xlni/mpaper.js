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
 * @name Formatter
 * @class
 * @private
 */
var Formatter = Base.extend(/** @lends Formatter# */{
    /**
     * @param {Number} [precision=5] the amount of fractional digits
     */
    initialize: function(precision) {
        this.precision = Base.pick(precision, 5);
        this.multiplier = Math.pow(10, this.precision);
    },

    /**
     * Utility function for rendering numbers as strings at a precision of
     * up to the amount of fractional digits.
     *
     * @param {Number} num the number to be converted to a string
     */
    number: function(val) {
        // It would be nice to use Number#toFixed() instead, but it pads with 0,
        // unnecessarily consuming space.
        // If precision is >= 16, don't do anything at all, since that appears
        // to be the limit of the precision (it actually varies).
        return this.precision < 16
                ? Math.round(val * this.multiplier) / this.multiplier : val;
    },

    pair: function(val1, val2, separator) {
        return this.number(val1) + (separator || ',') + this.number(val2);
    },

    point: function(val, separator) {
        return this.number(val.x) + (separator || ',') + this.number(val.y);
    },

    size: function(val, separator) {
        return this.number(val.width) + (separator || ',')
                + this.number(val.height);
    },

    rectangle: function(val, separator) {
        return this.point(val, separator) + (separator || ',')
                + this.size(val, separator);
    },
    tex2svg: function(input, options,callback){
        if( window.tex2svg ){ 
            return window.tex2svg(input, options, callback);
        }
    },
    toAbcOrder: function(order){
        return  String.fromCharCode('A'.charCodeAt(0) + order) ;
    },
    toMathJaxId: function(char){
        var code = char.charCodeAt(0);
        //a-z：97-122，A-Z：65-90，0-9：48-57 
        if( code >= 48 && code <= 57 ){
            return 'TEX-N-' + (30 + code-48);
        }
        if( code >= 97 && code <= 122 ){
            var v = parseInt('4E', 16) + (code - 97);
            return 'TEX-I-1D4' + v.toString(16).toUpperCase();
        }
        if( code >= 65 && code <= 90 ){
            var v = parseInt('34', 16) + (code - 65);
            return 'TEX-I-1D4' + v.toString(16).toUpperCase();
        }
        //greek..
        if( code >= 945 && code <= 969 ){
            var v = parseInt('FC', 16) + (code - 945);
            return 'TEX-I-1D6' + v.toString(16).toUpperCase();
        }
        if( code >= 913 && code <= 937 ){
            var v = parseInt('E2', 16) + (code - 913);
            return 'TEX-I-1D6' + v.toString(16).toUpperCase();
        }
        return null;
    },
    _getMathSymbol2: function(obj,  targetId, s){ 
        if(  obj instanceof Group ){
             for(var g in obj._children){
               //  if( g.length> 1 )  console.log( "::" + g + "   " + targetId);
                 if( g.indexOf(targetId) >= 0) s.finds++;
                // console.log( "finds = " + s.finds + " to = " + s.to )
                 if(  s.finds === s.to ) return obj._children[g];
                 var r =  this._getMathSymbol2(  obj._children[g],  targetId, s );
                 if( r ) return r;
             }
        } 
        return null;
     },
    /**
     * 
     * @param {*} obj  imported mathjax object,
     * @param {*} char  character to select
     * @param {*} targetOrder order of character in mathjax latex.
     * @returns 
     */
    getMathSymbol: function(obj, char, targetOrder){
        var id = this.toMathJaxId(char);
        if( !id ) return null;
       // id = id + ' 1';
      //  console.log( "query id :: " + id );
        return this._getMathSymbol2(obj, id, {finds:0, to: targetOrder} );
    },
    _getMathSymbolAll2: function(obj,  targetId , r){ 
        if(  obj instanceof Group ){
             for(var g in obj._children){
                if( g.indexOf(targetId) >= 0 )  r.push( obj._children[g] );
                this._getMathSymbolAll2(  obj._children[g],  targetId, r ); 
             }
        }  
     },
     forceStyleChanges: function(obj,  fillColor, strokeColor, nodeType){ 
         if(!obj) return;
         if(!nodeType || obj instanceof nodeType){
            obj.fillColor = fillColor;
            obj.strokeColor = strokeColor;
         } 
        if(  obj instanceof Group ){
            var that = this;
            obj._children.forEach( e => { that.forceStyleChanges(e, fillColor, strokeColor, nodeType); } )
        }  
     },
     /**
      * 
      * @param {*} obj 
      * @param {*} start 
      * @param {*} end 
      * @param {*} result is an object to hold query status and query result:
      *     {
      *       f : 0 not yet, 1 in range, 2 beyond range.,   
      *       r: []  hold result.
      *     }
      */
     _getMathSymbolRange2: function(obj,  start, end , result){ 
        if(  obj instanceof Group ){
             for(var g in obj._children){
                 var t = obj._children[g];
                 if( t == start ) result.f = 1;
                 else if (t == end ) result.f = 2;
                 else {
                     if( result.f == 1 && (t instanceof PathItem))  result.r.push( t );
                     else if( result.f != 2 ){
                         this._getMathSymbolRange2(t, start, end, result)
                     }
                 } 
             }
        }  
     },
    /**
     * 
     * @param {*} obj 
     * @param {*} query can be a symbol string, or a query object:
     *       { start_char: 'a', start_pos: 2, end_char 'c', end_pos : 1 } 
     * @returns a list of items. if not find return empty []
     */
    getMathSymbolRange: function(obj, query){
        var that = this, r = [];
        if( typeof query == 'string' ){ 
            for(var i in query){
                var id = this.toMathJaxId(query[i]);
                if( id ){
                    that._getMathSymbolAll2(obj, id , r);
                } 
            };
            return r;
        }
        var start = that.getMathSymbol(obj, query.start_char, query.start_pos) ;
        if( start ){
            r.push(start);
            var end = that.getMathSymbol(obj, query.end_char, query.end_pos) ;
            if( end ){ 
                var result =  {f: 0, r: r };
                that._getMathSymbolRange2(obj,  start, end ,result);
                r.push(end);
                return r;
            }
        } 
        return r;
    },
    /**
     * id of mathjax symbol is like: 
     *  #MJX-1-TEX-N-30  0
        #MJX-1-TEX-N-39  9 
       #MJX-1-TEX-I-1D44E a  
       #MJX-1-TEX-I-1D467 z 
       MJX-1-TEX-I-1D434  A
       MJX-1-TEX-I-1D44D  Z
        // a-z：97-122，A-Z：65-90，0-9：48-57  
        希腊字母，
        MJX-1-TEX-I-1D6FC α 
        MJX-1-TEX-I-1D6E2 Α 
        the last part is 16 based number, we use it as id for mathjax cache id.
        mathjax symbol will add additional number to it, with space inbetween.
        so, we also need to remove it. 
     * @param {*} id 
     * @returns 
     */
    mathjax_idmapper: function(id){
        var pos = id.lastIndexOf('-');
        if( pos > 0 )  id.substring(pos+1);
        pos  = id.indexOf(' ');
        if( pos > 0 )  id.substring(0, pos );
        return id;
    },
});

Formatter.instance = new Formatter();
