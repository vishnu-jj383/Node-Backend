const { statusCodes } = require("../../utils/constants");
const rateLimit = require("express-rate-limit");

// Function to set up rate limiting
const setupRateLimiting = () => {
  return rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 100, // limit each IP to 100 requests per windowMs
    keyGenerator: function (req) {
      const clientIp =
        req.headers["x-forwarded-for"] || req.connection.remoteAddress;
      return clientIp.split(",")[0];
    },
  });
};

// Function to handle undefined routes
const handleUndefinedRoutes = (req, res) => {
  res.status(statusCodes.NOTFOUND).json({
    status: false,
    message: "Undefined route",
  });
};

module.exports = { setupRateLimiting, handleUndefinedRoutes };
