const express = require("express");
const ip = require("../middleware/ip");
const auth = require("../middleware/auth");
const { validateCreateIntentRequest, validateCreateEntityRequest } = require("../middleware/watson");
const router = express.Router();
const witaiController = require("../controllers/watsonController");

router.get("/sync/:watsonid", ip, auth, witaiController.sync);

router.post("/tryit", ip, auth, witaiController.tryit);

router.post('/item/delete', ip, auth, witaiController.deleteItem);

router.post("/intent", ip, auth, validateCreateIntentRequest, witaiController.createIntent);

router.post("/entity", ip, auth, validateCreateEntityRequest, witaiController.createEntity);

module.exports = router;
