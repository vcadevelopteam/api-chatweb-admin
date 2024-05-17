const express = require("express");
const router = express.Router();
const auth = require('../middleware/auth');
const ip = require('../middleware/ip');
const integrationManagerController = require("../controllers/integrationManagerController");

router.post('/sync', ip, integrationManagerController.sync)

router.post('/file_upload', auth, ip, integrationManagerController.file_upload)

module.exports = router;