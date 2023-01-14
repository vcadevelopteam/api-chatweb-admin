const express = require("express");
const router = express.Router();
const paymentGateway = require("../controllers/paymentGatewayController");
const auth = require('../middleware/auth');
const ip = require('../middleware/ip');

router.post("/execute",
    paymentGateway.createCharge
)


module.exports = router;