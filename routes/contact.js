const express = require("express");
const router = express.Router();
const contactController = require("../controllers/contactController");
const auth = require('../middleware/auth');
const ip = require('../middleware/ip');

router.post("/",
    ip,
    auth,
    contactController.sendMessage
)

module.exports = router;