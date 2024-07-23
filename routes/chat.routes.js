const express = require("express");
const router = express.Router();
const authCheck = require('../middlewares/authCheck')
const {chatHistoryPerUser, chatHistory} = require('../controllers/chat.controller')

router.get('/chat-history/:id', authCheck, chatHistoryPerUser)
router.get('/chat-history-all', authCheck,chatHistory)

module.exports = router;