const express = require("express");
const router = express.Router();
const reportDataController = require("../controllers/reportDataController");

router.post("/:reportname",
    reportDataController.drawReport
)
module.exports = router;