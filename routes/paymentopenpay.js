const express = require("express");

const router = express.Router();

const ip = require('../middleware/ip');
const paymentOpenpayController = require("../controllers/paymentOpenpayController");

router.post('/getpaymentorder', ip, paymentOpenpayController.getPaymentOrder);

router.post('/processtransaction', ip, paymentOpenpayController.processTransaction);

module.exports = router;