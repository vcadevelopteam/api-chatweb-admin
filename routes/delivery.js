const express = require("express");
const router = express.Router();
const deliveryController = require("../controllers/deliveryController");
const auth = require('../middleware/auth');

router.post("/routing",
    auth,
    deliveryController.routing
)

router.get("/imaco",
    deliveryController.imaco
)

module.exports = router;