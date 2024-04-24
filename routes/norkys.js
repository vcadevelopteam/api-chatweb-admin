const express = require("express");
const router = express.Router();
const norkysController = require("../controllers/norkysController");

router.post('/sendinfo',
    norkysController.SendInfo
)

router.post('/rokys/sendinfo',
    norkysController.RockysSendInfo
)



module.exports = router;