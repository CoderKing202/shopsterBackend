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
