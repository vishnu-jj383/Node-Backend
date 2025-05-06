
const jwt = require("jsonwebtoken");
const User = require("../models/auth/userModel");
const { statusCodes, userCategory } = require("../utils/constants");


const adminAuth = async (req, res, next) => {
    try {
        console.log('first')
      const token = req.header("Authorization");
  
      // Check if the token is missing or has an invalid format
      if (!token || !token.startsWith("Bearer ")) {
        return res.status(statusCodes.UNAUTHORIZED).json({
          status: false,
          message: "Invalid token format",
        });
      }
  
      const tokenWithoutBearer = token.replace("Bearer ", "");
      let tokenDetails;
      let accountId;
  
      try {
        // Verify the JWT token and extract the account ID
  
        tokenDetails = jwt.verify(tokenWithoutBearer, process.env.JWT_SECRET);
        accountId = tokenDetails.id;   
        console.log(tokenDetails)  
      } catch (error) {
        if (error instanceof jwt.TokenExpiredError) {
          return res.status(statusCodes.UNAUTHORIZED).json({
            status: false,
            message: "Token expired, please login again",
          });
        } else if (error instanceof jwt.JsonWebTokenError) {
          return res.status(statusCodes.UNAUTHORIZED).json({
            status: false,
            message: "Invalid token, please login again",
          });
        } else {
          return res.status(statusCodes.ERROR).json({
            status: false,
            message: "An unexpected error occurred",
          });
        }
      }
  
         // Find the associated account details
         const accountDetails = await User.findOne({
          where: {
            id: accountId,
            roleCategory:userCategory.ADMIN
          },
        });

        console.log(accountDetails)
        
      if (!accountDetails) {
        return res.status(statusCodes.UNAUTHORIZED).json({
          status: false,
          message: "Account not found or not approved",
        });
      }
  
  /*     if (
        req?.path != "/logout" &&
        accountDetails?.passwordChangedAt &&
        accountDetails.passwordChangedAt > new Date(tokenDetails.iat * 1000)
      ) {
        // Password has been changed after the token was issued
        return res.status(statusCodes.UNAUTHORIZED).send({
          status: false,
          message: "Password has been changed. Please log in again",
        });
      } */
  
      req.token = tokenWithoutBearer;
      next();
    } catch (error) {
      console.log(error);
      res.status(statusCodes.UNAUTHORIZED).json({
        status: false,
        message: "Unauthorized: Access is denied due to invalid credentials",
      });
    }
  };  

  module.exports = adminAuth