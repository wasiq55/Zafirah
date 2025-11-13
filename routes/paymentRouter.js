// routes/paymentRouter.js
const express = require("express");
const router = express.Router();
const razorpay = require("../razorpay"); // ✅ use shared instance
const Product = require("../models/product-model");
const userModel = require("../models/user-model");

// ✅ Razorpay instance already initialized in razorpay.js
console.log("✅ Razorpay router active");

// ✅ Create Razorpay Order
router.post("/create-order", async (req, res) => {
  try {
    let { amount } = req.body;
    amount = Number(amount);

    if (!amount || isNaN(amount) || amount <= 0) {
      return res.status(400).json({ success: false, message: "Invalid payment amount." });
    }

    if (amount > 500000) {
      return res.status(400).json({
        success: false,
        message: "Amount exceeds Razorpay transaction limit (₹5,00,000).",
      });
    }

    const options = {
      amount: Math.round(amount * 100),
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
      payment_capture: 1,
      notes: { payment_for: "Order Payment" },
    };

    const order = await razorpay.orders.create(options);
    res.status(200).json({
      success: true,
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
      key_id: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    console.error("❌ Razorpay order creation failed:", error);
    res.status(500).json({
      success: false,
      message: error?.error?.description || "Server Error while creating Razorpay order.",
    });
  }
});

// ✅ Checkout routes
router.get("/checkout", async (req, res) => {
  try {
    const userId = req.user?._id;
    if (!userId) return res.redirect("/login");

    const user = await userModel.findById(userId).populate("cart");
    const cart = user?.cart || [];
    const totalAmount = cart.reduce((sum, p) => sum + (p.price - (p.discount || 0)), 0);

    res.render("checkout", {
      cart,
      product: null,
      totalAmount,
      razorpayKeyId: process.env.RAZORPAY_KEY_ID,
    });
  } catch (err) {
    console.error("❌ Checkout (cart) error:", err);
    res.redirect("/shop");
  }
});

router.get("/checkout/:id", async (req, res) => {
  try {
    const userId = req.user?._id;
    if (!userId) return res.redirect("/login");

    const product = await Product.findById(req.params.id);
    if (!product) return res.redirect("/shop");

    const totalAmount = product.price - (product.discount || 0);

    res.render("checkout", {
      cart: [],
      product,
      totalAmount,
      razorpayKeyId: process.env.RAZORPAY_KEY_ID,
    });
  } catch (err) {
    console.error("❌ Checkout (single product) error:", err);
    res.redirect("/shop");
  }
});

module.exports = router;
