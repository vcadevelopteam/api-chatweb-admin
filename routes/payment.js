const express = require("express");
const router = express.Router();
const culqiController = require("../controllers/culqiController");
const auth = require('../middleware/auth');
const ip = require('../middleware/ip');

router.post('/token', ip, culqiController.getToken)

router.post('/createorder', ip, culqiController.createOrder)

router.post('/deleteorder', ip, culqiController.deleteOrder)

router.post('/automaticpayment', ip, culqiController.automaticPayment)

router.post('/chargeinvoice', ip, auth, culqiController.chargeInvoice)

router.post('/charge', ip, auth, culqiController.charge)

router.post('/refund', ip, auth, culqiController.refund)

router.post('/createinvoice', ip, auth, culqiController.createInvoice)

router.post('/createcreditnote', ip, auth, culqiController.createCreditNote)

router.post('/regularizeinvoice', ip, auth, culqiController.regularizeInvoice)

router.post('/getexchangerate', ip, auth, culqiController.getExchangeRate)

router.post('/createbalance', ip, auth, culqiController.createBalance)

router.post('/emitinvoice', ip, auth, culqiController.emitInvoice)

router.post('/cardcreate', ip, auth, culqiController.cardCreate)

router.post('/carddelete', ip, auth, culqiController.cardDelete)

router.post('/cardget', ip, auth, culqiController.cardGet)

module.exports = router;