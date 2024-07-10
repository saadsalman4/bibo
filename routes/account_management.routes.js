const express = require("express");
const shopOwnerAuth = require('../middlewares/authCheck')
const {changePassword, resetPassword, forgotPassword} = require('../controllers/account_management.controller')

const router = express.Router();

router.put('/change-password', shopOwnerAuth, changePassword)
router.get('/forgot-password', forgotPassword)
router.put('/reset-password/:email/:token', resetPassword)

module.exports = router;