# MPaper.js - is an math extension of the popular [Paper.js](https://travis-ci.org/paperjs/mpaper.js)  project

MPaper.js integrate Paper.js with [Anime.js](https://animejs.com/) for animation API. it also borrow some API design ideas and codes from [Manim Community](https://docs.manim.community/en/stable/index.html)
 
Detailed tutorial at [wikipage](https://github.com/xlni/mpaper.js/wiki)
## Tutorial 
### Code Structure-1
 
     
    <head>
        <style> 
            canvas[resize] {
                width: 100%;
                height: 100%; 
            }
            </style>
            <script type="text/javascript" src="../../dist/mpaper-full.min.js"></script>
            <script type="text/paperscript" canvas="canvas">
               
              /** mpaper.js code goes here.....  **/
               
            </script>
        </head>
        <body>
        <canvas id='canvas' resize></canvas>
     </body> 
 

####  your mapper.js code is arranged as the followings:
    /**  
           section before Main, used for global setup,   onFrame, onMouseXXX events handlers are 
            defined here 
    **/
    Main();   
       
    /** code for main scene goes here ... **/

    Scene( 'scene-A' );
    /** code for a scene named 'scene-A' 

    Scene( 'second-life');
    /** code for a scene named 'second-life'  
 

#### available env variable: 
* project  :  current active project
* view     :   current used view
* curPage  :   current Page
* curLayer  :   current Layer this Page belongs to
* curTimeline : current timeline this Page uses.

#### reserved words to control animation workflow.
* Wait(second)  //animation waits for [second] before resuming.
* Pause()       //animation pauses here, until resume event is fired.

#### reserved words for object creation and removing.
* Create(options)
* Uncreate(options)

#### animation effects 
* Focus()
* Indicate()
* Flash()
* Circumscribe()
* ShowPassingFlash()
* Homotopy()
* ApplyingWaves()
* MorphingTo()
As we use Anime.js for controlling animation process, we can directly invoke Anime.js API by using:
* PlayCode()
* Anime()

## some special requirement for coding in mpaper:
* all reserved words starting with UpperCase letter must be at top level. they should not be inside any code blocks,
like {}, or function body, for-loop...
* if we have to use reserved words within code blocks, most of them have corresponding lower-case version. for example: Create -> create, Uncreate -> uncreate.
* all declared variable should omit keyword 'var' as mpaper automatically promote variables into top-level scope.

#### switch among different scenes:
* enterScene( scene-name )  //bring up a new scene 
* leaveScene()        //close current scene

#### working with Latex:
first, we need to include two additional js libraries :

    \<script id="MathJax-script" async src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-svg.js"\><\/script\>
    \<script type="text/javascript" src="../../lib/mathjax-bridge.js"\><\/script\>

##### for   math form, if mixed with text, we use \$\$...\$\$ to specify latex
    item = new Path.Tex({
        content : input,
        scale: 20,
        position: view.center
    })
##### for pure text
    item = new Path.Text({
        content : input,
        scale: 20,
        position: view.center
    })

#### svg morphing:
![latex-morphing](https://user-images.githubusercontent.com/25872192/168629258-8495de05-0117-4263-9cc4-30c6cca7cd48.gif)


## The following sections are for development only.
(some unit testing code is broken, so please use --no-verify flag for dist)

### Installing Paper.js 

The various distributions come with two different pre-build versions of
Paper.js, in minified and normal variants:

- `mpaper-full.js` – The full version for the browser, including PaperScript
  support and Acorn.js
- `mpaper-core.js` – The core version for the browser, without PaperScript
  support nor Acorn.js. You can use this to shave off some bytes and compilation
  time when working with JavaScript directly.

Mpaper.js need Acorn.js and PaperScript from Paper.js to support its functions,
so mpaper-full.js is required.
    
## Development

The main mpaper.js source tree is hosted on
[GitHub](https://github.com/xlni/mpaper.js/). `git` is required to create a
clone of the repository, and can be easily installed through your preferred
package manager on your platform.

### Get the Source

    git clone --recursive git://github.com/xlni/mpaper.js.git
    cd mpaper.js

To refresh your clone and fetch changes from origin, run:

    git fetch origin

To update the `jsdoc-toolkit` submodule, used to generate the documentation,
run:

    git submodule update  --init --recursive

### Setting Up For Building

mpaper.js uses [Gulp.js](https://gulpjs.com/) for building, and has a couple of
dependencies as NPM modules. Please read Paper.js document page for details.

In order to be able to build mpaper.js, after checking out the repository, mpaper
has dependencies that need to be installed. Install them by issuing the
following commands from the mpaper.js directory:

    yarn install

### Building the Library

The Paper.js sources are distributed across many separate files, organised in
subfolders inside the `src` folder. To compile them all into distributable
files, you can run the `build` task:

    yarn build
  
### Other Build Tasks

Create a final zipped distribution file inside the `dist` folder:

    yarn dist

### Branch structure
 
 
## License

Distributed under the MIT license. See 
[LICENSE](https://github.com/xlni/mpaper.js/blob/master/LICENSE.txt)
for details.
