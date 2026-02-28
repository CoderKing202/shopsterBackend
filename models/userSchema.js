const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },

  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },

  // NEW: email verification flag
  // emailVerified: {
  //   type: Boolean,
  //   default: false,
  // },

  // phoneNumber: {
  //   type: String,
  //   required: true,
  //   unique: true,
  //   trim: true,
  //   match: [/^\+[1-9]\d{6,14}$/, "Please enter a valid phone number"],
  // },

  // NEW: phone verification flag
  // phoneVerified: {
  //   type: Boolean,
  //   default: false,
  // },

  password: {
    type: String,
    required: true,
  },

  date: {
    type: Date,
    default: Date.now,
  },

  // NEW: expiry field for unverified users
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 24 * 60 * 60 * 1000), // 1 day
  },

  // 🛒 Cart items
  cartItems: {
    type: Array,
    default: [],
  },

  orderedProducts: {
    type: Array,
    default: [],
  },
  otpGeneratedTimes:{
    type: Number,
    default:0
  }
  
});

/* TTL index: auto-delete when expiresAt passes */
userSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const User = mongoose.model("users", userSchema);

module.exports = User;
