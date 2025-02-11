// Generated by CoffeeScript 1.7.1
(function() {
  var MAX_W, MIFF_END, MIFF_START, Stream, clean, distance, fs, gm, include, parseHistogramLine, reduceSimilar, sortByFrequency, temp;

  gm = require('gm');

  fs = require('fs');

  temp = require('temp');

  Stream = require('stream').Stream;

  MAX_W = 14;

  MIFF_START = 'comment={';

  MIFF_END = '\x0A}\x0A\x0C\x0A';

  exports.topColours = function(sourceFilename, sorted, cb) {
    var img, options, tmpFilename;
    img = gm(sourceFilename);
    tmpFilename = temp.path({
      suffix: '.miff'
    });
    options = {};
    if (sourceFilename instanceof Stream) {
      options.bufferStream = true;
    }
    return img.size(options, function(err, wh) {
      var h2, ratio, w2;
      if (err) {
        console.log(err);
        return cb();
      }
      ratio = wh.width / MAX_W;
      w2 = wh.width / 2;
      h2 = wh.height / 2;
      return img.noProfile().bitdepth(8).crop(w2, h2, w2 / 2, w2 / 2).scale(Math.ceil(wh.height / ratio), MAX_W).write('histogram:' + tmpFilename, function(err) {
        var histogram, miffRS;
        if (err) {
          console.log(err);
          return cb();
        }
        histogram = '';
        miffRS = fs.createReadStream(tmpFilename, {
          encoding: 'utf8'
        });
        miffRS.addListener('data', function(chunk) {
          var endDelimPos;
          endDelimPos = chunk.indexOf(MIFF_END);
          if (endDelimPos !== -1) {
            histogram += chunk.slice(0, endDelimPos + MIFF_END.length);
            return miffRS.destroy();
          } else {
            return histogram += chunk;
          }
        });
        return miffRS.addListener('close', function() {
          var colours, histogram_start;
          fs.unlink(tmpFilename);
          histogram_start = histogram.indexOf(MIFF_START) + MIFF_START.length;
          colours = reduceSimilar(clean(histogram.slice(histogram_start).split('\n').slice(1, -3).map(parseHistogramLine)));
          if (sorted) {
            colours = colours.sort(sortByFrequency);
          }
          return cb(colours);
        });
      });
    });
  };

  exports.colourKey = function(path, cb) {
    return exports.topColours(path, false, function(xs) {
      var M, m;
      M = xs.length;
      m = Math.ceil(M / 2);
      return cb([xs[0], xs[1], xs[2], xs[m - 1], xs[m], xs[m + 1], xs[M - 3], xs[M - 2], xs[M - 1]]);
    });
  };

  exports.rgb2hex = function(r, g, b) {
    var rgb;
    rgb = arguments.length === 1 ? r : [r, g, b];
    return '#' + rgb.map(function(x) {
      return (x < 16 ? '0' : '') + x.toString(16);
    }).join('');
  };

  exports.hex2rgb = function(xs) {
    if (xs[0] === '#') {
      xs = xs.slice(1);
    }
    return [xs.slice(0, 2), xs.slice(2, -2), xs.slice(-2)].map(function(x) {
      return parseInt(x, 16);
    });
  };

  include = function(x, xs) {
    if (xs.indexOf(x) === -1) {
      xs.push(x);
    }
    return xs;
  };

  clean = function(xs) {
    var rs, x, _i, _len;
    rs = [];
    for (_i = 0, _len = xs.length; _i < _len; _i++) {
      x = xs[_i];
      if (x) {
        rs.push(x);
      }
    }
    return rs;
  };

  sortByFrequency = function(_arg, _arg1) {
    var a, b, _a2, _b2;
    a = _arg[0], _a2 = _arg[1];
    b = _arg1[0], _b2 = _arg1[1];
    if (a > b) {
      return -1;
    }
    if (a < b) {
      return 1;
    }
    return 0;
  };

  distance = function(_arg, _arg1) {
    var b1, b2, g1, g2, r1, r2;
    r1 = _arg[0], g1 = _arg[1], b1 = _arg[2];
    r2 = _arg1[0], g2 = _arg1[1], b2 = _arg1[2];
    return Math.sqrt(Math.pow(r1 - r2, 2) + Math.pow(g1 - g2, 2) + Math.pow(b1 - b2, 2));
  };


  /*
  Example line:
      f:  (rrr, ggg, bbb)   #rrggbb\n
      \   \                 \_____________ Hex code / "black" / "white"
       \   \______________________________ RGB triplet
        \_________________________________ Frequency at which colour appears
   */

  parseHistogramLine = function(xs) {
    xs = xs.trim().split(':');
    if (xs.length !== 2) {
      return null;
    }
    return [
      +xs[0], xs[1].split('(')[1].split(')')[0].split(',').map(function(x) {
        return +x.trim();
      })
    ];
  };

  reduceSimilar = function(xs, r) {
    var N, avgD, d, maxD, maxF, minD, n, rs, tds, x, _i, _len;
    minD = Infinity;
    maxD = 0;
    maxF = 0;
    n = 0;
    N = xs.length - 1;
    tds = (function() {
      var _i, _len, _results;
      _results = [];
      for (_i = 0, _len = xs.length; _i < _len; _i++) {
        x = xs[_i];
        if (n === N) {
          break;
        }
        d = distance(x[1], xs[++n][1]);
        if (d < minD) {
          minD = d;
        }
        if (d > maxD) {
          maxD = d;
        }
        _results.push(d);
      }
      return _results;
    })();
    avgD = Math.sqrt(minD * maxD);
    n = 0;
    rs = [];
    for (_i = 0, _len = tds.length; _i < _len; _i++) {
      d = tds[_i];
      if (d > avgD) {
        include(xs[n], rs);
        if (xs[n][0] > maxF) {
          maxF = xs[n][0];
        }
      }
      n++;
    }
    return rs.map(function(_arg) {
      var c, f;
      f = _arg[0], c = _arg[1];
      return [f / maxF, c];
    });
  };

}).call(this);
