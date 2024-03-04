const express = require("express");
const router = express.Router();
const corpController = require("../controllers/corpController");
const auth = require('../middleware/auth');
const ip = require('../middleware/ip');

router.post("/",
    auth,
    corpController.insCorp
)

module.exports = router;