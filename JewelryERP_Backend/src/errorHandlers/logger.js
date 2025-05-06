const winston = require("winston");
const DailyRotateFile = require("winston-daily-rotate-file");

const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    // new DailyRotateFile({
    //   level: "info",
    //   filename: "errorHandlers/logs/combined-%DATE%.log",
    //   datePattern: "YYYY-MM-DD",
    //   zippedArchive: true,
    //   maxSize: "20m",
    //   maxFiles: "7d",
    // }),
    new DailyRotateFile({
      level: "error",
      filename: "errorHandlers/logs/error-%DATE%.log",
      datePattern: "YYYY-MM-DD",
      zippedArchive: true,
      maxSize: "20m",
      maxFiles: "7d",
    }),
  ],
});

module.exports = logger;
