require("dotenv").config();

const sendOtpSMS = async (phone, otp) => {
  try {
    const response = await fetch("https://control.msg91.com/api/v5/otp", {
      method: "POST",
      headers: {
        authkey: process.env.MSG91_AUTH_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        mobile: phone,
        otp: otp,
        template_id: process.env.MSG91_TEMPLATE_ID,
      }),
    });

    const data = await response.json();
    console.log("MSG91 response:", data);
    if (!response.ok) {
      console.error("SMS send error:", data);
    } else {
      console.log("OTP sent successfully");
    }
  } catch (error) {
    console.error("SMS send error:", error.message);
  }
};

module.exports = sendOtpSMS;
