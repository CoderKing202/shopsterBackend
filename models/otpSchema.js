const mongoose = require("mongoose");

const otpSchema = new mongoose.Schema({
  // Link to the user
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "users",
    required: true,
    index: true,
  },

  // Email or phone number where OTP was sent
  identifier: {
    type: String,
    required: true,
    trim: true,
  },

  // Channel used to send OTP
  channel: {
    type: String,
    enum: ["email", "phone"],
    required: true,
  },

  // Purpose of OTP
  purpose: {
    type: String,
    enum: [
      "login",
      "forgotPassword",
      "register"
    ],
    required: true,
  },

  // Hashed OTP value
  otpHash: {
    type: String,
    required: true,
  },

  // Number of attempts made
  attempts: {
    type: Number,
    default: 0,
  },

  // Maximum allowed attempts
  maxAttempts: {
    type: Number,
    default: 5,
  },

  // Expiry time of OTP
  expiresAt: {
    type: Date,
    required: true,
  },

  // Creation timestamp
  createdAt: {
    type: Date,
    default: Date.now,
    immutable: true,
  },
});

/* TTL index: OTP auto-deletes after expiry */
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

/* Only one active OTP per user per purpose */
otpSchema.index(
  { userId: 1, purpose: 1 },
  { unique: true }
);

const OTP = mongoose.model("otps", otpSchema);

module.exports = OTP;
