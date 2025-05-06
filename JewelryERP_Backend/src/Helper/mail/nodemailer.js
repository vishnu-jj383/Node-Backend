const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    type:"OAUTH2",
    user: process.env.EMAIL_USER, // Your Gmail address
    clientId: "295732972455-lcp0hbqsm8m7992ivr9mamgcr0r707p2.apps.googleusercontent.com",
    clientSecret: "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",
    refreshToken: "1//04bV7Bp4xRdZ4CgYIARAAGAQSNwF-L9IrPoPq3RPr93nb5V4PQtBWuiiB3HT27vmu8WRWYaaalinoElDa9xxyTd5PHqBIYPKfX90",
  },
});

module.exports={transporter}

