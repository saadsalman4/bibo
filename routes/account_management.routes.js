const express = require("express");
const shopOwnerAuth = require('../middlewares/authCheck')
const {changePassword, resetPassword, forgotPassword} = require('../controllers/account_management.controller')

const router = express.Router();

router.put('/change-password', shopOwnerAuth, changePassword)
router.get('/forgot-password', forgotPassword)

router.get('/reset-password/:email/:token', (req, res) => {
    const { email, token } = req.params;
    res.render('reset-password', { email, token });
  });
router.put('/reset-password/:email/:token', resetPassword)

module.exports = router;