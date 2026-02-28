const express = require("express");
const User = require("../models/userSchema");
const router = express.Router();
const { body, validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const OTP = require("../models/otpSchema"); // adjust path if needed
const fetchuser = require("../middleware/fetchUser");
require("dotenv").config();
// const sendOtpSMS = require("../utils/sendOtpSMS");
const sendOtpEmail = require("../utils/sendOtpEmail");

const JWT_SECRET = "MyNameisJatin";
const Razorpay = require("razorpay");
const crypto = require("crypto");


const instance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});
console.log("id",process.env.RAZORPAY_KEY_ID)
router.post("/create-order", async (req, res) => {
  try {
    const { amount } = req.body;

    const order = await instance.orders.create({
      amount: amount * 100, // ₹ → paise
      currency: "INR",
      receipt: "order_" + Date.now(),
    });

    res.json({ success: true, order });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});


router.post("/verify-payment", (req, res) => {
  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
  } = req.body;

  const body = razorpay_order_id + "|" + razorpay_payment_id;

  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(body)
    .digest("hex");

  if (expectedSignature === razorpay_signature) {
    return res.json({ success: true });
  } else {
    return res.status(400).json({ success: false });
  }
});

module.exports = router