const express = require("express");

const auth = require('../middleware/auth');
const postHistoryController = require("../controllers/postHistoryController");
const ip = require('../middleware/ip');
const router = express.Router();

router.post("/schedulepost",
    ip,
    auth,
    postHistoryController.schedulePost
)

module.exports = router;