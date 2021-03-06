
/**
 * Module dependencies.
 */

var express   = require('express')
  , routes    = require('./routes')
  , http      = require('http')
  , path      = require('path')
  , PDFCreator  = require('./lib/createpdf').PDFCreator
  , SVGtoJPG    = require('./lib/svgtojpg').SVGtoJPG
  , fs  = require('fs')
  , spawn = require('child_process').spawn
  , utils = require('./lib/utils').utils
  , httpRequest = require('request')
  , FSDeferred = require('./lib/fsdeferred')
  , PageFiles = require('./lib/pagefiles')
  , Q = require('q')
  , _ = require('lodash')
  , Response = require('./lib/response').Response;

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
_env = (!!process.argv[2])? 'development' : 'production'
app.set('env', _env)
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


app.get('/', function(req, res) {
  res.render('index', {title: 'Katalog', env: app.get('env')});
});

app.get('/update-json-file', function(req, res) {
  FSDeferred.readFile('data/pages-array.json').then(function(data){
    var pages = JSON.parse(data);
    var i = 0;
    pages.every(function(page, index, array){
      var _file = page.svg.file;
      var _newFile = utils.encodeFilename(_file);
      var _path = 'public/svg/' + _file;
      var _newPath = 'public/svg/' + _newFile;
      fs.exists(_path, function(exists) {
        if(!exists) {
          fs.exists(_newPath, function(exists) {
            if (exists) {
              console.log(++i, index, _newPath);
              array[index].svg.file = _newFile;
              array[index].svg.path = _newPath;
            } else {
              console.log(_newPath, ' does not exists');
            }

          });
        };
      });

      // console.log('array.length', array.length);
      // if (index == array.length) return false
      return true;
    });
    setTimeout(function() {
      var pagesData = JSON.stringify(pages);
      var duplicateFile = function(err) {
        if (err) {
          var status = JSON.stringify({status: 'err', message: 'Error 2. Cannot read JSON file containing pages'});
          res.send(status);
        } else {
          fs.writeFile('public/data/pages-array.json', pagesData , function() {
            console.log('done');
          });
        }
      }

      fs.writeFile('public/data/tmp.pages-array.json', pagesData , duplicateFile);
    }, 4000);

  });
});

app.get('/update-svg-filename', function(req, res) {

  FSDeferred.readFile('data/pages-array.json').then(function(data){
    var pages = JSON.parse(data);
    pages.every(function(page, index, array){
      var _file = page.svg.file;
      var _newFile = utils.encodeFilename(_file);
      var _path = 'public/svg/' + _file;
      var _newPath = 'public/svg/' + _newFile;

      if (_file != _newFile) {
        console.log(_file, index);
        fs.rename(_path, _newPath, function(err) {
          if ( err ) console.log('ERROR: ' + err);
        });
      };

      return true;
    });
  });

});

//READ FOLDER VERSION
app.get('/integrity', function(req, res) {
	var renderView = function(data) {
    res.render('integrity', {title: 'Integrity', data: data});
    // res.send(data); //TODO send only JSON
	};

  var promises = [];

  // FIRST PROMISE IS TO GET JSON FILE
  promises.push(FSDeferred.readFile('data/pages-array.json'));

  // REST PROMISES RELATES TO FOLDER READS
  PageFiles.folders.forEach(function(folder){
    promises.push(FSDeferred.readdir(folder, (function(folder) {
      return function(data) {     // WRAPPER - WRAPS RESULT OF FOLDER READ
        var obj = {};
        obj.name = folder;
        obj.count = data.length;
        obj.files = data;
        return obj;
      };
    })(folder)));
  });


  Q.all(promises).then(function(data) {
    var viewData = {};
    var pagesArray = data.shift();   // THIS IS JSON CONTENT (PAGES-ARRAY.JSON)
        pagesArray = JSON.parse(pagesArray);

    viewData.folders = data         // THIS IS ARRAY WITH JPG FOLDERS OBJECT (NAME, COUNT, FILES)
    viewData.files = [];

    // FILENAMES TABLE LABELS
    viewData.files.push(['File name']);
    var folderNames = _.flatten(viewData.folders, 'name');
    viewData.files[0] = viewData.files[0].concat(folderNames);

    // FOR EACH PAGE (FROM JSON FILE) CHECK IF THERE ARE RELATED JPG FILES
    pagesArray.forEach(function(page) {
      var pageFiles = []

      pageFiles.push(page.svg.file);

      viewData.folders.forEach(function(folder) {
        var filename = (folder.name == 'svg')? page.svg.file : page.svg.file + '.jpg';
        var fileIndex = _.findIndex(folder.files, function(file) {
          return file == filename;
        });

        pageFiles.push(fileIndex >= 0);
        folder.files.splice(fileIndex, 1);
      });



      viewData.files.push(pageFiles);
    });

    renderView(viewData);
  },
  function(err) {
    console.log('err', err);
  });
});

//API STARTS HERE

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

  const pages = fs.readFileSync('public/data/pages-array.json');
  renderView(undefined, pages); // TODO error handler
});

