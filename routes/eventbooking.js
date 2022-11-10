const auth = require('../middleware/auth');
const express = require("express");
const router = express.Router();
const eventBookingController = require("../controllers/eventBookingController");
const ip = require('../middleware/ip');

router.post('/collection',
    ip,
    eventBookingController.Collection
)

router.post('/cancelevent/:corpid/:orgid/:calendarbookingid',
    ip,
    eventBookingController.CancelEvent
)

router.post('/getevent',
    ip,
    eventBookingController.GetEventByBookingid
)

router.post("/googlelogin",
    auth,
    ip,
    eventBookingController.googleLogIn,
)

router.post("/googlerevoke",
    auth,
    ip,
    eventBookingController.googleRevoke,
)

router.post("/googlevalidate",
    auth,
    ip,
    eventBookingController.googleValidate,
)

router.post("/googlesync",
    ip,
    eventBookingController.googleSync,
)

router.post("/googlewebhooksync",
    ip,
    eventBookingController.googleWebhookSync,
)

router.post("/googlewatch",
    ip,
    eventBookingController.googleWatch,
)

router.post("/googlewatchstop",
    ip,
    eventBookingController.googleWatchStop,
)

router.post("/googlewebhook",
    ip,
    eventBookingController.googleWebhook,
)

module.exports = router;