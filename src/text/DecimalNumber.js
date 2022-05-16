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
 * @name DecimalNumber
 *
 * @class A DecimalNumber item represents  
 * 
 * @example
 *             decimal = DecimalNumber(
                    0,
                    show_ellipsis=True,
                    num_decimal_places=3,
                    include_sign=True,
                )
 *
 * @extends TextItem
 */
var DecimalNumber = StyledText.extend(/** @lends DecimalNumber# */{
    _class: 'DecimalNumber',

    /**
     * Creates a point text item
     *
     * @name DecimalNumber#initialize
     * @param {Point} point the position where the text will start
     * @return {DecimalNumber} the newly created point text
     *
     * @example {@paperscript}
     * var text = new DecimalNumber(new Point(200, 50));
     * text.justification = 'center';
     * text.fillColor = 'black';
     * text.content = 'The contents of the point text';
     */
    /**
     * Creates a point text item from the properties described by an object
     * literal.
     *
     * @name DecimalNumber#initialize
     * @param {Object} object an object containing properties describing the
     *     path's attributes
     * @return {DecimalNumber} the newly created point text
     *
     * @example {@paperscript}
     * var text = new DecimalNumber({
     *     point: [50, 50],
     *     content: 'The contents of the point text',
     *     fillColor: 'black',
     *     fontFamily: 'Courier New',
     *     fontWeight: 'bold',
     *     fontSize: 25
     * });
     */
    initialize: function DecimalNumber(params) {
        if( typeof params.number !== 'undefined')
            params.content = params.number;
        StyledText.apply(this, arguments); 
        this.num_decimal_places = typeof params.num_decimal_places == 'undefined' ? 2 : params.num_decimal_places;
        this.include_sign = params.include_sign || false;
        this.group_with_commas = typeof params.group_with_commas == 'undefined' ? true : params.group_with_commas;
        this.digit_buff_per_font_unit = params.digit_buff_per_font_unit || 0.001;
        this.show_ellipsis = params.show_ellipsis || false;
        this.units = params.units;
        this.include_background_rectangle = params.include_background_rectangle || false;
        this. edge_to_fix = typeof params.edge_to_fix == 'undefined' ? Constants.LEFT : params.edge_to_fix; 
        this._style.fontSize = typeof params.fontSize == 'undefined' ? 16 : params.fontSize; 
        this.setValue(params.content||0);
    },
    _copyExtraAttr: function(source, excludeMatrix){
        this.num_decimal_places = source.num_decimal_places;
        this.include_sign = source.include_sign  ;
        this.group_with_commas = source.group_with_commas;
        this.digit_buff_per_font_unit = source.digit_buff_per_font_unit  ;
        this.show_ellipsis = source.show_ellipsis ;
        this.units = source.units;
        this.include_background_rectangle = source.include_background_rectangle ;
        this. edge_to_fix = source.edge_to_fix; 
        this._style.fontSize = source._style.fontSize; 
    },
    setValue: function(number){
        this.number = number;
        this._content = this.number.toFixed( this.num_decimal_places ) 
                       + (this.show_ellipsis? '...' : '') + (this.units? this.units : '');
        this._changed(/*#=*/Change.CONTENT);
    },
    scale: function(scale){
        this._style.fontSize = this._style.fontSize * scale;
    },
    getValue: function(){
        return this.number;
    },
    increment_value: function(delta){
         this.setValue( this.getValue() + delta);
    },
    _animForShowing: function(duration, offset){ 
        this.visible = true;
        this.changeValue(0, this.getValue, duration)
    },
    changeValue: function(from, to, duration){ 
        if( duration ){
            if( typeof from !== 'undefined' )
                this.setValue(from);
                anime({
                targets: this,
                value: to,
                duration: duration
               } );
        } else {
            this.setValue(to);
        }
    }

});

var Integer = DecimalNumber.extend(/** @lends Integer# */{
    _class: 'Integer', 
    initialize: function Integer(params) {
        params.num_decimal_places = 0;
        DecimalNumber.apply(this, arguments); 
    },
    
    getValue: function(){
        return parseInt(this.number);
    },
   
});


