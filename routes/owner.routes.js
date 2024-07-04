const express = require("express");
const {  createSchema , signup } = require("../controllers/owner.controller");

const router = express.Router();

// router.post("/login", login);
// router.post("/logout", logout);
router.post("/signup", createSchema, signup);

module.exports = router;