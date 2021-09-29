const express = require("express");
const router = express.Router();
const subscriptionController = require("../controllers/subscriptionController");

router.post("/createsubscription",
    subscriptionController.CreateSubscription
)

router.post("/getpagelist",
    subscriptionController.GetPageList
)

router.post("/validateusername",
    subscriptionController.ValidateUsername
)

module.exports = router;