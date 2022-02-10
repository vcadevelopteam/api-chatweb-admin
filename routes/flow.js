const express = require("express");
const router = express.Router();
const flowController = require("../controllers/flowController");
const auth = require('../middleware/auth');

router.post("/location",
    flowController.Location
)

module.exports = router;