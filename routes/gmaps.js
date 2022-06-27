const express = require("express");
const router = express.Router();
const gmapsController = require("../controllers/gmapsController");
const ip = require('../middleware/ip');

router.get("/geocode",
    ip,
    gmapsController.geocode
)

module.exports = router;