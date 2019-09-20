var im = require('imagemagick');
var filename = '11bjs161qgjycxhgmy.JPEG';
var newFilename = Math.random().toString(36).substr(2, 9) + filename;
var newWidth = 200;
fs = require('fs');
http = require('http');
url = require('url');

im.resize({
  srcPath: './temp/' + filename,
  dstPath: './temp/processed/' + newFilename,
  width: newWidth,
  height: '',
  progressive: true
}, function(err, stdout, stderr) {
  console.log('error', err);
  console.log('stdout', stdout);
  console.log('stderr', stderr);
});


