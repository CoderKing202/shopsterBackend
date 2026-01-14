const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },

  // 🛒 Cart items (simple array)
  cartItems: {
    type: Array,
    default: [],
  },
});

const User = mongoose.model("users", userSchema);

// Index creation handled automatically by mongoose
// User.createIndexes();

module.exports = User;
