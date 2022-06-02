const express = require("express");
const router = express.Router();
const flowController = require("../controllers/flowController");
const auth = require('../middleware/auth');

router.post("/location",
    flowController.Location
)

router.post("/shippingcar",
    flowController.ShippingCar
)

router.post("/testrequest",
    auth,
    flowController.TestRequest
)

module.exports = router;