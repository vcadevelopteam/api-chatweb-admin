const express = require("express");

const router = express.Router();

const proxyController = require("../controllers/proxyController");

router.post("/sendrequest", proxyController.sendRequest);

module.exports = router;