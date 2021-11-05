const express = require("express");
const router = express.Router();
const checkController = require("../controllers/checkController");

router.post('/', checkController.load)

router.get('/migration/:corpid', checkController.migration)

module.exports = router;