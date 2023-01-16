const express = require("express");
const router = express.Router();
const paymentGateway = require("../controllers/paymentGatewayController");
const auth = require('../middleware/auth');
const ip = require('../middleware/ip');

router.post("/get/:orgid:corpid:conversationid:paymentid",
    paymentGateway.getPaymentOrder
)
router.post("/execute",
    paymentGateway.chargeCulqui
)

module.exports = router;