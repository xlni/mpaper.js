// Please note: When loading mpaper as a normal module installed in node_modules,
// you would use this instead:
// var mpaper = require('mpaper-jsdom-canvas');
var mpaper = require('../../dist/mpaper-full.js');
var scope = require('./Tadpoles.pjs')(new mpaper.Size(1024, 768));

scope.view.exportFrames({
    amount: 400,
    directory: __dirname,
    onComplete: function() {
        console.log('Done exporting.');
    },
    onProgress: function(event) {
        console.log(event.percentage + '% complete, frame took: ' + event.delta);
    }
});
