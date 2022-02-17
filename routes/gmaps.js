const express = require("express");
const router = express.Router();
const gmapsController = require("../controllers/gmapsController");
const auth = require('../middleware/auth');

router.get("/geocode",
    gmapsController.geocode
)

module.exports = router;