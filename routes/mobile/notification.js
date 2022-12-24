const express = require("express");
const router = express.Router();
const notificationController = require("../../controllers/mobile/notificationMobileController");
const auth = require('../../middleware/auth');

router.post("/messagein",
    notificationController.messagein
)


module.exports = router;