const express = require("express");
const router = express.Router();
const culqiController = require("../controllers/culqiController");
const auth = require('../middleware/auth');

router.post('/token', culqiController.getToken)

router.post('/createorder', culqiController.createOrder)

router.post('/deleteorder', culqiController.deleteOrder)

router.post('/chargeinvoice', auth, culqiController.chargeInvoice)

router.post('/charge', auth, culqiController.charge)

router.post('/refund', auth, culqiController.refund)

router.post('/createinvoice', auth, culqiController.createInvoice)

router.post('/createcreditnote', auth, culqiController.createCreditNote)

router.post('/regularizeinvoice', auth, culqiController.regularizeInvoice)

router.post('/getexchangerate', auth, culqiController.getExchangeRate)

router.post('/createbalance', auth, culqiController.createBalance)

module.exports = router;