const auth = require("../middleware/auth");
const channelController = require("../controllers/channelController");
const ip = require("../middleware/ip");
const router = require("express").Router();

router.post("/activatechannel", ip, auth, channelController.activateChannel);
router.post("/addtemplate", ip, auth, channelController.addTemplate);
router.post("/checkpaymentplan", ip, auth, channelController.checkPaymentPlan);
router.post("/deletechannel", ip, auth, channelController.deleteChannel);
router.post("/deletetemplate", ip, auth, channelController.deleteTemplate);
router.post("/getchannelservice", ip, channelController.getChannelService);
router.post("/getgrouplist", ip, auth, channelController.getGroupList);
router.post("/getlongtoken", ip, auth, channelController.getLongToken);
router.post("/getpagelist", ip, auth, channelController.getPageList);
router.post("/getphonelist", ip, auth, channelController.getPhoneList);
router.post("/insertchannel", ip, auth, channelController.insertChannel);
router.post("/synchronizetemplate", ip, auth, channelController.synchronizeTemplate);
router.post("/updatechannel", ip, auth, channelController.updateChannel);

module.exports = router;