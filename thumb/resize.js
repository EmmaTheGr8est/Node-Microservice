const jimp = require("jimp");

exports.thumbnailSize = (
  originalImagePath,
  thumbnailImageLocation,
  callback
) => {
  jimp.read(originalImagePath, (error, image) => {
    if (error) {
      callback(new Error("Image has broken"), null, null);
    } else {
      image.resize(50, 50).write(thumbnailImageLocation, err => {
        if (err) {
          callback(err, null, null);
        }
        callback(null, thumbnailImageLocation, null);
      });
    }
  });
};
