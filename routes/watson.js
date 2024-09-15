const express = require("express");
const ip = require("../middleware/ip");
const auth = require("../middleware/auth");
const { validateCreateIntentRequest } = require("../middleware/watson");
const router = express.Router();
const witaiController = require("../controllers/watsonController");

//TODO: agregar el middleware routes
router.get("/sync/:watsonid", ip, auth, witaiController.sync);

router.post("/tryit", ip, auth, witaiController.tryit);

router.post("/intent", ip, auth, validateCreateIntentRequest, witaiController.createIntent);

module.exports = router;
