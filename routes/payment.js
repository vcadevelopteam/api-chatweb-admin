const express = require("express");
const router = express.Router();
const culqiController = require("../controllers/culqiController");
const auth = require('../middleware/auth');
const ip = require('../middleware/ip');

router.post('/automaticpayment', ip, culqiController.automaticPayment)

router.post('/cardcreate', ip, auth, culqiController.cardCreate)

router.post('/carddelete', ip, auth, culqiController.cardDelete)

router.post('/cardget', ip, auth, culqiController.cardGet)

router.post('/charge', ip, auth, culqiController.charge)

router.post('/chargeinvoice', ip, auth, culqiController.chargeInvoice)

router.post('/createbalance', ip, auth, culqiController.createBalance)

router.post('/createcreditnote', ip, auth, culqiController.createCreditNote)

router.post('/createinvoice', ip, auth, culqiController.createInvoice)

router.post('/emitinvoice', ip, auth, culqiController.emitInvoice)

router.post('/getexchangerate', ip, auth, culqiController.getExchangeRate)

router.post('/regularizeinvoice', ip, auth, culqiController.regularizeInvoice)

module.exports = router;