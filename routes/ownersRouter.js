const express = require("express");
const router = express.Router();
const ownerModel = require("../models/owner-module");


if (process.env.NODE_ENV === "development") {
   router.post("/create", async function (req, res) {
      let owner = await ownerModel.find();
      if (owner.length > 0) {
          return res
            .status(503)
            .send("You don't have permision to create a owner");
      }

      let (fullname, email, password) = req.body;

      let createdowner =  await ownerModel.create({
         fullname,
         email,
         password,
      });
      res.send("we can create a owner");
   });
}

router.get("/admin", function (req, res) {
   let success = req.flash("success");
   let error = req.flash("error");
   res.render("createproducts", {success, error});
});


module.exports = router;