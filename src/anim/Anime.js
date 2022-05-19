// Defaults

const defaultInstanceSettings = {
  update: null,
  begin: null,
  loopBegin: null,
  changeBegin: null,
  change: null,
  changeComplete: null,
  loopComplete: null,
  complete: null,
  loop: 1,
  direction: 'normal',
  autoplay: true,
  timelineOffset: 0, 
  eventFunc: null,  //added for event
  eventFuncParams: null, 

}

const defaultTweenSettings = {
  duration: 1.0,
  delay: 0,
  endDelay: 0,
  easing: 'linear',
 // easing: 'easeOutElastic(1, .5)',
  round: 0,
  positionFunc: null, 
  progressFunc: null,
}
 

// Utils

function minMax(val, min, max) {
  return Math.min(Math.max(val, min), max);
}

function stringContains(str, text) {
  return str.indexOf(text) > -1;
}

function applyArguments(func, args) {
  return func.apply(null, args);
}

const is = { 
  cps: a => a && a._class && ( a._class == 'Color' || a._class == 'Size' || a._class == 'Point'),
  arr: a => Array.isArray(a),
  obj: a => stringContains(Object.prototype.toString.call(a), 'Object'),  
  str: a => typeof a === 'string',
  fnc: a => typeof a === 'function',
  und: a => typeof a === 'undefined',
  nil: a => is.und(a) || a === null, 
  hex: a => /(^#[0-9A-F]{6}$)|(^#[0-9A-F]{3}$)/i.test(a),
  rgb: a => /^rgb/.test(a),
  hsl: a => /^hsl/.test(a),
  cnm: a => /(red|green|blue|white|black|gray|pink|yellow|orange)/ig.test(a),
  col: a => ( a._class === 'Color' || is.hex(a) || is.rgb(a) || is.hsl(a) || is.cnm(a) ),
  key: a => !defaultInstanceSettings.hasOwnProperty(a) && !defaultTweenSettings.hasOwnProperty(a) && a !== 'targets' && a !== 'keyframes',
  exluded: a => is.str(a) && ( a == 'rotation' )
}
function colorToRgb(val) {
  if( val._class === 'Color' ) return val.toCSS();
  if (is.rgb(val)) return rgbToRgba(val);
  if (is.hex(val)) return hexToRgba(val);
  if (is.hsl(val)) return hslToRgba(val);
  if (is.cnm(val)) return nameToRgba(val); 
}

// Colors
function rgbToRgba(rgbValue) {
  const rgb = /rgb\((\d+,\s*[\d]+,\s*[\d]+)\)/g.exec(rgbValue);
  return rgb ? `rgba(${rgb[1]},1)` : rgbValue;
}

function nameToRgba(colorName) {
  let c = colorName;//.toLowerCase();
  const rgb = { red: '255,0,0', green: '0,255,0', blue: '0,0,255', white: '255,255,255', black: '0,0,0', gray: '192,192,192', pink: '255,192,203', yellow:'255,255,0', orange:'255,127,0' };
  return rgb[c] ? `rgba(${rgb[c]},1)` : 'rgba(0,0,0,1)';
}

function rgbToRgba(rgbValue) {
  const rgb = /rgb\((\d+,\s*[\d]+,\s*[\d]+)\)/g.exec(rgbValue);
  return rgb ? `rgba(${rgb[1]},1)` : rgbValue;
}

function hexToRgba(hexValue) {
  const rgx = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
  const hex = hexValue.replace(rgx, (m, r, g, b) => r + r + g + g + b + b );
  const rgb = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  const r = parseInt(rgb[1], 16);
  const g = parseInt(rgb[2], 16);
  const b = parseInt(rgb[3], 16);
  return `rgba(${r},${g},${b},1)`;
}

function hslToRgba(hslValue) {
  const hsl = /hsl\((\d+),\s*([\d.]+)%,\s*([\d.]+)%\)/g.exec(hslValue) || /hsla\((\d+),\s*([\d.]+)%,\s*([\d.]+)%,\s*([\d.]+)\)/g.exec(hslValue);
  const h = parseInt(hsl[1], 10) / 360;
  const s = parseInt(hsl[2], 10) / 100;
  const l = parseInt(hsl[3], 10) / 100;
  const a = hsl[4] || 1;
  function hue2rgb(p, q, t) {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1/6) return p + (q - p) * 6 * t;
    if (t < 1/2) return q;
    if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
    return p;
  }
  let r, g, b;
  if (s == 0) {
    r = g = b = l;
  } else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }
  return `rgba(${r * 255},${g * 255},${b * 255},${a})`;
}


// Easings

function parseEasingParameters(string) {
  const match = /\(([^)]+)\)/.exec(string);
  return match ? match[1].split(',').map(p => parseFloat(p)) : [];
}
    

// Spring solver inspired by Webkit Copyright © 2016 Apple Inc. All rights reserved. https://webkit.org/demos/spring/spring.js

