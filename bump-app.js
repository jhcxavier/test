/**
 * Created by ASUSK55A on 7/6/15.
 */

/**
 * Module dependencies.
 */

var express     = require('express')
    , config      = require('./config/config.json')
    , queue       = require('./routes/queue')
    , http        = require('http')
    , errors      = require('./models/errors')
    , app         = express();

app.configure(function(){
    app.set('port', 3020);
    app.set('views', __dirname + '/views');
    app.set('view engine', 'ejs')
    app.use(express.logger('dev'));
    app.use(express.bodyParser());
    app.use(express.methodOverride());
    app.use(app.router);
    app.use(express.static(__dirname + '/public'));
});

app.configure('development', function(){
    app.use(express.errorHandler());
});

app.configure('production', function(){
    app.use(errors.errorHandler());
});


// Default Index
app.get('/', queue.index)


// ROUTES
app.get('/loadavg',queue.loadAverage) // Get system load average
app.get('/flushall',queue.flushAll) // Get system load average
app.get('/bump/:catID', queue.bump)
app.get('/push/:catID', queue.push)
app.get('/remove/:catID',queue.remove)
app.get('/bumpList',queue.bumpList)
app.get('/pushList',queue.pushList)
app.get('/info/:catID',queue.catInfo)
//app.get('/queue/bump',queue.bump)//bump current catalog processing to delayed

http.createServer(app).listen(app.get('port'), function(){
    console.log("Bump server listening on port " + app.get('port'));
})