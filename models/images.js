//var http        = require('http')
var http = require('follow-redirects').http
  , config      = require('../config/config.json')
  , fs          = require('fs')
  , path        = require('path')
  , sys         = require("sys")
  , url         = require("url")
  , im          = require('imagemagick')
  , _           = require('underscore')
  , exec        = require('child_process').exec
  , imagesRoot  = path.resolve('..', 'imageout/public/images/') + "/"
  , tmpFolder   = imagesRoot+'tmp/'
  , imgCache    = {}
    
var resize = exports.resize = function(filename, o_data, cb){  
    
    function resizeNow(){
    
        var newFilename = Math.random().toString(36).substr(2,9)+ filename   
          , s_dstPath   = imagesRoot + o_data.folder+'/' + newFilename // Internal location in the server.
          , s_dstPublic = 'images/' + o_data.folder+'/' + newFilename   // Sendback URL that points to public location
        
        im.resize({
            srcPath 	: tmpFolder+filename
          , dstPath 	: s_dstPath
          , width   	: o_data.maxWidth
          , height  	: o_data.maxHeight
          , progressive	: true
        }
        , function(err, stdout, stderr){            
            if (err) { cb(err); return }

            if(o_data.sizeName == 'cropped' ||  o_data.sizeName == 'vertical_standard' ||  o_data.sizeName == 'vertical_medium' || o_data.sizeName == 'horizontal_medium') {
                //console.log("cropping:" + o_data.sizeName)
                im.identify(s_dstPath, function(err, features){       
                    if (err) { cb(err); return }
                    
                    var w_cropPixels = (features.width < features.height)? features.width : features.height
                       ,h_cropPixels = (features.width < features.height)? features.width : features.height 
                    
	                if(o_data.sizeName == 'vertical_standard' ||  o_data.sizeName == 'horizontal_medium' || o_data.sizeName == 'vertical_medium') {
						
                    	//console.log("Scaling Ver/Horz:" + o_data.sizeName + ' Size =' + o_data.maxWidth + 'w x' + o_data.maxHeight + 'h' )
						
						im.scale2({
							srcPath: s_dstPath,
							dstPath: s_dstPath,
							width:  o_data.maxWidth,
							height: o_data.maxHeight,
							quality: 1,
							gravity: "Center"
						}, function(err, stdout, stderr){
							if (err) { cb(err); return }

							if (typeof cb == "function") {
								cb(null, s_dstPublic)
							}
						});
						
                    	
                	}
                	else {

                        //console.log("Cropping image for " + o_data.sizeName)
						im.crop({
							srcPath: s_dstPath,
							dstPath: s_dstPath,
							width:  w_cropPixels,
							height: h_cropPixels,
							quality: 1,
							gravity: "Center"
						}, function(err, stdout, stderr){
							if (err) { cb(err); return }

							if (typeof cb == "function") {
								cb(null, s_dstPublic)
							}
						});
                    }
                })
            } else {
                if (typeof cb == "function") {
                    cb(null, s_dstPublic)
                }
            }
        })
    }
    
    // Make sure the folder exists and it if doesn't then create it.
    fs.readdir(imagesRoot+o_data.folder, function(err, files){
        if (err) {
            fs.mkdir(imagesRoot+o_data.folder, 0777, function(){
                resizeNow()
            })
        } else resizeNow()
    })
}

var getRemote = exports.getRemote = function(s_url, cb){

    // Check if we have already downloaded the remote file first
    // if so just return the downloaded version.
    if (typeof imgCache[s_url] != "undefined") {
        if (typeof cb == "function") cb(null, imgCache[s_url])
        return false
    }
     
    im.identify(s_url, function(err, features){


        // Force Feature Format to continue then bypass error.
        if(!features) {
            features = new Object();
            features.format = s_url.split('.').pop();
            if(features.format)
                err = false;
        }

        // If the image has no width then report the error and move on
        if (err) { cb(err); return }

        // Download image from remote server save it and add it to the imgCache
        var s_host          = url.parse(s_url).host
          , s_path          = url.parse(s_url).path
          , tmpFilename     = Math.random().toString(36).substr(2,9)+"."+features.format

        var o_options = {
            host: s_host
          , port: 80
          , path: s_path
        }

        var request = http.get(o_options, function(res){
            var imagedata = ''
            res.setEncoding('binary')

            res.on('data', function(chunk){
                imagedata += chunk
            })

            res.on('end', function(){
                fs.writeFile(tmpFolder+tmpFilename, imagedata, 'binary', function(err){
                    if (err) { cb(err); return } 
                    
                    imgCache[s_url] = tmpFilename
                    if (typeof cb == "function") cb(null, tmpFilename)
                })
            })

        })
    })
}

