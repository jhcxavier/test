var airbrake    = require('airbrake').createClient("0540f5a769b2a0bf8d8749972d99db28")

var errorHandler = exports.errorHandler = function(){
    
    return function(err, req, res, next){
    /*    if (typeof res != 'undefined'){
            res.statusCode = 500
            res.writeHead(500, { 'Content-Type': 'text/plain' })
            res.end(err.stack);
        }
        
        airbrake.notify(err, function(err, url) {
            console.log('AIRBRAKE: Error Submitted' + '-' + url)
        })*/
    }

}
