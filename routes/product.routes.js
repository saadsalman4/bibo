const express = require("express");
const shopOwnerAuth = require("../middlewares/authCheck")
const upload = require("../middlewares/uploads")
const { add } = require("../controllers/product_crud.controller");

const router = express.Router();

router.post("/createProduct", shopOwnerAuth, upload, add);
// router.put("/updateProduct", shopOwnerAuth, update);
// router.delete("/deleteProduct", shopOwnerAuth, delete);

module.exports = router;