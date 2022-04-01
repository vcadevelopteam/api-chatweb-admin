const express = require("express");
const router = express.Router();
const eventBookingController = require("../controllers/eventBookingController");
const ip = require('../middleware/ip');

router.post('/collection',
    ip,
    eventBookingController.Collection
)

module.exports = router;