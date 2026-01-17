const express = require("express");
const User = require("../models/userSchema");
const router = express.Router();
const { body, validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const fetchuser = require("../middleware/fetchUser")

const JWT_SECRET = "MyNameisJatin";
// ROUTE 1: Create a User using: POST "/api/auth/createuser" No Login required
router.post(
  "/createuser",
  // [
  //   body("name", "Enter a valid name").isLength({ min: 5 }),
  //   body("email", "Enter a valid email").isEmail(),
  //   body("password", "Password must be atleast 5 characters").isLength({
  //     min: 5,
  //   }),
  // ],
  async (req, res) => {
    let  success = false;
    // if there are errors return bad request and the errors
    // const result = validationResult(req);

    // if (!result.isEmpty()) {
    //   return res.status(400).json({ success,errors: result.array() });
    // }
    //Check whether the user with this email exists already
    try {
      let user = await User.findOne({ email: req.body.email });
      if (user) {
        return res
          .status(400)
          .json({ success,error: "Sorry a user with this email already exists" });
      }
      const salt = await bcrypt.genSalt(10);
      const secPass = await bcrypt.hash(req.body.password, salt);
      // Create a new user
      user = await User.create({
        name: req.body.name,
        email: req.body.email,
        password: secPass,
      });
      const data = {
        user: {
          id: user.id,
        },
      };
      // I think this is the structure used to
      // feed the data to the token making(who knows)
      const authtoken = jwt.sign(data, JWT_SECRET); //It is a synch method
      console.log(authtoken);
      success = true
      res.json({ success,authtoken });
    } catch (error) {
      //catch errors
      console.error(error.message);
      res.status(500).send("Internal Server Error");
    }

    // .then(user=> res.json(user))
    // .catch(err=>{console.log(err)
    // res.json({error:"Plaese enter a unique value for email",message:err.message})})
    // const user = User(req.body)
    // user.save()
    // console.log(req.body)
    // res.send(req.body)
  }
);


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
    try {
      let user = await User.findOne({ email });
      if (!user) {
        return res
          .status(400)
          .json({ error: "Please try to login with correct credentials" });
      }
      const passwordCompare = await bcrypt.compare(password, user.password);
      if (!passwordCompare) {
        success = false
        return res
          .status(400)
          .json({ success,error: "Please try to login with correct credentials" });
      }

      const payload = {
        user: {
          id: user.id,
        },
      };
      const authtoken = jwt.sign(payload, JWT_SECRET);
      success = true
      res.json({ success,authtoken });

    } catch (error) {
      console.error(error.message);
      res.status(500).send("Internal Server Error");
    }
  }
);


//ROUTE 3: Get loggedin User Details using: POST "/api/auth/getuser" Login required
router.post("/getuser", fetchuser,async (req, res) => {
  try {
    userId = req.user.id;
    const user = await User.findById(userId).select("-password");
    res.json(user)
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Internal Server Error");
  }
  
});
module.exports = router;

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

    user.cartItems = user.cartItems.filter(
      (item) => item.id !== id
    );

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
      return res.status(404).json({ success: false, message: "User not found" });
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
    
    const user = await User.findById(userId);

    const item = user.cartItems.find(item => item.id === id);
    console.log(item.id)
    if (!item) {
      return res.status(404).json({ success: false, message: "Item not found in cart" });
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

    const item = user.cartItems.find(item => item.id === id);
    console.log(item.id)
    if (!item) {
      return res.status(404).json({ success: false, message: "Item not found in cart" });
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
