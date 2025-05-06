//#region imports
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const helmet = require("helmet");
const xss = require("xss-clean");
const hpp = require("hpp");
const fileUpload = require("express-fileupload");
const { connectDB, sequelize } = require("./src/configuration/db");

//#endregion

// Import and execute aliases configuration
require("./src/configuration/aliases");

require("dotenv").config({
  path: process.env.NODE_ENV === "production" ? ".env.prod" : ".env",
});

//const { connectToDb } = require("@configuration/db");
const routes = require("./src/routes/routes");
const logger = require("./src/errorHandlers/logger");
const { globalErrorHandler } = require("./src/errorHandlers");
const {
  setupRateLimiting,
  handleUndefinedRoutes,
} = require("./src/Helper/app/appHelper");

const app = express();

// Connect to database

app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use(fileUpload());
app.use(xss());
app.use(hpp());
app.use(cors({ origin: "*" }));
app.use(morgan("dev"));
app.use(setupRateLimiting());

// For statis files
app.use(express.static("./public"));

//routes
app.use("/api/v1", routes);

//undefined routes
app.use("*", (req, res) => {
  res.status(404).json({
    status: false,
    message: "Undefined Route.",
  });
});

// Global error handler middleware
app.use(globalErrorHandler);
const PORT = process.env.PORT || 5000;

// sequelize.sync({ alter: true,  logging: console.log   })
//   .then(() => console.log("Database synchronized successfully."))
//   .catch((err) => console.error("Error syncing database:", err));


let server = app.listen(PORT, () =>
  console.log(`Server started at http://localhost:${PORT}`)
);

connectDB()
  .then(() => console.log("Database connected successfully."))
  .catch((err) => {
    console.error("Database connection failed:", err);
    process.exit(1);
  });

const unexpectedErrorHandler = (error) => {
  console.log(`UNEXPECTED ERROR!!! Shutting down ...`);
  logger.error(`Unexpected Error:`, error);
  if (server) {
    server.close(() => {
      process.exit(1); // Exit the process with a non-zero code to indicate failure
    });
  } else {
    process.exit(1); // If the server is not defined, just exit the process immediately
  }
};

process.on("uncaughtException", unexpectedErrorHandler);
process.on("unhandledRejection", unexpectedErrorHandler);

process.on("SIGINT", async () => {
  console.log("\n🔄 Closing Sequelize connection due to SIGINT...");
  try {
    await sequelize.close();
    console.log("✅ Sequelize connection closed. Exiting...");
  } catch (error) {
    console.error("Error closing Sequelize connection:", error);
  }
  process.exit(0);   
});
