const express = require("express");
const router = express.Router();
const isloggedin = require("../middleware/isLoggedin");
const productModel = require("../models/product-model");
const userModel = require("../models/user-model");
const Razorpay = require("razorpay");

// ✅ Home Routes
router.get("/", (req, res) => {
  const error = req.flash("error");
  res.render("index", { error });
});

router.get("/users/loading", (req, res) => res.render("loading"));
router.get("/index", (req, res) => res.render("index", { error: "" }));

// ✅ Shop Route (with sorting/filtering)
router.get("/shop", async (req, res) => {
  try {
    let { sortby, filter } = req.query;
    let query = {};
    let sortOption = {};

    if (filter === "new") query.isNew = true;
    if (filter === "discounted") query.discount = { $gt: 0 };
    if (filter === "available") query.inStock = true;
    if (filter === "discount") query.discount = { $exists: true, $ne: 0 };

    if (sortby === "popular") sortOption.popularity = -1;
    if (sortby === "newest") sortOption.createdAt = -1;
    if (sortby === "price-asc") sortOption.price = 1;
    if (sortby === "price-desc") sortOption.price = -1;

    const products = await productModel.find(query).sort(sortOption);
    res.render("shop", { products, success: "", sortby, filter });
  } catch (err) {
    console.error("❌ Shop Error:", err);
    res.status(500).send("Error loading shop");
  }
});

// ✅ My Account Route
router.get("/account", isloggedin, async (req, res) => {
  const user = await userModel
    .findOne({ email: req.user.email })
    .populate("cart")
    .populate("orders");
  res.render("myAccount", { user });
});

// ✅ Cart Page
router.get("/cart", isloggedin, async (req, res) => {
  try {
    const user = await userModel
      .findOne({ email: req.user.email })
      .populate("cart");

    if (!user) {
      req.flash("error", "User not found");
      return res.redirect("/shop");
    }

    res.render("cart", { user });
  } catch (error) {
    console.error("❌ Cart Error:", error);
    req.flash("error", "Something went wrong");
    res.redirect("/shop");
  }
});

// ✅ Add to Cart
router.get("/addtocart/:productid", isloggedin, async (req, res) => {
  const user = await userModel.findOne({ email: req.user.email });
  user.cart.push(req.params.productid);
  await user.save();
  req.flash("success", "Added to cart");
  res.redirect("/shop");
});

// ✅ Remove from Cart
router.post("/cart/remove/:productid", isloggedin, async (req, res) => {
  const user = await userModel.findOne({ email: req.user.email });
  user.cart.pull(req.params.productid);
  await user.save();
  res.redirect("/cart");
});

// ✅ Razorpay Order Creation
router.post("/create-order", async (req, res) => {
  try {
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_SECRET) {
      console.error("❌ Razorpay keys missing in environment variables");
      return res.status(500).json({ error: "Razorpay keys not configured" });
    }

    const { amount } = req.body;
    if (!amount || isNaN(amount) || amount <= 0) {
      return res.status(400).json({ error: "Invalid amount" });
    }

    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_SECRET,
    });

    const options = {
      amount: Math.round(amount * 100),
      currency: "INR",
      receipt: `receipt_order_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);
    console.log("✅ Razorpay Order Created:", order.id);

    res.status(200).json({
      id: order.id,
      amount: order.amount,
      currency: order.currency,
    });
  } catch (error) {
    console.error("❌ Razorpay Order Error:", error);
    res.status(500).json({
      error:
        error?.error?.description || "Error creating Razorpay order. Try again.",
    });
  }
});

// ✅ Checkout for Single Product
router.get("/checkout/:id", async (req, res) => {
  try {
    const product = await productModel.findById(req.params.id);

    if (!product) {
      req.flash("error", "Product not found");
      return res.redirect("/shop");
    }

    res.render("checkout", {
      product,
      cart: null,
      total: product.price, // ✅ Fixed: always defined
      razorpayKeyId: process.env.RAZORPAY_KEY_ID,
    });
  } catch (err) {
    console.error("❌ Checkout (single product) error:", err);
    res.redirect("/shop");
  }
});

// ✅ Checkout for Cart
router.get("/checkout", isloggedin, async (req, res) => {
  try {
    const user = await userModel
      .findOne({ email: req.user.email })
      .populate("cart");

    if (!user || !user.cart.length) {
      return res.render("checkout", {
        cart: [],
        product: null,
        total: 0, // ✅ Always defined
        razorpayKeyId: process.env.RAZORPAY_KEY_ID,
      });
    }

    // ✅ Calculate total safely
    const total = user.cart.reduce((acc, item) => acc + (item.price || 0), 0);

    res.render("checkout", {
      cart: user.cart,
      product: null,
      total, // ✅ Pass total to EJS
      razorpayKeyId: process.env.RAZORPAY_KEY_ID,
    });
  } catch (err) {
    console.error("❌ Checkout (cart) error:", err);
    res.redirect("/shop");
  }
});

// ✅ Search Route
router.get("/search", async (req, res) => {
  try {
    const query = req.query.q;
    if (!query || query.trim().length === 0) {
      return res.render("search", {
        products: [],
        query: "",
        error: "Please enter something to search.",
      });
    }

    const products = await productModel.find({
      name: { $regex: query, $options: "i" },
    });

    res.render("search", { products, query, error: null });
  } catch (err) {
    console.error("❌ Search Error:", err);
    res.render("search", {
      products: [],
      query: "",
      error: "Something went wrong.",
    });
  }
});

// ✅ Logout
router.get("/logout", isloggedin, (req, res) => {
  res.render("shop");
});

module.exports = router;
