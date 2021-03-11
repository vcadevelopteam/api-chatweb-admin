const express = require("express");
const router = express.Router();
const processFileController = require("../controllers/processfileController");
// const auth = require('../middleware/auth');

router.post("/",
    processFileController.process
)

module.exports = router;