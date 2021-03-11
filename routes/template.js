const express = require("express");
const router = express.Router();
const templateController = require("../controllers/templateController");
const auth = require('../middleware/auth');

router.post("/insert",
    auth,
    templateController.Insert
)
router.post("/massive_load",
    auth,
    templateController.MassiveLoad
)
router.post("/export",
    auth,
    templateController.Export
)


module.exports = router;