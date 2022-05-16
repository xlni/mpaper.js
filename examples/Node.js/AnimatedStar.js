// Please note: When loading mpaper as a normal module installed in node_modules,
// you would use this instead:
// var mpaper = require('mpaper-jsdom-canvas');
var mpaper = require('../../dist/mpaper-core.js');
mpaper.setup(new mpaper.Size(1024, 768));

var layer = mpaper.project.activeLayer;

var values = {
    count: 34,
    points: 32
};

initialize();

mpaper.view.exportFrames({
    amount: 100,
    directory: __dirname,
    onComplete: function() {
        console.log('Done exporting.');
    },
    onProgress: function(event) {
        console.log(event.percentage + '% complete, frame took: ' + event.delta);
    }
});

function initialize() {
    for (var i = 0; i < values.count; i++) {
        var offset = new mpaper.Point(20 + 10 * i, 0);
        var path = new mpaper.Path();
        path.fillColor = i % 2 ? 'red' : 'black';
        path.closed = true;

        var l = offset.length;
        for (var j = 0; j < values.points * 2; j++) {
            offset.angle += 360 / values.points;
            var vector = offset.normalize(l * (j % 2 ? 0.1 : -0.1));
            path.add(offset.add(vector));
        }
        path.smooth();
        layer.insertChild(0, path);
    }
    layer.fitBounds(mpaper.view.bounds);
}

mpaper.view.onFrame = function(event) {
    for (var i = 0, l = layer.children.length; i < l; i++) {
        var item = layer.children[i];
        var angle = (values.count - i) * Math.sin(event.count / 128) / 10;
        item.rotate(angle);
    }
};
