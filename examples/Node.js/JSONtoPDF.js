// Please note: When loading mpaper as a normal module installed in node_modules,
// you would use this instead:
// var mpaper = require('mpaper-jsdom-canvas');
var mpaper = require('../../dist/mpaper-core.js');
var path = require('path');
var fs = require('fs');

var canvas = mpaper.createCanvas(612, 792, 'pdf');
mpaper.setup(canvas);
fs.readFile('./in.json', { encoding: 'utf8' }, function (err, data) {
    if (err)
        throw err;
    mpaper.project.importJSON(data);
    mpaper.view.update();
    fs.writeFile(path.resolve('./out.pdf'), canvas.toBuffer(), function (err) {
        if (err)
            throw err;
        console.log('Saved!');
    });
});
