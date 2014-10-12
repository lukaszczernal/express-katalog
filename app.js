
/**
 * Module dependencies.
 */

var express   = require('express')
  , routes    = require('./routes')
  , user      = require('./routes/user')
  , http      = require('http')
  , path      = require('path')
  , PDFCreator  = require('./lib/createpdf').PDFCreator
  , SVGtoJPG    = require('./lib/svgtojpg').SVGtoJPG
  , fs  = require('fs')
  , spawn = require('child_process').spawn
  , utils = require('./lib/utils').utils
  , FormData    = require('form-data')
  , httpRequest = require('request');

var app = express();
var issaving = false;

var allowCrossDomain = function(req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');

  // intercept OPTIONS method
  if ('OPTIONS' == req.method) {
    res.send(200);
  } else {
    next();
  }
};

// all environments
app.set('env', 'production')
app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(allowCrossDomain);
app.use(app.router);
app.use(require('stylus').middleware(__dirname + '/public'));
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
  console.log('development');
  app.use(express.errorHandler());
} else {
  console.log('production');
}


// var SvgFiles = new ReadFolder('svg');

app.get('/', function(req, res) {
  res.render('index', {title: 'Katalog', env: app.get('env')});
});

//API STARTS HERE

//READ FOLDER VERSION
// app.get('/api/pages', function(req, res) {
// 	var renderView = function(err, pages) {
// 		if (err) console.log('Error. Cannot read folder.');
//     res.send(pages);
// 	};

// 	files = SvgFiles.read(renderView);
// });

//READ JSON VERSION
app.get('/api/pages', function(req, res) {
  var renderView = function(err, pages) {
    if (err) console.log('Error. Cannot read JSON file containing pages');
    var pages = JSON.parse(pages);
    res.send(pages);

    // TODO upload files to remote sever
    // var fileToBeUploaded = 'public/jpg/w280/' + pages[0].svg.file + '.jpg';
    // console.log(path.join(__dirname, fileToBeUploaded ));

    // var r = httpRequest.post('http://marekczernal.nazwa.pl/scripts/upload.php', function(err, res, body) {
    //   if (err) {
    //     return console.error('upload failed:', err);
    //   };
    //   console.log('Upload successful!  Server responded with:', body);
    // });

    // var form = r.form();
    // form.append('upfile', fs.createReadStream(path.join(__dirname, fileToBeUploaded )));

  };


  fs.readFile('public/data/pages-array.json', renderView);
});

//SAVE JSON TO FILE
app.post('/api/save', function(req, res) {
  var jsondata = req.body.jsondata;

  if (issaving == false) {
    issaving = true;

    var renderView = function(err) {
      var status = JSON.stringify({status: 'ok'});
      if (err) status = JSON.stringify({status: 'err', message: 'Error 1. Cannot read JSON file containing pages'});
      res.send(status);
      issaving = false;
    };

    var duplicatefile = function(err) {
      if (err) {
        var status = JSON.stringify({status: 'err', message: 'Error 2. Cannot read JSON file containing pages'});
        res.send(status);
      } else {
        fs.writeFile('public/data/pages-array.json', jsondata , renderView);
      }
    }

    fs.writeFile('public/data/tmp.pages-array.json', jsondata , duplicatefile);

  } else {
    var status = JSON.stringify({status: 'err', message: 'Another saving process is in progress.'});
    res.send(status);
  }

});

app.get('/api/delete/:id', function(req, res) {

  var page = {};
      index = req.params.id,
      filesToDelete = [];

  var onDeleteSuccess = function() {
    res.send(JSON.stringify({'status': 'ok'}));
  }

  var onFileDelete = function(err) {
    if (err) console.log('Error. Cannot delete file');
    if (filesToDelete.length < 1) onDeleteSuccess();
  };

  var deleteFile = function(path) {
    fs.unlink(path, onFileDelete);
  };

  var deleteFiles = function(err, pages) {
    if (err) console.log('Error. Cannot delete page related files');

    var pages = JSON.parse(pages),
        page = pages[index];

    filesToDelete.push('public/svg/' + page.svg.file);
    filesToDelete.push('public/jpg/w100/' + utils.encodeFilename(page.svg.file) + '.jpg');
    filesToDelete.push('public/jpg/w280/' + utils.encodeFilename(page.svg.file) + '.jpg');
    filesToDelete.push('public/jpg/w800/' + utils.encodeFilename(page.svg.file) + '.jpg');
    filesToDelete.push('public/jpg/w2000/' + utils.encodeFilename(page.svg.file) + '.jpg');

    var _file;
    while (filesToDelete.length > 0) {
      _file = filesToDelete.shift();
      deleteFile(_file);
    }

  };

  fs.readFile('public/data/pages-array.json', deleteFiles);
});

app.get('/api/edit/:id', function(req, res) {

  var index = req.params.id;

  var editFile = function(err, pages) {
    if (err) console.log('Error. Cannot edit page related files');
    var pages = JSON.parse(pages);
    PAGE = pages[index];

    var svg = 'public/svg/' + PAGE.svg.file;

    fs.exists(svg, function(exists) {
      if (exists) {
        res.send(JSON.stringify({'status': 'ok', 'svg': svg}));
        spawn('inkscape', [svg]);
      } else {
        res.send(JSON.stringify({'status': 'err', 'svg': svg}));
      };
    });

  };

  fs.readFile('public/data/pages-array.json', editFile);
});

app.post('/api/add', function(req, res) {

  var PAGE = {};
      PAGE.svg = {};
      PAGE.status = "enable";
      PAGE.svg.dir = 'svg';

  //5 SEND RESPONSE
  function response() {
    var status = {};
        status.status = 'ok';
        status.data = PAGE;

    res.send(JSON.stringify(status));
  };

  //4 CREATE SMALL JPG FILE (THUMB)
  function createThumb() {
    jpgThumbPath = 'public/jpg/w100/' + PAGE.svg.file + '.jpg';
    new SVGtoJPG(PAGE.svg.path, jpgThumbPath, {width: 100, quality: 90, callback: response});
  };

  //3 UPLOAD SVG FILE
  function uploadNewPage (path, file) {

    PAGE.svg.file = utils.encodeFilename(file);
    PAGE.svg.path = path + PAGE.svg.file;

    var is = fs.createReadStream(req.files.page.path);
    var os = fs.createWriteStream(PAGE.svg.path);

    is.pipe(os);
    os.on('close', function() {
        fs.unlinkSync(req.files.page.path);
        createThumb();
    });
  };

  //2 IF FILE ALREADY EXISTS, WE RENAME THE FILE
  function fileExists (path, file, callback) {
    fs.exists(path + file, function(exists) {
      if (exists) {
        file = file.split('-');
        if (isNaN(file[0])) {
          file.unshift('1');
        } else {
          file[0]++;
        }
        file = file.join('-');

        fileExists(path, file, callback)
      } else {
        callback(path, file);
      }
    })
  };

  //1 CHECK IF WE TRY TO UPLOAD FILE THAT ALREADY EXISTS
  fileExists('public/' + PAGE.svg.dir + '/', req.files.page.name, uploadNewPage);

});

app.post('/api/pdf', function(req, res) {

  var data = req.body.jsondata;

  var callback = function(status){
    res.send(JSON.stringify(status));
  }

  new PDFCreator(data, callback);

  // TODO SEND FILES TO SERVER

});


http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
