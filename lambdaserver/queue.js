/*
 * Process Image in the Queue Model.
 */

var redis   = require("redis")
  , config      = require('../config/config.json')
  , client  = redis.createClient()
  , _       = require('underscore')
  , kue     = require('kue')
  , job     = require('kue').Job
  , jobs    = false
  , sys     = require('sys')
  , child   = require('child_process')
  , os      = require('os')
  , exec    = require('child_process').exec
  , events  = require('events')
  , eventEmitter  = new events.EventEmitter();

kue.redis.createClient = function() {
    var client = redis.createClient(config.redis.port, config.redis.host);
    //client.auth('password');
    return client;
};

client.on("error",function(err){
    console.log("Redis Error: "+err);
});

jobs = kue.createQueue();


add = exports.add = function(o_JSON, cb){
    
    var quality         = o_JSON.quality
      , folder          = o_JSON.folder
	  , catalog_id		= o_JSON.catalogID || ""
	  , catalog_name	= o_JSON.catalogName || ""
	  , merchant_id		= o_JSON.merchantID || ""
	  , merchant_name	= o_JSON.merchantName || ""
      , returnAddr      = o_JSON.returnAddr
      , sizes           = o_JSON.sizes || []
      , images          = o_JSON.images || []
    
      
    client.on("error", function (err) {
        console.log("Error " + err);
    });
    
    _.each(images, function(o_image){
        
        _.each(sizes, function(o_size){
            
            var imgJSON = {
                title           : "Processing  " + catalog_name  + " (" + catalog_id	 +  " ) " + o_size.name + " of " + o_image.url
              , quality         : quality
              , catalog_id      : catalog_id
              , folder          : folder
              , returnAddr      : returnAddr
              , maxWidth        : o_size.maxWidth
              , maxHeight       : o_size.maxHeight
              , sizeName        : o_size.name
              , id              : o_image.id
              , url             : o_image.url
            }
            jobs.create("images", imgJSON).save()
            
        })
    })

    client.quit();
	console.log("Added feed for Merchant " +  merchant_name + "(" + merchant_id + ")" + " processing " + catalog_name  +  "(" + catalog_id + ")" + " at " + (new Date().toString()) );
    cb("Success!")
}

catInfo=exports.catInfo=function(catID,cb){
    var jobTotal          = 0,
        jobsToCurrent     = 0,
        listArr           = [],
        catalogsToCurrent = 0,
        jobCount          = 0,
        currentJobCount   = 0;

    jobs.state('inactive',function(err,jobID){
        for(var count in jobID){
            jobTotal++;
            job.get(jobID[count],function(err,inactiveJob){
                if(err){cb('[]');}
                var jobData=inactiveJob.data;
                var listIndex=listArr.indexOf(jobData.catalog_id);
                if(listIndex==-1){
                    listArr.push(jobData.catalog_id);
                }
                if(listArr.indexOf(catID)==-1){
                    jobsToCurrent++;
                }
                if(jobData.catalog_id==catID){
                    currentJobCount++;
                }
                if(++jobCount==jobID.length){
                    catalogsToCurrent=listArr.indexOf(catID);
                    console.log('Total # of... \nJobs in Queue: '+jobTotal);
                    console.log('Jobs to '+catID+': '+jobsToCurrent);
                    console.log('Catalogs to '+catID+': '+catalogsToCurrent);
                    console.log('Catalogs: '+listArr);
                    var jsonObj="{'total':'"+jobTotal+"', 'jobsToCurrent':'"+jobsToCurrent+"', 'currentJobTotal':'"+currentJobCount+"', 'catalogsToCurrent':'"+catalogsToCurrent+"', 'catalogs:'"+listArr+"'}";
                    //console.log(jsonObj);
                    cb(jsonObj);
                }
            });
        }
    });
}

