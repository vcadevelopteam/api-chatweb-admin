const express = require("express");
const router = express.Router();
const billingController = require("../controllers/billingController");
const auth = require('../middleware/auth');
const ip = require('../middleware/ip');

router.post("/sendinvoice",
    ip,
    auth,
    billingController.sendInvoice
)

router.post("/exchangerate",
    ip,
    auth,
    billingController.exchangeRate
)

module.exports = router;