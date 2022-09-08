const express = require("express");
const router = express.Router();
const reportDesignerController = require("../controllers/designerReportController");
const auth = require('../middleware/auth');
const ip = require('../middleware/ip');

router.post("/",
    ip,
    auth,
    reportDesignerController.drawReport
)

router.post("/export",
    ip,
    auth,
    reportDesignerController.exportReport
)

router.post("/exporttask",
    ip,
    reportDesignerController.exportTask
)

router.post("/exportdata",
    ip,
    reportDesignerController.exportData
)

router.post("/dashboard",
    ip,
    auth,
    reportDesignerController.dashboardDesigner
)

module.exports = router;