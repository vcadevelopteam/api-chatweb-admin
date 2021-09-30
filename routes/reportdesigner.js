const express = require("express");
const router = express.Router();
const reportDesignerController = require("../controllers/designerReportController");
const auth = require('../middleware/auth');

router.post("/",
    auth,
    reportDesignerController.drawReport
)

router.post("/export",
    auth,
    reportDesignerController.exportReport
)

module.exports = router;