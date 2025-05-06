const logger = require("./logger");

const { statusCodes } = require("../utils/constants");

/*
  Catch Errors Handler

  With async/await, you need some way to catch errors
  Instead of using try{} catch(e) {} in each controller, we wrap the function in
  catchErrors(), catch and errors they throw, and pass it along to our express middleware with next()
*/
const catchErrors = (fn) => (req, res, next) => fn(req, res, next).catch(next);

/**
 * Global error handler middleware
 * @param {Error} error - The error object passed by Express
 * @param {Object} req - The request object
 * @param {Object} res - The response object
 * @param {Function} next - The next middleware function
 * @returns {void}
 *
 * This handles errors that occur during the request-response cycle.
 * In development mode, detailed error information is sent as the response.
 * In production mode, only generic error messages are sent to the client.
 */

const globalErrorHandler = (error, req, res, next) => {
   const devMode = true;
  //const devMode = process.env.NODE_ENV === "development";

  try {
    const stackLines = error.stack ? error.stack.split("\n") : [];
    const errorStack = stackLines.slice(0, 4).join("\n");
    const userId = req.user?.account?._id || req.user?._id || "Unknown";

    // In Development Mode
    if (devMode) {
      console.log(error)
      logger.error(
        `Development Mode - Error: ${req.method} ${req.originalUrl}, ` +
          `Error: ${error.message}, Stack: ${errorStack}, UserId: ${userId}`
      );

      if (error.name === "SequelizeUniqueConstraintError") {
        const field = error.errors[0].path; // Get the field causing the error
        const value = error.errors[0].value; // Get the duplicate value
  
        return  res.status(statusCodes.CONFLICT).json({
            message: `${field} (${value}) already exists.`,
          })        
      }

      if (error.name === "SequelizeForeignKeyConstraintError") {
  console.log(error.original.detail)
        return  res.status(statusCodes.CONFLICT).json({
            message: `${error.parent.detail}`,
          })        
      }

      if (error instanceof SyntaxError) {
        return res.status(statusCodes.BADREQUEST).json({
          status: false,
          message: "Invalid JSON",
        });
      }

      

      // Generic error response for development
      return res.status(statusCodes.ERROR).json({
        status: false,
        message: error.message,
        stack: errorStack,
      });
    }

    // In Production Mode
    logger.error(
      `Production Mode - Error: ${req.method} ${req.originalUrl}, ` +
        `Error: ${error.message}`
    );

    // Generic error response for production
    return res.status(statusCodes.ERROR).json({
      status: false,
      message: "Something went wrong!",
    });

  } catch (err) {
    // If an error occurs while handling the error, log it and return a generic response
    //logger.error("Error while handling error:", err);
    logger.error(
      `Error while handling error - ${req.method} ${req.originalUrl},` +
        `Original Error Message: ${error.message}, ` +
        `Handling Error: ${err.message}`
    );
    return res.status(statusCodes.ERROR).json({
      status: false,
      message: "Something went wrong!",
    });
  }
};

/**
 * validating incoming data based on a given validator function.
 *
 * The `validate` middleware checks if the request data (either in the request body or request parameters)
 * confirms to a specified validation schema. It uses the provided validator function to perform the validation.
 * If the data doesn't meet the validation criteria, it sends a 400 Bad Request response with the validation error message.
 *
 * @param {Function} validator - The validator function to be used for validating the data.
 * @returns {Function} - A middleware function that checks the validity of incoming data.
 *                       If valid, it calls `next()` to pass the request to the next middleware.
 *                       If invalid, it sends a 400 Bad Request response with the validation error message.
 */

const validate = (validator) => {
  return (req, res, next) => {
    const data = { ...req.body, ...req.params, ...req.query };
    const { error } = validator(data);
    // If there's a validation error, send a 400 response with the error message
    if (error) {
      const message = error.details[0].message.replace(/"/g, "");
      return res
        .status(statusCodes.BADREQUEST)
        .send({ message, status: false });
    }

    // Inside the validate middleware
    if (req.files && Object.keys(req.files).length > 0) {
      for (const fileType in req.files) {
        const file = req.files[fileType];
        // Check if the file type is valid
        if (!isFileTypeValid(file.mimetype)) {
          return res
            .status(statusCodes.BADREQUEST)
            .send({ message: `Invalid ${fileType} file type`, status: false });
        }
      }
    }
    next();
  };
};

const validateWithFiles = (validator) => {
  return (req, res, next) => {
    const data = { ...req.body, ...req.params, ...req.query, ...req.files };
    const { error } = validator(data);
    // If there's a validation error, send a 400 response with the error message
    if (error) {
      const message = error.details[0].message.replace(/"/g, "");
      return res
        .status(statusCodes.BADREQUEST)
        .send({ message, status: false });
    }

    // Inside the validate middleware
    if (req.files && Object.keys(req.files).length > 0) {
      for (const fileType in req.files) {
        const file = req.files[fileType];
        // Check if the file type is valid
        if (!isFileTypeValid(file.mimetype) && file.mimetype != undefined) {
          return res
            .status(statusCodes.BADREQUEST)
            .send({ message: `Invalid ${fileType} file type`, status: false });
        }
      }
    }
    next();
  };
};

/**
 * Handle Custom Error Response
 *
 * This function is used to send standardized error responses to clients.
 *
 * @param {object} res - The Express response object to send the response.
 * @param {string} message - The error message to be included in the response.
 * @param {number} [statusCode=404] - The HTTP status code to set in the response (default: 404 Not Found).
 * @returns {object} The response with the specified error message and status.
 */

const handleCustomError = (
  res,
  message,
  statusCode = statusCodes.NOTFOUND,
  data
) => {
  if (data == undefined)
    return res.status(statusCode).json({ message, status: false });
  else return res.status(statusCode).send({ data, status: false });
};

const isFileTypeValid = (mimeType) => {
  const validFileType = [
    "image/jpeg",
    "image/jpg",
    "image/jfif",
    "image/Jpg",
    "video/mp4",
    "application/pdf",
    "image/png",
    "image/svg+xml",
  ];

  return validFileType.includes(mimeType);
};

const trimValues = (req, res, next) => {
  trimStringsInObject(req.query);
  trimStringsInObject(req.params);
  trimStringsInObject(req.body);
  next();
};

module.exports = {
  globalErrorHandler,
  catchErrors,
  validate,
  handleCustomError,
  trimValues,
  validateWithFiles,
};

const trimStringsInObject = (obj) => {
  for (const key in obj) {
    if (typeof obj[key] === "string") {
      obj[key] = obj[key].trim();
    } else if (typeof obj[key] === "object") {
      trimStringsInObject(obj[key]);
    }
  }
};
