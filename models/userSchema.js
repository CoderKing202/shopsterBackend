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

  phoneNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    match: [/^\+[1-9]\d{6,14}$/, "Please enter a valid phone number"],
  },

  password: {
    type: String,
    required: true,
  },

  date: {
    type: Date,
    default: Date.now,
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
});

const User = mongoose.model("users", userSchema);

module.exports = User;
