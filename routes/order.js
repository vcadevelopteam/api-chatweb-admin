const express = require("express");
const router = express.Router();
const routerController = require("../controllers/orderController");
const auth = require("../middleware/auth");

router.post("/update/info", routerController.updateInfo);

module.exports = router;
