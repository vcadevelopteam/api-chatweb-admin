const express = require("express");
const router = express.Router();
const loadController = require("../controllers/loadController");
const ip = require('../middleware/ip');

router.post('/:table_name/:action',
    ip,
    loadController.load
)

module.exports = router;