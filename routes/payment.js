const express = require("express");
const router = express.Router();
const culqiController = require("../controllers/culqiController");
const auth = require('../middleware/auth');

router.post('/token', culqiController.getToken)

router.post('/charge', auth, culqiController.createCharge)

router.post('/subscribe', auth, culqiController.createSubscription)

router.post('/unsubscribe', auth, culqiController.deleteSubscription)

module.exports = router;