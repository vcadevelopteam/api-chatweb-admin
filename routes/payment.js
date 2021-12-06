const express = require("express");
const router = express.Router();
const culqiController = require("../controllers/culqiController");

router.post('/token', culqiController.getToken)

router.post('/charge', culqiController.createCharge)

router.post('/subscription', culqiController.createSubscription)

router.post('/unsubscribe', culqiController.deleteSubscription)

module.exports = router;