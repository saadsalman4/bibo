const express = require("express");
const {shopOwnerAuth} = require("../middlewares/authCheck")
const { add, update, delete } = require("../controllers/product_crud.controller");

const router = express.Router();

router.post("/createProduct", shopOwnerAuth, add);
router.put("/updateProduct", shopOwnerAuth, update);
router.delete("/deleteProduct", shopOwnerAuth, delete);

module.exports = router;