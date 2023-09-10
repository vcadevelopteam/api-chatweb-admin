const express = require("express");

const router = express.Router();

const ip = require("../middleware/ip");
const culqiDemoController = require("../controllers/culqiDemoController");

router.post("/generateorder", ip, culqiDemoController.generateOrder);

router.post("/generatecharge", ip, culqiDemoController.generateCharge);

module.exports = router;