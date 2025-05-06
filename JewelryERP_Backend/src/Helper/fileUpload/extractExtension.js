function getFileExtensionFromMimeType(mimetype) {
    const extensionMatch = mimetype.match(/\/(.+)/);
    if (extensionMatch && extensionMatch[1]) {
      return "." + extensionMatch[1];
    }
  }

  async function checkFileType(fileType) {
    let validFileType = [
      "image/jpeg",
      "image/jpg",
      "image/jfif",
      "image/Jpg",
      "video/mp4",
      "application/pdf",
      "image/png",
      "image/svg+xml",
    ];

    if (!validFileType.includes(fileType)) {
      return false
    }
    else
    return true
  }
  
  module.exports = {
    getFileExtensionFromMimeType,
    checkFileType
  };
  