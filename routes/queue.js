var Queue = require('../models/queue');
var http=require("http");

exports.index = function(req, res){
    var url=[];
    var url2=[];
    http.get(process.env.SERVER+'/bumplist',function(resp){
        var body='';
        resp.on('data',function(chunk){
            body+=chunk;
        });
        resp.on('end',function(){
            http.get('http://127.0.0.1:3020/pushlist',function(resp2){
                var body2='';
                resp2.on('data',function(chunk){
                   body2+=chunk;
                });
                resp2.on('end',function(){
                   url2=JSON.parse(body2);
                    url=JSON.parse(body);
                    res.render('index', { title: 'Image Processing Queue', list: url, list2: url2});
                });
            }).on('error',function(e){
                    console.log("Error2: ",e);

                });
        });
    }).on('error',function(e){
            console.log("Got an Error: ", e);
            res.render('index', { title: 'Image Processing Queue', list: '[]'})
    });
};
    

exports.processJSON = function(req, res){    

    var JSON = req.param('JSON') ? req.param('JSON') : req.body;
    
    // Error out if JSON doesn't exists
    if(typeof JSON != 'object') {
        res.send("Failed to process Image: [" + imageJSON + "]");
        return false
    }

    Queue.add(JSON, function(message, err){
        if (err) res.send('jsonCallback({ message : "ERROR: " + err});');
        else res.send('jsonCallback({ message : "Success:Image Queued"});')
    })
};

exports.catInfo=function(req,res){
    var id=req.params.catID;
    Queue.catInfo(id,function(cb,err){
        if(err)res.send(err);
        else res.send(cb);
    });
    console.log("Returning info for catalog_id: "+id);
};

exports.bump = function(req, res){
    var id=req.params.catID;
    Queue.bump(id,function(cb, err){
        if(err)res.send(err);
        else res.send(cb);
    });
    console.log("Bumping catalog_id: "+id+" to delayed");
};

exports.push = function(req, res){
    var id=req.params.catID;
    Queue.push(id,function(cb, err){
        if(err)res.send(err);
        else res.send(cb);
    });
    console.log("Pushing catalog_id: "+id+" back into the queue");
};

exports.remove=function(req,res){
    var id=req.params.catID;
    Queue.remove(id,function(cb,err){
        if(err)res.send(err);
        else res.send(cb);
    });
    console.log("Removing catalog_id: "+id+" from the delayed list.");
};

exports.bumpList = function(req,res){
    Queue.bumpList(function(listArr){
        res.send(JSON.stringify(listArr));
    });
};

exports.pushList = function(req,res){
    Queue.pushList(function(listArr){
        res.send(JSON.stringify(listArr));
    });
};

exports.loadAverage = function(req, res){

    Queue.loadAverage(function(statsJSON, err){
        if (err) res.send('jsonCallback({ message : "ERROR: " + err});');
        else res.send(statsJSON)
    })
};


exports.flushAll = function(req, res){

    Queue.flushAll(function(successJSON, err){
        if (err) res.send('jsonCallback({ message : "ERROR: " + err});');
        else res.send(successJSON)
    })
};