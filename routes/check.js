const express = require("express");
const router = express.Router();
const checkController = require("../controllers/checkController");

router.post('/', checkController.load)

module.exports = router;