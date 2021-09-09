const express = require("express");
const router = express.Router();
const channelController = require("../controllers/channelController");
const auth = require('../middleware/auth');

router.post("/getchannelservice",
    channelController.GetChannelService
)

router.post("/getpagelist",
    auth,
    channelController.GetPageList
)

router.post("/getlongtoken",
    auth,
    channelController.GetLongToken
)

router.post("/insertchannel",
    auth,
    channelController.InsertChannel
)

router.post("/deletechannel",
    auth,
    channelController.DeleteChannel
)

module.exports = router;