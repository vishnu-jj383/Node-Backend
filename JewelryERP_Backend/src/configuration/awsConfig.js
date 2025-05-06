const { S3Client } = require("@aws-sdk/client-s3");
const logger = require("../errorHandlers/logger");

let s3;

const initializeS3Client = async () => {
  // Ensure that environment variables are set
  if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
    console.error("Missing required environment variables for AWS S3 credentials.");
    throw new Error("Missing credentials");
  }

  try {
    if (s3) {
      return s3;
    }

    // Initialize the S3 client using environment variables
    s3 = new S3Client({
      region: process.env.AWS_REGION || "ap-south-1", // Default to ap-south-1 if not set
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    });

    console.log("S3 Client Initialized Successfully");
    return s3;
  } catch (error) {
    logger.error("Error initializing AWS S3 client:", error);
    throw error;
  }
};

module.exports = {
  initializeS3Client,
  s3,
};
