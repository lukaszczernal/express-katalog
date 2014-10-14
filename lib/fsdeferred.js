var fs = require('fs'),
		Q = require('q');

exports.readdir = function(dir, wrapper, callback) {

	var results = {};

	var deferred = Q.defer();
	
	fs.readdir('public/' + dir, function(err, files) {
		if (err) {
			deferred.reject(err);
		} else { 
			files = (!!wrapper) ? wrapper(files) : files;
			deferred.resolve(files);
		};
	});

	return deferred.promise.nodeify(callback);

};

// NOT TESTED !!!
exports.createDir = function(path) {
	var deferred = Q.defer();
	var stat = fs.statSync(path);

	if (stat.isDirectory()) {
		deferred.resolve();
	} else if (stat.isFile()) {
		deferred.reject('Directory cannot be created. File of such name already exists.');
	} else {
		fs.mkdir(path, function(err) {
			if (err) {
				deferred.reject('Directory cannot be created due to some unknown error. ' + err);
			} else {
				deferred.resolve();
			}
		});
	};
};


exports.readFile = function(file, callback) {

	var deferred = Q.defer();

	fs.readFile('public/data/pages-array.json', function(err, file) {
		if (err) deferred.reject(err)
		else deferred.resolve(file)
	});

	return deferred.promise.nodeify(callback);
};


