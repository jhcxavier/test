var cluster = require('cluster')
var numCPUs = require('os').cpus().length;

if ( cluster.isMaster ) {
  for ( var i=0; i< numCPUs  ; ++i )
    cluster.fork();
} else {

    var kue         = require('kue')
      , jobs        = kue.createQueue()
      , config      = require('./config/config.json')
      , images      = require('./models/images')
      , errorHandle = require('./models/errors').errorHandler()
      , im          = require('imagemagick')
      , fs          = require('fs')
      , path        = require('path')
      , imagesRoot  = path.resolve('..', 'imageout/public/') + "/"
      , sys         = require('sys')
      , exec        = require('child_process').exec

    kue.app.set('title', 'Catalogs Kue');
    kue.app.listen(config.kuePort);
    
    var jobQuantity = 30 // was 100 amount of images to process before posting JSON back
      , a_JSON      = []
      , i           = 0
      , timeout
      , totalSteps  = 4
          
    jobs.process("images",function(job, done){


        // Get Remote image
        var tmpImage = images.wgetRemote(job.data.url, function(err, filename){
            if (err) errorHandler(err)
            else {
                job.progress(1, totalSteps)

                console.log("My Images!", images);
                // Resize & Store Image
                images.resize(filename, job.data, function(err, s_dstPath){

                    if (err) errorHandler(err)
                    else {
                        job.progress(2, totalSteps)

                        // Get additional meta info and store
                        im.identify(imagesRoot + s_dstPath, function(err, features){
                            if (err) errorHandler(err)
                            else {
                                job.progress(3, totalSteps)

                                // Create Return JSON for image
                                var o_returnJSON = {
                                    id          : job.data.id
                                    , url         : s_dstPath
                                    , sizeName    : job.data.sizeName
                                    , metainfo    : features 
                                }

                                // Move Completed File to S3 Storage Bucket
                                exec("s3cmd put --acl-public " + imagesRoot +s_dstPath+" s3://cdn.catalogs.com/"+s_dstPath, function (err, stdout, stderr) {
                                    if (err) throw err
                                })

                                complete_job(o_returnJSON, function(){	
                                    job.progress(4, totalSteps)
                                })
                            }
                        })
                    }
                })
            }
        })
        
        
        // HANDLE ALL ERRORS
        function errorHandler(err){

            errorHandle(new Error(err))

            var o_returnJSON = {
                id          : job.data.id
              , url         : ''
              , sizeName    : job.data.sizeName
              , metainfo    : '' 
              , error       : err
            }
            //job.state('failed');
            complete_job(o_returnJSON)
        }



        // ONCE A JOB IS FINISHED THIS MARKS IT AND FIGURES OUT WHETHER OR NOT
        // TO SEND THE JSON BACK YET
        function complete_job(o_returnJSON, cb){

            a_JSON.push(o_returnJSON)		

            // Finished
            clearTimeout(timeout)
            timeout = setTimeout(function(){finished()}, 15000)
            i++

            if ( i >= jobQuantity ) {
                //console.log('SENDING CURRENT PROGRESS')
                //post json
                images.putJSON(a_JSON, job.data.returnAddr, function(){
                    done()
                    //console.log("---------- HIT " + jobQuantity)

                    //reset counter and array
                    i = 0
                    a_JSON = []
                })

                if (typeof cb == "function") cb()
            } else done()
        }



        // THIS IS RUN ONCE EVERYTHING EVERYTHING IS 100% DONE
        function finished(cb){
            //console.log('REACHED END')

            images.putJSON(a_JSON, job.data.returnAddr)
            images.clearCache()

            if (typeof cb == "function") cb()
        }   
        
    })
}
