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

    const user = await User.findById(userId);

    user.cartItems.push(item);
    await user.save();

    res.json({ success: true, cartItems: user.cartItems });
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

    const user = await User.findById(userId);

    user.cartItems = user.cartItems.filter((item) => item.id !== id);

    await user.save();

    res.json({ success: true, cartItems: user.cartItems });
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

    const user = await User.findById(userId);

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    user.cartItems = [];
    await user.save();

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

    const user = await User.findById(userId);

    const item = user.cartItems.find((item) => item.id === id);
    console.log(item.id);
    if (!item) {
      return res
        .status(404)
        .json({ success: false, message: "Item not found in cart" });
    }
    user.markModified("cartItems");
    item.quantity += 1;
    // console.log(user)
    await user.save();

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

    const user = await User.findById(userId);

    const item = user.cartItems.find((item) => item.id === id);
    console.log(item.id);
    if (!item) {
      return res
        .status(404)
        .json({ success: false, message: "Item not found in cart" });
    }

    if (item.quantity > 1) {
      item.quantity -= 1;
    }
    user.markModified("cartItems");
    await user.save();

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

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, msg: "User not found" });
    }

    /* ---------- UPDATE NAME ---------- */
    if (name) {
      user.name = name;
    }

    /* ---------- UPDATE EMAIL ---------- */
    if (email) {
      // Optional: prevent duplicate emails
      const emailExists = await User.findOne({ email });
      if (emailExists && emailExists._id.toString() !== userId) {
        return res.json({ success: false, msg: "Email already in use" });
      }
      user.email = email;
    }

    /* ---------- UPDATE PHONE NUMBER ---------- */
    if (phoneNumber) {
      // Validate E.164 format (+<country><number>)
      const phoneRegex = /^\+[1-9]\d{6,14}$/;
      if (!phoneRegex.test(phoneNumber)) {
        return res.json({
          success: false,
          msg: "Invalid phone number format",
        });
      }

      // Prevent duplicate phone numbers
      const phoneExists = await User.findOne({ phoneNumber });
      if (phoneExists && phoneExists._id.toString() !== userId) {
        return res.json({
          success: false,
          msg: "Phone number already in use",
        });
      }

      user.phoneNumber = phoneNumber;
    }

    /* ---------- UPDATE PASSWORD ---------- */
    if (password) {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
    }

    await user.save();

    res.json({
      success: true,
      msg: "Profile updated successfully",
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
    const user = await User.findById(userId);

    user.orderedProducts.push(...orderedProducts);
    await user.save();

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
  try {
    const { userId, identifier, channel, purpose } = req.body;

    if (!userId || !identifier || !channel || !purpose) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields",
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
    await sendOtpEmail(identifier, otp);

    res.json({
      success: true,
      message: "OTP generated and stored",
      otpId: otpRecord._id,
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Internal Server Error");
  }
});
router.post("/verifyOtp", async (req, res) => {
   let success = false;
  try {
    console.log("Hello")
    const { userId, otp,purpose } = req.body;
    if (!userId || !otp || !purpose) {
  return res.status(400).json({ success, error: "Missing fields" });
}
   
    let otpRecord
    if (userId && otp && purpose) {
      otpRecord = await OTP.findOne({ userId ,purpose});
    
      if(!otpRecord){
        res.status(400).json({success,error:"OTP not found"})
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
      return res.status(400).json({ success, error: "Invalid OTP" });
    }

    // OTP correct → prevent user expiry
    await User.updateOne({ _id: userId }, { $unset: { expiresAt: "" } });

    const data = {
      user: {
        id: userId,
      },
    };
    await otpRecord.deleteOne({ _id: otpRecord._id });
    const authtoken = jwt.sign(data, JWT_SECRET);
    success = true
    res.json({ success, token: authtoken });
  } catch (ex) {
    res.status(500).json({success,error:"Internal Server error"});
  }
});

module.exports = router;

router.post("/getOtpTimer", async (req, res) => {
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
    res.status(500).json({success,error:"Internal Server error"});
  }
});

router.post("/deleteOTP", async (req, res) => {
      let success = false; 
  try {

    const { userId } = req.body;
    console.log("userId",userId)
    const result = await OTP.deleteOne({ userId });
    if (result.deletedCount > 0) {
      success = true;
    }
    res.json({ success });
  } catch (ex) {
    res.status(400).json({ success });
  }
});
