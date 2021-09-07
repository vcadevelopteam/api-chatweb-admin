const express = require("express");
const router = express.Router();
const channelController = require("../controllers/channelController");
const auth = require('../middleware/auth');

router.post("/getchannelservice",
    channelController.GetChannelService
)

router.post("/getpagelist",
    channelController.GetPageList
)

router.post("/getlongtoken",
    channelController.GetLongToken
)

router.post("/insertchannel",
    channelController.InsertChannel
)

router.post("/deletechannel",
    channelController.DeleteChannel
)

module.exports = router;