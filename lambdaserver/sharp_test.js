const sharp = require('sharp');

sharp('temp/11bjs161qgjycxhgmy.JPEG')
  .resize(100, 400)
  .toFile('temp/processed/11bjs161qgjycxhgmy.JPEG', function(err) {
    console.log('error', err);
    // output.jpg is a 300 pixels wide and 200 pixels high image
    // containing a scaled and cropped version of input.jpg
  });
