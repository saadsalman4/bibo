const express = require("express");
const {viewListing, purchaseItem, viewHistory} = require('../controllers/owner_purchases.controller')
const shopOwnerAuth = require('../middlewares/authCheck')
const router = express.Router();

router.get("/viewListing/:id", shopOwnerAuth, viewListing);
router.post("/Buy/:id", shopOwnerAuth, purchaseItem);
router.get("/viewPurchaseHistory", shopOwnerAuth, viewHistory )

module.exports = router;