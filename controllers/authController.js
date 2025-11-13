const userModel = require("../models/user-model");
const bcrypt = require("bcrypt");
const { generateToken } = require("../utils/generateTokens");
const jwt =require("jsonwebtoken");
const { model } = require("mongoose");


module.exports.registerUser = async function (req, res) {
  try {
    let { email, password, fullname } = req.body;

    // Basic validation
    if (!fullname || fullname.trim().length < 3)
      return res.status(400).send("Full name must be at least 3 characters");

    if (!email || !password)
      return res.status(400).send("Email and password are required");

    // Check if user already exists
    let existingUser = await userModel.findOne({ email });
    if (existingUser)
      return res.status(401).send("You already have an account, please login");

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    let user = await userModel.create({
      email,
      password: hashedPassword,
      fullname,
    });

    // Generate JWT
    let token = generateToken(user);

    // Set cookie and send response
    res.cookie("token", token, { httpOnly: true });
    res.send("User created successfully");
  } catch (err) {
    res.status(500).send(err.message);
  }
};

module.exports.loginUser = async function (req, res) {
  let { email, password, fullname } = req.body;

  let user = await userModel.findOne({email: email});
  if (!user) return res.send("Email or Password incorrect");

  bcrypt.compare(password, user.password, function(err,result){
    if(result){
      let token = generateToken(user);
      res.cookie("token", token);
      res.redirect("/shop");

    } else{
      return res.send("Email or Password incorrect");
    }
  });
};

module.exports.logout = function(req, res){
  res.cookie("token", "");
  res.redirect("/");
};