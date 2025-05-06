// Libraries
const sharp = require("sharp");

const {
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  S3Client
} = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const { initializeS3Client } = require("../../configuration/awsConfig");

const uploadFileToCdn = (file, fileName, fileType) => {
  return new Promise(async (resolve, reject) => {
    try {
      //  check file type
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
        return resolve({
          status: false,
          message: "Invalid file type",
        });
      }
      /*
      if file type is either 'image/jpeg' or 'image/png' compress the quality
      */

      //get file size in MB
      const fileSize = file.length / 1024 / 1024;

      //if file size is greater than 15 MB then return error

      if (fileSize > 15) {
        return resolve({
          status: false,
          message: "File size should be less than 15 MB",
        });
      }

      if (
        fileType === "image/jpeg" ||
        fileType === "image/jpg" ||
        fileType === "image/Jpg"
      ) {
        let buffer = await sharp(file)
          .rotate()
          [`${fileType === "image/jpeg" ? "jpeg" : "jpg"}`]({ quality: 70 })
          .toBuffer()
          .catch((error) => {
            console.log(
              `error in upload image sharp compression ---> ${error}`
            );

            return resolve({
              status: false,
              message: "Something went wrong with the image file",
            });
          });

        file = buffer;
      }
      //trimming spaces in file name
      fileName = fileName.replace(/ +/g, "");
      const uploadParams = {
        Bucket: process.env.SPACE_BUCKET_NAME,
        Key: fileName,
        Body: file,
        ContentType: fileType,
        //ACL: "public-read",
      };

      const s3 = await initializeS3Client();

      //   Upload image to s3 bucket
      await s3.send(new PutObjectCommand(uploadParams));

      const fileUrl = `${fileName}`;

      return resolve({
        status: true,
        message: "File uploaded successfully",
        url: fileUrl,
      });
    } catch (error) {
      console.error("Error uploading file to S3:", error);
      reject(error);
    }
  });
};

const uploadPrivateFileToCdn = (file, fileName, fileType) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!isValidFileType(fileType)) {
        return {
          status: false,
          message: `Invalid file type for ${fileType}`,
        };
      }

      /*
      if file type is either 'image/jpeg' or 'image/png' compress the quality
      */

      //get file size in MB
      const fileSize = file.length / 1024 / 1024;

      //if file size is greater than 15 MB then return error

      if (fileSize > 15) {
        return resolve({
          status: false,
          message: "File size should be less than 15 MB",
        });
      }

      if (
        fileType === "image/jpeg" ||
        fileType === "image/jpg" ||
        fileType === "image/Jpg"
      ) {
        let buffer = await sharp(file)
          .rotate()
          [`${fileType === "image/jpeg" ? "jpeg" : "jpg"}`]({ quality: 70 })
          .toBuffer()
          .catch((error) => {
            console.log(
              `error in upload image sharp compression ---> ${error}`
            );

            return resolve({
              status: false,
              message: "Something went wrong with the image file",
            });
          });

        file = buffer;
      }
      //trimming spaces in file name
      fileName = fileName.replace(/ +/g, "");
      const uploadParams = {
        Bucket: process.env.SPACE_PRIVATE_BUCKET_NAME,
        Key: fileName,
        Body: file,
        ContentType: fileType,
        ACL: "private",
      };

      const s3 = await initializeS3Client();

      //   Upload image to s3 bucket
      await s3.send(new PutObjectCommand(uploadParams));

      const fileUrl = `${fileName}`;

      return resolve({
        status: true,
        message: "File uploaded successfully",
        url: fileUrl,
      });
    } catch (error) {
      console.error("Error uploading private file to S3:", error);
      reject(error);
    }
  });
};

const uploadPrivateFileToCdnNew = (file, fileName, fileType) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!isValidFileType(fileType)) {
        return {
          status: false,
          message: `Invalid file type for ${fileType}`,
        };
      }

      /*
      if file type is either 'image/jpeg' or 'image/png' compress the quality
      */

      //get file size in MB
      const fileSize = file.length / 1024 / 1024;

      //if file size is greater than 15 MB then return error

      if (fileSize > 15) {
        return resolve({
          status: false,
          message: "File size should be less than 15 MB",
        });
      }

      if (
        fileType === "image/jpeg" ||
        fileType === "image/jpg" ||
        fileType === "image/Jpg"
      ) {
        try {
          let buffer = await sharp(file)
            .rotate()
            [`${fileType === "image/jpeg" ? "jpeg" : "jpg"}`]({ quality: 70 })
            .toBuffer();
          file = buffer;
        } catch (error) {
          console.log(`error in upload image sharp compression ---> ${error}`);
        }
      }

      //trimming spaces in file name
      fileName = fileName.replace(/ +/g, "");
      const uploadParams = {
        Bucket: process.env.SPACE_PRIVATE_BUCKET_NAME,
        Key: fileName,
        Body: file,
        ContentType: fileType,
        ACL: "private",
      };

      const s3 = await initializeS3Client();

      // Upload image to s3 bucket
      await s3.send(new PutObjectCommand(uploadParams));

      const fileUrl = `${fileName}`;

      return resolve({
        status: true,
        message: "File uploaded successfully",
        url: fileUrl,
      });
    } catch (error) {
      console.error("Error uploading private file to S3:", error);
      reject(error);
    }
  });
};

