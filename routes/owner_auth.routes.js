const express = require("express");
const { signup, login, renderLogin , verifyOTP, renderSignup, renderVerifyOTP, resendOTP} = require("../controllers/owner_auth.controller");

const router = express.Router();

router.post("/login", login);
router.get("/login", renderLogin)

// router.post("/logout", logout);
router.post("/signup", signup);
router.get("/signup", renderSignup)


router.post('/verify-otp/:token', verifyOTP)
router.get('/verify-otp/:token', renderVerifyOTP)
router.post('/resend-otp/:token', resendOTP)

module.exports = router;