const jwt = require("jsonwebtoken");

/**
 * Generates a JSON Web Token (JWT) with the provided user ID in the payload.
 * @param {string} id - User ID to be included in the JWT payload.
 * @returns {string} - The generated JWT token.
 * @throws {Error} - If an error occurs during JWT generation.
 */

const createToken = (id,access,roleCategory) => {
  try {
    // Create a JWT with the user ID as the payload
    const token = jwt.sign(
      {
        id,
        access,
        roleCategory
      },
      process.env.JWT_SECRET,
      {
        expiresIn: process.env.JWT_EXPIRES_IN,
      }
    );

    // Return the generated JWT
    return token;
  } catch (error) {
    // Handle any errors that occur during JWT generation
    throw new Error("Error generating JWT: " + error.message);
  }
};

const createRefreshToken = (id,access,roleCategory) => {
  try {
    // Create a JWT with the user ID as the payload
    const token = jwt.sign(
      {
        id,
        access,
        roleCategory
      },
      process.env.JWT_REFRESH_SECRET,
      {
        expiresIn: process.env.JWT_REFRESH_EXPIRES_IN,
      }
    );

    // Return the generated JWT
    return token;
  } catch (error) {
    // Handle any errors that occur during JWT generation
    throw new Error("Error generating JWT: " + error.message);
  }
};

module.exports = {
  createToken,
  createRefreshToken,
};
