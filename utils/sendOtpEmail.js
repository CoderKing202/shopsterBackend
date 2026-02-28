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

const sendOtpEmail = async (to, otp, purpose) => {
  try {
    let subject = "";
    let textContent = "";

    switch (purpose) {
      case "login":
        subject = "🔐 Login Verification - Shopster";
        textContent = `You're trying to log in to Shopster.

Your OTP is: ${otp}

⏳ This code will expire in 5 minutes.
If this wasn't you, please ignore this email.`;
        break;

      case "register":
        subject = "🎉 Welcome to Shopster - Verify Your Email";
        textContent = `Welcome to Shopster!

To complete your registration, use this OTP:

👉 ${otp}

⏳ Valid for 5 minutes.

Happy shopping! 🛍️`;
        break;

      case "forgotPassword":
        subject = "🔑 Reset Your Password - Shopster";
        textContent = `We received a request to reset your password.

Use this OTP to continue:

👉 ${otp}

⏳ This code expires in 5 minutes.

If you didn’t request this, you can safely ignore this email.`;
        break;

      default:
        subject = "Shopster OTP Verification";
        textContent = `Your OTP is ${otp}. It expires in 5 minutes.`;
    }

    const result = await brevo.transactionalEmails.sendTransacEmail({
      subject,
      textContent,
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

