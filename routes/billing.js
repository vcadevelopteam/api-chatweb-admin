const express = require("express");
const router = express.Router();
const billingController = require("../controllers/billingController");
const auth = require('../middleware/auth');

router.post("/sendinvoice",
    auth,
    billingController.sendInvoice
)

module.exports = router;