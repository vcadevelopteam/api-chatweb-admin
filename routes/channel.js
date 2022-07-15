const auth = require('../middleware/auth');
const channelController = require("../controllers/channelController");
const router = require("express").Router();
const ip = require('../middleware/ip');

router.post("/activatechannel",
    ip,
    auth,
    channelController.activateChannel
)

router.post("/checkpaymentplan",
    ip,
    auth,
    channelController.checkPaymentPlan
)

router.post("/deletechannel",
    ip,
    auth,
    channelController.deleteChannel
)

router.post("/getchannelservice",
    ip,
    channelController.getChannelService
)

router.post("/getlongtoken",
    ip,
    auth,
    channelController.getLongToken
)

router.post("/getpagelist",
    ip,
    auth,
    channelController.getPageList
)

router.post("/insertchannel",
    ip,
    auth,
    channelController.insertChannel
)

router.post("/updatechannel",
    ip,
    auth,
    channelController.updateChannel
)

module.exports = router;