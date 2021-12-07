const express = require("express");
const router = express.Router();
const culqiController = require("../controllers/culqiController");
const auth = require('../middleware/auth');

router.post('/token', culqiController.getToken)

router.post('/charge', auth, culqiController.charge)

router.post('/subscribe', auth, culqiController.subscribe)

router.post('/unsubscribe', auth, culqiController.unsubscribe)

module.exports = router;