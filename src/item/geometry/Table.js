 
/**
 * @name Table
 *
 * @class The Table  
 * 
 * Parameters:
 @param data   – A 2D array or list of lists. Content of the table has to be a valid input for the callable set in element_to_mobject.

 @param area -  rectangle ? [x, y,  width, height];
 @param  row_labels (Iterable[VMobject] | None) – List of String representing the labels of each row.

@param  col_labels (Iterable[VMobject] | None) – List of String representing the labels of each column.

@param  top_left_entry (VMobject | None) – The top-left entry of the table, can only be specified if row and column labels are given.

@param  v_buff (float) – Vertical buffer passed to arrange_in_grid(), by default 0.8.

@param  h_buff (float) – Horizontal buffer passed to arrange_in_grid(), by default 1.3.

@param  include_outer_lines (bool) – True if the table should include outer lines, by default False.

@param  add_background_rectangles_to_entries (bool) – True if background rectangles should be added to entries, by default False.

@param  cell_bg_color (Color) – Background color of entries if add_background_rectangles_to_entries is True.

 
@param  background_rectangle_color (Color) – Background color of table 
 
@param  col_config  -  column width? by percentage

@param  row_config  - row height by percentage.

@param  line_config (dict) – Dict passed to Line, customizes the lines of the table.
 *
 * @extends R9Line
 */
 var Table = Group.extend(/** @lends Table# */{
    _class: 'Table',
    
    initialize: function Table(params) {
        
        this.row_labels  = params.row_labels || []; 
        this.col_labels = params.col_labels || []; 
        this.top_left_entry  = params.top_left_entry || null; 
        this.v_buff = params.v_buff || 0; 
        this.h_buff = params.h_buff || 0; 
        this.include_outer_lines  = params.include_outer_lines || false; 
        this.add_background_rectangles_to_entries  = params.add_background_rectangles_to_entries || false;
        this.cell_bg_color = params.cell_bg_color || null;  
        this.background_rectangle_color = params.background_rectangle_color || null; 
        this.col_config = params.col_config || {}; 
        this.row_config  = params.row_config || {}; 
        this.text_config  = params.text_config || {}; 
        this.line_config = params.line_config || {}; 
        this.col_lines = [];
        this.row_lines = [];
        this.data_cells = [];
        this.row_label_cells = [];
        this.col_label_cells = [];
        this.top_left_cell = null;
      
        this.bgrect = null;
        Group.apply(this, arguments);
        this. _initialize(params); 

        if( typeof this.area  == 'undefined' ){
            this.area = new Rectangle(0,0, this.data[0].length * 50 +50,  this.data.length * 50 + 50);
        } else if( this.area._class != 'Rectangle' ){ 
            this.area = new Rectangle(this.area);
        }

        this.createTable();
    },
    createTable: function(){
        var lineColor = this.line_config.strokeColor || this._style.strokeColor ||  'black',
            strokeWidth = this.line_config.strokeWidth || this._style.strokeWidth ||  1,
            x = this.area.x, y = this.area.y, w = this.area.width, h = this.area.height,
            data = this.data, numcols = data[0].length, numrows = data.length;

        if( this.include_outer_lines || this.background_rectangle_color != null){
            this.bgrect = new Path.Rectangle(this.area);
            if( this.include_outer_lines ){
                this.bgrect.strokeColor = lineColor;
                this.bgrect.strokeWidth = strokeWidth;
            } else {
                this.bgrect.strokeWidth = 0;
            }
            if( this.background_rectangle_color != null ){
                this.bgrect.fillColor = this.background_rectangle_color;
            }  
            this.bgrect.remove();
            this.addChild(this.bgrect);
        }
        //calculate columns width;
        var accx = x, avg_cw = w / (numcols+1), aline;
        for(var i = 0; i < numcols ; i++){
             accx += this.col_config.length>0? w * this.col_config[i] : avg_cw;
             aline = new R9Line( [accx, y], [accx, y+h]);
             aline.strokeColor = lineColor;
             aline.strokeWidth = strokeWidth; 
             this.col_lines[i] = aline;
             aline.remove();
             this.addChild(aline); 
        }
        var accy = y, avg_ch = h / (numrows+1);
        for(var i = 0; i < numrows  ; i++){
            accy += this.row_config.length>0? h * this.row_config[i] : avg_ch;
            aline = new R9Line( [x, accy], [x + w, accy]);
            aline.strokeColor = lineColor;
            aline.strokeWidth = strokeWidth; 
            this.row_lines[i] = aline;
            aline.remove();
            this.addChild(aline); 
       }
       //add data, data will be used as style text?
       var textColor = this.text_config.strokeColor || this._style.strokeColor ||  'black', 
           fontSize = this.text_config.fontSize || this._style.fontSize || 20;
         
        if( this.top_left_entry ){
            var tobj = this.__addTextObj(this.top_left_entry , textColor, null, fontSize, 0,0);
            this.top_left_cell = tobj;
        }
        if( this.row_labels.length > 0 ){
            for(var i = 0; i < this.row_labels.length; i++){
                var tobj = this.__addTextObj(this.row_labels[i], textColor, null, fontSize, i+1,0);
                this.row_label_cells[i] = tobj;
            }
        }
        if( this.col_labels.length > 0 ){
            for(var i = 0; i < this.col_labels.length; i++){
                var tobj = this.__addTextObj(this.col_labels[i], textColor, null, fontSize, 0, i+1);
                this.col_label_cells[i] = tobj;
            }
        }
        for(var i = 0; i < numrows; i++){ 
            this.data_cells[i] = [];
            for(var j = 0; j < numcols; j++){  
                var tobj = this.__addTextObj(data[i][j], textColor, this.cell_bg_color, fontSize, i+1, j+1);
                this.data_cells[i][j] = tobj;
            }
        } 
    }, 

    __addTextObj: function(data, textColor, cellcolor, fontSize, row, col){
        var r = this._getCellSize(row, col); 
        var tobj = new StyledText({
        //   position: view.center + [0, -200],
            strokeColor: textColor,
            fillColor: textColor,
            justification: 'center',
            fontSize: fontSize,
            bgColor: cellcolor,
            content:  data
        });
       if( cellcolor ){
           var  strokeWidth = this.line_config.strokeWidth || this._style.strokeWidth ||  1;
           tobj.adjustXOffsetByNewWidth(r.width - strokeWidth * 2 -4)
           tobj.adjustYOffsetByNewHeight(r.height - strokeWidth * 2 -4)
       }
        tobj.position =  r.center;
        tobj.remove();
        this.addChild(tobj);
        return tobj;
    },
    /**
     * start from 0,0,  it is different from position for data.
     * (0,0) for top-left cell, (1,1) for cell of data[0]0]
     * @param {*} row  
     * @param {*} col 
     */
    _getCellSize:function( row, col){
        var x = this.area.x, y = this.area.y, w = this.area.width, h = this.area.height,
            numcols = this.data[0].length, numrows = this.data.length;
        var xl = col ==0? x : this.col_lines[col-1].position.x;
        var xr = col == numcols ? x+w : this.col_lines[col].position.x;
        var yt = row==0? y : this.row_lines[row-1].position.y;
        var yb = row== numrows ? y+h: this.row_lines[row].position.y; 
        return new Rectangle(xl, yt, xr - xl , yb - yt );
    },

    _change_row_label:function(color){
        this.row_label_cells.array.forEach(e => {
            e.strokeColor = color;
        });
    },
    _change_col_label:function(color){
        this.col_label_cells.array.forEach(e => {
            e.strokeColor = color;
        });
    },


    _copyExtraAttr: function(source, excludeMatrix){ 
        this.num_rects =  source.num_rects  ;
        this.row_labels  = source.row_labels ; 
        this.col_labels = source.col_labels  ; 
        this.top_left_entry  = source.top_left_entry  ; 
        this.v_buff = source.v_buff  ; 
        this.h_buff = source.h_buff  ; 
        this.include_outer_lines  = source.include_outer_lines ; 
        this.add_background_rectangles_to_entries  = source.add_background_rectangles_to_entries ;
        this.cell_bg_color = source.cell_bg_color; 
        this.include_background_rectangle = source.include_background_rectangle ; 
        this.background_rectangle_color = source.background_rectangle_color  ; 
        this.col_config = source.col_config ; 
        this.row_config  = source.row_config  ; 
        this.line_config = source.line_config  ; 
    },
        
   
    _draw_decro: function(ctx, param, viewMatrix, strokeMatrix) {
     

    },
   
   
});

