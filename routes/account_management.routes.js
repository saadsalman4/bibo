const express = require("express");
const shopOwnerAuth = require('../middlewares/authCheck')
const {changePassword, resetPassword, forgotPassword, renderResetPassword} = require('../controllers/account_management.controller')

const router = express.Router();

router.put('/change-password', shopOwnerAuth, changePassword)
router.get('/forgot-password', forgotPassword)

router.get('/reset-password/:token', renderResetPassword)
router.put('/reset-password/:token', resetPassword)

module.exports = router;