importScripts('../../dist/mpaper-full.js');
mpaper.install(this);
mpaper.setup([640, 480]);

onmessage = function(event) {
    var data = event.data;
    if (data) {
        var path1 = project.importJSON(data[0]);
        var path2 = project.importJSON(data[1]);
        console.log(path1, path2);
        var result = path1.unite(path2);
        postMessage(result.exportJSON());
    }
};