function spring(string, duration) {

  const params = parseEasingParameters(string);
  const mass = minMax(is.und(params[0]) ? 1 : params[0], .1, 100);
  const stiffness = minMax(is.und(params[1]) ? 100 : params[1], .1, 100);
  const damping = minMax(is.und(params[2]) ? 10 : params[2], .1, 100);
  const velocity = minMax(is.und(params[3]) ? 0 : params[3], .1, 100);
  const w0 = Math.sqrt(stiffness / mass);
  const zeta = damping / (2 * Math.sqrt(stiffness * mass));
  const wd = zeta < 1 ? w0 * Math.sqrt(1 - zeta * zeta) : 0;
  const a = 1;
  const b = zeta < 1 ? (zeta * w0 + -velocity) / wd : -velocity + w0;

  function solver(t) {
    let progress = duration ? (duration * t) / 1.0 : t;
    if (zeta < 1) {
      progress = Math.exp(-progress * zeta * w0) * (a * Math.cos(wd * progress) + b * Math.sin(wd * progress));
    } else {
      progress = (a + b * progress) * Math.exp(-progress * w0);
    }
    if (t === 0 || t === 1) return t;
    return 1 - progress;
  }

  function getDuration() {
    const cached = cache.springs[string];
    if (cached) return cached;
    const frame = 1 / 6;
    let elapsed = 0;
    let rest = 0;
    while (true) {
      elapsed += frame;
      if (solver(elapsed) === 1) {
        rest++;
        if (rest >= 16) break;
      } else {
        rest = 0;
      }
    }
    const duration = elapsed * frame * 1.0;
    cache.springs[string] = duration;
    return duration;
  }

  return duration ? solver : getDuration;

}

// BezierEasing https://github.com/gre/bezier-easing

const bezier = (() => {

  const kSplineTableSize = 11;
  const kSampleStepSize = 1.0 / (kSplineTableSize - 1.0);

  function A(aA1, aA2) { return 1.0 - 3.0 * aA2 + 3.0 * aA1 };
  function B(aA1, aA2) { return 3.0 * aA2 - 6.0 * aA1 };
  function C(aA1) { return 3.0 * aA1 };

  function calcBezier(aT, aA1, aA2) { return ((A(aA1, aA2) * aT + B(aA1, aA2)) * aT + C(aA1)) * aT };
  function getSlope(aT, aA1, aA2) { return 3.0 * A(aA1, aA2) * aT * aT + 2.0 * B(aA1, aA2) * aT + C(aA1) };

  function binarySubdivide(aX, aA, aB, mX1, mX2) {
    let currentX, currentT, i = 0;
    do {
      currentT = aA + (aB - aA) / 2.0;
      currentX = calcBezier(currentT, mX1, mX2) - aX;
      if (currentX > 0.0) { aB = currentT } else { aA = currentT };
    } while (Math.abs(currentX) > 0.0000001 && ++i < 10);
    return currentT;
  }

  function newtonRaphsonIterate(aX, aGuessT, mX1, mX2) {
    for (let i = 0; i < 4; ++i) {
      const currentSlope = getSlope(aGuessT, mX1, mX2);
      if (currentSlope === 0.0) return aGuessT;
      const currentX = calcBezier(aGuessT, mX1, mX2) - aX;
      aGuessT -= currentX / currentSlope;
    }
    return aGuessT;
  }

  function bezier(mX1, mY1, mX2, mY2) {

    if (!(0 <= mX1 && mX1 <= 1 && 0 <= mX2 && mX2 <= 1)) return;
    let sampleValues = new Float32Array(kSplineTableSize);

    if (mX1 !== mY1 || mX2 !== mY2) {
      for (let i = 0; i < kSplineTableSize; ++i) {
        sampleValues[i] = calcBezier(i * kSampleStepSize, mX1, mX2);
      }
    }

    function getTForX(aX) {

      let intervalStart = 0;
      let currentSample = 1;
      const lastSample = kSplineTableSize - 1;

      for (; currentSample !== lastSample && sampleValues[currentSample] <= aX; ++currentSample) {
        intervalStart += kSampleStepSize;
      }

      --currentSample;

      const dist = (aX - sampleValues[currentSample]) / (sampleValues[currentSample + 1] - sampleValues[currentSample]);
      const guessForT = intervalStart + dist * kSampleStepSize;
      const initialSlope = getSlope(guessForT, mX1, mX2);

      if (initialSlope >= 0.001) {
        return newtonRaphsonIterate(aX, guessForT, mX1, mX2);
      } else if (initialSlope === 0.0) {
        return guessForT;
      } else {
        return binarySubdivide(aX, intervalStart, intervalStart + kSampleStepSize, mX1, mX2);
      }

    }

    return x => {
      if (mX1 === mY1 && mX2 === mY2) return x;
      if (x === 0 || x === 1) return x;
      return calcBezier(getTForX(x), mY1, mY2);
    }

  }

  return bezier;

})();

function steps(steps = 10) {
  return t => Math.ceil((minMax(t, 0.000001, 1)) * steps) * (1 / steps);
} 
  
const penner = (() => {

  // Based on jQuery UI's implemenation of easing equations from Robert Penner (http://www.robertpenner.com/easing)

  const eases = { linear: () => t => t };

  const functionEasings = {
    Sine: () => t => 1 - Math.cos(t * Math.PI / 2),
    Circ: () => t => 1 - Math.sqrt(1 - t * t),
    Back: () => t => t * t * (3 * t - 2),
    Bounce: () => t => {
      let pow2, b = 4;
      while (t < ((pow2 = Math.pow(2, --b)) - 1) / 11) { };
      return 1 / Math.pow(4, 3 - b) - 7.5625 * Math.pow((pow2 * 3 - 2) / 22 - t, 2)
    },
    Elastic: (amplitude = 1, period = .5) => {
      const a = minMax(amplitude, 1, 10);
      const p = minMax(period, .1, 2);
      return t => {
        return (t === 0 || t === 1) ? t :
          -a * Math.pow(2, 10 * (t - 1)) * Math.sin((((t - 1) - (p / (Math.PI * 2) * Math.asin(1 / a))) * (Math.PI * 2)) / p);
      }
    }
  }

  const baseEasings = ['Quad', 'Cubic', 'Quart', 'Quint', 'Expo'];

  baseEasings.forEach((name, i) => {
    functionEasings[name] = () => t => Math.pow(t, i + 2);
  });

  Object.keys(functionEasings).forEach(name => {
    const easeIn = functionEasings[name];
    eases['easeIn' + name] = easeIn;
    eases['easeOut' + name] = (a, b) => t => 1 - easeIn(a, b)(1 - t);
    eases['easeInOut' + name] = (a, b) => t => t < 0.5 ? easeIn(a, b)(t * 2) / 2 :
      1 - easeIn(a, b)(t * -2 + 2) / 2;
    eases['easeOutIn' + name] = (a, b) => t => t < 0.5 ? (1 - easeIn(a, b)(1 - t * 2)) / 2 :
      (easeIn(a, b)(t * 2 - 1) + 1) / 2;
  });

  return eases;

})();