//SAVE JSON TO FILE
app.post('/api/save', function(req, res) {
  var jsondata = req.body.jsondata;

  if (!issaving) {
    issaving = true;

    var renderView = function(err) {
      var status = JSON.stringify({status: 'ok'});
      if (err) status = Response.error('Error 1. Cannot read JSON file containing pages');

      issaving = false;
      res.send(status);
    };

    var duplicateFile = function(err) {
      if (err) {
        var status = Response.error('Error 2. Cannot read JSON file containing pages');
        res.send(status);
      } else {
        if (jsondata) {
          fs.writeFile('public/data/pages-array.json', jsondata, renderView);
        } else {
          var status = Response.error('pages-array.json file save fail.');
          res.send(status);
        }
      }
    }

    if (jsondata) {
      fs.writeFile('public/data/tmp.pages-array.json', jsondata, duplicateFile);
    } else {
      var status = Response.error('tmp.pages-array.json file save fail.');
      res.send(status);
    }

  } else {
    var status = Response.error('Another saving process is in progress.');
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

  const pages = fs.readFileSync('public/data/pages-array.json');
  deleteFiles(undefined, pages); // TODO error handler
});

app.get('/api/edit/:id', function(req, res) {

  var index = req.params.id;

  var editFile = function(err, pages) {
    if (err) console.log('Error. Cannot edit page related files');
    var pages = JSON.parse(pages);
    PAGE = pages && pages[index];
    var svg;
    if (PAGE && PAGE.svg) {
      svg = 'public/svg/' + PAGE.svg.file;
    } else {
      console.log('SVG file path invalid', svg, PAGE);
    }

    fs.exists(svg, function(exists) {
      if (exists) {
        res.send(JSON.stringify({'status': 'ok', 'svg': svg}));
        var childProcess = spawn('inkscape', ['-f', svg]);

        childProcess.on('error', function(err) {
          console.error('Inkscape error: ', err);
        });

        childProcess.on('exit', function(code, signal) {
          if (code) {
            console.error('Inkscape exited with code', code)
          } else if (signal) {
            console.error('Inkscape was killed with signal', signal);
          } else {
            console.log('Inkscape exited okay');
          }

        });
      } else {
        res.send(JSON.stringify({'status': 'err', 'svg': svg}));
      };
    });

  };

  const pages = fs.readFileSync('public/data/pages-array.json');
  editFile(undefined, pages); // TODO error handler
});

app.get('/api/refresh/:id', function(req, res){
  var index = req.params.id;
  console.log('refresh: ' + index);

  function response() {
    var status = {};
        status.status = 'ok';
    res.send(JSON.stringify(status));
  };

  var refresh = function(err, pages) {
    if (err) console.log('Error. Cannot edit page related files');
    var pages = JSON.parse(pages);
    PAGE = pages[index];

    var svg = 'public/svg/' + PAGE.svg.file;

    var jpgToBeCreated = [];
    PageFiles.jpgs.folders.forEach(function(folder){
      jpgToBeCreated.push('public/' + folder + '/' + PAGE.svg.file + '.jpg');
    });

    new SVGtoJPG(PAGE.svg.path, jpgToBeCreated, {width: PageFiles.jpgs.widths, quality: PageFiles.jpgs.qualities, callback: response});
  };

  const pages = fs.readFileSync('public/data/pages-array.json');
  refresh(undefined, pages); // TODO error handler
});

app.post('/api/add', function(req, res) {

  var PAGE = {};
      PAGE.svg = {};
      PAGE.status = "enable";
      PAGE.svg.dir = 'svg';

  //8 SEND RESPONSE
  function response() {
    var status = Response.success('Page added successfully.', {data: PAGE});
    res.send(status);
  };

  function createJPGs() {
    var jpgToBeCreated = [];
    PageFiles.jpgs.folders.forEach(function(folder){
      jpgToBeCreated.push('public/' + folder + '/' + PAGE.svg.file + '.jpg');
    });

    new SVGtoJPG(PAGE.svg.path, jpgToBeCreated, {width: PageFiles.jpgs.widths, quality: PageFiles.jpgs.qualities, callback: response})
  };

  //3 UPLOAD SVG FILE
  function uploadNewPage (path, file) {

    PAGE.svg.file = file;
    PAGE.svg.path = path + PAGE.svg.file;

    var is = fs.createReadStream(req.files.page.path);
    var os = fs.createWriteStream(PAGE.svg.path);

    is.pipe(os);
    os.on('close', function() {
        fs.unlinkSync(req.files.page.path);
        createJPGs();
    });
  };

  //2 IF FILE ALREADY EXISTS, WE RENAME THE FILE
  function fileExists (path, file, callback) {
    fs.exists(path + file, function(exists) {
      console.log(path + file, ' exists? ', exists);
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
  if (req.files.page) {
    fileExists('public/' + PAGE.svg.dir + '/', utils.encodeFilename(req.files.page.name), uploadNewPage);
  } else {
    res
      .status(400)
      .send(Response.error('Error. Page not added.'));
  }

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
