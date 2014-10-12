
var utils = {

  encodeFilename: function(filename) {
    var newFilename = filename.replace(/ /g, "_");

    return newFilename;
  }

};


exports.utils = utils
