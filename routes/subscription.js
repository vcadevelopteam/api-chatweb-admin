const express = require("express");
const router = express.Router();
const subscriptionController = require("../controllers/subscriptionController");

router.post("/createsubscription",
    subscriptionController.CreateSubscription
)

router.post("/getpagelist",
subscriptionController.GetPageList
)

module.exports = router;