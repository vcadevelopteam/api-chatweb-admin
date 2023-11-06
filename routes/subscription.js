const auth = require("../middleware/auth");
const ip = require("../middleware/ip");
const router = require("express").Router();
const subscriptionController = require("../controllers/subscriptionController");

router.get("/countrylist", ip, ip, subscriptionController.countryList);
router.get("/currencylist", ip, ip, subscriptionController.currencyList);

router.post("/activateuser", ip, subscriptionController.activateUser);
router.post("/changepassword", ip, subscriptionController.changePassword);
router.post("/createsubscription", ip, subscriptionController.createSubscription);
router.post("/get/contract", ip, subscriptionController.getContract);
router.post("/getpagelist", ip, subscriptionController.getPageList);
router.post("/recoverpassword", ip, subscriptionController.recoverPassword);
router.post("/validatechannels", ip, subscriptionController.validateChannels);
router.post("/validateuserid", ip, auth, subscriptionController.validateUserId);
router.post("/validateusername", ip, subscriptionController.validateUsername);

module.exports = router;