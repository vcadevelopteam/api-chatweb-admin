const express = require("express");
const router = express.Router();
const contactController = require("../controllers/contactController");
const auth = require('../middleware/auth');

router.post("/",
    auth,
    contactController.sendMessage
)

module.exports = router;