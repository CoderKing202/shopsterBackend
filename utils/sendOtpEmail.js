// const nodemailer = require("nodemailer");

// const transporter = nodemailer.createTransport({
//   host: process.env.EMAIL_HOST,
//   port: process.env.EMAIL_PORT,
//   secure: false,
//   auth: {
//     user: process.env.EMAIL_USER,
//     pass: process.env.EMAIL_PASS,
//   },
// });

// const sendOtpEmail = async (to, otp) => {
//   try {const nodemailer = require("nodemailer");

// const transporter = nodemailer.createTransport({
//   host: process.env.EMAIL_HOST,
//   port: process.env.EMAIL_PORT,
//   secure: false,
//   auth: {
//     user: process.env.EMAIL_USER,
//     pass: process.env.EMAIL_PASS,
//   },
// });

// const sendOtpEmail = async (to, otp) => {
//   try {
//     await transporter.sendMail({
//       from: `Shopster <${process.env.EMAIL_FROM}>`,
//       to,
//       subject: "Shopster Verification Code",
//       text: `Your Shopster OTP is ${otp}. It will expire in 5 minutes. Do not share this code.`,
//     });

//     console.log("Email OTP sent");
//   } catch (error) {
//     console.error("Email send error:", error);
//   }
// };

// module.exports = sendOtpEmail;

//     await transporter.sendMail({
//       from: `Shopster <${process.env.EMAIL_FROM}>`,
//       to,
//       subject: "Shopster Verification Code",
//       text: `Your Shopster OTP is ${otp}. It will expire in 5 minutes. Do not share this code.`,
//     });

//     console.log("Email OTP sent");
//   } catch (error) {
//     console.error("Email send error:", error);
//   }
// };

// module.exports = sendOtpEmail;
require("dotenv").config();
const { BrevoClient } = require("@getbrevo/brevo");

const brevo = new BrevoClient({
  apiKey: process.env.BREVO_API_KEY,
});

const sendOtpEmail = async (to, otp) => {
  try {
    const result = await brevo.transactionalEmails.sendTransacEmail({
      subject: "Shopster OTP Verification",
      textContent: `Your Shopster OTP is ${otp}. It expires in 5 minutes.`,
      sender: {
        name: "Shopster",
        email: process.env.EMAIL_FROM,
      },
      to: [{ email: to }],
    });

    console.log("Brevo email sent:", result);
  } catch (error) {
    console.error("Brevo email error:", error.message);
  }
};

module.exports = sendOtpEmail;

