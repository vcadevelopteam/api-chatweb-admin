const express = require("express");

const router = express.Router();

const ip = require("../middleware/ip");
const culqiDemoController = require("../controllers/culqiDemoController");

router.post("/generateorder", ip, culqiDemoController.generateOrder);

router.post("/generatecharge", ip, culqiDemoController.generateCharge);

router.post("/checkorder", ip, culqiDemoController.checkOrder);

router.post("/webhookorder", ip, culqiDemoController.webhookOrder);

module.exports = router;