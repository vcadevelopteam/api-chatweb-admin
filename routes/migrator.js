const express = require("express");
const router = express.Router();
const migratorController = require("../controllers/migratorController");
const migratorv2Controller = require("../controllers/migratorv2Controller");
const migratorv3Controller = require("../controllers/migratorv3Controller");
const migratorIaaSPaaSController = require("../controllers/migratorIaaSPaaSController");
const ip = require('../middleware/ip');

router.post('/listcorp', ip, migratorController.listCorp)

router.post('/execute', ip, migratorController.executeMigration)

router.post('/executev2', ip, migratorv2Controller.executeMigration)

router.post('/executev3', ip, migratorv3Controller.executeMigration)

router.post('/iaaspaas', ip, migratorIaaSPaaSController.executeMigration)

module.exports = router;