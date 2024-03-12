const express = require("express");
const router = express.Router();
const deliveryController = require("../controllers/deliveryController");
const auth = require('../middleware/auth');

router.post("/routing",
    auth,
    deliveryController.routing
)

module.exports = router;