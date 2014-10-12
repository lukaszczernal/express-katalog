var EventEmitter	= require('events').EventEmitter,
    Inkscape     	= require('inkscape'),
    fs 				= require('fs');


SVGtoPNG = function(svgpath, pngpath, options) {

  var svg 		= fs.createReadStream(svgpath);
  var stream 	= fs.createWriteStream(pngpath);

  var converter = new Inkscape(['-e', '-w', options.width, '-b', '#ffffff']);

  svg.pipe(converter).pipe(stream);

  return stream;
};

exports.SVGtoPNG = SVGtoPNG
