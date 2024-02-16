const express = require("express");

const router = express.Router();

const ip = require("../middleware/ip");
const paymentEpaycoController = require("../controllers/paymentEpaycoController");

router.post("/getpaymentorder", ip, paymentEpaycoController.getPaymentOrder);

router.post("/processtransaction", ip, paymentEpaycoController.processTransaction);

module.exports = router;