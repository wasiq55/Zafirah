require("dotenv").config();
console.log("✅ Environment loaded");
console.log("RAZORPAY_KEY_ID:", process.env.RAZORPAY_KEY_ID);
console.log("RAZORPAY_KEY_SECRET:", process.env.RAZORPAY_KEY_SECRET);

console.log("✅ Environment loaded");
console.log("RAZORPAY_KEY_ID:", process.env.RAZORPAY_KEY_ID);

const express = require("express");
const app = express();
const path = require("path");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const flash = require("connect-flash");
const userModel = require("./models/user-model");
const checkLoginStatus = require("./middleware/isLoggedin");

// DB connection
const db = require("./config/mongoose-connection");

// Routers
const ownersRouter = require("./routes/ownersRouter");
const productsRouter = require("./routes/productsRouter");
const usersRouter = require("./routes/usersRouter");
const indexRouter = require("./routes/index");
const paymentRouter = require("./routes/paymentRouter");

// -------------------- MIDDLEWARES -------------------- //

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Cookies
app.use(cookieParser());
app.use(checkLoginStatus);

// -------------------- SESSION & FLASH -------------------- //
app.use(
  session({
    secret: process.env.EXPRESS_SESSION_SECRET || "supersecretkey",
    resave: false,
    saveUninitialized: false,
  })
);

// Flash middleware
app.use(flash());

// ✅ Make flash messages available in all EJS templates
app.use((req, res, next) => {
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  next();
});

// -------------------- STATIC & VIEW ENGINE -------------------- //
app.use(express.static(path.join(__dirname, "public")));
app.set("view engine", "ejs");

// -------------------- ROUTES -------------------- //
app.get("/", (req, res) => {
  res.redirect("/users/loading");
});

app.delete("/remove-from-cart/:index", async (req, res) => {
  try {
    const user = await userModel.findById(req.user._id);
    if (!user)
      return res.status(404).json({ success: false, message: "User not found" });

    user.cart.splice(req.params.index, 1);
    await user.save();

    res.json({ success: true, message: "Item removed successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Routers
app.use("/payment", paymentRouter);
app.use("/users", usersRouter);
app.use("/", indexRouter);
app.use("/owners", ownersRouter);
app.use("/products", productsRouter);

// -------------------- SERVER -------------------- //
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`✅ Server started on port ${PORT}`);
});
