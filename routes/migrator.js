const express = require("express");
const router = express.Router();
const migratorController = require("../controllers/migratorController");
const auth = require('../middleware/auth');

router.post('/listcorp', migratorController.listCorp)

router.post('/execute', migratorController.executeMigration)

module.exports = router;