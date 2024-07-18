const express = require("express");
const shopOwnerAuth = require('../middlewares/authCheck')
const {changePassword, resetPassword, forgotPassword, renderResetPassword, 
    renderForgotPassword, forgotPasswordMobile, verifyOTPMobile, 
    resetPasswordMobile, renderForgotPasswordMobile,
    renderResetPasswordMobile, renderVerifyOTPMobile} = require('../controllers/account_management.controller');

const router = express.Router();

router.put('/change-password', shopOwnerAuth, changePassword)


router.post('/forgot-password', forgotPassword)
router.get('/forgot-password', renderForgotPassword)
router.get('/forgot-password-mobile', renderForgotPasswordMobile)

router.get('/reset-password/:token', renderResetPassword)
router.post('/reset-password/:token', resetPassword)
router.get('/reset-password-mobile', renderResetPasswordMobile)

router.post('/forgot-password-mobile', forgotPasswordMobile)
router.post('/verify-otp-mobile', verifyOTPMobile)
router.get('/verify-otp-mobile', renderVerifyOTPMobile)
router.post('/reset-password-mobile', resetPasswordMobile)


module.exports = router;