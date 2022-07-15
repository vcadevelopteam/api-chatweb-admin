const express = require("express");
const router = express.Router();
const personController = require("../controllers/personController");
const auth = require('../middleware/auth');
const ip = require('../middleware/ip');

router.post("/get/leads",
    ip,
    auth,
    personController.getLeads
)

module.exports = router;