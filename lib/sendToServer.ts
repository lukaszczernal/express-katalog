// https://bountify.co/node-js-script-for-copying-files-between-two-ftp-locations

const Client = require('ftp');

const ftpAccount = {
    host     : 'lukeduke.linuxpl.info',
    port     : 21,
    user     : 'katalog',
    password : '3majsieLINUXPL'
}


var ftpClient = new Client();
ftpClient.on('ready', function() {

  downloadList.map(function(filename){

    // Upload local files to the server:
    ftpClient.put(filename, filename, function(err) {
      if (err) throw err;
      ftpClient.end();
    });

  });

});

ftpClient.connect(ftpAccount);
