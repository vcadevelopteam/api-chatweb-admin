const express = require("express");
const router = express.Router();
const flowController = require("../controllers/flowController");
const auth = require('../middleware/auth');
const ip = require('../middleware/ip');

router.post("/location",
    ip,
    flowController.Location
)

router.post("/continueflow",
    flowController.ContinueFlow
)

router.post("/shippingcar",
    ip,
    flowController.ShippingCar
)

router.post("/testrequest",
    ip,
    auth,
    flowController.TestRequest
)

router.post("/triggerblock",
    auth,
    flowController.TriggerBlock
)

module.exports = router;