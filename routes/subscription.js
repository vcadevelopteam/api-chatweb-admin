const express = require("express");
const router = express.Router();
const subscriptionController = require("../controllers/subscriptionController");

router.post("/createsubscription",
    subscriptionController.CreateSubscription
)

module.exports = router;