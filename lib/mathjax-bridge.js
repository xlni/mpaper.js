(function () {
   if(!window.tex2svg){
        window.tex2svg = function(input, options,callback){
            MathJax.texReset();
            options = options || {};
            options.display = false; 
            if( callback )
                return  MathJax.tex2svgPromise(input, options).then(function (node) { 
                    callback(node.getElementsByTagName('svg')[0])
                    }).catch(function (err) {
                    callback(null);
                    }) ;
            else
                return  MathJax.tex2svg(input, options ).getElementsByTagName('svg')[0];
        };
      }
  })();