const express = require("express");
const router = express.Router();
const norkysController = require("../controllers/norkysController");

router.post('/sendinfo',
    norkysController.SendInfo
)

module.exports = router;