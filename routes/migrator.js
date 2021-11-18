const express = require("express");
const router = express.Router();
const migratorController = require("../controllers/migratorController");
const migratorv2Controller = require("../controllers/migratorv2Controller");
const auth = require('../middleware/auth');

router.post('/listcorp', migratorController.listCorp)

router.post('/execute', migratorController.executeMigration)

router.post('/executev2', migratorv2Controller.executeMigration)

module.exports = router;