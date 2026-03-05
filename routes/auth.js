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
// ROUTE 1: Create a User using: POST "/api/auth/createuser" No Login required
router.post("/createuser", async (req, res) => {
  let success = false;

  try {
    const { name, email, password /*phoneNumber*/ } = req.body;

    /* ---------- CHECK EMAIL ---------- */
    let userByEmail = await User.findOne({ email });
    if (userByEmail) {
      return res.status(400).json({
        success,
        error: "Sorry, a user with this email already exists",
      });
    }

    /* ---------- CHECK PHONE NUMBER ---------- */
    // let userByPhone = await User.findOne({ phoneNumber });
    // if (userByPhone) {
    //   return res.status(400).json({
    //     success,
    //     error: "Sorry, a user with this phone number already exists",
    //   });
    // }

    // /* ---------- VALIDATE PHONE NUMBER FORMAT ---------- */
    // const phoneRegex = /^\+[1-9]\d{6,14}$/;
    // if (!phoneRegex.test(phoneNumber)) {
    //   return res.status(400).json({
    //     success,
    //     error: "Invalid phone number format",
    //   });
    // }

    /* ---------- HASH PASSWORD ---------- */
    const salt = await bcrypt.genSalt(10);
    const secPass = await bcrypt.hash(password, salt);

    /* ---------- CREATE USER ---------- */
    const user = await User.create({
      name,
      email,
      password: secPass,
      // phoneNumber,
    });

    /* ---------- CREATE JWT ---------- */
    // const data = {
    //   user: {
    //     id: user.id,
    //   },
    // };

    // const authtoken = jwt.sign(data, JWT_SECRET);

    // success = true;
    // res.json({ success, authtoken });
    tellPurpose("register", res, user);
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Internal Server Error");
  }
});

//ROUTE 2: Authenticate a User using: POST "/api/auth/login" No login required
router.post(
  "/login",
  // [
  //   body("email", "Enter a valid email").isEmail(),
  //   body("password", "Password cannot be blank").exists(), //check if the password is not empty
  // ],
  async (req, res) => {
    // if there are errors return bad request and the errors
    let success = false;

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const { email, password } = req.body;
    console.log("-----");

    try {
      let user = await User.findOne({ email });
      console.log(email);
      if (!user) {
        return res
          .status(400)
          .json({ error: "Please try to login with correct credentials" });
      }
      const passwordCompare = await bcrypt.compare(password, user.password);
      if (!passwordCompare) {
        success = false;
        return res.status(400).json({
          success,
          error: "Please try to login with correct credentials",
        });
      }

      // const payload = {
      //   user: {
      //     id: user.id,
      //   },
      // };
      // const authtoken = jwt.sign(payload, JWT_SECRET);
      // success = true
      // res.json({ success,authtoken });
      tellPurpose("login", res, user);
    } catch (error) {
      console.error(error.message);
      res.status(500).send("Internal Server Error");
    }
  },
);

//ROUTE 3: Get loggedin User Details using: POST "/api/auth/getuser" Login required
router.get("/getuser", fetchuser, async (req, res) => {
  try {
    userId = req.user.id;
    const user = await User.findById(userId).select("-password");
    res.json(user);
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Internal Server Error");
  }
});

// ROUTE 4: Add item to cart using: POST "/api/auth/addCartItem" Login required
router.post("/addCartItem", fetchuser, async (req, res) => {
  try {
    const userId = req.user.id;
    const item = req.body; // product object sent from frontend

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $push: { cartItems: item } },
      { new: true },
    );

    res.json({ success: true, cartItems: updatedUser.cartItems });
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Internal Server Error");
  }
});

// ROUTE 5: Remove item from cart using: POST "/api/auth/removeCartItem" Login required
router.post("/removeCartItem", fetchuser, async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.body; // product id

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $pull: { cartItems: { id: id } } },
      { new: true },
    );

    res.json({ success: true, cartItems: updatedUser.cartItems });
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Internal Server Error");
  }
});

// ROUTE 6: To get cart Items of a logged in user
router.get("/getCartItems", fetchuser, async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await User.findById(userId).select("cartItems");

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    res.json({
      success: true,
      cartItems: user.cartItems,
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Internal Server Error");
  }
});

// ROUTE 11: To reset cart of a logged in user
router.post("/resetCartItems", fetchuser, async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: { cartItems: [] } },
      { new: true },
    );

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    res.json({
      success: true,
      cartItems: user.cartItems,
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Internal Server Error");
  }
});

// ROUTE 7 to increment quantity of the product
router.post("/incrementQuantity", fetchuser, async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.body; // product id

    const user = await User.findOneAndUpdate(
      { _id: userId, "cartItems.id": id },
      { $inc: { "cartItems.$.quantity": 1 } },
      { new: true },
    );

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "Item not found" });
    }

    res.json({ success: true, cartItems: user.cartItems });
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Internal Server Error");
  }
});

