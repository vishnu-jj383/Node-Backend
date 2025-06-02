const { Sequelize } = require("sequelize");
require("dotenv").config();

const sequelize = new Sequelize(process.env.DB_CONNECTION, {
  dialect: "postgres",
  logging: false, // Set to true for SQL query logs
  //logging: console.log,
  pool: {
    max: 10,  // Limit connections
    min: 2,   // Keep a minimum
    acquire: 20000, // Lower acquisition timeout
    idle: 5000, // Close idle connections quickly
  }, 
});

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log("postgres Database connected successfully.");
  } catch (error) {
    console.error("Unable to connect to the database:", error);
  }
};

module.exports = { sequelize, connectDB };
