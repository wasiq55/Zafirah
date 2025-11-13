// razorpay.js
const Razorpay = require("razorpay");

// if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
//   console.error("❌ Razorpay keys missing in environment variables");
// } else {
// }
console.log("✅ Razorpay keys loaded successfully");

const razorpayInstance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

module.exports = razorpayInstance;
