var fs = require('fs');

ReadFolder = function(folder) {
	this.folder = folder;
};

ReadFolder.prototype.read = function(done) {
	var results = {},
		dir = this.folder;
	
	fs.readdir('public/' + dir, function(err, list) {
		if (err) return done(err);

		var pending = list.length;
		if (!pending) return done(null, results);

		var i = 0;
		list.forEach(function(file) {
			if (file.indexOf('.svg') > 0) {
				path = dir + '/' + file;
				results[i++] = {'svg': {'file': file, 'dir': dir, 'path': path}}
			}
		});

		done(null, results);

	});	
};


exports.ReadFolder = ReadFolder