var wgetRemote = exports.wgetRemote = function(s_url, cb){

    // Download image from remote server save it and add it to the imgCache
    var s_host          = url.parse(s_url).host
        , s_path        = url.parse(s_url).path
	    , err 			= false
		, wcommand		= ''
		, tmpFilename   = Math.random().toString(36).substr(2,9);

    // Check if we have already downloaded the remote file first
    // if so just return the downloaded version.
    if (typeof imgCache[s_url] != "undefined") {
        if (typeof cb == "function") cb(null, imgCache[s_url])
        return false
    }
	wcommand = "wget   --no-check-certificate --user-agent=\"Mozilla/5.0 (Macintosh; Intel Mac OS X 10.8; rv:21.0) Gecko/20100101 Firefox/21.0\" -O\"" + tmpFolder+tmpFilename + "\" '" +  s_url.trim() + "'"
	//console.log(wcommand);
    proc = exec(wcommand, function (err, stdout, stderr) {

        if (err) {
			console.dir("Images Error "+err);
		}
    });

	proc.on('exit', function (code) {

		var renamedFile = '';

		   //console.log('Image ' + tmpFolder+tmpFilename  + ' was downloaded with exit code '+code);

		   fullPath = tmpFolder+tmpFilename;

	       im.identify(fullPath, function(err, features){
				// Force Feature Format to continue then bypass error.
				if(err) {
					renamedFile = tmpFilename + '.JPG';
					err = false;
				}
				else
					renamedFile = tmpFilename + '.' + features.format;

				fs.rename(tmpFolder+tmpFilename ,tmpFolder+renamedFile,  function (err) {
				                    //if (err) throw err;
				                    //console.log('Renamed complete for ' +renamedFile);
				                });

				if (typeof cb == "function") cb(null, renamedFile);
			});
	});

    if (err) { cb(err); return }
}

var postJSON = exports.postJSON = function(a_JSON, s_returnAddr, cb){
        
    
    var s_host    = url.parse(s_returnAddr).host
      , s_path    = url.parse(s_returnAddr).path
    
    var o_options = {
        host: s_host
      , port: config.imagePort
      , path: s_path
      , method: 'POST'
      , headers: {
          'Content-Type': 'application/json'
      }
    }

    var req = http.request(o_options, function(res){
        res.on('data', function(chunk) {
            if (typeof cb == "function") cb()
        });
    })
    
    req.on('error', function(err){
        if (err) { cb(err); return }
    })
    
    req.write(JSON.stringify({JSON: a_JSON}))
    req.end()
}


var putJSON = exports.putJSON = function(a_JSON, s_returnAddr, cb){
        
    
    var s_host    = url.parse(s_returnAddr).host
      , s_path    = url.parse(s_returnAddr).path
    
    var o_options = {
        host: s_host
      , port: 80
      , path: s_path
      , method: 'PUT'
      , headers: {
          'Content-Type': 'application/json'
      }
    }

    var req = http.request(o_options, function(res){
        res.on('data', function(chunk) {
            if (typeof cb == "function") cb()
        });
    })
    
    req.on('error', function(err){
        if (err) { cb(err); return }
    })
    
    //console.dir(o_options)
    //console.log("Sending")
    
    req.write(JSON.stringify({JSON: a_JSON}))
    req.end()
}

var clearCache = exports.clearCache = function(){
    _.each(imgCache, function(val, key){
        fs.unlink(tmpFolder+val)
    })
    imgCache = {}
}
