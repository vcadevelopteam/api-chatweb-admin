const express = require("express");
const router = express.Router();
const migratorController = require("../controllers/migratorController");
const auth = require('../middleware/auth');

router.post('/listcorp', auth, migratorController.listCorp)

router.post('/execute', auth, migratorController.executeMigration)

module.exports = router;