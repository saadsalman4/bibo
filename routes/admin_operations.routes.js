const express = require("express");
const { login, addAdmin, forgotPassword} = require("../controllers/admin_operations.controller");

const router = express.Router();

router.post('/addAdmin', addAdmin)
router.post("/login", login);
router.post('/forgot-password', forgotPassword)

module.exports = router;