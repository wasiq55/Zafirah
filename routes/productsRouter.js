// const express = require("express");
// const router = express.Router();
// const upload = require("../config/multer-config");
// const productModel = require("../models/product-model");

// router.post("/create", upload.single("image"), async function (req, res) {
//    try {
//       let { name, price, discount, bgcolor, panelcolor, textcolor } = req.body;

//       let product = await productModel.create({
//          image: req.file.buffer,
//          name,
//          price,
//          discount,
//          bgcolor,
//          panelcolor,
//          textcolor,
//       });

//       req.flash("sucess", "Product created successfully.");
//       res.redirect("/owners/admin");
//    }catch (err) {
//       res.send(err.message);
//    }
//  });

// module.exports = router;

const express = require("express");
const router = express.Router();
const upload = require("../config/multer-config");
const productModel = require("../models/product-model");
const isLoggedin = require("../middleware/isLoggedin");

// GET /products/create → show form
router.get("/create", isLoggedin, (req, res) => {
  const success = req.flash("success");
  const error = req.flash("error");
  res.render("createproducts", { success, error });
});

// POST /products/create → handle form submission
router.post("/create", isLoggedin, upload.single("image"), async (req, res) => {
  try {
    const { name, price, discount, bgcolor, panelcolor, textcolor } = req.body;
    if (!req.file || !name || !price) {
      req.flash("error", "All fields including image are required.");
      return res.redirect("/products/create");
    }

    await productModel.create({
      image: req.file.buffer,
      name,
      price,
      discount,
      bgcolor,
      panelcolor,
      textcolor,
    });

    req.flash("success", "Product created successfully.");
    res.redirect("/products/create");
  } catch (err) {
    req.flash("error", "Something went wrong: " + err.message);
    res.redirect("/products/create");
  }
});


// ✅ Single Product Details Page
router.get("/product/:id", async (req, res) => {
  try {
    const productId = req.params.id;
    const product = await productModel.findById(productId);

    if (!product) {
      return res.status(404).send("Product not found");
    }

    res.render("product-details", { product });
  } catch (error) {
    console.error("❌ Product details page error:", error);
    res.status(500).send("Server Error");
  }
});

module.exports = router;
