const router = require("express").Router();
const subscriptionController = require("../controllers/subscriptionController");

router.post("/createsubscription",
    subscriptionController.createSubscription
)

router.post("/getpagelist",
    subscriptionController.getPageList
)

router.post("/validateusername",
    subscriptionController.validateUsername
)

module.exports = router;