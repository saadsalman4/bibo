const express = require("express");
const { login, addAdmin, forgotPassword, getAllUsers, blockUser,
    getProductCount, getOrderCount, getProductDetails, getOrderDetails} = require("../controllers/admin_operations.controller");
const adminAuth = require('../middlewares/adminAuthCheck')

const router = express.Router();

router.post('/addAdmin', addAdmin)

router.post("/login", login);
router.post('/forgot-password', forgotPassword)

router.get('/product-count', adminAuth, getProductCount)
router.get('/order-count', getOrderCount)
router.get('/product-details', getProductDetails)
router.get('/order-details', getOrderDetails)

router.get('/get-users', getAllUsers)
router.post('/block-user/:id', blockUser)

module.exports = router;