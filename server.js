require('dotenv').config()
var cluster = require('cluster')
   ,app     = require('./kue-app')
 
  console.log("SERVER env variable", process.env.SERVER);
var workers = {},
    count = require('os').cpus().length;
 
function spawn(){
  var worker = cluster.fork();
  workers[worker.pid] = worker;
  return worker;
}
 
if (cluster.isMaster) {
  for (var i = 0; i < count; i++) {
    spawn();
  }
  
  cluster.on('death', function(worker) {
    console.log('worker ' + worker.pid + ' died. spawning a new process...');
    delete workers[worker.pid];
    spawn();
  });
} else {
  app.kue.app.listen(3000);
}