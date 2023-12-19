const express = require("express");

const router = express.Router();

const ip = require('../middleware/ip');
const paymentIzipayController = require("../controllers/paymentIzipayController");

router.post('/getpaymentorder', ip, paymentIzipayController.getPaymentOrder);

router.post('/processtransaction', ip, paymentIzipayController.processTransaction);

module.exports = router;