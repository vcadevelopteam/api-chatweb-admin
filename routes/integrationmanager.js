const express = require("express");
const router = express.Router();
const ip = require('../middleware/ip');
const integrationManagerController = require("../controllers/integrationManagerController");

router.post('/sync', ip, integrationManagerController.sync)

module.exports = router;