const deleteFileCdn = (fileName) => {
  return new Promise(async (resolve, reject) => {
    try {
      const params = {
        Bucket: process.env.SPACE_BUCKET_NAME,
        Key: fileName,
      };

      const s3 = await initializeS3Client();

      //   Upload image to s3 bucket
      await s3.send(new DeleteObjectCommand(params));

      return resolve({
        status: true,
        message: "File deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting file to S3:", error);
      reject(error);
    }
  });
};

const deletePrivateFileFromCdn = (fileName) => {
  return new Promise(async (resolve, reject) => {
    try {
      const params = {
        Bucket: process.env.SPACE_PRIVATE_BUCKET_NAME,
        Key: fileName,
      };

      const s3 = await initializeS3Client();

      //   Upload image to s3 bucket
      await s3.send(new DeleteObjectCommand(params));

      return resolve({
        status: true,
        message: "File deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting file to S3:", error);
      reject(error);
    }
  });
};

const uploadMultipleFilesToCdn = async (files, fileNamePre) => {
  // Check if all files are valid
  for (const fileType in files) {
    const fileData = files[fileType];

    const mimeType = fileData.mimetype.toLowerCase();
    if (!isValidFileType(mimeType)) {
      return {
        status: false,
        message: `Invalid file type for ${fileType}`,
      };
    }
  }

  // If all files are valid, proceed with uploads
  const uploadPromises = [];
  for (const fileType in files) {
    const fileData = files[fileType];
    const fileName = `${fileNamePre}/${Date.now()}_${fileData.name}`;
    const mimeType = fileData.mimetype.toLowerCase();

    const uploadPromise = uploadFileToCdn(fileData.data, fileName, mimeType);

    // Push an object with type and promise to the array
    uploadPromises.push({
      type: fileType,
      promise: uploadPromise,
    });
  }

  try {
    const results = await Promise.all(
      uploadPromises.map((upload) => upload.promise)
    );

    // Create an object with named properties for each type and its URL
    const urlsByType = {};
    results.forEach((result, index) => {
      const type = uploadPromises[index].type;
      const url = result.url;
      urlsByType[type] = url;
    });

    return {
      status: true,
      message: "Files uploaded successfully",
      data: urlsByType,
    };
  } catch (error) {
    console.error("Error uploading files:", error);
    return {
      status: false,
      message: "Error uploading files",
      error: error.message,
    };
  }
};

/** This function generates a pre-signed URL for an image stored in an S3 private bucket
 * It takes the file name of the image as a parameter and returns the URL
 * The URL expires after 60 seconds
 */

const generatePresignedUrl = async (fileName) => {
  if (typeof fileName !== "string" || !fileName) {
    return "";
  }
  const getObjectParams = {
    Bucket: process.env.SPACE_PRIVATE_BUCKET_NAME,
    Key: fileName,
  };

  try {
    const command = new GetObjectCommand(getObjectParams);

    const s3 = await initializeS3Client();

    const url = await getSignedUrl(s3, command, { expiresIn: 600 });

    //console.log("Pre-signed URL:", url);
    return url; // Return this URL to your application to display the image
  } catch (error) {
    console.error("Error generating pre-signed URL:", error);
    throw error; // Propagate the error if something goes wrong
  }
};

const deleteFileFromCdn = async (fileName) => {
  try {
    if (!fileName) {
      return {
        status: false,
        message: "File name is required",
      };
    }

    const s3 = await initializeS3Client();

    const deleteParams = {
      Bucket: process.env.SPACE_BUCKET_NAME,
      Key: fileName,
    };

    await s3.send(new DeleteObjectCommand(deleteParams));

    return {
      status: true,
      message: "File deleted successfully",
    };
  } catch (error) {
    console.error("Error deleting file from S3:", error);
    return {
      status: false,
      message: "Error deleting file",
      errorDetails: error.message,
    };
  }
};

module.exports = { deleteFileFromCdn };


module.exports = {
  uploadFileToCdn,
  uploadPrivateFileToCdn,
  deleteFileFromCdn,
  deletePrivateFileFromCdn,
  uploadMultipleFilesToCdn,
  generatePresignedUrl,
};

const isValidFileType = (fileType) => {
  const validFileTypes = [
    "image/jpeg",
    "image/jpg",
    "image/jfif",
    "image/png",
    "image/svg+xml",
    "video/mp4",
    "application/pdf",
  ];

  return validFileTypes.includes(fileType.toLowerCase());
};
