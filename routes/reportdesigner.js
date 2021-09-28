const express = require("express");
const router = express.Router();
const reportDesignerController = require("../controllers/designerReportController");
const auth = require('../middleware/auth');

router.post("/",
    auth,
    reportDesignerController.drawReport
)

module.exports = router;