/**
 * @name NumericTable
 *
 * @class The NumericTable  
 * 
 * additional parameters:
 * @param  fixed   0 means integer, number of decimal points.
 * @param  color_rules a list of rules , in the form: 
 *  {
 *      vstart:   2          if undefined,  negative infinite
 *      vend:     4.5        if undefined,  positive infinite
 *      color:   'red'
 *  }
 * 
 * @extends R9Line
 * 
 */ 
var NumericTable = Table.extend(/** @lends NumericTable# */{
    _class: 'NumericTable',
    
    initialize: function NumericTable(params) {
        this.fixed = params.fixed || 0;
        this.color_rules = params.color_rules || [];
        Table.apply(this, arguments);
    },
    

    add_color_rule:function(start, end, color){
        this.color_rules.push({
            vstart: start,
            vend: end,
            color: color
        });
    },
    get_color_by_rule:function(value, default_color){
       var rules = this.color_rules;
       if( rules.length == 0 ) return default_color;
       for(var i in rules ){
           var r = rules[i];
           if( r.vstart == null || typeof r.vstart == 'undefined'){
               if( r.vend >= value ) return r.color;
           }
           else if( r.vend == null || typeof r.vend == 'undefined'){
               if( r.vstart <= value ) return r.color;
           } else {
               if( r.vstart <= value && r.vend >= value ) return r.color;
           }
       }
       return default_color;
    },
    //override table's implementation
    __addTextObj: function(data, textColor, cellcolor, fontSize, row, col){
        var r = this._getCellSize(row, col), tobj; 
        if( row == 0 || col == 0 ){
            tobj = new StyledText({ 
                strokeColor: textColor,
                fillColor: textColor,
                justification: 'center',
                fontSize: fontSize,
                bgColor: cellcolor,
                content:  data
            });
        } else {
            textColor = this.get_color_by_rule(data, textColor);
            tobj = new DecimalNumber({ 
                strokeColor: textColor,
                fillColor: textColor,
                justification: 'center',
                fontSize: fontSize,
                bgColor: cellcolor,
                num_decimal_places: this.fixed,
                number:  data
            });
        } 
       if( cellcolor ){
           var  strokeWidth = this.line_config.strokeWidth || this._style.strokeWidth ||  1;
           tobj.adjustXOffsetByNewWidth(r.width - strokeWidth * 2 -4)
           tobj.adjustYOffsetByNewHeight(r.height - strokeWidth * 2 -4)
       }
        tobj.position =  r.center;
        tobj.remove();
        this.addChild(tobj);
        return tobj;
    },
    
});