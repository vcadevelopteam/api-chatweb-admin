const express = require("express");
const router = express.Router();
const backupController = require("../controllers/backupController");

router.get('/incremental', backupController.incremental)

module.exports = router;