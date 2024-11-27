const nodemailer = require('nodemailer');
require('dotenv').config(); // Make sure you have dotenv installed

const sendEmail = (to, subject, text) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER, // Set this in your .env file
      pass: process.env.GMAIL_PASSWORD, // Set this in your .env file (use an app-specific password if using 2FA)
    },
    tls: {
      rejectUnauthorized: false, // Optional: needed for certain environments (like self-signed certificates)
    }
  });

  const mailOptions = {
    from: process.env.GMAIL_USER, // Use the same email as the sender
    to,
    subject,
    text,
  };

  return transporter.sendMail(mailOptions);
};

module.exports = { sendEmail };
