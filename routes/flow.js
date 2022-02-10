const express = require("express");
const router = express.Router();
const flowController = require("../controllers/flowController");
const auth = require('../middleware/auth');

router.post("/location",
    auth,
    flowController.Location
)

module.exports = router;