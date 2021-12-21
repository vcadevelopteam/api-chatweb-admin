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

module.exports = router;