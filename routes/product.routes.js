const express = require("express");
const shopOwnerAuth = require("../middlewares/authCheck")
const upload = require("../middlewares/uploads")
const { add, update, delete_, read } = require("../controllers/product_crud.controller");
const {validateProduct} = require("../middlewares/validateSchemas")
const multer = require("multer")
const upload_ = multer()

const router = express.Router();

router.get("/getProduct/:id", shopOwnerAuth, read);
router.post('/createProduct', shopOwnerAuth ,validateProduct , add);
router.put("/updateProduct/:id", shopOwnerAuth, validateProduct, update);
router.put("/deleteProduct/:id", shopOwnerAuth, delete_);

module.exports = router;