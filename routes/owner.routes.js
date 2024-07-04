const express = require("express");
const { signup, login } = require("../controllers/owner.controller");

const router = express.Router();

router.post("/login", login);
// router.post("/logout", logout);
router.post("/signup", signup);

module.exports = router;