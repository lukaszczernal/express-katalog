var Service = require('node-windows').Service;

// Create a new service object
var svc = new Service({
  name:'Katalog',
  description: 'Artdom Katalog',
  script: 'C:\\Users\\Admin\\Dropbox\\express-katalog\\app.js'
});

// Listen for the "install" event, which indicates the
// process is available as a service.
svc.on('install',function(){
  svc.start();
});

svc.install();