// Route 8 to decrement quantity of the product
router.post("/decrementQuantity", fetchuser, async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.body; // product id

    const user = await User.findOneAndUpdate(
      { _id: userId, "cartItems.id": id, "cartItems.quantity": { $gt: 1 } },
      { $inc: { "cartItems.$.quantity": -1 } },
      { new: true },
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Item not found or quantity already 1",
      });
    }

    res.json({ success: true, cartItems: user.cartItems });
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Internal Server Error");
  }
});

// ROUTE 9: Update the User info
router.put("/updateProfile", fetchuser, async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, email, password, phoneNumber } = req.body;

    let updateFields = {};

    /* ---------- UPDATE NAME ---------- */
    if (name) {
      updateFields.name = name;
    }

    /* ---------- UPDATE EMAIL ---------- */
    if (email) {
      const emailExists = await User.findOne({ email });
      if (emailExists && emailExists._id.toString() !== userId) {
        return res.json({ success: false, msg: "Email already in use" });
      }
      updateFields.email = email;
    }

    /* ---------- UPDATE PHONE NUMBER ---------- */
    if (phoneNumber) {
      const phoneRegex = /^\+[1-9]\d{6,14}$/;

      if (!phoneRegex.test(phoneNumber)) {
        return res.json({
          success: false,
          msg: "Invalid phone number format",
        });
      }

      const phoneExists = await User.findOne({ phoneNumber });
      if (phoneExists && phoneExists._id.toString() !== userId) {
        return res.json({
          success: false,
          msg: "Phone number already in use",
        });
      }

      updateFields.phoneNumber = phoneNumber;
    }

    /* ---------- UPDATE PASSWORD ---------- */
    if (password) {
      const salt = await bcrypt.genSalt(10);
      updateFields.password = await bcrypt.hash(password, salt);
    }

    // 🔥 FINAL UPDATE (single query)
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updateFields },
      { new: true },
    );

    if (!updatedUser) {
      return res.status(404).json({ success: false, msg: "User not found" });
    }

    res.json({
      success: true,
      msg: "Profile updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Internal Server Error");
  }
});

// ROUTE 10: Add item order History using: POST "/api/auth/addorderproducts" Login required
router.post("/addorderedproducts", fetchuser, async (req, res) => {
  try {
    const userId = req.user.id;
    console.log("user " + userId);
    const { orderedProducts } = req.body; // product object sent from frontend
    console.log(req.body);
    const user = await User.findByIdAndUpdate(
      userId,
      { $push: { orderedProducts: { $each: orderedProducts } } },
      { new: true },
    );
    res.json({ success: true });
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Internal Server Error");
  }
});

// helper functions
function tellPurpose(purpose, res, user) {
  res.send({
    purpose,
    userId: user._id,
    success: true,
  });
}

