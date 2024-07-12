const express = require("express");
const shopOwnerAuth = require('../middlewares/authCheck')
const {changePassword, resetPassword, forgotPassword, renderResetPassword, renderForgotPassword} = require('../controllers/account_management.controller')

const router = express.Router();

router.put('/change-password', shopOwnerAuth, changePassword)


router.post('/forgot-password', forgotPassword)
router.get('/forgot-password', renderForgotPassword)

router.get('/reset-password/:token', renderResetPassword)
router.post('/reset-password/:token', resetPassword)


module.exports = router;