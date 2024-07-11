const express = require("express");
const { signup, login, renderLogin } = require("../controllers/owner_auth.controller");

const router = express.Router();

router.post("/login", login);
// router.post("/logout", logout);
router.post("/signup", signup);

router.get('/login', renderLogin)

module.exports = router;