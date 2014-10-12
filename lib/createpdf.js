var EventEmitter    = require('events').EventEmitter,
    PDFDocument     = require('pdfkit'),
    SVGtoJPG        = require('./svgtojpg').SVGtoJPG,
    fs              = require('fs'),
    utils           = require('./utils').utils;
    // Dropbox       = require('dropbox');

var leadingZeros = function(what) {
  var what = '' + what;
  if (what.length < 2) return '0' + what;
  return what;
};


PDFCreator = function(data, callback) {

  var today = new Date(),
      day, month, year, time = 0;

      day = leadingZeros(today.getDate());
      month = leadingZeros(today.getMonth());
      year = leadingZeros(today.getFullYear());
      time = leadingZeros(today.getHours()) + leadingZeros(today.getMinutes()) + leadingZeros(today.getSeconds());

  var data = JSON.parse(data),
			ee = new EventEmitter(),
  		pages = [],
      pdf = null,
      directory = 'public/pdf',
			path = directory + '/katalog_' + year + month + day + '_' + time + '.pdf',
      _this = this;

  this.writeStreams = 0;

  if (data.length > 1) {
    pdf = new PDFDocument({'size': [631.36, 841.89]}),  //CUSTOM VALUES TO FILL OUT IPAD'S 4:3 SCREEN
		pdf.image('public/img/artdom_logo-w2000.png', 75, 300, {'fit': [450, 841]});
		pdf.addPage();
  } else if (data.length == 1) {
    pdf = new PDFDocument({'size': 'A4'}),  //CUSTOM VALUES TO FILL OUT IPAD'S 4:3 SCREEN
  	path = 'public/pdf/drukuj.pdf';
  };

  var processPage = function(page) {

    var page = page;

    _this.writeStreams++;

    if (page.status != 'disable') {
      pages.push(page);
    }

    page.svg.folder = 'public/svg/';
    page.svg.path   = page.svg.folder + page.svg.file;

    page.png        = {};
    page.png.file   = utils.encodeFilename(page.svg.file) + '.png';
    page.png.folder = 'public/png/';
    page.png.path   = page.png.folder + page.png.file;

    page.jpg        = {};
    page.jpg.file   = utils.encodeFilename(page.svg.file) + '.jpg';
    page.jpg.folder = 'public/jpg/';
    page.jpg.path   = page.jpg.folder + 'w2000/' + page.jpg.file; // w2000 contains our full size images (it is our default)

    jpgToBeCreated = [];
    jpgToBeCreated.push(page.jpg.folder + 'w2000/' + page.jpg.file);
    jpgToBeCreated.push(page.jpg.folder + 'w800/' + page.jpg.file);
    jpgToBeCreated.push(page.jpg.folder + 'w280/' + page.jpg.file);
    jpgToBeCreated.push(page.jpg.folder + 'w100/' + page.jpg.file);

    widths = [2000,800,280,100];

    var siftedJpgs    = [];
    var siftedWidths  = [];

    var i = jpgToBeCreated.length;
    var checkExistsStreams = 0;

    var procedeWithConvertion = function() {
      if (siftedJpgs.length == 0) {
        nextPage()
      } else {
        new SVGtoJPG(page.svg.path, siftedJpgs, {width: siftedWidths, callback: nextPage})
      }
    };

    while(--i >= 0) {
      checkExistsStreams++;
      fs.exists(jpgToBeCreated[i], (function(i) {
        return function(exists) {
          if (!exists) {
            siftedJpgs.push(jpgToBeCreated[i]);
            siftedWidths.push(widths[i]);
          };
          if (--checkExistsStreams == 0) procedeWithConvertion();
        };

      })(i));
    };

  }

  var nextPage = function(err, stdout) {
    if (err) throw err;

    --_this.writeStreams;
    if (data.length > 0) {
      processPage(data.shift())
    } else if (_this.writeStreams < 1) {
      ee.emit('finish');
    }
  };

  ee.on('finish', function() {
  	var i = 0;

    // ADDING ALL PAGES
    pages.forEach( function(page) {
      if (i>0) { pdf.addPage() };
      pdf.image(page.jpg.path, 20, 0, {'fit': [595, 841]});
      i++;
    });

    // WRITTING PDF FILE
    pdf.write(path, function(err) {
      var status = {status: 'ok'};
      if (err) {
        status = {status: 'error'};
      } else {
        // REMOVE ALL OTHER PDF FILES

        rmDir = function(dirPath) {
          try { var files = fs.readdirSync(dirPath); }
          catch(e) { return; }
          if (files.length > 0) {
            for (var i = 0; i < files.length; i++) {
              var filePath = dirPath + '/' + files[i];
              if (fs.statSync(filePath).isFile() && (filePath != path))  // DELETE IF FILE AND FILE IS NOT THE FILE WE'VE JUST CREATED
                fs.unlinkSync(filePath);
              // else
              //   rmDir(filePath);
            };
          // fs.rmdirSync(dirPath);
          };
        };

        rmDir(directory);

      };

      callback(status);
    });
  });

  var i = (data.length < 2)? data.length : 1;
  while(i--) processPage(data.shift());

};


exports.PDFCreator = PDFCreator
