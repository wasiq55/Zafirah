// middleware/isLoggedin.js
const jwt = require("jsonwebtoken");
const userModel = require("../models/user-model");

module.exports = async function (req, res, next) {
  try {
    const token = req.cookies.token;

    if (!token) {
      res.locals.isLoggedin = false;
      return next();
    }

    const decoded = jwt.verify(token, process.env.JWT_KEY);
    const user = await userModel.findOne({ email: decoded.email }).select("-password");

    if (!user) {
      res.locals.isLoggedin = false;
      return next();
    }

    req.user = user;
    res.locals.isLoggedin = true;
    res.locals.user = user;
    next();

  } catch (err) {
    res.locals.isLoggedin = false;
    next();
  }
};
