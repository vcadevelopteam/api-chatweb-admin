const express = require("express");
const router = express.Router();
const eventBookingController = require("../controllers/eventBookingController");
const ip = require('../middleware/ip');

router.post('/collection',
    ip,
    eventBookingController.Collection
)

router.post('/cancelevent/:corpid/:orgid/:calendarbookingid',ip,eventBookingController.CancelEvent);
router.post('/getevent',ip,eventBookingController.GetEventByBookingid);

module.exports = router;