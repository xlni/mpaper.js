// Please note: When loading mpaper as a normal module installed in node_modules,
// you would use this instead:
// var mpaper = require('mpaper-jsdom-canvas');
var mpaper = require('../../dist/mpaper-core.js');

mpaper.setup(new mpaper.Size(300, 600));
mpaper.project.importSVG('in.svg', {
    onLoad: function(item) {
        mpaper.view.exportFrames({
            amount: 1,
            directory: __dirname,
            onComplete: function() {
                console.log('Done exporting.');
            },
            onProgress: function(event) {
                console.log(event.percentage + '% complete, frame took: ' + event.delta);
            }
        });
    },
    onError: function(message) {
        console.error(message);
    }
});
