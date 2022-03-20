const auth = require('../middleware/auth');
const ip = require('../middleware/ip');
const router = require("express").Router();
const subscriptionController = require("../controllers/subscriptionController");

router.post("/activateuser",
    subscriptionController.activateUser
)

router.post("/get/contract",
    subscriptionController.getContract
)

router.post("/validatechannels",
    subscriptionController.validateChannels
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

router.get("/currencylist",
    ip,
    subscriptionController.currencyList
)

router.get("/countrylist",
    ip,
    subscriptionController.countryList
)

router.post("/recoverpassword",
    subscriptionController.recoverPassword
)

router.post("/changepassword",
    subscriptionController.changePassword
)

module.exports = router;