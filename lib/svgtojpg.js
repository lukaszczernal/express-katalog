
//
//
// svgpath (string) - input path
// jpgpath (string/array) - output jpg files (array length needs to be equal to options.width length)
// options (object)
// options.width (string/array) - size of output jpg, if jpgpath is an array then this
//                                also needs to be an array (both should have same lenght)
// options.callback (function)
//
//


var EventEmitter  = require('events').EventEmitter,
    PNGtoJPG      = require('./pngtojpg').PNGtoJPG,
    SVGtoPNG      = require('./svgtopng').SVGtoPNG,
    fs            = require('fs');


SVGtoJPG = function(svgpath, jpgpath, options) {
  if (svgpath == null) return;

  var jpgpath = (!jpgpath)? [svgpath + '.jpg'] : jpgpath;
      jpgpath = (jpgpath instanceof Array)? jpgpath : [jpgpath]; // CONVERT JPGPATH INTO AN ARRAY (even if they are single values)

  var pngpath = jpgpath[0] + '.png';

  var options = (typeof options == 'undefined')? {} : options;
      options.width = (typeof options.width == 'undefined')? [2000] : options.width;
      options.width = (options.width instanceof Array)? options.width : [options.width]; // CONVERT OPTIONS.WIDTH INTO AN ARRAY (even if they are single values)

      options.quality = (typeof options.quality == 'undefined')? [55] : options.quality;
      options.quality = (options.quality instanceof Array)? options.quality : [options.quality]; // CONVERT OPTIONS.WIDTH INTO AN ARRAY (even if they are single values)

  if (options.width.length != jpgpath.length ||
      options.width.length != options.quality.length) return;


  pngOptions = {};
  pngOptions.width = Math.max.apply(Math, options.width);


  var stream = new SVGtoPNG(svgpath, pngpath, pngOptions);

      stream.on('close', function() {

        var i = jpgpath.length;
        var convert = function(i) {
          --i;
          new PNGtoJPG(pngpath, jpgpath[i], {'resize': options.width[i], 'quality': options.quality[i]}, function() {
            console.log('JPG file created:',jpgpath[i], options.width[i]);
            if (i > 0) {
              convert(i);
            } else {
              fs.unlink(pngpath, function() {
                console.log('PNG file deleted: ' + pngpath);
                if(options.callback != null) options.callback();
                // TO TEST AJAX CALL TIMEOUTS
                // console.log('timeout set');
                // setTimeout(function() {
                //   console.log('timeout gone');
                //   if(options.callback != null) options.callback();
                // }, 599000);
              });
            };
          });
        };

        convert(i);

      });

};

exports.SVGtoJPG = SVGtoJPG
