var EventEmitter	= require('events').EventEmitter,
	im 				= require('imagemagick'),
	fs 				= require('fs');


PNGtoJPG = function(png, jpg, options, callback) {
  var setup = new Array(png);

  if (!!options) {

    // check if there is quality level in options if not set to 55
    if (!options.quality) options.quality = 55;

    for (var option in options) {
      if (options.hasOwnProperty(option)) {
        setup.push('-' + option);
        setup.push(options[option]);
      }
    };

  };

  setup.push(jpg);
  im.convert(setup, callback);

};

exports.PNGtoJPG = PNGtoJPG
