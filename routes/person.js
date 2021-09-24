const express = require("express");
const router = express.Router();
const personController = require("../controllers/personController");
const auth = require('../middleware/auth');

router.post("/get/leads",
    auth,
    personController.getLeads
)

module.exports = router;