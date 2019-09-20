var cluster = require('cluster')
var numCPUs = require('os').cpus().length;

if ( cluster.isMaster ) {
    for ( var i=0; i< numCPUs  ; ++i )
        cluster.fork();
} else {

    /**
     * Module dependencies.
     */

    var express = require('express')
        , config = require('./config/config.json')
        , queue = require('./routes/queue')
        , http = require('http')
        , errors = require('./models/errors')
        , app = express();

    app.configure(function () {
        app.set('port', process.env.PORT || config.imagePort);
        app.set('views', __dirname + '/views');
        app.set('view engine', 'ejs')
        app.use(express.logger('dev'));
        app.use(express.bodyParser());
        app.use(express.methodOverride());
        app.use(app.router);
        app.use(express.static(__dirname + '/public'));
    });

    app.configure('development', function () {
        app.use(express.errorHandler());
    });

    app.configure('production', function () {
        app.use(errors.errorHandler());
    });


// Default Index
    app.get('/', queue.index)


//  Queue ROUTES
    app.get('/queue', queue.processJSON) // Save Image to Queue via GET
    app.post('/queue', queue.processJSON) // Save Image to Queue via POST
    app.get('/queue/loadavg', queue.loadAverage) // Get system load average
    app.get('/queue/flushall', queue.flushAll) // Get system load average

    app.get('/bump/:catID', queue.bump)
    app.get('/push/:catID', queue.push)
    app.get('/remove/:catID',queue.remove)
    app.get('/bumpList',queue.bumpList)
    app.get('/pushList',queue.pushList)
    app.get('/info/:catID',queue.catInfo)



    http.createServer(app).listen(app.get('port'), function () {
        console.log("Express server listening on port " + app.get('port'));
    })

}