function parseEasings(easing, duration) {
  if (is.fnc(easing)) return easing;
  const name = easing.split('(')[0];
  const ease = penner[name];
  const args = parseEasingParameters(easing);
  switch (name) {
    case 'spring': return spring(easing, duration);
    case 'cubicBezier': return applyArguments(bezier, args);
    case 'steps': return applyArguments(steps, args);
    default: return applyArguments(ease, args);
  }
}

// Strings

function selectString(str) {
  try {
    let nodes = document.querySelectorAll(str);
    return nodes;
  } catch(e) {
    return;
  }
}

// Arrays

function filterArray(arr, callback) {
  const len = arr.length;
  const thisArg = arguments.length >= 2 ? arguments[1] : void 0;
  const result = [];
  for (let i = 0; i < len; i++) {
    if (i in arr) {
      const val = arr[i];
      if (callback.call(thisArg, val, i, arr)) {
        result.push(val);
      }
    }
  }
  return result;
}

function flattenArray(arr) {
  return arr.reduce((a, b) => a.concat(is.arr(b) ? flattenArray(b) : b), []);
}

function toArray(o) {
  if (is.arr(o)) return o;
  if (is.str(o)) o = selectString(o) || o;
  if (o instanceof NodeList || o instanceof HTMLCollection) return [].slice.call(o);
  return [o];
}

function arrayContains(arr, val) {
  return arr.some(a => a === val);
}

// Objects

function cloneObject(o) {
  const clone = {};
  for (let p in o) clone[p] = o[p];
  return clone;
}

function replaceObjectProps(o1, o2) {
  const o = cloneObject(o1);
  for (let p in o1) o[p] = o2.hasOwnProperty(p) ? o2[p] : o1[p];
  return o;
}

function mergeObjects(o1, o2) {
  const o = cloneObject(o1);
  for (let p in o2) o[p] = is.und(o1[p]) ? o2[p] : o1[p];
  return o;
}
 
// Values

function getFunctionValue(val, animatable) {
  if (!is.fnc(val) || is.cps(val) ) return val;
  if( typeof animatable.target)
  return val(animatable.target, animatable.id, animatable.total);
}
  

function getOriginalTargetValue(target, propName , state) {
    return  _getState(target, propName, state);
}
function _getState(target, key, state) { 
  var path =  _parseKey(key),
      current = _getProperty(target, path),
      value;
  if (state && !is.exluded(state)) {
      var resolved = _resolveValue(current, state);
      // Temporarily set the resolved value, so we can retrieve the
      // coerced value from mpaper's internal magic.
      _setProperty(target, path, resolved);  
      value = _getProperty(target, path);
      // Clone the value if possible to prevent future changes.
      value = value && value.clone ? value.clone() : value;
      _setProperty(target, path, current);  
  } else {
      // We want to get the current state at the time of the call, so
      // we have to clone if possible to prevent future changes.
      value = current && current.clone ? current.clone() : current;
  }
  return value; 
} 