bumpList=exports.bumpList=function(cb){
    var listArr=[];
    var jobCount=0;
    jobs.state('inactive',function(err,jobID){
        for(var count in jobID){
            //console.log(count);
            job.get(jobID[count],function(err,inactiveJob){
                if(err){cb(listArr); return 0;}
                var jobData=inactiveJob.data;
                var listIndex=listArr.indexOf(jobData.catalog_id+" "+jobData.title.substring(11,jobData.title.indexOf(jobData.catalog_id)-1));
                if(listIndex==-1){
                    listArr.push(jobData.catalog_id+" "+jobData.title.substring(11,jobData.title.indexOf(jobData.catalog_id)-1));
                }
                //console.log('ListArray: '+JSON.stringify(listArr));
                if(++jobCount==jobID.length){
                    var listArray=listArr;//JSON.stringify(listArr);
                    cb(listArray);
                }
            })
        }
        if(jobID.length==0){cb(listArr);}
    });
}

pushList=exports.pushList=function(cb){
    var listArr=[];
    var jobCount=0;
    jobs.state('delayed',function(err,jobID){
        for(var count in jobID){
            //console.log(count);
            job.get(jobID[count],function(err,inactiveJob){
                if(err){cb(listArr); return 0;}
                var jobData=inactiveJob.data;
                var listIndex=listArr.indexOf(jobData.catalog_id+" "+jobData.title.substring(11,jobData.title.indexOf(jobData.catalog_id)-1));
                if(listIndex==-1){
                    listArr.push(jobData.catalog_id+" "+jobData.title.substring(11,jobData.title.indexOf(jobData.catalog_id)-1));
                }
                //console.log('ListArray: '+JSON.stringify(listArr));
                if(++jobCount==jobID.length){
                    var listArray=listArr;//JSON.stringify(listArr);
                    cb(listArray);
                }
            })
        }
        if(jobID.length==0){cb(listArr);}
    });
}

//permanently removes the jobs from the queue
remove=exports.remove=function(catID,cb){
    jobs.state('delayed',function(err,jobID){
       for(var count in jobID){
           job.get(jobID[count],function(err,delayedJob){
               if(err){cb('Nothing to remove')}
               var jobData=delayedJob.data;
               if(catID==jobData.catalog_id){
                   delayedJob.remove();
               }
           });
       }
    });
    cb('Removed '+catID+' from delayed processing');
};

//bump the current feed to the end of the queue
bump=exports.bump=function(catID,cb){
    jobs.state('inactive',function(err,jobID){
        for(var count in jobID){
            job.get(jobID[count],function(err,inactiveJob){
                if(err){cb('Nothing to bump');}
                var jobData=inactiveJob.data;
                if(catID==jobData.catalog_id){
                    inactiveJob.state('delayed');
                }
            });
        }
    });
    jobs.state('active',function(err,jobID){
        for(var count in jobID){
            job.get(jobID[count],function(err,activeJob){
                if(err){cb('Nothing to bump');}
                var jobData=activeJob.data;
                if(catID==jobData.catalog_id){
                    activeJob.state('complete');
                }
            });
        }
    });
    cb('Successfully bumped catalog_id: '+catID);
};

//Pushes delayed jobs back into the queue
push=exports.push=function(catID,cb){
    jobs.state('delayed',function(err,jobID){
        for(var count in jobID){
            job.get(jobID[count],function(err,delayedJob){
                var jobData=delayedJob.data;
                if(catID==jobData.catalog_id){
                    delayedJob.state('inactive');
                    //client.zrem('q:jobs:delayed',jobID[count]);
                }
            });
        }
    });
    cb('Successfully pushed catalog_id: '+catID+' back into the queue');
};

loadAverage  = exports.loadAverage = function(cb){
    var  statsObj =  new Object()
        ,err = null
		statsObj.cpuLoadAvg = os.loadavg();
		statsObj.uptime = Math.round(os.uptime()/60);

    if (typeof cb == 'function')
        cb(JSON.stringify(statsObj), err)
    else
        return false
}

flushAll  = exports.flushAll = function(cb){
    var  successObj =  new Object()
        ,err = null
    proc = exec("redis-cli flushall",  function (err, stdout, stderr) {
        if (err) {
            console.dir(err);
        }
    });
    proc.on('exit', function (code) {
        console.log("Cleared Redis:" + code)
        successObj.message = "Cleared Redis at " + Date()
        if (typeof cb == 'function')
            cb(JSON.stringify(successObj), err)
        else
            return false
    });

} 