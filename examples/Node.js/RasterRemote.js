// Please note: When loading mpaper as a normal module installed in node_modules,
// you would use this instead:
// var mpaper = require('mpaper-jsdom-canvas');
var mpaper = require('../../dist/mpaper-core.js');
var fs = require('fs');

var canvas = mpaper.createCanvas(800, 600);
mpaper.setup(canvas);

var url = 'http://assets.paperjs.org/images/marilyn.jpg';
var raster = new mpaper.Raster(url);
raster.position = mpaper.view.center;

raster.onLoad = function() {
    mpaper.view.update();
    console.log('The image has loaded:' + raster.bounds);

    // Saving the canvas to a file.
    out = fs.createWriteStream(__dirname + '/canvas.png');
    stream = canvas.pngStream();

    stream.on('data', function(chunk) {
        out.write(chunk);
    });

    stream.on('end', function() {
        console.log('saved png');
    });
};

raster.onError = function(message) {
    console.error(message);
};
