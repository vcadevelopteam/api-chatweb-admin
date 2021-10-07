const auth = require('../middleware/auth');
const channelController = require("../controllers/channelController");
const router = require("express").Router();

router.post("/deletechannel",
    auth,
    channelController.deleteChannel
)

router.post("/getchannelservice",
    channelController.getChannelService
)

router.post("/getlongtoken",
    auth,
    channelController.getLongToken
)

router.post("/getpagelist",
    auth,
    channelController.getPageList
)

router.post("/insertchannel",
    auth,
    channelController.insertChannel
)

module.exports = router;