const express = require("express");
const router = express.Router();
const flowController = require("../controllers/flowController");
const auth = require('../middleware/auth');
const ip = require('../middleware/ip');

router.post("/location",
    ip,
    flowController.Location
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

module.exports = router;