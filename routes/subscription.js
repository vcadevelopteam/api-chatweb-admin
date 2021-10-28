const auth = require('../middleware/auth');
const router = require("express").Router();
const subscriptionController = require("../controllers/subscriptionController");

router.post("/get/contract",
    subscriptionController.getContract
)

router.post("/createsubscription",
    subscriptionController.createSubscription
)

router.post("/getpagelist",
    subscriptionController.getPageList
)

router.post("/validateuserid",
    auth,
    subscriptionController.validateUserId
)

router.post("/validateusername",
    subscriptionController.validateUsername
)

module.exports = router;