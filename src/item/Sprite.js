/*
 * copy the copy logic from kinetics.js 
 */

/**
 * @name Sprite
 *
 * @class The Sprite item represents an animated image in a Paper.js project.
 * it can has several states
 * 
 *    * @example
     * var imageObj = new Image();
     * imageObj.onload = function() {
     *   var sprite = new  Sprite({ 
     *     image: imageObj,
     *     position: 
     *     animation: 'standing',
     *     animations: {
     *       standing: [
     *         // x, y, width, height (6 frames)
     *         0, 0, 49, 109,
     *         52, 0, 49, 109,
     *         105, 0, 49, 109,
     *         158, 0, 49, 109,
     *         210, 0, 49, 109,
     *         262, 0, 49, 109
     *       ],
     *       kicking: [
     *         // x, y, width, height (6 frames)
     *         0, 109, 45, 98,
     *         45, 109, 45, 98,
     *         95, 109, 63, 98,
     *         156, 109, 70, 98,
     *         229, 109, 60, 98,
     *         287, 109, 41, 98
     *       ]          
     *     },
     *     frameRate: 7,
     *     frameIndex: 0
     *   });
     * };
     * imageObj.src = '/path/to/image.jpg'
 * 
 * 
 * 
 *
 * @extends Item
 */
var Sprite = Item.extend(/** @lends Sprite# */{
    _class: 'Sprite',
    _applyMatrix: false,
    _canApplyMatrix: false,
    // Sprite doesn't make the distinction between the different bounds,
    // so use the same name for all of them
    _boundsOptions: { stroke: false, handle: false },
   
   
    _serializeFields: {
        crossOrigin: null, // NOTE: Needs to be set before source to work!
        source: null, 
        frameIndex: 0,
        frameRate: 0,
        animation: null,
        animations:null, 
    },
    // Prioritize `crossOrigin` over `source`:
    _prioritize: ['crossOrigin'],
    _smoothing: 'low',
    // Enforce creation of beans, as bean getters have hidden parameters.
    // See  #getContext(_change) below.
    beans: true,
  

  
  
    /**
     * Creates a new raster from an object description, and places it in the
     * active layer.
     *
     * @name Sprite#initialize
     * @param {Object} object an object containing properties to be set on the
     *     raster
     *
     * @example {@paperscript height=300}
     * var raster = new Sprite({
     *     image:  
     *     position: view.center,
     *     animation:
     *     animations: 
     *     frameRate:
     *     frameIndex:
     * });
     *  raster.onFrame() =  new function(e){
     *    raster._onFrame(e) 
     * } 
     *
     * raster.scale(0.5);
     * raster.rotate(10);
     */
    initialize: function Sprite(image, position, animation, animations,  frameRate, frameIndex) {
        this._animation = null;
        this._animations = null; 
        this._frameIndex = 0;
        this._frameRate = 0; 
          //flag to indicate animation
        this.running = 0;
        this.lastAniTime = 0;
        this._initialize(image, position, animation, animations, frameRate, frameIndex)  
        if (!this._size) {
            var anim = this.getAnimation(),
            index = this.getFrameIndex(),
            ix4 = index * 4,
            set = this.getAnimations()[anim],
          //  x =      set[ix4 + 0],
          //  y =      set[ix4 + 1],
            width =  set[ix4 + 2],
            height = set[ix4 + 3];
            this._size = new Size({width:width, height:height});
            this._loaded = true;
        }
        this.on('frame', this._onFrame.bind(this));
        this.start();
    },
    _copyExtraAttr: function(source, excludeMatrix){
       this. _frameIndex = source._frameIndex;
       this. _frameRate = source._frameRate;
       this. _animation = source._animation;
       this. _animations = source._animations; 
       this._size = source._size;
       this._loaded = source._loaded;
       this.running = source.running;
       this.lastAniTime = source.lastAniTime;
    },
    

    _updateIndex: function() { 
        var index = this.getFrameIndex(),
            animation = this.getAnimation(),
            animations = this.getAnimations(),
            anim = animations[animation],
            len = anim.length / 4,
            punch = this._isPunch;

        if(index < len - 1) {
            this.setFrameIndex(index + 1);
        }
        else {
            if( punch ){
                if( this._animation_prev ){
                    this._animation = this._animation_prev;
                    this._frameIndex = this._frameIndex_prev;
                } 
                this._isPunch = false;
            } else {
                this.setFrameIndex(0);
            } 
        }
    },
    start: function() {
       this.running = true
    },
    /**
     * stop sprite animation
     * @method
     * @memberof Kinetic.Sprite.prototype
     */
    stop: function() {
        this.running = false
    },
     
    //onFrame: '#_onFrame', 
    /**
     * by default, paperjs invoke it 60 times a second.
     * @returns 
     */
    _onFrame: function(event){
        var that = this;
        if( !that.running  ) return;
        if( 1.0 / this.getFrameRate() <= event.time - this.lastAniTime ){
             this.lastAniTime = event.time
             this._updateIndex(); 
            this._changed(/*#=*/(Change.GEOMETRY | Change.PIXELS));
        }
    },
   
    getFrameIndex: function(){
        return this._frameIndex;
    },
    setFrameIndex: function(frameIndex){
        this._frameIndex = frameIndex;
    },
    getFrameRate: function(){
        return this._frameRate;
    },
    setFrameRate: function(frameRate){
        this._frameRate = frameRate;
    },
    getAnimation: function(){
        return this._animation;
    },
    setAnimation: function(animation, isPunch){
        this._isPunch = isPunch || false;
        if( this._isPunch ){
            this._animation_prev = this._animation;
            this._frameIndex_prev = this._frameIndex; 
        } 
        this._animation = animation; 
        this._frameIndex = 0;
    }, 
    getAnimations: function(){
        return this._animations;
    },
    setAnimations: function(animations){
        this._animations = animations;
    },   
    _equals: function(item) {
        return this.getSource() === item.getSource();
    },

    copyContent: function(source) {
        var image = source._image,
            canvas = source._canvas;
        if (image) {
            this._setImage(image);
        } else if (canvas) {
            // If the Sprite contains a Canvas object, we need to create a new
            // one and draw this raster's canvas on it.
            var copyCanvas = CanvasProvider.getCanvas(source._size);
            copyCanvas.getContext('2d').drawImage(canvas, 0, 0);
            this._setImage(copyCanvas);
        }
        // TODO: Shouldn't this be copied with attributes instead of content?
        this._crossOrigin = source._crossOrigin;
    },

    /**
     * The size of the raster in pixels.
     *
     * @bean
     * @type Size
     */
    getSize: function() {
        var size = this._size;
        return new LinkedSize(size ? size.width : 0, size ? size.height : 0,
                this, 'setSize');
    },

    setSize: function(_size, _clear) {
        var size = Size.read(arguments);
        if (!size.equals(this._size)) { // NOTE: this._size could be null
            if (size.width > 0 && size.height > 0) {
                // Get reference to image before changing canvas.
                var element = !_clear && this.getElement();
                // NOTE: Setting canvas internally sets _size.
                // NOTE: No need to release canvas because #_setImage() does so.
                this._setImage(CanvasProvider.getCanvas(size));
                if (element) {
                    // Draw element back onto the new, resized canvas.
                    this.getContext(true).drawImage(element, 0, 0,
                            size.width, size.height);
                }
            } else {
                // 0-width / height dimensions do not require the creation of
                // an internal canvas. Just reflect the size for now.
                if (this._canvas)
                    CanvasProvider.release(this._canvas);
                this._size = size.clone();
            }
        } else if (_clear) {
            // We can reuse the canvas, but need to clear it.
            this.clear();
        }
    },

    /**
     * The width of the raster in pixels.
     *
     * @bean
     * @type Number
     */
    getWidth: function() {
        return this._size ? this._size.width : 0;
    },

    setWidth: function(width) {
        this.setSize(width, this.getHeight());
    },

    /**
     * The height of the raster in pixels.
     *
     * @bean
     * @type Number
     */
    getHeight: function() {
        return this._size ? this._size.height : 0;
    },

    setHeight: function(height) {
        this.setSize(this.getWidth(), height);
    },

    /**
     * The loading state of the raster image.
     *
     * @bean
     * @type Boolean
     */
    getLoaded: function() {
        return this._loaded;
    },

    isEmpty: function() {
        var size = this._size;
        return !size || size.width === 0 && size.height === 0;
    },

    /**
     * The resolution of the raster at its current size, in PPI (pixels per
     * inch).
     *
     * @bean
     * @type Size
     */
    getResolution: function() {
        var matrix = this._matrix,
            orig = new Point(0, 0).transform(matrix),
            u = new Point(1, 0).transform(matrix).subtract(orig),
            v = new Point(0, 1).transform(matrix).subtract(orig);
        return new Size(
            72 / u.getLength(),
            72 / v.getLength()
        );
    },

    /**
     * @private
     * @bean
     * @deprecated use {@link #resolution} instead.
     */
    getPpi: '#getResolution',

    /**
     * The HTMLImageElement or Canvas element of the raster, if one is
     * associated.
     * Note that for consistency, a {@link #onLoad} event will be triggered on
     * the raster even if the image has already finished loading before, or if
     * we are setting the raster to a canvas.
     *
     * @bean
     * @type HTMLImageElement|HTMLCanvasElement
     */
    getImage: function() {
        return this._image;
    },

    setImage: function(image) {
        var that = this;

        function emit(event) {
            var view = that.getView(),
                type = event && event.type || 'load';
            if (view && that.responds(type)) {
                mpaper = view._scope;
                that.emit(type, new Event(event));
            }
        }

        this._setImage(image);
        if (this._loaded) {
            // Emit load event with a delay, so behavior is the same as when
            // it's actually loaded and we give the code time to install event.
            setTimeout(emit, 0);
        } else if (image) {
            // Trigger the load event on the image once it's loaded
            DomEvent.add(image, {
                load: function(event) {
                    that._setImage(image);
                    emit(event);
                },
                error: emit
            });
        }
    },

    /**
     * Internal version of {@link #setImage(image)} that does not trigger
     * events. This is used by #setImage(), but also in other places where
     * underlying canvases are replaced, resized, etc.
     */
    _setImage: function(image) {
        if (this._canvas)
            CanvasProvider.release(this._canvas);
        // Due to similarities, we can handle both canvas and image types here.
        if (image && image.getContext) {
            // A Canvas object
            this._image = null;
            this._canvas = image;
            this._loaded = true;
        } else {
            // A Image object
            this._image = image;
            this._canvas = null;
            this._loaded = !!(image && image.src && image.complete);
        }
        
        this._context = null;
        this._changed(/*#=*/(Change.GEOMETRY | Change.PIXELS));
    },

    /**
     * The Canvas object of the raster. If the raster was created from an image,
     * accessing its canvas causes the raster to try and create one and draw the
     * image into it. Depending on security policies, this might fail, in which
     * case `null` is returned instead.
     *
     * @bean
     * @type HTMLCanvasElement
     */
    getCanvas: function() {
        if (!this._canvas) {
            var ctx = CanvasProvider.getContext(this._size);
            // Since drawImage into canvas might fail based on security policies
            // wrap the call in try-catch and only set _canvas if we succeeded.
            try {
                if (this._image)
                    ctx.drawImage(this._image, 0, 0);
                this._canvas = ctx.canvas;
            } catch (e) {
                CanvasProvider.release(ctx);
            }
        }
        return this._canvas;
    },

    // #setCanvas() is a simple alias to #setImage()
    setCanvas: '#setImage',

    /**
     * The Canvas 2D drawing context of the raster.
     *
     * @bean
     * @type CanvasRenderingContext2D
     */
    getContext: function(_change) {
        if (!this._context)
            this._context = this.getCanvas().getContext('2d');
        // Support a hidden parameter that indicates if the context will be used
        // to change the Sprite object. We can notify such changes ahead since
        // they are only used afterwards for redrawing.
        if (_change) {
            // Also set _image to null since the Sprite stops representing it.
            // NOTE: This should theoretically be in our own _changed() handler
            // for ChangeFlag.PIXELS, but since it's only happening in one place
            // this is fine:
            this._image = null;
            this._changed(/*#=*/Change.PIXELS);
        }
        return this._context;
    },

    setContext: function(context) {
        this._context = context;
    },

    /**
     * The source of the raster, which can be set using a DOM Image, a Canvas,
     * a data url, a string describing the URL to load the image from, or the
     * ID of a DOM element to get the image from (either a DOM Image or a
     * Canvas). Reading this property will return the url of the source image or
     * a data-url.
     * Note that for consistency, a {@link #onLoad} event will be triggered on
     * the raster even if the image has already finished loading before.
     *
     * @bean
     * @type HTMLImageElement|HTMLCanvasElement|String
     *
     * @example {@paperscript}
     * var raster = new Sprite();
     * raster.source = 'http://paperjs.org/about/mpaper-js.gif';
     * raster.position = view.center;
     *
     * @example {@paperscript}
     * var raster = new Sprite({
     *     source: 'http://paperjs.org/about/mpaper-js.gif',
     *     position: view.center
     * });
     */
    getSource: function() {
        var image = this._image;
        return image && image.src || this.toDataURL();
    },

    setSource: function(src) {
        var image = new self.Image(),
            crossOrigin = this._crossOrigin;
        if (crossOrigin)
            image.crossOrigin = crossOrigin;
        // Prevent setting image source to `null`, as this isn't supported by
        // browsers, and it would actually throw exceptions in JSDOM.
        // TODO: Look into fixing this bug in JSDOM.
        if (src)
            image.src = src;
        this.setImage(image);
    },

    /**
     * The crossOrigin value to be used when loading the image resource, in
     * order to support CORS. Note that this needs to be set before setting the
     * {@link #source} property in order to always work (e.g. when the image is
     * cached in the browser).
     *
     * @bean
     * @type String
     *
     * @example {@paperscript}
     * var raster = new Sprite({
     *     crossOrigin: 'anonymous',
     *     source: 'http://assets.paperjs.org/images/marilyn.jpg',
     *     position: view.center
     * });
     *
     * console.log(view.element.toDataURL('image/png').substring(0, 32));
     */
    getCrossOrigin: function() {
        var image = this._image;
        return image && image.crossOrigin || this._crossOrigin || '';
    },

    setCrossOrigin: function(crossOrigin) {
        this._crossOrigin = crossOrigin;
        var image = this._image;
        if (image)
            image.crossOrigin = crossOrigin;
    },

    /**
     * Determines if the raster is drawn with pixel smoothing when scaled up or
     * down, and if so, at which quality its pixels are to be smoothed. The
     * settings of this property control both the `imageSmoothingEnabled` and
     * `imageSmoothingQuality` properties of the `CanvasRenderingContext2D`
     * interface.
     *
     * By default, smoothing is enabled at `'low'` quality. It can be set to of
     * `'off'` to scale the raster's pixels by repeating the nearest neighboring
     * pixels, or to `'low'`, `'medium'` or `'high'` to control the various
     * degrees of available image smoothing quality.
     *
     * For backward compatibility, it can can also be set to `false` (= `'off'`)
     * or `true` (= `'low'`).
     *
     * @bean
     * @type String
     * @default 'low'
     * @values 'low', 'medium', 'high', 'off'
     *
     * @example {@paperscript} var raster = new Sprite({source:
     * 'http://assets.paperjs.org/images/marilyn.jpg', smoothing: 'off'
     * });
     * raster.scale(5);
     */
    getSmoothing: function() {
        return this._smoothing;
    },

    setSmoothing: function(smoothing) {
        this._smoothing = typeof smoothing === 'string'
            ? smoothing
            : smoothing ? 'low' : 'off';
        this._changed(/*#=*/Change.ATTRIBUTE);
    },

    // DOCS: document Sprite#getElement
    getElement: function() {
        // Only return the internal element if the content is actually ready.
        return this._canvas || this._loaded && this._image;
    }
}, /** @lends Sprite# */{
    // Explicitly deactivate the creation of beans, as we have functions here
    // that look like bean getters but actually read arguments.
    // See #getSubCanvas(), #getSubRaster(), #getSubRaster(), #getPixel(),
    // #getImageData()
    beans: false,

    /**
     * Extracts a part of the Sprite's content as a sub image, and returns it as
     * a Canvas object.
     *
     * @param {Rectangle} rect the boundaries of the sub image in pixel
     * coordinates
     *
     * @return {HTMLCanvasElement} the sub image as a Canvas object
     */
    getSubCanvas: function(/* rect */) {
        var rect = Rectangle.read(arguments),
            ctx = CanvasProvider.getContext(rect.getSize());
        ctx.drawImage(this.getCanvas(), rect.x, rect.y,
                rect.width, rect.height, 0, 0, rect.width, rect.height);
        return ctx.canvas;
    },

    /**
     * Extracts a part of the raster item's content as a new raster item, placed
     * in exactly the same place as the original content.
     *
     * @param {Rectangle} rect the boundaries of the sub raster in pixel
     * coordinates
     *
     * @return {Sprite} the sub raster as a newly created raster item
     */
    getSubRaster: function(/* rect */) {
        var rect = Rectangle.read(arguments),
            raster = new Sprite(Item.NO_INSERT);
        raster._setImage(this.getSubCanvas(rect));
        raster.translate(rect.getCenter().subtract(this.getSize().divide(2)));
        raster._matrix.prepend(this._matrix);
        raster.insertAbove(this);
        return raster;
    },

    /**
     * Returns a Base 64 encoded `data:` URL representation of the raster.
     *
     * @return {String}
     */
    toDataURL: function() {
        // See if the linked image is base64 encoded already, if so reuse it,
        // otherwise try using canvas.toDataURL()
        var image = this._image,
            src = image && image.src;
        if (/^data:/.test(src))
            return src;
        var canvas = this.getCanvas();
        return canvas ? canvas.toDataURL.apply(canvas, arguments) : null;
    },

    /**
     * Draws an image on the raster.
     *
     * @param {CanvasImageSource} image
     * @param {Point} point the offset of the image as a point in pixel
     * coordinates
     */
    drawImage: function(image /*, point */) {
        var point = Point.read(arguments, 1);
        this.getContext(true).drawImage(image, point.x, point.y);
    },
 
      
    /**
     * {@grouptitle Pixels}
     * Gets the color of a pixel in the raster.
     *
     * @name Sprite#getPixel
     * @function
     * @param {Number} x the x offset of the pixel in pixel coordinates
     * @param {Number} y the y offset of the pixel in pixel coordinates
     * @return {Color} the color of the pixel
     */
    /**
     * Gets the color of a pixel in the raster.
     *
     * @name Sprite#getPixel
     * @function
     * @param {Point} point the offset of the pixel as a point in pixel
     *     coordinates
     * @return {Color} the color of the pixel
     */
    getPixel: function(/* point */) {
        var point = Point.read(arguments);
        var data = this.getContext().getImageData(point.x, point.y, 1, 1).data;
        // Alpha is separate now:
        return new Color('rgb', [data[0] / 255, data[1] / 255, data[2] / 255],
                data[3] / 255);
    },

    /**
     * Sets the color of the specified pixel to the specified color.
     *
     * @name Sprite#setPixel
     * @function
     * @param {Number} x the x offset of the pixel in pixel coordinates
     * @param {Number} y the y offset of the pixel in pixel coordinates
     * @param {Color} color the color that the pixel will be set to
     */
    /**
     * Sets the color of the specified pixel to the specified color.
     *
     * @name Sprite#setPixel
     * @function
     * @param {Point} point the offset of the pixel as a point in pixel
     *     coordinates
     * @param {Color} color the color that the pixel will be set to
     */
    setPixel: function(/* point, color */) {
        var args = arguments,
            point = Point.read(args),
            color = Color.read(args),
            components = color._convert('rgb'),
            alpha = color._alpha,
            ctx = this.getContext(true),
            imageData = ctx.createImageData(1, 1),
            data = imageData.data;
        data[0] = components[0] * 255;
        data[1] = components[1] * 255;
        data[2] = components[2] * 255;
        data[3] = alpha != null ? alpha * 255 : 255;
        ctx.putImageData(imageData, point.x, point.y);
    },

    /**
     * Clears the image, if it is backed by a canvas.
     */
    clear: function() {
        var size = this._size;
        this.getContext(true).clearRect(0, 0, size.width + 1, size.height + 1);
    },

    // DOCS: document Sprite#createImageData
    /**
     * {@grouptitle Image Data}
     * @param {Size} size
     * @return {ImageData}
     */
    createImageData: function(/* size */) {
        var size = Size.read(arguments);
        return this.getContext().createImageData(size.width, size.height);
    },

    // DOCS: document Sprite#getImageData
    /**
     * @param {Rectangle} rect
     * @return {ImageData}
     */
    getImageData: function(/* rect */) {
        var rect = Rectangle.read(arguments);
        if (rect.isEmpty())
            rect = new Rectangle(this._size);
        return this.getContext().getImageData(rect.x, rect.y,
                rect.width, rect.height);
    },

    // DOCS: document Sprite#putImageData
    /**
     * @param {ImageData} data
     * @param {Point} point
     */
    putImageData: function(data /*, point */) {
        var point = Point.read(arguments, 1);
        this.getContext(true).putImageData(data, point.x, point.y);
    },

    // DOCS: document Sprite#setImageData
    /**
     * @param {ImageData} data
     */
    setImageData: function(data) {
        this.setSize(data);
        this.getContext(true).putImageData(data, 0, 0);
    },

    /**
     * {@grouptitle Event Handlers}
     *
     * The event handler function to be called when the underlying image has
     * finished loading and is ready to be used. This is also triggered when
     * the image is already loaded, or when a canvas is used instead of an
     * image.
     *
     * @name Sprite#onLoad
     * @property
     * @type ?Function
     *
     * @example
     * var url = 'http://assets.paperjs.org/images/marilyn.jpg';
     * var raster = new Sprite(url);
     *
     * // If you create a Sprite using a url, you can use the onLoad
     * // handler to do something once it is loaded:
     * raster.onLoad = function() {
     *     console.log('The image has finished loading.');
     * };
     *
     * // As with all events in mpaper.js, you can also use this notation instead
     * // to install multiple handlers:
     * raster.on('load', function() {
     *     console.log('Now the image is definitely ready.');
     * });
     */

    /**
     *
     * The event handler function to be called when there is an error loading
     * the underlying image.
     *
     * @name Sprite#onError
     * @property
     * @type ?Function
     */

    _getBounds: function(matrix, options) {
        var rect = new Rectangle(this._size).setCenter(0, 0);
        return matrix ? matrix._transformBounds(rect) : rect;
    },

    _hitTestSelf: function(point) {
        if (this._contains(point)) {
            var that = this;
            return new HitResult('pixel', that, {
                offset: point.add(that._size.divide(2)).round(),
                // Inject as Straps.js accessor, so #toString renders well too
                color: {
                    get: function() {
                        return that.getPixel(this.offset);
                    }
                }
            });
        }
    },

    _draw: function(ctx, param, viewMatrix) {
        var element = this.getElement();
        // Only draw if image is not empty (#1320).
        if (element && element.width > 0 && element.height > 0) {
            // Handle opacity for Rasters separately from the rest, since
            // Rasters never draw a stroke. See Item#draw().
            ctx.globalAlpha = Numerical.clamp(this._opacity, 0, 1);

            // Call _setStyles() to make sure shadow is drawn (#1437).
            this._setStyles(ctx, param, viewMatrix);

            // `Sprite#smoothing` controlls both the `imageSmoothingQuality`
            // and `imageSmoothingEnabled` canvas context properties:
            var smoothing = this._smoothing,
                disabled = smoothing === 'off';
            DomElement.setPrefixed(
                ctx,
                disabled ? 'imageSmoothingEnabled' : 'imageSmoothingQuality',
                disabled ? false : smoothing
            );
            var anim = this.getAnimation(),
            index = this.getFrameIndex(),
            ix4 = index * 4,
            set = this.getAnimations()[anim],
            x =      set[ix4 + 0],
            y =      set[ix4 + 1],
            width =  set[ix4 + 2],
            height = set[ix4 + 3];
            ctx.translate(  -this._size.width / 2, -this._size.height / 2 );
            ctx.drawImage(element,  x, y, width, height, 0, 0, width, height );
            ctx.translate(   this._size.width / 2,  this._size.height / 2 );
        }
    },

    _canComposite: function() {
        return true;
    }
});
 
//CoreUtils.addGetterSetter(Sprite, 'frameIndex', 0);
//CoreUtils.addGetterSetter(Sprite, 'frameRate', 0);
//CoreUtils.addGetterSetter(Sprite, 'animation' );
//CoreUtils.addGetterSetter(Sprite, 'animations' );
//CoreUtils.addGetterSetter(Sprite, 'image'  );
//CoreUtils.backCompat( Sprite, {
 //   index: 'frameIndex',
 //   getIndex: 'getFrameIndex',
 //   setIndex: 'setFrameIndex'
//});

