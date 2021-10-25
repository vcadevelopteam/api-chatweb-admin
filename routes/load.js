const express = require("express");
const router = express.Router();
const loadController = require("../controllers/loadController");

router.post('/:table_name/:action', loadController.load)

module.exports = router;