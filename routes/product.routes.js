const express = require("express");
const shopOwnerAuth = require("../middlewares/authCheck")
const upload = require("../middlewares/uploads")
const { add, update, delete_, read } = require("../controllers/product_crud.controller");
const {validateProduct} = require("../middlewares/validateSchemas")

const router = express.Router();

router.get("/getProduct/:id", read);
router.post("/createProduct", shopOwnerAuth, upload, validateProduct, add);
router.put("/updateProduct/:id", shopOwnerAuth, upload, validateProduct, update);
router.put("/deleteProduct/:id", shopOwnerAuth, delete_);

module.exports = router;