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

exports.readFile = function(file, callback) {

	var deferred = Q.defer();

	fs.readFile('public/data/pages-array.json', function(err, file) {
		if (err) deferred.reject(err)
		else deferred.resolve(file)
	});

	return deferred.promise.nodeify(callback);
};