function _parseKey(key) {
  var  path = key
              // Convert from JS property access notation to JSON pointer:
              .replace(/\.([^.]*)/g, '/$1')
              // Expand array property access notation ([])
              .replace(/\[['"]?([^'"\]]*)['"]?\]/g, '/$1');
  return path.split('/'); 
}
function _resolveValue(current, value) {
  if (value) {
      if (Array.isArray(value) && value.length === 2) {
          var operator = value[0];
          return (
              operator &&
              operator.match &&
              // We're (unnecessarily) escaping '*/' here to not confuse
              // the ol' JSDoc parser...
              operator.match(/^[+\-\*\/]=/)
          )
              ?  _calculate(current, operator[0], value[1])
              : value;
      } else if (typeof value === 'string') {
          var match = value.match(/^[+\-*/]=(.*)/);
          if (match) {
              var parsed = JSON.parse(match[1].replace(
                  /(['"])?([a-zA-Z0-9_]+)(['"])?:/g,
                  '"$2": '
              ));
              return  _calculate(current, value[0], parsed);
          }
      }
  }
  return value;
}

function _calculate(left, operator, right) {
  return mpaper.PaperScript.calculateBinary(left, operator, right);
}

function _getProperty(target, path, offset) {
  var obj = target, prev = target;
  for (var i = 0, l = path.length - (offset || 0); i < l && obj; i++) {
      prev  = obj;
      obj = obj[path[i]];
  }
  return typeof obj == 'function' ? obj.apply(prev) : obj;
} 

function _setProperty (target, path, value) {
  var dest = _getProperty(target, path, 1);
  if (dest) {
      dest[path[path.length - 1]] = value;
  }
}


function getRelativeValue(to, from) {
  if( is.cps( from ) ){
      if( is.arr( to ) ){
        if( from._class = 'Point' ) return new Point( to );
        if( from._class = 'Color' ) return new Color( to );
        if( from._class = 'Size' ) return new Size( to ); 
      } 
  } 
  if( is.str( to ) && to[0] == '=' && to[1] != '=' ){
     const y0 =  to.substring(1).split(','); 
     if( from._class = 'Point' ) return new Point( y0 );
     if( from._class = 'Color' ) return new Color( y0 );
     if( from._class = 'Size' ) return new Size( y0 ); 
  }
  const operator = /^(\*=|\+=|-=|\/=|==)/.exec(to);
  if (!operator) return to; 
  if( is.cps( from ) ){
      const yy =  to.replace(operator[0], '').slice(1, -1).split(','); 
      let toobj;
      if( from._class = 'Point' ) toobj = new Point( yy );
      if( from._class = 'Color' ) toobj = new Color( yy );
      if( from._class = 'Size' ) toobj = new Size( yy ); 
      switch (operator[0][0]) {
        case '+': return from.__add(toobj);
        case '-': return from.__subtract(toobj);
        case '*': return from.__multiply(toobj);
        case '\/': return from.__divide(toobj);
      }
  }

  const x = parseFloat(from);
  const y = parseFloat(to.replace(operator[0], ''));
  switch (operator[0][0]) {
    case '+': return x + y  ;
    case '-': return x - y  ;
    case '*': return x * y  ;
    case '\/': return x / y  ;
    case '=': return -x;      //== means start at the same time as previous one.
  }
}
function validateValue(val) {
  if( typeof val == 'string' && is.col(val) ) 
      return colorToRgb(val); 
  if( typeof val == 'object' && val._class === 'Color' )
      return colorToRgb(val);
  return val + '';
}

function decomposeValue( val ) {
  // const rgx = /-?\d*\.?\d+/g; // handles basic numbers
  // const rgx = /[+-]?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?/g; // handles exponents notation
  const rgx = /[+-]?\d*\.?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?/g; // handles exponents notation
  const value = validateValue( val );
  return {
    orig_str: value,
    orig_value: val,
    numbers: value.match(rgx) ? value.match(rgx).map(Number) : [0],
    strings: (is.str(val)  ) ? value.split(rgx) : []
  }
}

// Animatables

function parseTargets(targets) {
  const targetsArray = targets ? (flattenArray(is.arr(targets) ? targets.map(toArray) : toArray(targets))) : [];
  return filterArray(targetsArray, (item, pos, self) => self.indexOf(item) === pos);
}

function getAnimatables(targets) {
  const parsed = parseTargets(targets);
  return parsed.map((t, i) => {
    return {target: t, id: i, total: parsed.length  };
  });
}

// Properties

function normalizePropertyTweens(prop, tweenSettings) {
  let settings = cloneObject(tweenSettings);
  
  if (is.arr(prop)) {
    const l = prop.length;
    const isFromTo = (l === 2 && !is.obj(prop[0]));
    if (!isFromTo) {
      // Duration divided by the number of tweens
      if (!is.fnc(tweenSettings.duration)) settings.duration = tweenSettings.duration / l;
    } else {
      // Transform [from, to] values shorthand to a valid tween value
      prop = {value: prop};
    }
  }
  const propArray = is.arr(prop) ? prop : [prop];
  return propArray.map((v, i) => {
    const obj = (is.obj(v)  ) ? v : {value: v};
    // Default delay value should only be applied to the first tween
    if (is.und(obj.delay)) obj.delay = !i ? tweenSettings.delay : 0;
    // Default endDelay value should only be applied to the last tween
    if (is.und(obj.endDelay)) obj.endDelay = i === propArray.length - 1 ? tweenSettings.endDelay : 0;
    return obj;
  }).map(k => mergeObjects(k, settings));
}

 

function getProperties(tweenSettings, params) {
  const properties = []; 
  
  for (let p in params) {
    if( p == 'position' && is.arr(params[p])){
      params[p] = new Point(params[p]);
    }
    if (is.key(p)) { 
      properties.push({
        name: p,
        tweens: normalizePropertyTweens(params[p], tweenSettings)
      });
    }
  }
  return properties;
}

// Tweens

function normalizeTweenValues(tween, animatable) {
    const t = {};

    if( tween._class &&  is.cps( tween )  ){
      t.value = tween;
      t.duration = tween.duration; 
      t.delay = tween.delay; 
      t.endDelay = tween.endDelay; 
      t.easing = tween.easing; 
      t.round = tween.round;   
    } else {
      for (let p in tween) {
        if( p === 'progressFunc') continue;
       
        let value = getFunctionValue(tween[p], animatable);
        if (is.arr(value)) {
          value = value.map(v => getFunctionValue(v, animatable));
          if (value.length === 1) value = value[0];
        }
        t[p] = value;
      }
    }
    t. positionFunc = tween.positionFunc;
    t. progressFunc = tween.progressFunc;
    t.duration = parseFloat(t.duration);
    t.delay = parseFloat(t.delay);
    return t;
}

function normalizeTweens(prop, animatable) {
  let previousTween;
  return prop.tweens.map(t => {
    const tween = normalizeTweenValues(t, animatable);
    const tweenValue = tween.value;
    let to = is.arr(tweenValue) ? tweenValue[1] : tweenValue; 
    to = getOriginalTargetValue(animatable.target, prop.name, to);
    const originalValue = getOriginalTargetValue(animatable.target, prop.name );
    const previousValue = previousTween ? previousTween.to.orig_value : originalValue;
    const from = is.arr(tweenValue) ? tweenValue[0] : previousValue;
   
    if (is.und(to)) to = previousValue;
    tween.from = decomposeValue(from );
    tween.to = decomposeValue(getRelativeValue(to, from));
    tween.start = previousTween ? previousTween.end : 0;
    tween.end = tween.start + tween.delay + tween.duration + tween.endDelay;
    tween.easing = parseEasings(tween.easing, tween.duration); 
    
    previousTween = tween;
    return tween;
  });
}

// Tween progress

 
// Set Value helper

function setTargetsValue(targets, properties) {
  const animatables = getAnimatables(targets);
  animatables.forEach(animatable => {
    for (let property in properties) {
      const value = getFunctionValue(properties[property], animatable);
      const target = animatable.target; 
      const originalValue = getOriginalTargetValue(target, property );
        const to = getRelativeValue( value,   originalValue); 
       target[ property ] = to ;
    }
  });
}

// Animations

function createAnimation(animatable, prop) {
 
    const tweens = normalizeTweens(prop, animatable);
    const lastTween = tweens[tweens.length - 1];
    return {
      type: 'object',
      property: prop.name,
      animatable: animatable,
      tweens: tweens,
      duration: lastTween.end,
      delay: tweens[0].delay,
      endDelay: lastTween.endDelay, 
    } 
}

function getAnimations(animatables, properties) {
  return filterArray(flattenArray(animatables.map(animatable => {
    return properties.map(prop => {
      return createAnimation(animatable, prop);
    });
  })), a => !is.und(a));
}

// Create Instance

function getInstanceTimings(animations, tweenSettings) {
  const animLength = animations.length;
  const getTlOffset = anim => anim.timelineOffset ? anim.timelineOffset : 0;
  const timings = {};
  timings.duration = animLength ? Math.max.apply(Math, animations.map(anim => getTlOffset(anim) + anim.duration)) : tweenSettings.duration;
  timings.delay = animLength ? Math.min.apply(Math, animations.map(anim => getTlOffset(anim) + anim.delay)) : tweenSettings.delay;
  timings.endDelay = animLength ? timings.duration - Math.max.apply(Math, animations.map(anim => getTlOffset(anim) + anim.duration - anim.endDelay)) : tweenSettings.endDelay;
  return timings;
}

let instanceID = 0;

function createNewInstance(params) {

  const instanceSettings = replaceObjectProps(defaultInstanceSettings, params);
  const tweenSettings = replaceObjectProps(defaultTweenSettings, params);
  const properties = getProperties(tweenSettings, params);
  const animatables = getAnimatables(params.targets);
  const animations = getAnimations(animatables, properties);
  const timings = getInstanceTimings(animations, tweenSettings);
  const id = instanceID;
  instanceID++;
  return mergeObjects(instanceSettings, {
    id: id,
    children: [],
    animatables: animatables,
    animations: animations,
    duration: timings.duration,
    delay: timings.delay,
    endDelay: timings.endDelay
  });
}

// Core

let activeInstances = [];

const engine = (() => {
  let raf, requested = false,
    callbacks = [],
    timer;

  function play(callback) {
    if( callback && typeof callback == 'function' ){
      registerCallback(callback);
    }
    if (!raf && (!isDocumentHidden() || !anime.suspendWhenDocumentHidden) && (activeInstances.length > 0 || callbacks.length>0)) {
      raf = requestAnimationFrame(step);
    } 
  }
  function step(t) {
    // memo on algorithm issue:
    // dangerous iteration over mutable `activeInstances`
    // (that collection may be updated from within callbacks of `tick`-ed animation instances)
    let activeInstancesLength = activeInstances.length, ts = t/1000.0;
    let i = 0;
    while (i < activeInstancesLength) {
      const activeInstance = activeInstances[i];
      if (!activeInstance.paused) {
        activeInstance.tick(ts);
        i++;
      } else {
        activeInstances.splice(i, 1);
        activeInstancesLength--;
      }
    }
    // Make a local references to the current callbacks array and set
    // callbacks to a new empty array, so it can collect the functions for
    // the new requests.
    var functions = callbacks;
    callbacks = [];
    // Call the collected callback functions.
    for (var j = 0, l = functions.length; j < l; j++)
      functions[j]();
    // Now see if the above calls have collected new callbacks. Keep
    // requesting new frames as long as we have callbacks.
    requested = raf && callbacks.length; 


    raf = i > 0 || callbacks.length > 0 ? requestAnimationFrame(step) : undefined;
  }

  function registerCallback(callback) {
    // Add to the list of callbacks to be called in the next animation
    // frame.
    callbacks.push(callback);
    // Handle animation natively. We only need to request the frame
    // once for all collected callbacks.
    if ( typeof raf == 'function' && !requested) {
      raf(step);
      requested = true;
    } 
  }

  function handleVisibilityChange() {
    if (!anime.suspendWhenDocumentHidden) return;

    if (isDocumentHidden()) {
      // suspend ticks
      raf = cancelAnimationFrame(raf);
    } else { // is back to active tab
      // first adjust animations to consider the time that ticks were suspended
      activeInstances.forEach(
        inste => inste ._onDocumentVisibility()
      );
      engine();
    }
  }
  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', handleVisibilityChange);
  }

  return play; 
})();

function isDocumentHidden() {
  return !!document && document.hidden;
}

// Public Instance

function anime(params = {}) {

  let startTime = 0, lastTime = 0, now = 0;
  let children, childrenLength = 0;
  let resolve = null;

  function makePromise(inste) {
    const promise = window.Promise && new Promise(_resolve => resolve = _resolve);
    inste.finished = promise;
    return promise;
  }
  params = pre_process_params( params );
  

  let inste = createNewInstance(params);
  let promise = makePromise(inste);

  function toggleInstanceDirection() {
    const direction = inste.direction;
    if (direction !== 'alternate') {
      inste.direction = direction !== 'normal' ? 'normal' : 'reverse';
    }
    inste.reversed = !inste.reversed;
    children.forEach(child => child.reversed = inste.reversed);
  }

  function adjustTime(time) {
    return inste.reversed ? inste.duration - time : time;
  }

  function resetTime() {
    startTime = 0;
    lastTime = adjustTime(inste.currentTime) * (1 / anime.speed);
  }

  function seekChild(time, child) {
    if (child) child.seek(time - child.timelineOffset);
  }

  function syncInstanceChildren(time) {
    if (!inste.reversePlayback) {
      for (let i = 0; i < childrenLength; i++) seekChild(time, children[i]);
    } else {
      for (let i = childrenLength; i--;) seekChild(time, children[i]);
    }
  }

  function setAnimationsProgress(insTime) {  
    let i = 0;
    const animations = inste.animations;
    const animationsLength = animations.length;
    while (i < animationsLength) {
      const anim = animations[i];
      const animatable = anim.animatable;
      const atarget = animatable.target; 
      const tweens = anim.tweens;
      const tweenLength = tweens.length - 1;
      let tween = tweens[tweenLength];
      if( insTime == 0 &&   atarget instanceof Item ){
     //   atarget.addToViewIfNot();
      }

      // Only check for keyframes if there is more than one tween
      if (tweenLength) tween = filterArray(tweens, t => (insTime < t.end))[0] || tween;
      const elapsed = minMax(insTime - tween.start - tween.delay, 0, tween.duration) / tween.duration;
      const eased = isNaN(elapsed) ? 1 : tween.easing(elapsed);    
   //   const strings = tween.to.strings;
   //   const round = tween.round;
   //   const numbers = [];
    //  const toNumbersLength = tween.to.numbers.length;
      if( anim.property == 'pfnc' &&  tween['progressFunc']  ){
          if( typeof  tween['progressFunc'] === 'function'){
              tween['progressFunc'](eased);
          } else {
              atarget[tween['progressFunc']](eased); 
          } 
          i++;
          continue;
      }

      let progress,  getValue = function(value) {
          return typeof value === 'function'
              ? value(eased, elapsed)
              : value;
      };
      var from = getValue(tween.from.orig_value),
              to = getValue(tween.to.orig_value);
              // Some mpaper objects have math functions (e.g.: Point,
             // Color) which can directly be used to do the tweening.
      var  value = (from && to && from.__add && to.__add)
              ? to.__subtract(from).__multiply(eased).__add(from)
            : ((to - from) * eased) + from;

      if( anim.property == 'position' && typeof tween['positionFunc'] === 'function' ){
          value = tween['positionFunc'](from, to, value, eased); 
      }  
      _setProperty(atarget,  _parseKey(anim.property), value);  
     
 
        // TODO: Set `progress` and `factor` on Anime object also, so they
        // can be used witout events.
      // if (this.responds('update')) {
        //    this.emit('update', new Base({
        //       progress: eased,
        //       factor: factor
        //   }));
      // }
      // animatable.target[  anim.property ] = value ;
      anim.currentValue = value;
      i++;

      // let progress;
      // for (let n = 0; n < toNumbersLength; n++) {
      //   let value;
      //   const toNumber = tween.to.numbers[n];
      //   const fromNumber = tween.from.numbers[n] || 0;
      //     value = fromNumber + (eased * (toNumber - fromNumber));
        
      //   if (round) {
      //     if (!(tween.isColor && n > 2)) {
      //       value = Math.round(value * round) / round;
      //     }
      //   }
      //   numbers.push(value);
      // }
      // // Manual Array.reduce for better performances
      // const stringsLength = strings.length;
      // if (!stringsLength) {
      //   progress = numbers[0];
      // } else {
      //   progress = strings[0];
      //   for (let s = 0; s < stringsLength; s++) {
      //     const a = strings[s];
      //     const b = strings[s + 1];
      //     const n = numbers[s];
      //     if (!isNaN(n)) {
      //       if (!b) {
      //         progress += n + ' ';
      //       } else {
      //         progress += n + b;
      //       }
      //     }
      //   }
      // }
      // animatable.target[  anim.property ] = progress ;
      // anim.currentValue = progress;
      // i++;
    }
  }

  function setCallback(cb) {
    if (inste[cb] && !inste.passThrough) inste[cb](inste);
  }
  
  function invokeEvent( ) {
	    if (inste.eventFunc && !inste.passThrough){
          inste.animatables.forEach(e => {
            if(typeof inste.eventFunc === 'function'){
                 inste.eventFunc(inste.eventFuncParams);
            } else {
                e[inste.eventFunc](inste.eventFuncParams);
            }
          }); 
      } 
  }

  function countIteration() {
    if (inste.remaining && inste.remaining !== true) {
      inste.remaining--;
    }
  }

  function setInstanceProgress(engineTime) {
   
    const insDuration = inste.duration;
    const insDelay = inste.delay;
    const insEndDelay = insDuration - inste.endDelay;
    const insTime = adjustTime(engineTime);
    inste.progress = minMax((insTime / insDuration) * 100, 0, 100);
    inste.reversePlayback = insTime < inste.currentTime;
    if (children) { syncInstanceChildren(insTime); }
    if (!inste.began && inste.currentTime > 0) {
      inste.began = true; 
      setCallback('begin');

      if ( inste.eventFunc ){
        invokeEvent( );
        inste.paused = true;
        inste.completed = true;
        setCallback('loopComplete');
        setCallback('complete');
        if (!inste.passThrough && 'Promise' in window) {
          resolve();
          promise = makePromise(inste);
        }
        return;
      }
    }
    if (!inste.loopBegan && inste.currentTime > 0) {
      inste.loopBegan = true;
      setCallback('loopBegin');
    }
    if (insTime <= insDelay && inste.currentTime !== 0) {
      setAnimationsProgress(0);
    }
    if ((insTime >= insEndDelay && inste.currentTime !== insDuration) || !insDuration) {
      setAnimationsProgress(insDuration);
    }
    if (insTime > insDelay && insTime < insEndDelay) {
      if (!inste.changeBegan) {
        inste.changeBegan = true;
        inste.changeCompleted = false;
        setCallback('changeBegin');
      }
      setCallback('change');
      setAnimationsProgress(insTime);
    } else {
      if (inste.changeBegan) {
        inste.changeCompleted = true;
        inste.changeBegan = false;
        setCallback('changeComplete');
      }
    }
    inste.currentTime = minMax(insTime, 0, insDuration);
    if (inste.began) setCallback('update');
    if (engineTime >= insDuration) {
      lastTime = 0;
      countIteration();
      if (!inste.remaining) {
        inste.paused = true;
        if (!inste.completed) {
          inste.completed = true;
          setCallback('loopComplete');
          setCallback('complete');
          if (!inste.passThrough && 'Promise' in window) {
            resolve();
            promise = makePromise(inste);
          }
        }
      } else {
        startTime = now;
        setCallback('loopComplete');
        inste.loopBegan = false;
        if (inste.direction === 'alternate') {
          toggleInstanceDirection();
        }
      }
    }
  }

  inste.reset = function() {
    const direction = inste.direction;
    inste.passThrough = false;
    inste.currentTime = 0;
    inste.progress = 0;
    inste.paused = true;
    inste.began = false;
    inste.loopBegan = false;
    inste.changeBegan = false;
    inste.completed = false;
    inste.changeCompleted = false;
    inste.reversePlayback = false;
    inste.reversed = direction === 'reverse';
    inste.remaining = inste.loop;
    children = inste.children;
    childrenLength = children.length;
    for (let i = childrenLength; i--;) inste.children[i].reset();
    if (inste.reversed && inste.loop !== true || (direction === 'alternate' && inste.loop === 1)) inste.remaining++;
    setAnimationsProgress(inste.reversed ? inste.duration : 0);
  }
  inste.addTargetsToView = function() { 
    let i = 0;
    const animations = inste.animations;
    const animationsLength = animations.length;
    while (i < animationsLength) {
      const anim = animations[i];
      const animatable = anim.animatable;
      const atarget = animatable.target; 
      if(  atarget instanceof Item ){
        atarget.addToViewIfNot(anim.duration, anim.delay); 
      }
      i++;
    }
    var children = inste.children, childrenLength = children.length;
    for (let j = childrenLength; j--;) inste.children[j].addTargetsToView();

  } 
  // internal method (for engine) to adjust animation timings before restoring engine ticks (rAF)
  inste._onDocumentVisibility = resetTime;

  // Set Value helper

  inste.set = function(targets, properties) {
    setTargetsValue(targets, properties);
    return inste;
  }

  inste.tick = function(t) {  
    now = t;
    if (!startTime) startTime = now;
    setInstanceProgress((now + (lastTime - startTime)) * anime.speed);
  }

  inste.seek = function(time) {
    setInstanceProgress(adjustTime(time));
  }

  inste.pause = function() {
    inste.paused = true;
    resetTime();
  }

  inste.play = function() {
    if (!inste.paused) return;
    if (inste.completed) inste.reset();
    inste.addTargetsToView();
    inste.paused = false;
    activeInstances.push(inste);
    resetTime();
  
    engine();
  }

  inste.reverse = function() {
    toggleInstanceDirection();
    inste.completed = inste.reversed ? false : true;
    resetTime();
  }

  inste.restart = function() {
    inste.reset();
    inste.play();
  }

  inste.remove = function(targets) {
    const targetsArray = parseTargets(targets);
    removeTargetsFromInstance(targetsArray, inste);
  }

  inste.reset();

  if (inste.autoplay) inste.play();

  return inste;

}

// Remove targets from animation

function removeTargetsFromAnimations(targetsArray, animations) {
  for (let a = animations.length; a--;) {
    if (arrayContains(targetsArray, animations[a].animatable.target)) {
      animations.splice(a, 1);
    }
  }
}

function removeTargetsFromInstance(targetsArray, inste) {
  const animations = inste.animations;
  const children = inste.children;
  removeTargetsFromAnimations(targetsArray, animations);
  for (let c = children.length; c--;) {
    const child = children[c];
    const childAnimations = child.animations;
    removeTargetsFromAnimations(targetsArray, childAnimations);
    if (!childAnimations.length && !child.children.length) children.splice(c, 1);
  }
  if (!animations.length && !children.length) inste.pause();
}

function removeTargetsFromActiveInstances(targets) {
  const targetsArray = parseTargets(targets);
  for (let i = activeInstances.length; i--;) {
    const inste = activeInstances[i];
    removeTargetsFromInstance(targetsArray, inste);
  }
}

//relative offset helps
/**
 * 
 * @param {*} relative number or string  with "+=number"
 * @param {*} added number
 * @returns 
 */
function addTimeOffset(relative, added){
    const operator = /^(\*=|\+=|-=|\/=)/.exec(relative);
    if (!operator){ 
      return isNaN(relative) ? added : parseFloat(relative) + added; 
    } 
    const yy =  relative.replace(operator[0], '').slice(1, -1); 
    return operator[0] + (yy + added);
}
// Stagger helpers

function stagger(val, params = {}) {
  const direction = params.direction || 'normal';
  const easing = params.easing ? parseEasings(params.easing) : null;
  const grid = params.grid;
  const axis = params.axis;
  let fromIndex = params.from || 0;
  const fromFirst = fromIndex === 'first';
  const fromCenter = fromIndex === 'center';
  const fromLast = fromIndex === 'last';
  const isRange = is.arr(val);
  const val1 = isRange ? parseFloat(val[0]) : parseFloat(val);
  const val2 = isRange ? parseFloat(val[1]) : 0; 
  const start = params.start || 0 + (isRange ? val1 : 0);
  let values = [];
  let maxValue = 0;
  return (el, i, t) => {
    if (fromFirst) fromIndex = 0;
    if (fromCenter) fromIndex = (t - 1) / 2;
    if (fromLast) fromIndex = t - 1;
    if (!values.length) {
      for (let index = 0; index < t; index++) {
        if (!grid) {
          values.push(Math.abs(fromIndex - index));
        } else {
          const fromX = !fromCenter ? fromIndex%grid[0] : (grid[0]-1)/2;
          const fromY = !fromCenter ? Math.floor(fromIndex/grid[0]) : (grid[1]-1)/2;
          const toX = index%grid[0];
          const toY = Math.floor(index/grid[0]);
          const distanceX = fromX - toX;
          const distanceY = fromY - toY;
          let value = Math.sqrt(distanceX * distanceX + distanceY * distanceY);
          if (axis === 'x') value = -distanceX;
          if (axis === 'y') value = -distanceY;
          values.push(value);
        }
        maxValue = Math.max(...values);
      }
      if (easing) values = values.map(val => easing(val / maxValue) * maxValue);
      if (direction === 'reverse') values = values.map(val => axis ? (val < 0) ? val * -1 : -val : Math.abs(maxValue - val));
    }
    const spacing = isRange ? (val2 - val1) / maxValue : val1;
    return start + (spacing * (Math.round(values[i] * 100) / 100))  ;
  }
}

//for adapting to paperjs.
function pre_process_params(options){
    // scaleX, scaleY.        paperjs does not support scale animation directly. we use bounds change. 
    //    also keep position for scaling. 
    if( options.target ) {
      options.targets = options.target;
      delete options.target;
    } 
    if( !options.targets ) options.targets = {};

    var scaleX = options.scaleX || 1, scaleY = options.scaleY || 1;
    if( scaleX != 1 || scaleY != 1 ){
        options['bounds.size'] = '*=[' + scaleX + ',' + scaleY + ']'; 
        if( ! options.position ){
            options.position = '+=[0,0]'; 
        } 
        delete options.scaleX;
        delete options.scaleY;
    }
    //handle positionFunc
    if( options.positionFunc ){
      if( typeof options.positionFunc != 'function' ){
          options.positionFunc = function(from, to, curpos, easing){
            return new Point(curpos.x, curpos.y + Math.sin( 4*Math.PI *easing ) * 50 * (1-easing));
          }
      }
      if( !options.position )
          options.position = '+=[0,0]';  // we need to use position field to invoke positionFunc.
    } 
    if( options.progressFunc  )
        options.pfnc = 0; // we need to use faked pfnc field to invoke progressFunc.
    
    return options;
}

// Timeline

function timeline(params = {}) {
  let tl = anime(params);
  let last = null;
  tl.duration = 0;
  tl.add = function(instanceParams, timelineOffset) {
    const tlIndex = activeInstances.indexOf(tl);
    const children = tl.children;
    if (tlIndex > -1) activeInstances.splice(tlIndex, 1);
    function passThrough(ins) { ins.passThrough = true; };
    for (let i = 0; i < children.length; i++) passThrough(children[i]);
    instanceParams = pre_process_params( instanceParams );
    let insParams = mergeObjects(instanceParams, replaceObjectProps(defaultTweenSettings, params));
    insParams.targets = insParams.targets || params.targets || {};
    const tlDuration = tl.duration;
    insParams.autoplay = false;
    insParams.direction = tl.direction;
    insParams.timelineOffset = is.und(timelineOffset) ? tlDuration : getRelativeValue(timelineOffset, tlDuration);
    if( timelineOffset == '==' && tl ) insParams.timelineOffset = tl.timelineOffset  
    passThrough(tl);
    tl.seek(insParams.timelineOffset);
    const ins = anime(insParams);
    last = ins;
    passThrough(ins);
    const totalDuration = ins.duration + insParams.timelineOffset;
    children.push(ins);
    const timings = getInstanceTimings(children, params);
    tl.delay = timings.delay;
    tl.endDelay = timings.endDelay;
    tl.duration = timings.duration;
    tl.seek(0);
    tl.reset();
    if (tl.autoplay) tl.play();
    return tl;
  }
  return tl;
}

anime.version = '3.2.1';
anime.speed = 1;
// TODO:#review: naming, documentation
anime.suspendWhenDocumentHidden = true;
anime.running = activeInstances;
anime.remove = removeTargetsFromActiveInstances;
anime.get = getOriginalTargetValue;
anime.set = setTargetsValue; 
anime.stagger = stagger;
anime.timeline = timeline;
anime.engine = engine;
anime.easing = parseEasings; 
anime.penner = penner;
anime.addTimeOffset = addTimeOffset;
anime.random = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

//export default anime;
