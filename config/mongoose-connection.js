const mongoose = require("mongoose");
const dbgr = require("debug")("development: mongoose");

// Use environment variable from Render
const mongoURI = process.env.MONGODB_URI;

mongoose
  .connect(mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => dbgr("MongoDB connected"))
  .catch((err) => dbgr("MongoDB connection error:", err));

module.exports = mongoose.connection;
