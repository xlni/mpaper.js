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
 * @name MoveRestriction
 *
 * @class The MoveRestriction object is the base class for any of the other updator types,
 * such as {@link MoveRestriction},  
 */
/* global MoveRestriction: true */
var MoveRestriction = Updater.extend(/** @lends MoveRestriction# */{
    _class: 'MoveRestriction',

    //{  }
    /**
     * @example
     * new MoveRestriction({
     *      host : ...
     *      pos_control : {   //define PositionControl type. if is undefined, use type='center'
     *               shape: ..,
     *               type: ...,
     *            } 
      *      type : ...   'mrs_x', 'mrs_y'.....
     * })
     * 
     * 'mrs_x':   move_restriction_on_x   (can only move on x direction)
     * 'mrs_y':   move_restriction_on_y  (can only move on y direction)
     * 
     * 'mrs_range_x'  move_restriction_on_x range (can only move on x range)
     *      type: mrs_range_x,
     *      min:  min x value
     *      max:  max x value
     *  * 'mrs_range_y'  move_restriction_on_y range (can only move on y range)
     *      type: mrs_range_y,
     *      min:  min y value
     *      max:  max y value
     * 
     *   * 'mrs_range'  move_restriction_on_ rectangle range (can only move on area controlled by x -y range)
     *      type: mrs_range,
   *        min:  min x value
     *      max:  max x value
     *      min2:  min y value
     *      max2:  max y value
     * 
     *   * 'mrs_shape'  move_restriction_on_ shape border or on path 
     *      type: mrs_range,
   *        shape: a path,
   *        onborder: false|true ,  default is true
   * 
   *    * 'mrs_move_with'  move_with a shape, keep distance and direction
     *      type: mrs_move_with,
   *        shape: a path 
   * 
   *  *    * 'move_tracking'  not a move restriction, but callback to update self moving location
     *      type: mrs_move_with,
   *        shape: a path ,
   *        callback:  function(x_diff, y_idd);
     * 
     * @param {*} param {}
     */
    initialize: function MoveRestriction(param) {
        Updater.apply(this, arguments); 
        var type = param.type, that = this;
        that.min = param.min || 0, 
        that.max = param.max || 0;
        that.min2 = param.min2 || 0, 
        that.max2 = param.max2 || 0;
        that.shape = param.shape;
        that.onborder = typeof param.onborder == 'undefined' ? true : !!param.onborder;
       
        if( param.pos_control ){
            if( typeof param.pos_control.shape == 'undefined' )
                param.pos_control.shape = that.host;
            that.pos_control = new PositionControl( param.pos_control );
        } else {
            that.pos_control = new PositionControl( {
                shape: that.host,
                type: 'center'
            } );
        }
        that.orig_x = that.pos_control.getPosition().x;
        that.orig_y = that.pos_control.getPosition().y;

        
        if( type == 'mrs_x' ){
            that.update_func = function(event, progress){ 
                var pos = that.pos_control.getPosition().clone();
                if( pos.y != that.orig_y ){  
                    pos.y = that.orig_y; 
                    that.pos_control.setPosition(pos);
                }
                 // that.host.position.y = that.orig_y; 
            }
        }
        else if( type == 'mrs_y' ){
            that.update_func = function(event, progress){ 
                var pos = that.pos_control.getPosition().clone();
                if( pos.x != that.orig_x ){
                    pos.x = that.orig_x; 
                    that.pos_control.setPosition(pos);
                }
                //  that.host.position.x = that.orig_x; 
            }
        }
        else if( type == 'mrs_range_x' ){
            that.update_func = function(event, progress){ 
                var pos = that.pos_control.getPosition().clone(), changed=false;
                if( pos.y != that.orig_y ){ 
                    pos.y = that.orig_y; 
                    changed = true;
                }
                if( pos.x < that.min ){ 
                    pos.x = that.min; 
                    changed = true;
                }
                if( pos.x > that.max ){
                    pos.x = that.max; 
                    changed = true;
                } 
                if( changed ){
                    that.pos_control.setPosition(pos);
                }
            }
        }
        else if( type == 'mrs_range_y' ){
            that.update_func = function(event, progress){ 
                var pos = that.pos_control.getPosition(), changed=false;
                if( pos.x != that.orig_x ){
                    pos.x = that.orig_x; 
                    changed = true;
                } 
                if( pos.y < that.min ){
                    changed = true;
                    pos.y = that.min; 
                } 
                if( pos.y > that.max ){
                    pos.y = that.max; 
                    changed = true;
                }
                if( changed ){
                    that.pos_control.setPosition(pos);
                }  
            }
        }
        else if( type == 'mrs_range' ){
            that.update_func = function(event, progress){ 
                var pos = that.pos_control.getPosition().clone(), changed=false;
                if( pos.x < that.min ){
                    changed = true;
                    pos.x = that.min; 
                } 
                if( pos.x > that.max ){
                    changed = true;
                    pos.x = that.max; 
                }  
                if( pos.y < that.min2 ){
                    changed = true;
                    pos.y = that.min2; 
                } 
                if( pos.y > that.max2 ){
                    changed = true;
                    pos.y = that.max2; 
                }
                if( changed ){
                    that.pos_control.setPosition(pos);
                }      
            }
        }
        else if( type == 'mrs_shape' ){
            that.update_func = function(event, progress){ 
                if( that.onborder ){
                    var point = that.pos_control.getPosition() ,  
                        nearestPoint = that.shape.getNearestPoint(point);
                    if( !point.equals( nearestPoint) )
                        that.pos_control.setPosition(nearestPoint);
                } else {
                    var point = that.pos_control.getPosition() ;
                    if( !that.shape.contains( point ) ){  
                        var nearestPoint = that.shape.getNearestPoint(point);
                        that.pos_control.setPosition(nearestPoint);
                    }
                }
            }
        }
        else if( type == 'mrs_move_with' ){
            var p = that.pos_control.getPosition() ;
            that.move_with_dist = that.shape.position.__subtract( p );
            that.update_func = function(event, progress){  
                var point = that.pos_control.getPosition(), pos = that.shape.position.__add(that.move_with_dist);  
                if( !point.equals(pos) ){  
                    that.pos_control.setPosition(pos); 
                }
            }
        } else if ( type == 'move_tracking' ){
            var p = that.pos_control.getPosition() ; 
            that.update_func = function(event, progress){  
                var point = that.pos_control.getPosition(), x_dff = point.x - that.orig_x,
                y_dff = point.y - that.orig_y;
                that.orig_x = that.pos_control.getPosition().x;
                that.orig_y = that.pos_control.getPosition().y;
                if( x_dff != 0 || y_dff != 0 )
                    param.callback(x_dff, y_dff);
            }
        }
    },

     
   
});
