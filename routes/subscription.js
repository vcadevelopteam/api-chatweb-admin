const auth = require('../middleware/auth');
const ip = require('../middleware/ip');
const router = require("express").Router();
const subscriptionController = require("../controllers/subscriptionController");

router.post("/activateuser",
    subscriptionController.activateUser
)

router.post("/changepassword",
    subscriptionController.changePassword
)

router.get("/countrylist",
    ip,
    subscriptionController.countryList
)

router.post("/createsubscription",
    subscriptionController.createSubscription
)

router.get("/currencylist",
    ip,
    subscriptionController.currencyList
)

router.post("/get/contract",
    subscriptionController.getContract
)

router.post("/getpagelist",
    subscriptionController.getPageList
)

router.post("/recoverpassword",
    subscriptionController.recoverPassword
)

router.post("/validatechannels",
    subscriptionController.validateChannels
)

router.post("/validateuserid",
    auth,
    subscriptionController.validateUserId
)

router.post("/validateusername",
    subscriptionController.validateUsername
)

module.exports = router;