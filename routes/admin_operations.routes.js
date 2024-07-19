const express = require("express");
const { login, addAdmin, forgotPassword, getAllUsers, blockUser, blockProduct, orderHistory,
    getProductCount, getOrderCount, getProductDetails, getOrderDetails} = require("../controllers/admin_operations.controller");
const adminAuth = require('../middlewares/adminAuthCheck')

const router = express.Router();

router.post('/addAdmin', addAdmin) //manual add

router.post("/login", login);
router.post('/forgot-password', forgotPassword)

router.get('/product-count', adminAuth, getProductCount)
router.get('/order-count', adminAuth, getOrderCount)
router.get('/product-details', adminAuth, getProductDetails)
router.get('/order-details', adminAuth, getOrderDetails)

router.get('/get-users',adminAuth, getAllUsers)
router.post('/block-user/:id', adminAuth, blockUser)
router.post('/block-product/:id', adminAuth, blockProduct)
router.get('/order-history/:id', adminAuth, orderHistory)

module.exports = router;