router.post("/generate-otp", async (req, res) => {
  let success = false;
  console.log("Tello");
  try {
    const { userId, identifier, channel, purpose } = req.body;

    if (!userId || !identifier || !channel || !purpose) {
      return res.status(400).json({
        success,
        error: "Missing required fields",
      });
    }
    const user = await User.findByIdAndUpdate(
      userId, // ✔ pass only id
      {
       
        $inc: { otpGeneratedTimes: 1 },
      },
      { new: true },
    );

    if (!user) {
      return res.status(404).json({ success: false });
    }

    if (user.otpGeneratedTimes >= 7) {
      await User.updateOne({ _id: userId }, { $set: { otpGeneratedTimes: 0 } });

      return res.status(500).json({
        success,
        error: "OTPgenlimitExceed",
      });
    }
    /* ---------- GENERATE 6-DIGIT OTP ---------- */
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    /* ---------- HASH OTP ---------- */
    const salt = await bcrypt.genSalt(10);
    const otpHash = await bcrypt.hash(otp, salt);

    /* ---------- SET EXPIRY (5 MINUTES) ---------- */
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    /* ---------- SAVE TO DATABASE ---------- */
    const otpRecord = await OTP.findOneAndUpdate(
      { userId, purpose }, // ensure one OTP per purpose
      {
        userId,
        identifier,
        channel,
        purpose,
        otpHash,
        expiresAt,
        attempts: 0,
      },
      { upsert: true, new: true },
    );

    /* ---------- LOG OTP ---------- */
    console.log(`OTP for ${identifier}: ${otp}`);
    const formattedPhone = identifier.replace("+", "");
    console.log(formattedPhone);
    // await sendOtpSMS(formattedPhone, otp);
    await sendOtpEmail(identifier, otp,purpose);
    success = true;
    res.json({
      success,
      message: "OTP generated and stored",
      otpId: otpRecord._id,
    });
  } catch (error) {
    console.error(error.message);
    res
      .status(500)
      .json({ success, error: "could not generate OTP due to server error" });
  }
});
router.post("/verifyOtp", async (req, res) => {
  let success = false;
  try {
    const { userId, otp, purpose } = req.body;
    if (!userId || !otp || !purpose) {
      return res.status(400).json({ success, error: "Missing fields" });
    }

    let otpRecord;
    if (userId && otp && purpose) {
      otpRecord = await OTP.findOne({ userId, purpose });

      if (!otpRecord) {
        return res.status(400).json({ success, error: "OTP not found" });
      }
      // check expiry
      if (otpRecord.expiresAt < new Date()) {
        await OTP.deleteOne({ _id: otpRecord._id });
        return res.status(400).json({ success, error: "OTP expired" });
      }
    }

    // compare OTP
    const isMatch = await bcrypt.compare(otp, otpRecord.otpHash);

    if (!isMatch) {
      otpRecord.attempts += 1;
      await otpRecord.save();
      if (otpRecord.attempts >= otpRecord.maxAttempts) {
        await otpRecord.deleteOne({ _id: otpRecord._id });
        return res.status(500).json({
          success,
          error: "noMoreAttempts",
        });
      }
      return res
        .status(500)
        .json({ success, error: "wrongOtp", attempts: otpRecord.attempts });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      {
        $unset: { expiresAt: "" },
        $set: { otpGeneratedTimes: 0 },
      },
      { new: true },
    );

    const check = await User.findById(userId);
    console.log("After unset:", check.expiresAt);

    const data = {
      user: {
        id: userId,
      },
    };
    await otpRecord.deleteOne({ _id: otpRecord._id });
    const authtoken = jwt.sign(data, JWT_SECRET);

    success = true;
    return res.json({ success, token: authtoken });
  } catch (ex) {
    return res.status(500).json({ success, error: "Internal Server error" });
  }
});

router.post("/getOtpTimer", async (req, res) => {
  let success = false;
  try {
    const { userId } = req.body;
    const otpRecord = await OTP.findOne({ userId });
    const now = new Date();
    const remainingTime = otpRecord.expiresAt - now;
    res.json({
      success: true,
      remainingTime: remainingTime > 0 ? remainingTime : 0,
    });
  } catch (ex) {
    res.status(500).json({ success, error: "Internal Server error" });
  }
});

router.post("/deleteOTP", async (req, res) => {
  let success = false;
  try {
    const { userId } = req.body;
    console.log("userId", userId);
    const result = await OTP.deleteOne({ userId });
    if (result.deletedCount > 0) {
      success = true;
    }
    res.json({ success });
  } catch (ex) {
    res.status(400).json({ success });
  }
});

router.get("/getUserIdbyEmail", async (req, res) => {
  const { email } = req.query;
  let success = false;
  if (!email) {
    res.status(400).json({ success, error: "Email not sent" });
  }
  try {
    const user = await User.findOne({
      email,
      expiresAt: { $exists: false },
    });
    if (!user) {
      res.json({
        success: false,
        error: "Email is not registered",
      });
    }
    success = true;
    // console.log(user.id);
    res.json({ success, userId: user.id });
  } catch (ex) {
    res.status(500).json({ success, error: "Internal Error" });
  }
});

router.post("/resetPassword", fetchuser, async (req, res) => {
  const { newPassword } = req.body;
  let success = false;
  const userId = req.user.id;
  if (!newPassword) {
    res.status(200).json({ success, error: "Please fill the full details" });
  }
  try {
    const user = await User.findOne({ _id: userId });
    console.log(user);
    //bcrypt

    const passwordCompare = await bcrypt.compare(newPassword, user.password);
    if (passwordCompare) {
      return res.status(500).json({
        success,
        error: "Please enter new Password",
      });
    }
    const salt = await bcrypt.genSalt(10);
    const secPass = await bcrypt.hash(newPassword, salt);
    await User.updateOne({ _id: userId }, { $set: { password: secPass } });
    success = true;
    res.json({
      success,
    });
  } catch (ex) {
    return res.status(500).json({
      success,
      error: "Internal Server error",
    });
  }
});

router.post("/resetUserAttempt", async (req, res) => {
  const { userId } = req.body;
  let success = false;

  try {
    const result = await User.updateOne(
      { _id: userId },
      {
        $set: { otpGeneratedTimes: 0 },
        $unset: { expiresAt: "" },
      }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({
        success,
        error: "User not found",
      });
    }

    success = true;
    res.json({ success });

  } catch (ex) {
    console.error(ex);
    res.status(500).json({
      success,
      error: "Internal Server Error",
    });
  }
});
module.exports = router;
