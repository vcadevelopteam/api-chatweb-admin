const express = require("express");

const auth = require('../middleware/auth');
const router = express.Router();
const campaignController = require("../controllers/campaignController");

router.post("/start",
    auth,    
    campaignController.start
)

router.post("/stop",
    auth,    
    campaignController.stop
)

router.post("/voxiTrigger",
    campaignController.voxiTrigger
)

module.exports = router;