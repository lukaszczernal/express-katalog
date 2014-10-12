
var utils = {

  LatinMap: {
    'ś': 's',
    'Ś': 'S',
    'ł': 'l',
    'Ł': 'L',
    'ą': 'a',
    'Ą': 'A',
    'ę': 'e',
    'Ę': 'E',
    'ó': 'o',
    'Ó': 'O',
    'ź': 'z',
    'Ź': 'Z',
    'ż': 'z',
    'Ż': 'Z',
    'ć': 'c',
    'Ć': 'C',
    'ń': 'n',
    'Ń': 'N' 
  },

  encodeFilename: function(filename) {
    var newFilename = filename.replace(/[^A-Za-z0-9\[\] ]/g, function(x) { return utils.LatinMap[x] || x; });
    newFilename = newFilename.replace(/ /g, "_");

    return newFilename;
  }

};


exports.utils = utils
