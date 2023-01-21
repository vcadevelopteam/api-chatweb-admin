const express = require("express");

const router = express.Router();

const ip = require('../middleware/ip');
const paymentNiubizController = require("../controllers/paymentNiubizController");

router.post('/createsessiontoken', ip, paymentNiubizController.createSessionToken);

router.post('/authorizetransaction', ip, paymentNiubizController.authorizeTransaction);

module.exports = router;