const express = require("express");
const router = express.Router();
const auth = require('../middleware/auth');
const loadController = require("../controllers/loadController");

router.post('/:table_name/:action', auth, loadController.load)

module.exports = router;