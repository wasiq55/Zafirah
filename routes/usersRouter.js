const express = require("express");
const router = express.Router();
const isLoggedin = require("../middleware/isLoggedin");
const {registerUser, loginUser, logout} = require("../controllers/authController");
const razorpayInstance = require("../razorpay");



router.get("/", function (req, res) {
   res.send("hey its working");
});

router.post("/register", registerUser );
router.post("/login", loginUser);
router.post("/logout", logout);
router.get("/logout", logout);

router.get("/shop", isLoggedin, function (req, res) {
  res.send("Welcome to the shop page!");
  // Or: res.render("shop"); if you have a view file
});

router.get("/addtocart/:id", isLoggedin, async (req, res) => {
    try {
        const productId = req.params.id;

        // Initialize cart if not already
        if (!req.session.cart) req.session.cart = [];

        // Add product ID to session cart
        req.session.cart.push(productId);

        // Flash message for success
        req.flash("success", "Product added to cart!");

        // Redirect back to shop page
        res.redirect("/users/shop");
    } catch (err) {
        console.error(err);
        req.flash("error", "Something went wrong");
        res.redirect("/users/shop");
    }
});

router.get("/loading", (req, res) => {
  res.render("loading");
});

router.get("/login", (req, res) => {
  res.render("login");
});

router.post("/create-order", async (req, res) => {
  try {
    const { amount } = req.body;

    const options = {
      amount: amount * 100, // convert to paise
      currency: "INR",
      receipt: "order_rcptid_" + Math.floor(Math.random() * 10000),
    };

    const order = await razorpayInstance.orders.create(options);
    res.json({ success: true, order });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
});

module.exports = router;