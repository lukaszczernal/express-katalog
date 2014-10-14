var fs = require('fs');

exports.createDirSync = function(path) {
  if (fs.existsSync(path)) return true;
  
  fs.mkdirSync(path);
  
  return true
};